import {useEffect, useRef, useState, Fragment} from "react";

const challengeLabel: Record<string, {emoji: string; text: string}> = {
    SMILE:      {emoji: '😊', text: 'Lütfen gülümseyin'},
    BLINK:      {emoji: '😉', text: 'Lütfen gözlerinizi kırpın'},
    TURN_RIGHT: {emoji: '➡️', text: 'Başınızı sağa çevirin'},
    TURN_LEFT:  {emoji: '⬅️', text: 'Başınızı sola çevirin'},
    NOD_DOWN:   {emoji: '⬇️', text: 'Başınızı öne eğin'},
    NOD_UP:     {emoji: '⬆️', text: 'Başınızı geriye eğin'},
    BROW_UP:    {emoji: '🤨', text: 'Kaşlarınızı kaldırın'},
    LOOK_LEFT:  {emoji: '👀', text: 'Gözlerinizi sola kaydırın'},
    LOOK_RIGHT: {emoji: '👀', text: 'Gözlerinizi sağa kaydırın'},
    LOOK_UP:    {emoji: '🙄', text: 'Gözlerinizi yukarı bakın'},
};

// Renkli debug canvas — MediaPipe'ın gördüğü landmark bölgeleri
const REGION_COLORS: Record<number, string> = {};
([[
    '#3b82f6', [10,151,9,108,107,338,337,297,299,296,67,109,66,105,104,103,54,21,162,127,356,389,251]
],[
    '#06b6d4', [33,130,159,145,144,153,133,7,163,160,161,246,155,154,157,158,173,
                362,359,386,374,373,380,263,249,390,388,387,466,384,385,398,382,381]
],[
    '#eab308', [4,5,1,2,98,97,326,327,6,195,197,19,248,281,363,440,275,45,220,115,44,174,279]
],[
    '#ef4444', [0,13,14,17,61,291,37,267,84,314,39,269,40,270,91,321,181,405,185,409,146,375,78,308,95,324,311,310,312,415,402,317,87,178,88,95]
],[
    '#f97316', [152,148,172,136,149,150,176,397,400,377,378,379,365,288,361,323,58,132,93,234,127,162,454]
]] as [string, number[]][]).forEach(([color, ids]) => ids.forEach(i => { REGION_COLORS[i] = color; }));

const KEY_LMS: [number, string, string][] = [
    [10,'foreH','#93c5fd'],[151,'fhB','#93c5fd'],
    [33,'eL','#67e8f9'],[263,'eR','#67e8f9'],
    [130,'eLout','#a5f3fc'],[359,'eRout','#a5f3fc'],
    [4,'nose','#fde047'],[13,'mT','#fdba74'],
    [152,'chin','#fca5a5'],[234,'chL','#d8b4fe'],[454,'chR','#d8b4fe'],
];

interface CenteringDebug {
    faceCenterX: number; faceCenterY: number;
    faceW: number; faceH: number;
    maxOffX: number; maxOffY: number;
    offX: number; offY: number;
    mult: number;
}

// Pose landmark bağlantıları: [from, to]
const POSE_CONNECTIONS: [number,number][] = [
    [11,12],[11,13],[13,15],[12,14],[14,16], // omuzlar ve kollar
    [11,23],[12,24],                          // gövde üst
];
const POSE_KEY = [11,12,13,14,15,16]; // omuz, dirsek, bilek

