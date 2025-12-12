import React, { useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaVideo } from 'react-icons/fa';

const CallModal = () => {
    const { 
        call, callAccepted, myVideo, remoteStream, 
        callEnded, hangUp, answerCall, isReceivingCall, 
        toggleMute, toggleVideo
    } = useContext(SocketContext);

    const userVideo = useRef();

    // Fix: Attach remote stream safely when component mounts or stream changes
    useEffect(() => {
        if (remoteStream && userVideo.current) {
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream, callAccepted]);

    // Render nothing if no active call state
    if (!isReceivingCall && !callAccepted) return null;

    return (
        <div className="call-modal" style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'black', zIndex: 9999, display: 'flex', flexDirection: 'column' 
        }}>
            
            {/* --- INCOMING CALL SCREEN --- */}
            {isReceivingCall && !callAccepted && (
                <div style={{ 
                    height: '100%', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', 
                    background: 'linear-gradient(135deg, #000000 0%, #001a00 100%)' 
                }}>
                    <div style={{
                        width: '100px', height: '100px', background: '#15803d', 
                        borderRadius: '30px', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', 
                        color: 'white', marginBottom: '24px', boxShadow: '0 0 40px rgba(21, 128, 61, 0.6)'
                    }}>
                        {call.name ? call.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <h2 style={{ color: 'white', marginBottom: '10px' }}>{call.name || 'Unknown Caller'}</h2>
                    <p style={{ color: '#9ca3af', marginBottom: '60px' }}>Incoming {call.type} Call...</p>
                    
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <button onClick={hangUp} style={{ 
                            width: '70px', height: '70px', borderRadius: '50%', border: 'none', 
                            background: '#ef4444', color: 'white', fontSize: '1.5rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FaPhoneSlash />
                        </button>
                        <button onClick={answerCall} style={{ 
                            width: '70px', height: '70px', borderRadius: '50%', border: 'none', 
                            background: '#22c55e', color: 'white', fontSize: '1.5rem', cursor: 'pointer',
                            animation: 'pulse 1.5s infinite', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FaPhone />
                        </button>
                    </div>
                    <style>{`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }`}</style>
                </div>
            )}

            {/* --- ACTIVE CALL SCREEN --- */}
            {callAccepted && !callEnded && (
                <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                    
                    {/* Remote Video (Full Screen) */}
                    {call.type === 'video' ? (
                        <video 
                            playsInline 
                            ref={userVideo} 
                            autoPlay 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ 
                                    width: '120px', height: '120px', background: '#333', borderRadius: '50%', 
                                    margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem'
                                }}>
                                    {call.name ? call.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <h2>{call.name}</h2>
                                <p>Audio Call in progress</p>
                                <audio ref={userVideo} autoPlay /> 
                            </div>
                        </div>
                    )}
                    
                    {/* Local Video (Floating PiP) */}
                    {call.type === 'video' && (
                        <div style={{ 
                            position: 'absolute', top: '20px', right: '20px', 
                            width: '100px', height: '150px', borderRadius: '12px', 
                            overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)', background: '#000'
                        }}>
                            <video 
                                playsInline 
                                muted 
                                ref={myVideo} 
                                autoPlay 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                        </div>
                    )}

                    {/* Floating Controls */}
                    <div style={{ 
                        position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', 
                        display: 'flex', gap: '20px', background: 'rgba(20, 20, 20, 0.8)', 
                        padding: '15px 30px', borderRadius: '40px', backdropFilter: 'blur(10px)'
                    }}>
                        <button onClick={toggleMute} style={{ 
                            width: '50px', height: '50px', borderRadius: '50%', border: 'none', 
                            background: '#333', color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FaMicrophone />
                        </button>
                        
                        <button onClick={hangUp} style={{ 
                            width: '50px', height: '50px', borderRadius: '50%', border: 'none', 
                            background: '#ef4444', color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FaPhoneSlash />
                        </button>
                        
                        {call.type === 'video' && (
                             <button onClick={toggleVideo} style={{ 
                                width: '50px', height: '50px', borderRadius: '50%', border: 'none', 
                                background: '#333', color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
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