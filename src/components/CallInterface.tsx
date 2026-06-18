import React, {useEffect, useRef, useState} from 'react';

interface CallInterfaceProps {
    identifyObject: any;
    config: any;
    setContext: React.Dispatch<React.SetStateAction<any>>;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({identifyObject}) => {
    const myVideoRef   = useRef<HTMLVideoElement | null>(null);
    const peerVideoRef = useRef<HTMLVideoElement | null>(null);
    const [statusText, setStatusText] = useState('Temsilci bekleniyor...');
    const [statusType, setStatusType] = useState<'idle'|'info'|'success'|'warning'|'error'>('warning');
    const [callDone, setCallDone]     = useState(false);   // agent sonlandırdı → tamamlandı
    const [inCall, setInCall]         = useState(false);
    const [queueCount, setQueueCount] = useState<number | null>(null);

    useEffect(() => {
        const sdk = identifyObject.current;
        if (!sdk) return;

        sdk.lifeCycle.videoCall = {
            onQueueUpdate: (data: any) => {
                setQueueCount(data.countMember ?? null);
                setStatusText(
                    data.countMember === 0
                        ? 'Temsilci hazırlanıyor...'
                        : `Sıra: ${data.countMember}`
                );
                setStatusType('warning');
            },
            onCall:    () => handleAnswerCall(),
            onCancel:  () => {
                setInCall(false);
                setStatusText('Çağrı iptal edildi');
                setStatusType('error');
            },
            // Agent / sunucu çağrıyı bitirdi → görüşme tamamlandı, sonraki modüle geç
            onTerminate: async () => {
                setInCall(false);
                setCallDone(true);
                setStatusText('Görüşme tamamlandı');
                setStatusType('success');
                await identifyObject.current?.nextModule();
            },
            onRefuse: (msg: any) => {
                setInCall(false);
                setStatusText('Reddedildi: ' + msg);
                setStatusType('error');
            },
        };

        sdk.lifeCycle.room = {
            onAgentCome:  () => { setStatusText('Temsilci bağlandı');  setStatusType('success'); },
            onAgentLeave: () => { setStatusText('Temsilci ayrıldı');   setStatusType('warning'); },
        };
    }, []);

    const handleAnswerCall = async () => {
        setInCall(true);
        setStatusText('Görüşme devam ediyor');
        setStatusType('success');
        try {
            const sdk = identifyObject.current;
            if (sdk && myVideoRef.current && peerVideoRef.current) {
                await sdk.answerCallWithElements(myVideoRef.current, peerVideoRef.current);
            }
        } catch (err: any) {
            setStatusText('Çağrı başlatılamadı: ' + err.message);
            setStatusType('error');
        }
    };

    // Kullanıcı görüşmeyi bitirir → peer bağlantısını kapat, sıraya geri dön
    const handleLeave = async () => {
        try {
            await identifyObject.current?._clearPeerData?.();
        } catch { /* ignore */ }
        setInCall(false);
        setQueueCount(null);
        setStatusText('Sıraya geri alınıyorsunuz...');
        setStatusType('warning');
    };

    return (
        <div className="id-module">
            {/* Sol — video alanı */}
            <div className="id-module-media" style={{flexDirection:'column',gap:0,padding:0}}>
                {inCall ? (
                    <>
                        <video ref={peerVideoRef} autoPlay playsInline
                               style={{width:'100%',flex:1,objectFit:'cover',background:'#000'}}/>
                        <video ref={myVideoRef} autoPlay playsInline muted
                               style={{
                                   position:'absolute',bottom:12,right:12,
                                   width:120,height:90,objectFit:'cover',
                                   borderRadius:8,border:'2px solid rgba(255,255,255,0.3)',
                                   background:'#000',transform:'scaleX(-1)'
                               }}/>
                    </>
                ) : (
                    <>
                        <video ref={myVideoRef}   autoPlay playsInline muted style={{display:'none'}}/>
                        <video ref={peerVideoRef} autoPlay playsInline       style={{display:'none'}}/>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,
                                     color:'#fff',textAlign:'center',padding:32}}>
                            {callDone ? (
                                <div style={{fontSize:64}}>✅</div>
                            ) : (
                                <div style={{
                                    width:64,height:64,borderRadius:'50%',
                                    border:'3px solid rgba(255,255,255,0.2)',
                                    borderTopColor:'#fff',
                                    animation:'id-spin 1s linear infinite'
                                }}/>
                            )}
                            {!callDone && queueCount !== null && queueCount > 0 && (
                                <div>
                                    <div style={{fontSize:52,fontWeight:800,lineHeight:1}}>{queueCount}</div>
                                    <div style={{fontSize:12,opacity:0.6,marginTop:4,fontWeight:600,
                                                 textTransform:'uppercase',letterSpacing:'0.5px'}}>
                                        Önünüzdeki kişi
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Sağ — panel */}
            <div className="id-module-panel">
                <div>
                    <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',
                                 color:'var(--slate-400)',marginBottom:6}}>Temsilci Görüşmesi</div>
                    <div className="id-module-title">
                        {callDone  ? 'Görüşme Tamamlandı'   :
                         inCall    ? 'Görüşme Devam Ediyor' :
                                     'Temsilci Bekleniyor'}
                    </div>
                </div>

                <div className={`id-status id-status-${statusType}`}>
                    <div className="id-status-dot"/>
                    {statusText}
                </div>

                {inCall && (
                    <button className="id-btn id-btn-danger id-btn-lg" onClick={handleLeave}>
                        Görüşmeyi Bitir
                    </button>
                )}
            </div>
        </div>
    );
};
