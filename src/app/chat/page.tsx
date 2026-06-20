"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { 
  MoreVertical, MessageSquare, Phone, Video, Search, 
  Smile, Paperclip, Mic, Send, ArrowLeft, Settings
} from "lucide-react"; // Make sure lucide-react is installed, if not we will install it or use emojis

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Call States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState<any>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  
  // Responsive UI state
  const [showChatArea, setShowChatArea] = useState(false);
  
  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);

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
      const res = await fetch("https://chartbox-ywrc.onrender.com/api/user/all", {
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
      const res = await fetch(`https://chartbox-ywrc.onrender.com/api/user/messages/${contactId}`, {
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
      
      socketRef.current = io("https://chartbox-ywrc.onrender.com");
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
    setShowChatArea(true); // Switch to chat view on mobile
  };

  const handleBackToList = () => {
    setShowChatArea(false); // Return to list view on mobile
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
      alert("Haikuweza kupata idhini ya kutumia Kamera au Maikrofoni yako.");
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
  };

  const endCall = () => {
    socketRef.current?.emit("endCall", { to: caller || selectedUser?._id });
    endCallLocally();
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (status === "loading" || !session) return <div className="flex h-screen items-center justify-center bg-[#f0f2f5] text-gray-500">Inapakia WhatsApp...</div>;

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] overflow-hidden font-sans">
      
      {/* Call Notifications */}
      {receivingCall && !callAccepted && (
        <div className="absolute top-5 right-5 bg-white p-5 rounded-lg shadow-2xl z-50 flex flex-col items-center border border-gray-200">
          <p className="text-lg font-semibold text-gray-800 mb-4">{callerName} anapiga simu...</p>
          <div className="flex gap-4">
            <button className="bg-green-500 text-white px-6 py-2 rounded-full font-medium hover:bg-green-600 transition" onClick={answerCall}>Pokea</button>
            <button className="bg-red-500 text-white px-6 py-2 rounded-full font-medium hover:bg-red-600 transition" onClick={endCallLocally}>Kataa</button>
          </div>
        </div>
      )}

      {/* Video Call Overlay */}
      {(stream || callAccepted) && (
        <div className="absolute inset-0 bg-black z-40 flex flex-col items-center justify-center p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-8 w-full max-w-5xl justify-center items-center">
            {stream && (
              <video playsInline muted ref={myVideo} autoPlay className="w-48 md:w-64 bg-gray-800 rounded-lg shadow-lg border-2 border-green-500" />
            )}
            {callAccepted && !callEnded && (
              <video playsInline ref={userVideo} autoPlay className="w-full md:w-[600px] bg-gray-800 rounded-lg shadow-lg" />
            )}
          </div>
          <button className="bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-red-600" onClick={endCall}>Kata Simu</button>
        </div>
      )}

      {/* --- SIDEBAR (Left Panel) --- */}
      {/* On mobile, show sidebar only if showChatArea is false. On desktop, always show */}
      <div className={`${showChatArea ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[350px] lg:w-[400px] bg-white border-r border-gray-200 h-full`}>
        
        {/* Sidebar Header */}
        <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div 
                className="w-10 h-10 rounded-full bg-gray-300" 
                style={{ background: session.user?.image ? `url(${session.user.image}) center/cover` : '#cbd5e1' }} 
             />
             <span className="font-semibold text-gray-800 hidden md:block">{session.user?.name}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <Link href="/dashboard" title="Settings (Dashibodi)">
               <Settings className="w-5 h-5 cursor-pointer hover:text-gray-700" />
            </Link>
            <MessageSquare className="w-5 h-5 cursor-pointer hover:text-gray-700" />
            <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-700" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-2 border-b border-gray-200 flex-shrink-0">
          <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-1.5">
            <Search className="w-4 h-4 text-gray-500 mr-3" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="bg-transparent border-none outline-none text-sm text-gray-700 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredUsers.map(u => (
            <div 
              key={u._id} 
              onClick={() => handleSelectUser(u)}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-gray-100 ${selectedUser?._id === u._id ? 'bg-[#f0f2f5]' : ''}`}
            >
              <div 
                className="w-12 h-12 rounded-full mr-4 flex-shrink-0 bg-gray-300"
                style={{ background: u.profilePicture ? `url(${u.profilePicture}) center/cover` : '#cbd5e1' }} 
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-gray-900 font-normal text-[17px] truncate">{u.username}</h2>
                  <span className="text-xs text-gray-500">
                    {u.status === 'online' ? 'Sasa hivi' : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{u.phoneNumber}</p>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center p-8 text-gray-400">Hakuna rafiki aliyepatikana</div>
          )}
        </div>
      </div>

      {/* --- MAIN CHAT AREA (Right Panel) --- */}
      {/* On mobile, show chat area only if showChatArea is true. On desktop, always show */}
      <div className={`${!showChatArea ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-[#efeae2] h-full relative`}>
        
        {/* WhatsApp Background Pattern */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')", backgroundSize: '400px' }}></div>

        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-gray-200 z-10">
              <div className="flex items-center gap-3 cursor-pointer">
                <ArrowLeft className="w-6 h-6 text-gray-600 md:hidden mr-2" onClick={handleBackToList} />
                <div 
                  className="w-10 h-10 rounded-full bg-gray-300"
                  style={{ background: selectedUser.profilePicture ? `url(${selectedUser.profilePicture}) center/cover` : '#cbd5e1' }}
                />
                <div>
                  <h2 className="text-gray-900 font-medium text-[16px]">{selectedUser.username}</h2>
                  <p className="text-xs text-gray-500">Mawasiliano yapo wazi</p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-gray-500">
                <Video className="w-5 h-5 cursor-pointer hover:text-gray-700" onClick={() => callUser(selectedUser._id, true)} />
                <Phone className="w-5 h-5 cursor-pointer hover:text-gray-700" onClick={() => callUser(selectedUser._id, false)} />
                <Search className="w-5 h-5 cursor-pointer hover:text-gray-700 hidden sm:block" />
                <div className="relative">
                  <MoreVertical 
                    className="w-5 h-5 cursor-pointer hover:text-gray-700" 
                    onClick={() => setShowDropdown(!showDropdown)} 
                  />
                  {showDropdown && (
                    <div className="absolute right-0 top-10 w-56 bg-white shadow-xl rounded-lg py-2 z-50 text-[15px] text-[#3b4a54] border border-gray-100">
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Add member</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Group info</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Search</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Select messages</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Mute notifications</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Disappearing messages</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Add to favourites</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Close chat</div>
                      <div className="border-t border-gray-100 my-1"></div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Clear chat</div>
                      <div className="px-5 py-3 hover:bg-[#f5f6f6] cursor-pointer" onClick={() => setShowDropdown(false)}>Exit group</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-2 z-10 scrollbar-hide">
              <div className="text-center my-4">
                <span className="bg-[#ffeecd] text-gray-600 text-xs px-3 py-1 rounded-lg shadow-sm">
                  Ujumbe na simu zinalindwa kwa usalama (End-to-end encrypted).
                </span>
              </div>
              
              {messages.map(msg => {
                const isMine = msg.senderId === (session.user as any).id;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div 
                      className={`relative max-w-[85%] md:max-w-[65%] px-3 py-2 rounded-lg shadow-sm ${isMine ? 'bg-[#d9fdd3]' : 'bg-white'}`}
                      style={{ borderTopRightRadius: isMine ? 0 : '0.5rem', borderTopLeftRadius: !isMine ? 0 : '0.5rem' }}
                    >
                      <span className="text-[#111b21] text-[15px] leading-relaxed break-words block pr-12 pb-1">
                        {msg.content}
                      </span>
                      <span className="text-[10px] text-gray-500 absolute bottom-1 right-2">
                        {formatTime(msg.createdAt)}
                        {isMine && <span className="ml-1 text-blue-500">✓✓</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 z-10">
              <Smile className="w-6 h-6 text-gray-500 cursor-pointer hidden sm:block" />
              <Paperclip className="w-6 h-6 text-gray-500 cursor-pointer hidden sm:block" />
              
              <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 shadow-sm">
                <input 
                  type="text" 
                  className="bg-transparent border-none outline-none text-[15px] text-gray-800 w-full"
                  placeholder="Type a message"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                />
              </div>

              {messageText.trim() ? (
                <button onClick={handleSendMessage} className="text-gray-500 hover:text-green-600 transition">
                  <Send className="w-6 h-6" />
                </button>
              ) : (
                <Mic className="w-6 h-6 text-gray-500 cursor-pointer" />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center z-10 border-b-8 border-green-500">
            <img src="/window.svg" alt="WhatsApp Web" className="w-72 opacity-20 mb-8" style={{ filter: 'grayscale(1)' }} />
            <h1 className="text-3xl text-gray-700 font-light mb-4">CHART BOX Web</h1>
            <p className="text-gray-500 text-sm max-w-md text-center leading-relaxed">
              Tuma na upokee meseji bila kuunganisha simu yako kwenye intaneti.<br/>
              Tumia Chartbox kupiga simu za video na sauti papo hapo.
            </p>
            <p className="text-gray-400 text-xs mt-8 flex items-center gap-1">
              <span className="mr-1">🔒</span> Kila kitu kinalindwa salama.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
