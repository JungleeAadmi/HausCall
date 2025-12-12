import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socketURL = process.env.NODE_ENV === 'production' 
  ? '/' 
  : `http://${window.location.hostname}:5000`;

// Auto-connect, robust reconnection
const socket = io(socketURL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
});

const SocketContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState('');
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState('');
  const [isReceivingCall, setIsReceivingCall] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  // Helper: Request Camera/Mic ONLY when needed
  const getMedia = async () => {
    try {
        const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(currentStream);
        if (myVideo.current) {
            myVideo.current.srcObject = currentStream;
        }
        return currentStream;
    } catch (err) {
        console.error("Failed to get media:", err);
        alert("Camera permission denied. Cannot start call.");
        return null;
    }
  };

  useEffect(() => {
    // 1. Socket Setup
    socket.on('connect', () => {
        console.log("Socket Connected:", socket.id);
        // Persistence Fix: If we have a user in storage, re-register immediately
        const storedUser = localStorage.getItem('user');
        if(storedUser) {
            const u = JSON.parse(storedUser);
            socket.emit('register', u.id);
        }
    });

    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal, type }) => {
      setCall({ isReceivedCall: true, from, name: callerName, signal, type });
      setIsReceivingCall(true);
    });

    // 2. Re-register on window focus (fixes minimize logout issue)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            if (!socket.connected) socket.connect();
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                socket.emit('register', u.id);
            }
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('connect');
      socket.off('me');
      socket.off('callUser');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const registerUser = (userId) => {
    if(userId) socket.emit('register', userId);
  };

  const answerCall = async () => {
    // Ask for camera NOW
    const currentStream = await getMedia();
    if(!currentStream) return;

    setCallAccepted(true);
    setIsReceivingCall(false);

    const peer = new Peer({ 
        initiator: false, 
        trickle: false, 
        stream: currentStream,
        config: { iceServers }
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const callUser = async (id, type = 'video') => {
    // Ask for camera NOW
    const currentStream = await getMedia();
    if(!currentStream) return;

    const peer = new Peer({ 
        initiator: true, 
        trickle: false, 
        stream: currentStream,
        config: { iceServers }
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', { 
        userToCall: id, 
        signal: data, 
        from: me, 
        name,
        type
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) connectionRef.current.destroy();
    // Stop local stream tracks to turn off camera light
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    window.location.reload();
  };

  const toggleMute = () => {
    if(stream) stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
  };

  const toggleVideo = () => {
    if(stream) stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
  };

  return (
    <SocketContext.Provider value={{
      call, callAccepted, myVideo, userVideo, stream, name, setName, callEnded, me,
      callUser, leaveCall, answerCall, registerUser, isReceivingCall, toggleMute, toggleVideo
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContextProvider, SocketContext };