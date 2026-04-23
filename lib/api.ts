const BASE_URL = "https://go-payment-api-production.up.railway.app";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

/**
 * Shape returned by /sign-in.
 * The refresh token is set as an HttpOnly cookie by the server —
 * the client never sees or stores it directly.
 * User info must be fetched separately via GET /user.
 */
export interface AuthResponse {
  accessToken: string;
}

/** Shape returned by GET /user */
export interface UserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

// Sign-up returns just the created user (no token)
export interface SignUpResponse {
  ID: string;
  Name: string;
  Email: string;
}

export interface Wallet {
  id: string;
  UserID: string;
  Balance: number;
  currency?: string;
}

export interface Transaction {
  ID: string;
  SenderID: string;
  ReceiverID: string;
  Amount: number;
  Status?: string;
  Description?: string;
  CreatedAt: string;
}

export interface TransferPayload {
  sender_id: string;
  receiver_id: string;
  amount: number;
  description?: string;
}

// ────────────────────────────────────────────
// Token helpers
// ────────────────────────────────────────────

const ACCESS_TOKEN_KEY = "paysim_access_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

// ────────────────────────────────────────────
// Silent token refresh
// ────────────────────────────────────────────

/**
 * Calls the /refresh endpoint using the HttpOnly refresh-token cookie
 * (the browser attaches it automatically thanks to credentials:'include').
 * On success, persists the new access token and returns it.
 * On failure, clears local auth state and redirects to /login.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      credentials: "include", // sends the refreshtoken HttpOnly cookie
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("refresh failed");

    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    // Unwrap envelope
    const envelope = json as {
      data?: { accessToken?: string };
      accessToken?: string;
    };
    const newToken =
      envelope?.data?.accessToken ??
      (envelope as { accessToken?: string })?.accessToken ??
      null;

    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    throw new Error("no token in refresh response");
  } catch {
    // Refresh failed — clear all local auth and force re-login
    clearAccessToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("paysim_user");
      window.location.href = "/login";
    }
    return null;
  }
}

// ────────────────────────────────────────────
// Core request helper
// ────────────────────────────────────────────

/**
 * retried is an internal flag to prevent infinite refresh loops.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    // credentials:'include' ensures the browser attaches the refreshtoken
    // HttpOnly cookie on every request (needed for /refresh to work)
    credentials: "include",
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (res.status === 401 && !retried) {
    // Try a silent refresh once
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry the original request with the fresh token
      return request<T>(path, options, true);
    }
    // refreshAccessToken() already redirected to /login
    throw new Error("Session expired. Please log in again.");
  }

  if (res.status === 401 && retried) {
    // Second 401 after refresh — give up
    clearAccessToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("paysim_user");
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const msg =
      (json as { data?: unknown; error?: string; message?: string })?.error ||
      (json as { message?: string })?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  // Unwrap envelope: { data: T, error: null }
  const envelope = json as { data?: T; error?: string | null };
  if (envelope?.error) {
    throw new Error(envelope.error);
  }
  if (envelope?.data !== undefined) {
    return envelope.data as T;
  }

  return json as T;
}

// ────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<SignUpResponse> {
  return request<SignUpResponse>("/sign-up", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/sign-in", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Fetches the currently authenticated user's profile.
 * Requires a valid access token to be in localStorage.
 */
export async function getMe(): Promise<UserResponse> {
  return request<UserResponse>("/users");
}

// ────────────────────────────────────────────
// Wallet
// ────────────────────────────────────────────

export async function getWallet(userId: string): Promise<Wallet> {
  return request<Wallet>(`/wallet?user_id=${userId}`);
}

// ────────────────────────────────────────────
// Transactions
// ────────────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>("/transactions");
}

export async function getTransactionsByUser(
  userId: string,
): Promise<Transaction[]> {
  return request<Transaction[]>(`/transactions/user?user_id=${userId}`);
}

export async function transfer(payload: TransferPayload): Promise<unknown> {
  return request<unknown>("/transfer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ────────────────────────────────────────────
// Profile
// ────────────────────────────────────────────

export interface UpdateProfilePayload {
  name?: string;
  avatar_url?: string;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<User> {
  return request<User>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface ChangePasswordPayload {
  old_password?: string;
  new_password?: string;
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<unknown> {
  return request<unknown>("/users/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
