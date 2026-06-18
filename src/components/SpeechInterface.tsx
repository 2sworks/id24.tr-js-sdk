import {useEffect, useState} from "react";

export const SpeechInterface = ({identifyObject}: { identifyObject: any }) => {
    const [expectedText, setExpectedText]   = useState<string | null>(null);
    const [spokenText, setSpokenText]       = useState<string | null>(null);
    const [isListening, setIsListening]       = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isCompleted, setIsCompleted]       = useState(false);
    const [voiceLoading, setWhisperLoading] = useState(false);
    const [statusText, setStatusText]       = useState('Sesli doğrulama hazırlanıyor...');
    const [statusType, setStatusType]       = useState<'idle'|'info'|'success'|'warning'|'error'>('idle');

    useEffect(() => {
        const sdk = identifyObject.current;
        if (!sdk) { setStatusText('SDK başlatılmamış'); return; }

        sdk.lifeCycle.speech = {
            onStart: (expected: string) => {
                setExpectedText(expected);
                setStatusText('Aşağıdaki metni mikrofona söyleyin');
                setStatusType('info');
            },
            onListeningStart: () => {
                setIsListening(true);
                setStatusText('Dinleniyor...');
                setStatusType('warning');
            },
            onListeningStop: () => {
                setIsListening(false);
                setStatusText('Ses işleniyor...');
                setStatusType('idle');
            },
            onTranscribing: () => { setIsTranscribing(true); setStatusText('Ses sunucuya gönderiliyor...'); },
            onSpokenText: (text: string) => { setIsTranscribing(false); setSpokenText(text); setStatusText('Metni kontrol edin, ardından onaylayın'); },
            onCompleted: async () => {
                setIsCompleted(true);
                setStatusText('Doğrulandı, sonraki adıma geçiliyor...');
                setStatusType('success');
                await identifyObject.current.nextModule();
            },
            onFailed: (spoken: string | null) => {
                setStatusText(`Eşleşmedi — söylenen: "${spoken ?? '—'}"`);
                setStatusType('error');
            },
            onSkip: async () => {
                setStatusText('Sesli doğrulama atlandı');
                setStatusType('idle');
                await identifyObject.current.nextModule();
            },
            onError:  (e: any) => { setIsTranscribing(false); setStatusText('Hata: ' + (e?.message || e?.error || e)); setStatusType('error'); },
            onStop:   () => setIsListening(false),
            onVoiceLoading: () => { setWhisperLoading(true);  setStatusText('Ses tanıma motoru yükleniyor...'); setStatusType('idle'); },
            onVoiceReady:   () => { setWhisperLoading(false); },
        };

        sdk.startSpeechRecognition().catch((err: any) => {
            setStatusText('Başlatılamadı: ' + err.message);
            setStatusType('error');
        });
    }, []);

    return (
        <div className="id-module">
            {/* Sol — görsel alan */}
            <div className="id-module-media" style={{
                flexDirection:'column', gap:0,
                background: isListening
                    ? 'linear-gradient(135deg,#7f1d1d,#dc2626)'
                    : 'linear-gradient(135deg,var(--blue-900),var(--blue-700))'
            }}>
                <div style={{
                    fontSize: isListening ? 96 : 72,
                    transition: 'font-size 0.3s ease',
                    filter: isListening ? 'drop-shadow(0 0 24px rgba(255,255,255,0.4))' : 'none',
                    animation: isListening ? 'id-pulse-red 1s ease infinite' : 'none',
                    cursor: isCompleted ? 'default' : 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                }}
                    onMouseDown  ={!isCompleted && !isTranscribing ? (e) => { e.preventDefault(); identifyObject.current.startSpeechListening(); } : undefined}
                    onMouseUp    ={!isCompleted && !isTranscribing ? () => identifyObject.current.stopSpeechListening()  : undefined}
                    onMouseLeave ={!isCompleted && !isTranscribing ? () => identifyObject.current.stopSpeechListening()  : undefined}
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart ={!isCompleted && !isTranscribing ? (e) => { e.preventDefault(); identifyObject.current.startSpeechListening(); } : undefined}
                    onTouchEnd   ={!isCompleted && !isTranscribing ? () => identifyObject.current.stopSpeechListening()  : undefined}
                >
                    {isCompleted ? '✅' : '🎙️'}
                </div>
                <div style={{color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:500, marginTop:12, textAlign:'center', padding:'0 24px'}}>
                    {voiceLoading  ? 'Motor yükleniyor...' :
                     isTranscribing  ? 'İşleniyor...'        :
                     isListening     ? 'Bırakınca durur'     :
                     isCompleted     ? 'Tamamlandı'          :
                                       'Basılı tutarak konuşun'}
                </div>
            </div>

            {/* Sağ — panel */}
            <div className="id-module-panel">
                <div>
                    <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',
                                 color:'var(--slate-400)',marginBottom:6}}>Sesli Doğrulama</div>
                    <div className="id-module-title">
                        {isCompleted ? 'Doğrulama Tamamlandı' :
                         isListening ? 'Dinleniyor...' : 'Hazır'}
                    </div>
                </div>

                <div className={`id-status id-status-${statusType}`}>
                    <div className="id-status-dot"/>
                    {statusText}
                </div>

                {voiceLoading && (
                    <div className="id-loader">
                        <div className="id-spinner"/>
                        İlk kullanımda model indiriliyor (~40 MB)...
                    </div>
                )}

                {expectedText && !isCompleted && (
                    <div className="id-text-card id-text-card-info">
                        <div className="id-text-card-hint">Söylenecek metin (sesli doğrulama)</div>
                        <div className="id-text-card-word">{expectedText}</div>
                    </div>
                )}

                {spokenText && (
                    <div className="id-transcript">
                        <div className="id-transcript-label">Algılanan metin</div>
                        <div className="id-transcript-text">
                            {spokenText.replace(/[.!?,;:]+$/, '')}
                        </div>
                    </div>
                )}

                {!isCompleted && (
                    <div style={{display:'flex', gap:10}}>
                        <button className="id-btn id-btn-primary"
                                onClick={() => identifyObject.current.confirmSpeech()}
                                disabled={!spokenText || isListening || voiceLoading}>
                            Onayla
                        </button>
                        <button className="id-btn id-btn-ghost"
                                onClick={() => identifyObject.current.skipSpeechRecognition()}>
                            Atla
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
