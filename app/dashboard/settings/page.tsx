"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, changePassword } from "@/lib/api";
import { 
  Loader2, 
  Image as ImageIcon, 
  CheckCircle, 
  Save, 
  User as UserIcon,
  Shield,
  Bell,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";

type Tab = "profile" | "security" | "notifications" | "danger";

export default function SettingsPage() {
  const { user, updateUser, isLoading: authLoading, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile Form State
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Security Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setIsSavingProfile(true);

    try {
      const payload: { name?: string; avatar_url?: string } = {};
      if (name !== user?.name) payload.name = name;
      if (avatarUrl !== user?.avatar_url) payload.avatar_url = avatarUrl;
      
      if (Object.keys(payload).length === 0) {
        setIsSavingProfile(false);
        return; 
      }

      const updatedUser = await updateProfile(payload);
      updateUser({ name: updatedUser.name, avatar_url: updatedUser.avatar_url });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError("Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setIsSavingPassword(true);

    try {
      if (!oldPassword || !newPassword) {
        throw new Error("Please provide both current and new passwords.");
      }
      await changePassword({ 
        old_password: oldPassword, 
        new_password: newPassword 
      });
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-[#baff29]" />
      </div>
    );
  }

  const initials = (name || user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your account settings and preferences.</p>
      </div>

      <div className="flex gap-8 items-start flex-1">
        {/* Sidebar Nav */}
        <div className="w-64 shrink-0 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "profile" 
                ? "bg-zinc-100 text-zinc-900" 
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserIcon size={16} className={activeTab === "profile" ? "text-zinc-900" : "text-zinc-400"} />
              Public Profile
            </div>
            {activeTab === "profile" && <ChevronRight size={14} className="text-zinc-400" />}
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "security" 
                ? "bg-zinc-100 text-zinc-900" 
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shield size={16} className={activeTab === "security" ? "text-zinc-900" : "text-zinc-400"} />
              Security
            </div>
            {activeTab === "security" && <ChevronRight size={14} className="text-zinc-400" />}
          </button>

          <button
            disabled
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-2.5">
              <Bell size={16} />
              Notifications
            </div>
          </button>

          <button
            disabled
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-rose-300 opacity-50 cursor-not-allowed mt-2 border border-transparent"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} />
              Danger Zone
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">Public Profile</h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="p-6">
                {profileError && (
                  <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm leading-tight">
                    {profileError}
                  </div>
                )}
                
                {profileSuccess && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    Profile updated successfully!
                  </div>
                )}

                <div className="space-y-8">
                  {/* Avatar Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                      <ImageIcon size={14} className="text-zinc-400" />
                      Profile Picture
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#baff29] to-[#4caf50] flex items-center justify-center text-xl font-bold text-black border-[3px] border-white shadow-sm overflow-hidden">
                          {avatarUrl ? (
                             // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={avatarUrl} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                      </div>

                      <div className="flex-1 max-w-sm">
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://.../your-image.jpg"
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Personal Info Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                      <UserIcon size={14} className="text-zinc-400" />
                      Personal Details
                    </h3>
                    <div className="grid gap-5 max-w-sm">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="John Doe"
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-3 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
                        />
                        <p className="mt-1.5 text-xs text-zinc-500">
                          Your email address is managed securely and cannot be changed here.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-zinc-100">
                  <button
                    type="submit"
                    disabled={isSavingProfile || (name === user.name && avatarUrl === (user.avatar_url || ""))}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#111] text-white rounded-xl text-sm font-medium hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Update profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h2 className="text-lg font-semibold text-zinc-900">Change Password</h2>
                </div>
                <form onSubmit={handlePasswordSubmit} className="p-6">
                  {passwordError && (
                    <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm leading-tight">
                      {passwordError}
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <CheckCircle size={16} />
                      Password updated successfully!
                    </div>
                  )}

                  <div className="grid gap-5 max-w-sm">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                        Old password
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          className="w-full pl-3 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition p-1"
                        >
                          {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                        New password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full pl-3 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition p-1"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={isSavingPassword || !oldPassword || !newPassword}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#baff29] text-black rounded-xl text-sm font-semibold hover:bg-[#a1f200] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingPassword ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Shield size={16} />
                      )}
                      Update password
                    </button>
                    <a href="#" className="text-sm text-[#3b82f6] hover:underline font-medium">I forgot my password</a>
                  </div>
                </form>
              </div>

              {/* Sessions Activity mockup */}
              <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <h2 className="text-lg font-semibold text-zinc-900">Active Sessions</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-zinc-500 mb-5">
                    This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-zinc-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">MacBook Pro · San Francisco, US</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Your current session · Chrome</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-zinc-100">
                    <button 
                      onClick={() => logout()}
                      className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-xl text-sm font-medium transition"
                    >
                      <LogOut size={16} />
                      Log out of all devices
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
