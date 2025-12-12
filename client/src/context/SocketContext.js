import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socketURL = process.env.NODE_ENV === 'production' 
  ? '/' 
  : `http://${window.location.hostname}:5000`;

const socket = io(socketURL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
});

const SocketContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null); // Fix: Store remote stream in state
  const [me, setMe] = useState('');
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState('');
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null); // Fix: Track who we are talking to

  const myVideo = useRef();
  const connectionRef = useRef();

  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

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
        alert("Camera access denied. Please check your browser permissions.");
        return null;
    }
  };

  useEffect(() => {
    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal, type }) => {
      setCall({ isReceivedCall: true, from, name: callerName, signal, type });
      setIsReceivingCall(true);
    });

    socket.on('callEnded', () => {
        // If the other person hangs up, we just clean up
        leaveCall(); 
    });

    return () => {
        socket.off('me');
        socket.off('callUser');
        socket.off('callEnded');
    };
  }, []);

  const answerCall = async () => {
    const currentStream = await getMedia();
    if(!currentStream) return;

    setCallAccepted(true);
    setIsReceivingCall(false);
    setOtherUserId(call.from); // Fix: Remember who called us

    const peer = new Peer({ 
        initiator: false, 
        trickle: false, 
        stream: currentStream,
        config: { iceServers }
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (currentRemoteStream) => {
      setRemoteStream(currentRemoteStream); // Fix: Save stream to state
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const callUser = async (id, type = 'video') => {
    const currentStream = await getMedia();
    if(!currentStream) return;

    setOtherUserId(id); // Fix: Remember who we are calling

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
        name: name,
        type
      });
    });

    peer.on('stream', (currentRemoteStream) => {
      setRemoteStream(currentRemoteStream); // Fix: Save stream to state
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  // Called when I click the red button
  const hangUp = () => {
      if(otherUserId) {
          socket.emit('endCall', { to: otherUserId });
      }
      leaveCall();
  };

  // Internal cleanup function
  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) connectionRef.current.destroy();
    if (stream) stream.getTracks().forEach(track => track.stop());
    
    setCall({});
    setIsReceivingCall(false);
    setCallAccepted(false);
    setRemoteStream(null);
    setOtherUserId(null);
    
    // Force reload to clear all WebRTC states cleanly
    window.location.reload();
  };

  const registerUser = (userId) => {
      if(userId) socket.emit('register', userId);
  };

  const toggleMute = () => {
    if(stream) stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
  };

  const toggleVideo = () => {
    if(stream) stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
  };

  return (
    <SocketContext.Provider value={{
      call, callAccepted, myVideo, remoteStream, stream, name, setName, callEnded, me,
      callUser, hangUp, answerCall, registerUser, isReceivingCall, toggleMute, toggleVideo
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContextProvider, SocketContext };