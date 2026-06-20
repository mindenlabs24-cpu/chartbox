"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  
  // Call States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<RTCPeerConnection | null>(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchUsers = async () => {
    if (!session?.user) return;
    try {
      const token = (session.user as any).backendToken;
      const res = await fetch("http://localhost:5000/api/user/all", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchMessages = async (contactId: string) => {
    if (!session?.user) return;
    try {
      const token = (session.user as any).backendToken;
      const res = await fetch(`http://localhost:5000/api/user/messages/${contactId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    if (session?.user && (session.user as any).id) {
      fetchUsers();
      
      socketRef.current = io("http://localhost:5000");
      socketRef.current.emit("registerUser", (session.user as any).id);

      socketRef.current.on("receiveMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socketRef.current.on("messageSent", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      // WebRTC Listeners
      socketRef.current.on("callUser", (data) => {
        setReceivingCall(true);
        setCaller(data.from);
        setCallerName(data.name);
        setCallerSignal(data.signal);
        setIsVideoCall(data.signal.type === 'offer' && data.signal.sdp.includes('m=video'));
      });

      socketRef.current.on("callAccepted", async (signal) => {
        setCallAccepted(true);
        if (connectionRef.current) {
          await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        }
      });

      socketRef.current.on("iceCandidate", async (data) => {
        if (connectionRef.current) {
          try {
            await connectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        }
      });

      socketRef.current.on("callEnded", () => {
        endCallLocally();
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUser || !session?.user) return;
    
    socketRef.current?.emit("sendMessage", {
      senderId: (session.user as any).id,
      receiverId: selectedUser._id,
      content: messageText
    });

    setMessageText("");
  };

  // WebRTC Functions
  const setupMediaStream = async (video: boolean) => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      return currentStream;
    } catch (err) {
      console.error("Failed to get media", err);
      return null;
    }
  };

  const callUser = async (idToCall: string, video: boolean) => {
    const currentStream = await setupMediaStream(video);
    if (!currentStream) return;
    
    setIsVideoCall(video);
    
    const peerConnection = new RTCPeerConnection(configuration);
    connectionRef.current = peerConnection;

    currentStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, currentStream);
    });

    peerConnection.ontrack = (event) => {
      if (userVideo.current) {
        userVideo.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("iceCandidate", {
          to: idToCall,
          candidate: event.candidate,
          from: (session?.user as any).id
        });
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socketRef.current?.emit("callUser", {
      userToCall: idToCall,
      signalData: offer,
      from: (session?.user as any).id,
      name: session?.user?.name
    });
  };

  const answerCall = async () => {
    setCallAccepted(true);
    const currentStream = await setupMediaStream(isVideoCall);
    
    const peerConnection = new RTCPeerConnection(configuration);
    connectionRef.current = peerConnection;

    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, currentStream);
      });
    }

    peerConnection.ontrack = (event) => {
      if (userVideo.current) {
        userVideo.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("iceCandidate", {
          to: caller,
          candidate: event.candidate,
          from: (session?.user as any).id
        });
      }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(callerSignal));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socketRef.current?.emit("answerCall", { signal: answer, to: caller });
  };

  const endCallLocally = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCallAccepted(false);
    setReceivingCall(false);
    setCaller("");
    setCallerSignal(null);
    window.location.reload(); // Refresh to clear state properly
  };

  const endCall = () => {
    socketRef.current?.emit("endCall", { to: caller || selectedUser?._id });
    endCallLocally();
  };

  if (status === "loading" || !session) return <div style={{ color: 'white', padding: '2rem' }}>Inapakia...</div>;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-color)', padding: '2rem', gap: '2rem', position: 'relative' }}>
      
      {/* Call Notification Overlay */}
      {receivingCall && !callAccepted && (
        <div style={{ position: 'absolute', top: 20, right: 20, background: 'var(--glass-bg)', padding: '20px', borderRadius: '15px', zIndex: 1000, border: '1px solid var(--primary-color)', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: 'white' }}>{callerName} anapiga simu...</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button className="btn-primary" onClick={answerCall}>Pokea</button>
            <button className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={endCallLocally}>Kataa</button>
          </div>
        </div>
      )}

      {/* Video/Audio Call Overlay */}
      {(stream || callAccepted) && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            {stream && (
              <video playsInline muted ref={myVideo} autoPlay style={{ width: '300px', borderRadius: '15px', border: '2px solid var(--primary-color)' }} />
            )}
            {callAccepted && !callEnded && (
              <video playsInline ref={userVideo} autoPlay style={{ width: '600px', borderRadius: '15px', border: '2px solid var(--secondary-color)' }} />
            )}
          </div>
          <button className="btn-secondary" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '15px 40px', fontSize: '1.2rem', borderRadius: '30px' }} onClick={endCall}>Kata Simu</button>
        </div>
      )}

      {/* Sidebar: Users List */}
      <div className="glass-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
        <h2 className="title-gradient" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Marafiki (Contacts)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {users.map(u => (
            <div 
              key={u._id} 
              onClick={() => handleSelectUser(u)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px',
                borderRadius: '10px', cursor: 'pointer',
                background: selectedUser?._id === u._id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: '1px solid var(--glass-border)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                background: u.profilePicture ? `url(${u.profilePicture}) center/cover` : 'var(--secondary-color)'
              }} />
              <div>
                <h4 style={{ fontWeight: 600 }}>{u.username}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.status || 'Available'}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/dashboard" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button className="btn-secondary" style={{ width: '100%' }}>Rudi Dashibodi</button>
        </Link>
      </div>

      {/* Main Chat Area */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: selectedUser.profilePicture ? `url(${selectedUser.profilePicture}) center/cover` : 'var(--secondary-color)' }} />
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>{selectedUser.username}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedUser.phoneNumber}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => callUser(selectedUser._id, false)} style={{ padding: '8px 16px', fontSize: '0.9rem', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}>📞 Piga Sauti</button>
                <button className="btn-secondary" onClick={() => callUser(selectedUser._id, true)} style={{ padding: '8px 16px', fontSize: '0.9rem', color: '#f472b6', borderColor: 'rgba(244,114,182,0.3)' }}>📹 Video</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => {
                const isMine = msg.senderId === (session.user as any).id;
                return (
                  <div key={msg._id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{ 
                      padding: '12px 18px', 
                      borderRadius: '16px',
                      background: isMine ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderBottomRightRadius: isMine ? '4px' : '16px',
                      borderBottomLeftRadius: !isMine ? '4px' : '16px',
                      boxShadow: isMine ? '0 4px 15px var(--primary-glow)' : 'none'
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: isMine ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Andika ujumbe wako hapa..." 
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={handleSendMessage} style={{ padding: '0 30px' }}>Tuma</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p style={{ fontSize: '1.2rem' }}>Chagua rafiki pembeni ili kuanza mawasiliano (Chat)</p>
          </div>
        )}
      </div>
    </main>
  );
}
