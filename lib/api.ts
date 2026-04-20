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

export interface AuthResponse {
  token: string;
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
// Helper
// ────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("paysim_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
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
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("paysim_token");
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
  password: string
): Promise<SignUpResponse> {
  return request<SignUpResponse>("/sign-up", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/sign-in", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
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
  userId: string
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

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  return request<User>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
