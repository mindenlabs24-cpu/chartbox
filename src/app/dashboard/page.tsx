"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [wallpaper, setWallpaper] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.name) {
      setUsername(session.user.name);
    }
  }, [status, session, router]);

  const handleSave = async () => {
    setStatusMessage("Inahifadhi...");
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, profilePicture, wallpaper }),
      });
      if (res.ok) {
        setStatusMessage("Taarifa zimehifadhiwa kikamilifu!");
      } else {
        setStatusMessage("Hitilafu imetokea wakati wa kuhifadhi.");
      }
    } catch (err) {
      setStatusMessage("Hitilafu imetokea wakati wa kuhifadhi.");
    }
    setTimeout(() => setStatusMessage(""), 3000);
  };

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen text-gray-400">Inapakia...</div>;
  }

  return (
    <main 
      className="min-h-screen p-4 md:p-8"
      style={{ 
        backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* Sidebar */}
        <div className="glass-panel p-6 md:p-8 flex-1 md:max-w-xs w-full">
          <div className="text-center mb-8">
            <div 
              className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-4 border-4 border-[rgba(255,255,255,0.08)] bg-[#3b82f6]"
              style={{ 
                background: profilePicture ? `url(${profilePicture}) center/cover` : 'var(--primary-color)',
              }} 
            />
            <h2 className="text-2xl font-semibold">{session?.user?.name}</h2>
            <p className="text-gray-400 mt-1">Online</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button className="btn-secondary w-full" onClick={() => router.push('/chat')}>
              Nenda Kwenye Chat
            </button>
            <button className="btn-secondary w-full text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => signOut()}>
              Ondoka (Logout)
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="glass-panel p-6 md:p-12 flex-[2] w-full">
          <h2 className="title-gradient text-3xl md:text-4xl font-bold mb-6 md:mb-8">
            Mipangilio ya Wasifu
          </h2>

          {statusMessage && (
            <div className="bg-blue-500/10 border border-blue-500 text-blue-100 px-4 py-3 rounded-lg mb-6 text-sm">
              {statusMessage}
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div>
              <label className="block mb-2 text-sm text-gray-400">
                Badilisha Jina (Username)
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-400">
                Picha ya Wasifu (Profile Picture URL)
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Weka link ya picha..."
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-400">
                Picha ya Nyuma (Background Wallpaper URL)
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Weka link ya background..."
                value={wallpaper}
                onChange={(e) => setWallpaper(e.target.value)}
              />
            </div>

            <button className="btn-primary mt-4 w-full md:w-auto" onClick={handleSave}>
              Hifadhi Mabadiliko
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
