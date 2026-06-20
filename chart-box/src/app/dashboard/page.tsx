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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Inapakia...</div>;
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      padding: '2rem',
      backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Sidebar */}
        <div className="glass-panel" style={{ padding: '2rem', flex: '1', minWidth: '300px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: profilePicture ? `url(${profilePicture}) center/cover` : 'var(--primary-color)',
              margin: '0 auto 1rem auto',
              border: '4px solid var(--glass-border)'
            }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{session?.user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Online</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => router.push('/chat')}>
              Nenda Kwenye Chat
            </button>
            <button className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => signOut()}>
              Ondoka (Logout)
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="glass-panel" style={{ padding: '3rem', flex: '2', minWidth: '400px' }}>
          <h2 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '2rem' }}>
            Mipangilio ya Wasifu (Profile Settings)
          </h2>

          {statusMessage && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary-color)', color: 'var(--text-primary)', padding: '10px 15px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {statusMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Badilisha Jina (Username)
              </label>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Picha ya Wasifu (Profile Picture URL)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Weka link ya picha..."
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Picha ya Nyuma (Background Wallpaper URL)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Weka link ya background..."
                value={wallpaper}
                onChange={(e) => setWallpaper(e.target.value)}
              />
            </div>

            <button className="btn-primary" onClick={handleSave} style={{ marginTop: '1rem', width: 'fit-content' }}>
              Hifadhi Mabadiliko (Save)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
