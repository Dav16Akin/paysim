"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import { Loader2, Image as ImageIcon, CheckCircle, Save, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const payload: { name?: string; avatar_url?: string } = {};
      if (name !== user?.name) payload.name = name;
      if (avatarUrl !== user?.avatar_url) payload.avatar_url = avatarUrl;
      
      if (Object.keys(payload).length === 0) {
        setIsSaving(false);
        return; // nothing to update
      }

      const updatedUser = await updateProfile(payload);
      updateUser({ name: updatedUser.name, avatar_url: updatedUser.avatar_url });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-[#baff29]" />
      </div>
    );
  }

  // Get initials for placeholder avatar
  const initials = (name || user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Profile Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your personal information and avatar.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              Profile updated successfully!
            </div>
          )}

          <div className="space-y-8">
            {/* Avatar Section */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <ImageIcon size={18} className="text-zinc-400" />
                Profile Picture
              </h3>
              <div className="flex items-center gap-6">
                {/* Current Avatar / Preview */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#baff29] to-[#4caf50] flex items-center justify-center text-2xl font-bold text-black border-4 border-white shadow-md overflow-hidden">
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

                <div className="flex-1 max-w-xl">
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/your-image.jpg"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:bg-white transition"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Provide a direct link to an image. (Square images work best)
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-zinc-100" />

            {/* Personal Info Section */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <UserIcon size={18} className="text-zinc-400" />
                Personal Information
              </h3>
              <div className="grid gap-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#baff29] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Your email address cannot be changed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => {
                setName(user.name || "");
                setAvatarUrl(user.avatar_url || "");
                setError(null);
                setSuccess(false);
              }}
              className="px-6 py-3 rounded-xl font-medium text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={isSaving || (name === user.name && avatarUrl === (user.avatar_url || ""))}
              className="flex items-center gap-2 px-6 py-3 bg-[#111] text-white rounded-xl font-medium hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