function drawDebugFrame(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    landmarks: any[],
    debug?: { faceComplete: boolean; faceReason: string; centering: CenteringDebug | null; challenge: string; poseLandmarks?: any[] | null; objectInFront?: boolean; flatFaceFrames?: number; zRange?: number | null }
) {
    if (!landmarks?.length) return;
    const vW = video.videoWidth  || 640;
    const vH = video.videoHeight || 480;
    // Canvas'ı container boyutuna ayarla (object-fit:cover ile eşleşmesi için)
    const cW = canvas.clientWidth  || vW;
    const cH = canvas.clientHeight || vH;
    if (canvas.width !== cW || canvas.height !== cH) { canvas.width = cW; canvas.height = cH; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cW, cH);

    // object-fit:cover transform: videoyu kap, taşanı kırp
    const scale = Math.max(cW / vW, cH / vH);
    const offX  = (cW - vW * scale) / 2;
    const offY  = (cH - vH * scale) / 2;
    // Normalize (0-1) landmark koordinatını canvas px'ine çevir
    const px = (lm: any) => lm.x * vW * scale + offX;
    const py = (lm: any) => lm.y * vH * scale + offY;

    // ── Pose iskelet (PoseLandmarker yüklüyse) ───────────────────────────────
    const poseLms: any[] | null | undefined = debug?.poseLandmarks;
    if (poseLms && poseLms.length >= 17) {
        const alert = debug?.objectInFront;
        const boneColor = alert ? 'rgba(239,68,68,0.85)' : 'rgba(52,211,153,0.85)';
        const dotColor  = alert ? '#ef4444' : '#34d399';

        // Bağlantı çizgileri
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = boneColor;
        for (const [a, b] of POSE_CONNECTIONS) {
            const la = poseLms[a], lb = poseLms[b];
            if (!la || !lb) continue;
            if ((la.visibility ?? 1) < 0.4 || (lb.visibility ?? 1) < 0.4) continue;
            ctx.beginPath();
            ctx.moveTo(px(la), py(la));
            ctx.lineTo(px(lb), py(lb));
            ctx.stroke();
        }

        // Anahtar nokta daireleri
        for (const idx of POSE_KEY) {
            const lm = poseLms[idx];
            if (!lm || (lm.visibility ?? 1) < 0.4) continue;
            ctx.beginPath();
            ctx.arc(px(lm), py(lm), idx === 15 || idx === 16 ? 6 : 4, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.fill();
        }

        // Bilek uyarısı etiketi
        if (alert) {
            ctx.save();
            ctx.scale(-1, 1); ctx.translate(-cW, 0);
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
            ctx.fillText('⚠ nesne-tespit', 8, cH - 8);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    // Tüm yüz landmarkları
    for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        if (!lm) continue;
        ctx.beginPath();
        ctx.arc(px(lm), py(lm), 1.5, 0, Math.PI * 2);
        ctx.fillStyle = REGION_COLORS[i] || 'rgba(255,255,255,0.25)';
        ctx.fill();
    }

    // Anahtar landmarklar — büyük daire + etiket
    ctx.font = 'bold 9px monospace';
    for (const [idx, label, color] of KEY_LMS) {
        const lm = landmarks[idx];
        if (!lm) continue;
        ctx.beginPath();
        ctx.arc(px(lm), py(lm), 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(label, px(lm) + 7, py(lm) + 4);
        ctx.shadowBlur = 0;
    }

    // ── SDK merkezleme overlay ────────────────────────────────────────────────
    const c = debug?.centering;
    if (c) {
        const ok = debug!.faceComplete;
        const color = ok ? '#22c55e' : '#ef4444';

        // İzin verilen offset kutusu — video koordinatlarını cover transform ile canvas'a map et
        const bx1 = (0.5 - c.maxOffX) * vW * scale + offX;
        const by1 = (0.5 - c.maxOffY) * vH * scale + offY;
        const bx2 = (0.5 + c.maxOffX) * vW * scale + offX;
        const by2 = (0.5 + c.maxOffY) * vH * scale + offY;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(bx1, by1, bx2 - bx1, by2 - by1);
        ctx.setLineDash([]);

        // Ekran merkezi artı işareti
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cW/2 - 10, cH/2); ctx.lineTo(cW/2 + 10, cH/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cW/2, cH/2 - 10); ctx.lineTo(cW/2, cH/2 + 10); ctx.stroke();

        // SDK'nın hesapladığı yüz merkez noktası
        const fcx = c.faceCenterX * vW * scale + offX;
        const fcy = c.faceCenterY * vH * scale + offY;
        ctx.beginPath();
        ctx.arc(fcx, fcy, 7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fcx, fcy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Merkez → ekran ortası çizgisi
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(fcx, fcy); ctx.lineTo(cW/2, cH/2); ctx.stroke();
        ctx.setLineDash([]);

        // Bilgi metni — canvas CSS'te scaleX(-1) uygulandığından context'i geri çevir
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-cW, 0);
        ctx.font = 'bold 11px monospace';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        const zRange = debug?.zRange;
        const flatF  = debug?.flatFaceFrames ?? 0;
        const zColor = zRange == null ? '#aaa' : zRange > 0.03 ? '#4ade80' : zRange > 0.015 ? '#facc15' : '#f87171';
        const lines = [
            `${(c as any).zone ?? ''}  faceW=${c.faceW.toFixed(2)} mult=${c.mult.toFixed(2)}`,
            `offX=${c.offX.toFixed(2)} maxX=${c.maxOffX.toFixed(2)}`,
            `offY=${c.offY.toFixed(2)} maxY=${c.maxOffY.toFixed(2)}`,
            debug!.faceReason ? `! ${debug!.faceReason.split(' ')[0]}` : '✓ ok',
            `zRange=${zRange != null ? zRange.toFixed(4) : '?'}  flat=${flatF}/8`,
        ];
        lines.forEach((line, i) => {
            ctx.fillStyle = i === 3 ? color : i === 4 ? zColor : '#fff';
            ctx.fillText(line, 8, 16 + i * 15);
        });
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

export const LivenessDetectionInterface = ({identifyObject, colorDebugMode}: { identifyObject: any; colorDebugMode?: boolean }) => {
    const videoRef  = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [statusText, setStatusText]   = useState('Canlılık testi hazır');
    const [statusType, setStatusType]   = useState<'idle'|'info'|'success'|'warning'|'error'>('idle');
    const [challenge, setChallenge]     = useState<{emoji:string;text:string}|null>(null);
    const [progress, setProgress]       = useState<{done:number;total:number}|null>(null);
    const [isRunning, setIsRunning]     = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [faceVisible, setFaceVisible]         = useState(true);
    const [faceWarning, setFaceWarning]         = useState(false);
    const [faceWarnReason, setFaceWarnReason]   = useState<string|null>(null);
    const [multipleFaces, setMultipleFaces]     = useState(false);
    const [modelLoading, setModelLoading]       = useState(false);
    const [isUploading, setIsUploading]         = useState(false);
    const [sunglassesWarn, setSunglassesWarn]   = useState(false);
    const [hatWarn, setHatWarn]                 = useState(false);

    useEffect(() => {
        const sdk = identifyObject.current;
        if (!sdk) return;

        sdk.lifeCycle.livenessDetection = {
            onStart: (challenges: string[]) => {
                setIsRunning(true);
                setProgress({done: 0, total: challenges.length});
                setStatusText('Test başladı');
                setStatusType('info');
            },
            onChallengeStart: (ch: string, index: number, total: number) => {
                setChallenge(challengeLabel[ch] || {emoji: '🎯', text: ch});
                setProgress({done: index, total});
                setStatusText(`Adım ${index + 1} / ${total}`);
                setStatusType('info');
            },
            onChallengeCompleted: (_ch: string, index: number, total: number) => {
                setProgress({done: index + 1, total});
            },
            onWrongAction: (expected: string) => {
                setStatusText(`Yanlış hareket — beklenen: ${challengeLabel[expected]?.text ?? expected}`);
                setStatusType('warning');
            },
            onFaceFound:      () => { setFaceVisible(true);  setFaceWarning(false); setFaceWarnReason(null); },
            onFaceLost:       () => { setFaceVisible(false); setFaceWarning(false); setFaceWarnReason(null); setSunglassesWarn(false); setHatWarn(false); },
            onFaceWarning:    (reason: string|null) => { setFaceWarning(true); setFaceWarnReason(reason ?? null); },
            onFaceClear:      () => { setFaceWarning(false); setFaceWarnReason(null); },
            onMultipleFaces:  () => setMultipleFaces(true),
            onSingleFace:     () => setMultipleFaces(false),
            onSunglassesWarning: () => setSunglassesWarn(true),
            onSunglassesClear:   () => setSunglassesWarn(false),
            onHatWarning:        () => setHatWarn(true),
            onHatClear:          () => setHatWarn(false),
            onDebugFrame: (landmarks: any[], _scores: any, debug: any) => {
                if (!colorDebugMode || !canvasRef.current || !videoRef.current) return;
                drawDebugFrame(canvasRef.current, videoRef.current, landmarks, debug);
            },
            onModelLoading: () => { setModelLoading(true);  setStatusText('Model yükleniyor...'); setStatusType('idle'); },
            onModelReady:   () => { setModelLoading(false); },
            onUploadStart:     () => { setIsUploading(true);  setStatusText('Kayıt yükleniyor...'); setStatusType('info'); },
            onUploadCompleted: () => { setIsUploading(false); setStatusText('Kayıt yüklendi'); },
            onCompleted: async () => {
                setChallenge(null);
                setIsRunning(false);
                setIsCompleted(true);
                setStatusText('Canlılık testi başarıyla tamamlandı');
                setStatusType('success');
                await identifyObject.current.nextModule();
            },
            onUploadError: () => { setStatusText('Hata alındı — adım yeniden başlatılıyor'); setStatusType('error'); },
            onReset: () => { setStatusText('Süreç baştan başladı'); setStatusType('idle'); },
            onSkip: async () => {
                setChallenge(null);
                setIsRunning(false);
                setStatusText('Canlılık testi atlandı');
                setStatusType('idle');
                await identifyObject.current.nextModule();
            },
            onError: (e: any) => { setStatusText('Hata: ' + (e?.message || e)); setStatusType('error'); },
            onStop:  () => setIsRunning(false),
        };
    }, []);

    const handleStart = async () => {
        try {
            setStatusText('Kamera açılıyor...');
            setStatusType('idle');
            await identifyObject.current.startLivenessDetection(videoRef.current);
        } catch (err: any) {
            setStatusText('Başlatılamadı: ' + err.message);
            setStatusType('error');
        }
    };

    return (
        <div className="id-module">
            {/* Sol — video */}
            <div className="id-module-media">
                <div className="id-video-wrap" style={{height:'100%', background:'#000'}}>
                    <video ref={videoRef} autoPlay playsInline muted
                           style={{transform:'scaleX(-1)',width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    {colorDebugMode && (
                        <canvas ref={canvasRef} style={{
                            position:'absolute',top:0,left:0,width:'100%',height:'100%',
                            transform:'scaleX(-1)',pointerEvents:'none'
                        }}/>
                    )}
                    {isRunning && multipleFaces && (
                        <div style={{
                            position:'absolute',top:12,left:12,right:12,
                            background:'rgba(220,38,38,0.92)',backdropFilter:'blur(6px)',
                            borderRadius:8,padding:'8px 14px',color:'#fff',
                            fontSize:13,fontWeight:600,textAlign:'center'
                        }}>
                            ⚠️ Kamerada yalnızca bir kişi olmalı
                        </div>
                    )}
                    {isRunning && !multipleFaces && !faceVisible && (
                        <div style={{
                            position:'absolute',top:12,left:12,right:12,
                            background:'rgba(220,38,38,0.85)',backdropFilter:'blur(6px)',
                            borderRadius:8,padding:'8px 14px',color:'#fff',
                            fontSize:13,fontWeight:600,textAlign:'center'
                        }}>
                            ⚠️ Yüz görünmüyor — kameraya bakın
                        </div>
                    )}
                    {isRunning && !multipleFaces && faceVisible && faceWarning && (
                        <div style={{
                            position:'absolute',top:12,left:12,right:12,
                            background:'rgba(234,88,12,0.88)',backdropFilter:'blur(6px)',
                            borderRadius:8,padding:'8px 14px',color:'#fff',
                            fontSize:13,fontWeight:600,textAlign:'center'
                        }}>
                            {faceWarnReason === 'sol-goz-kapali' || faceWarnReason === 'sag-goz-kapali' || faceWarnReason === 'goz-kapali-turn'
                                ? '👁️ Gözlerinizin açık ve kameraya baktığınızdan emin olun'
                                : '⚠️ Yüzünüzün tamamı ekranda ve ortalı gözüksün'}
                        </div>
                    )}
                    {isRunning && sunglassesWarn && (
                        <div style={{
                            position:'absolute',top:48,left:12,right:12,
                            background:'rgba(109,40,217,0.90)',backdropFilter:'blur(6px)',
                            borderRadius:8,padding:'8px 14px',color:'#fff',
                            fontSize:13,fontWeight:600,textAlign:'center'
                        }}>
                            Lütfen şapka, kasket, güneş gözlüğü veya yüzünüzü kapatan saç/aksesuar gibi unsurları kaldırın
                        </div>
                    )}
                    {isRunning && hatWarn && (
                        <div style={{
                            position:'absolute',top:sunglassesWarn ? 90 : 48,left:12,right:12,
                            background:'rgba(15,118,110,0.90)',backdropFilter:'blur(6px)',
                            borderRadius:8,padding:'8px 14px',color:'#fff',
                            fontSize:13,fontWeight:600,textAlign:'center'
                        }}>
                            Lütfen şapka, kasket, güneş gözlüğü veya yüzünüzü kapatan saç/aksesuar gibi unsurları kaldırın
                        </div>
                    )}
                    {isUploading && (
                        <div style={{
                            position:'absolute',inset:0,
                            background:'rgba(0,0,0,0.72)',backdropFilter:'blur(4px)',
                            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                            gap:14,color:'#fff',borderRadius:'inherit'
                        }}>
                            <div style={{
                                width:44,height:44,borderRadius:'50%',
                                border:'3px solid rgba(255,255,255,0.25)',
                                borderTopColor:'#fff',
                                animation:'id-spin 0.8s linear infinite'
                            }}/>
                            <div style={{fontSize:15,fontWeight:700}}>Kayıt yükleniyor...</div>
                            <div style={{fontSize:12,opacity:0.65}}>Lütfen bekleyin</div>
                        </div>
                    )}
                    {challenge && isRunning && !isUploading && (
                        <div style={{
                            position:'absolute',bottom:16,left:12,right:12,
                            background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)',
                            borderRadius:10,padding:'14px 16px',color:'#fff',textAlign:'center'
                        }}>
                            <div style={{fontSize:36,lineHeight:1,marginBottom:6}}>{challenge.emoji}</div>
                            <div style={{fontSize:15,fontWeight:700}}>{challenge.text}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sağ — panel */}
            <div className="id-module-panel">
                <div>
                    <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',
                                 color:'var(--slate-400)',marginBottom:6}}>Canlılık Testi</div>
                    <div className="id-module-title">
                        {isCompleted  ? 'Test Tamamlandı' :
                         modelLoading ? 'Model Yükleniyor...' :
                         isRunning    ? 'Testi Tamamlayın' :
                                        'Testi Başlatın'}
                    </div>
                </div>

                <div className={`id-status id-status-${statusType}`}>
                    <div className="id-status-dot"/>
                    {statusText}
                </div>

                {modelLoading && (
                    <div className="id-loader">
                        <div className="id-spinner"/>
                        Analiz motoru yükleniyor...
                    </div>
                )}

                {progress && (
                    <div>
                        <div style={{fontSize:12,color:'var(--slate-400)',marginBottom:10,fontWeight:500}}>
                            İlerleme
                        </div>
                        <div className="id-steps">
                            {Array.from({length: progress.total}).map((_, i) => (
                                <Fragment key={i}>
                                    {i > 0 && (
                                        <div className={`id-step-connector${i <= progress.done ? ' done' : ''}`}/>
                                    )}
                                    <div className={`id-step${
                                        i < progress.done ? ' done' :
                                        i === progress.done && isRunning ? ' active' : ''
                                    }`}>
                                        {i < progress.done ? '✓' : i + 1}
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                    {!isRunning && !isCompleted && !modelLoading && (
                        <button className="id-btn id-btn-primary id-btn-lg" onClick={handleStart}>
                            Testi Başlat
                        </button>
                    )}
                    {isRunning && (
                        <button className="id-btn id-btn-ghost"
                                onClick={() => identifyObject.current.resetLivenessDetection()}>
                            Baştan Başla
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
