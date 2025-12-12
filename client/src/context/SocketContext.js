import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socketURL = process.env.NODE_ENV === 'production' 
  ? '/' 
  : `http://${window.location.hostname}:5000`;

// Initialize socket
const socket = io(socketURL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
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

  // BLACK SCREEN FIX: Google STUN servers help phones find each other
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => console.error("Failed to get media stream", err));

    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal, type }) => {
      setCall({ isReceivedCall: true, from, name: callerName, signal, type });
      setIsReceivingCall(true);
    });

    // RECONNECT FIX: Ensure socket connects when app comes back from background
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            if (!socket.connected) socket.connect();
            // Re-register user ID if we have one in local storage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                socket.emit('register', u.id);
            }
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      socket.off('me');
      socket.off('callUser');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const registerUser = (userId) => {
    if(userId) {
        socket.emit('register', userId);
    }
  };

  const answerCall = () => {
    setCallAccepted(true);
    setIsReceivingCall(false);

    // Initiator false = I am answering
    const peer = new Peer({ 
        initiator: false, 
        trickle: false, 
        stream,
        config: { iceServers } // Apply Fix
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const callUser = (id, type = 'video') => {
    // Initiator true = I am calling
    const peer = new Peer({ 
        initiator: true, 
        trickle: false, 
        stream,
        config: { iceServers } // Apply Fix
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

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
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
    if (connectionRef.current) {
      connectionRef.current.destroy();
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