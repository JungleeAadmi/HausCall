import React, { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaVideo, FaVideoSlash, FaMicrophoneSlash } from 'react-icons/fa';

const CallModal = () => {
    const { 
        call, 
        callAccepted, 
        myVideo, 
        userVideo, 
        stream, 
        name, 
        setName, 
        callEnded, 
        me, 
        callUser, 
        leaveCall, 
        answerCall,
        isReceivingCall,
        toggleMute,
        toggleVideo
    } = useContext(SocketContext);

    // If no call is happening, don't render anything
    if (!isReceivingCall && !callAccepted) return null;

    return (
        <div className="call-modal">
            
            {/* --- INCOMING CALL SCREEN --- */}
            {isReceivingCall && !callAccepted && (
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <h1>Incoming {call.type} Call...</h1>
                    <h3>{call.name} is calling you!</h3>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
                        <button 
                            className="control-btn" 
                            style={{ background: 'green', color: 'white' }}
                            onClick={answerCall}
                        >
                            <FaPhone />
                        </button>
                    </div>
                </div>
            )}

            {/* --- ACTIVE CALL SCREEN --- */}
            {callAccepted && !callEnded && (
                <div className="video-grid">
                    {/* Remote Video (Big) */}
                    {call.type === 'video' ? (
                        <video playsInline ref={userVideo} autoPlay style={{ height: '70vh' }} />
                    ) : (
                        <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <h2>Audio Call with {call.name}</h2>
                        </div>
                    )}
                    
                    {/* Local Video (Small Overlay) */}
                    {call.type === 'video' && (
                        <video 
                            playsInline 
                            muted 
                            ref={myVideo} 
                            autoPlay 
                            style={{ 
                                position: 'absolute', 
                                top: '20px', 
                                right: '20px', 
                                width: '100px', 
                                borderRadius: '8px', 
                                border: '2px solid white' 
                            }} 
                        />
                    )}

                    {/* Controls */}
                    <div className="floating-controls">
                        <button className="control-btn" style={{ background: '#333', color: 'white' }} onClick={toggleMute}>
                            <FaMicrophone />
                        </button>
                        <button className="control-btn" style={{ background: 'red', color: 'white' }} onClick={leaveCall}>
                            <FaPhoneSlash />
                        </button>
                        {call.type === 'video' && (
                             <button className="control-btn" style={{ background: '#333', color: 'white' }} onClick={toggleVideo}>
                                <FaVideo />
                             </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallModal;