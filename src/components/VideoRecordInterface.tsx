import {useEffect, useRef, useState} from "react";

type Phase = 'preview' | 'recording' | 'recorded' | 'processing' | 'done' | 'speechFailed';

export const VideoRecordInterface = ({identifyObject}: { identifyObject: any }) => {
    const videoRef    = useRef<HTMLVideoElement | null>(null);
    const [phase, setPhase]           = useState<Phase>('preview');
    const [countdown, setCountdown]   = useState<number | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [speechScore, setSpeechScore] = useState<number | null>(null);
    const [expectedText, setExpectedText] = useState('');
    const [statusText, setStatusText] = useState('Kameraya bakın, hazır olunca başlatın');

    const showPreviewCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            if (videoRef.current) videoRef.current.srcObject = stream;
            setPhase('preview');
            setStatusText('Kameraya bakın, hazır olunca başlatın');
        } catch (err: any) {
            setStatusText('Kameraya erişilemedi: ' + err.message);
        }
    };

    const startRecording = async () => {
        if (phase === 'recording') return;
        setPhase('recording');
        await identifyObject.current.startVideoRecord();
    };

    const confirmRecording = async () => {
        setPhase('processing');
        setStatusText('Video yükleniyor, ses analiz ediliyor...');
        await identifyObject.current.confirmVideoRecord();
    };

    const retakeRecording = async () => {
        setTranscript(null);
        setSpeechScore(null);
        await showPreviewCamera();
    };

    useEffect(() => {
        const sdk = identifyObject.current;
        if (!sdk) return;

        const speechEnabled = !!sdk.options?.videoRecordSpeech;
        if (speechEnabled) setExpectedText(sdk.options?.videoRecordExpectedText || 'İstanbul');

        sdk.lifeCycle.videoRecord = {
            onStart() {
                // Modülün kendi stream'ini video elementine bağla;
                // preview stream'i bırak (SDK zaten kendi stream'ini yönetiyor).
                const recordingStream = identifyObject.current?.videoRecordModule?.stream;
                if (videoRef.current && recordingStream) {
                    const old = videoRef.current.srcObject as MediaStream | null;
                    if (old && old !== recordingStream) old.getTracks().forEach(t => t.stop());
                    videoRef.current.srcObject = recordingStream;
                }
                setPhase('recording');
                setStatusText('Kayıt devam ediyor');
                setCountdown(identifyObject.current.getVideoRecordDuration());
                const interval = setInterval(() => {
                    setCountdown(prev => {
                        if (prev && prev > 1000) return prev - 1000;
                        clearInterval(interval);
                        return 0;
                    });
                }, 1000);
            },
            onStop() {
                setCountdown(null);
                setPhase('recorded');
                setStatusText('Kaydı inceleyin ve onaylayın');
            },
            // SDK'dan gelen ses analiz olaylarını UI fazına yansıtma — arka planda devam eder
            onTranscribeStart() {},
            onTranscribeCompleted(text: string) { setTranscript(text); },
            onSpeechFailed(text: string, score: number) {
                setPhase('speechFailed');
                setTranscript(text);
                setSpeechScore(score);
                setStatusText('Konuşma eşleşmedi, tekrar deneyin');
            },
            async onCompleted() {
                setPhase('done');
                setStatusText('Tamamlandı');
                await identifyObject.current.nextModule();
            }
        };

        showPreviewCamera();
    }, []);

    const speechEnabled = !!(identifyObject.current?.options?.videoRecordSpeech);
    const previewUrl = phase === 'recorded' || phase === 'speechFailed'
        ? identifyObject.current?.getVideoPreviewUrl()
        : null;

    return (
        <div className="id-module">
            {/* Sol — video */}
            <div className="id-module-media">
                {phase === 'processing' ? (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,color:'#fff',textAlign:'center',padding:32}}>
                        <div style={{
                            width:56,height:56,borderRadius:'50%',
                            border:'3px solid rgba(255,255,255,0.2)',
                            borderTopColor:'#fff',
                            animation:'id-spin 1s linear infinite'
                        }}/>
                        <div style={{fontSize:14,fontWeight:600,opacity:0.85}}>
                            Video yükleniyor<br/>ses analiz ediliyor...
                        </div>
                    </div>
                ) : !previewUrl ? (
                    <div className="id-video-wrap" style={{height:'100%'}}>
                        <video ref={videoRef} autoPlay playsInline muted
                               style={{transform:'scaleX(-1)',width:'100%',height:'100%',objectFit:'cover'}}/>
                        {phase === 'recording' && (
                            <>
                                <div className="id-video-badge">
                                    <span className="rec-dot"/>REC
                                </div>
                                {countdown !== null && (
                                    <div className="id-countdown">
                                        {countdown > 0 ? `${countdown / 1000}s` : '...'}
                                    </div>
                                )}
                                {speechEnabled && expectedText && (
                                    <div style={{
                                        position:'absolute',bottom:16,left:12,right:12,
                                        background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)',
                                        borderRadius:10,padding:'12px 16px',color:'#fff',textAlign:'center'
                                    }}>
                                        <div style={{fontSize:11,opacity:0.7,marginBottom:4}}>Yüksek sesle okuyun</div>
                                        <div style={{fontSize:22,fontWeight:800}}>{expectedText}</div>
                                    </div>
                                )}
                            </>
                        )}
                        {phase === 'preview' && speechEnabled && expectedText && (
                            <div style={{
                                position:'absolute',bottom:16,left:12,right:12,
                                background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',
                                borderRadius:10,padding:'12px 16px',color:'#fff',textAlign:'center'
                            }}>
                                <div style={{fontSize:11,opacity:0.6,marginBottom:4}}>Okunacak metin</div>
                                <div style={{fontSize:20,fontWeight:700}}>{expectedText}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <video src={previewUrl} controls autoPlay
                           style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                )}
            </div>

            {/* Sağ — panel */}
            <div className="id-module-panel">
                <div>
                    <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',
                                 color:'var(--slate-400)',marginBottom:6}}>
                        Kısa Video Kaydı
                    </div>
                    <div className="id-module-title">
                        {phase === 'preview'     && 'Hazır mısınız?'}
                        {phase === 'recording'   && 'Kayıt Devam Ediyor'}
                        {phase === 'recorded'    && 'Kaydı İnceleyin'}
                        {phase === 'processing'  && 'İşleniyor...'}
                        {phase === 'done'        && 'Tamamlandı ✓'}
                        {phase === 'speechFailed'&& 'Eşleşme Başarısız'}
                    </div>
                </div>

                <div className={`id-status ${
                    phase === 'done'         ? 'id-status-success' :
                    phase === 'recording'    ? 'id-status-warning' :
                    phase === 'speechFailed' ? 'id-status-error'   :
                    phase === 'processing'   ? 'id-status-info'    :
                    'id-status-idle'
                }`}>
                    <div className="id-status-dot"/>
                    {statusText}
                </div>

                {/* Preview: okunacak metin bilgisi sağ panelde */}
                {phase === 'preview' && speechEnabled && expectedText && (
                    <div className="id-text-card id-text-card-info">
                        <div className="id-text-card-hint">Okunacak metin</div>
                        <div className="id-text-card-word">{expectedText}</div>
                    </div>
                )}

                {phase === 'speechFailed' && transcript !== null && (
                    <div className="id-transcript">
                        <div className="id-transcript-label">Tanınan metin</div>
                        <div className="id-transcript-text">{transcript || '—'}</div>
                        {speechScore !== null && (
                            <div className="id-score-bar-wrap">
                                <div className="id-score-bar-label">
                                    <span>Benzerlik</span>
                                    <span>{(speechScore * 100).toFixed(0)}%</span>
                                </div>
                                <div className="id-score-bar-track">
                                    <div className="id-score-bar-fill" style={{width:`${speechScore*100}%`}}/>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    {phase === 'preview' && (
                        <button className="id-btn id-btn-primary id-btn-lg" onClick={startRecording}>
                            Kaydı Başlat
                        </button>
                    )}
                    {phase === 'recording' && (
                        <button className="id-btn id-btn-ghost" disabled>
                            <div className="id-spinner" style={{width:14,height:14}}/>
                            Kayıt Devam Ediyor...
                        </button>
                    )}
                    {(phase === 'recorded' || phase === 'speechFailed') && (
                        <>
                            <button className="id-btn id-btn-secondary" onClick={retakeRecording}>Tekrar Al</button>
                            <button className="id-btn id-btn-primary" onClick={confirmRecording}>
                                {phase === 'speechFailed' ? 'Tekrar Onayla' : 'Onayla ve Gönder'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
