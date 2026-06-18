import React, {useEffect, useRef, useState} from 'react';
import {ConfigForm} from './components/ConfigForm';
import {CallInterface} from './components/CallInterface';
import {
    IdentifyLogLevels,
    IdentifyOptionBuilder,
    IdentifySdkBuilder,
    IdentifyModuleTypes
} from '@2sworks/identify-sdk';
import {VideoRecordInterface} from "./components/VideoRecordInterface";
import {LivenessDetectionInterface} from "./components/LivenessDetectionInterface";
import {SpeechInterface} from "./components/SpeechInterface";

// Liveness durumuna göre kullanıcıya gösterilecek metin (developer kendi ekranını kurabilir).
const livenessLabel: Record<string, string> = {
    'idle': '',
    'disabled': 'Canlılık bu proje için kapalı — atlandı',
    'missing-assets': 'Canlılık aktif ama MediaPipe paketleri verilmemiş — atlandı',
    'preparing': '⏳ Canlılık paketleri hazırlanıyor...',
    'ready': '✅ Canlılık hazır',
    'error': '⚠️ Canlılık yüklenemedi (görüşme yine de devam eder)',
    'reporting': '🟢 Canlılık raporlaması aktif',
    'stopped': 'Canlılık raporlaması durdu',
};

export const App: React.FC = () => {
    const identifyObject = useRef<any>(null);
    const [context, setContext] = useState({
        isInitialized: false,
        isIdentificationStarted: false,
        isSocketConnected: false,
        activeModule: null,
        livenessStatus: 'idle' as string,
        error: null as string | null,
    });
    const [config, setConfig] = useState<any | null>(null);
    const [allCompleted, setAllCompleted] = useState(false);

    useEffect(() => {
        if (config && !context.isIdentificationStarted) {
            const initIdentification = async () => {
                try {
                    const optsBuilder = new IdentifyOptionBuilder()
                        .setIdentityType(config.modules);

                    // Yüz merkezleme toleransları — boşsa SDK varsayılanı kullanılır
                    {
                        const lt: Record<string, number> = {};
                        const lth = config.livenessThresholds || {};
                        const fields: [string, string][] = [
                            ['faceCenterMultNear',    lth.faceCenterMultNear],
                            ['faceCenterMultMid',     lth.faceCenterMultMid],
                            ['faceCenterMultFar',     lth.faceCenterMultFar],
                            ['faceSizeNearThreshold', lth.faceSizeNearThreshold],
                            ['faceSizeFarThreshold',  lth.faceSizeFarThreshold],
                            ['faceCenterMin',         lth.faceCenterMin],
                            ['faceCenterMax',         lth.faceCenterMax],
                            ['faceCenterMaxNear',     lth.faceCenterMaxNear],
                            ['faceCenterMaxMid',      lth.faceCenterMaxMid],
                            ['faceCenterMaxFar',      lth.faceCenterMaxFar],
                            ['smilingProbability',    lth.smilingProbability],
                            ['blinkProbability',      lth.blinkProbability],
                            ['browUpProbability',     lth.browUpProbability],
                            ['eyeWideProbability',    lth.eyeWideProbability],
                            ['leftYawAngle',          lth.leftYawAngle],
                            ['rightYawAngle',         lth.rightYawAngle],
                            ['nodDownAngle',          lth.nodDownAngle],
                            ['nodUpAngle',            lth.nodUpAngle],
                            ['lookUpProbability',     lth.lookUpProbability],
                            ['lookDownProbability',   lth.lookDownProbability],
                            ['winkProbability',       lth.winkProbability],
                            ['gazeProbability',       lth.gazeProbability],
                        ];
                        fields.forEach(([k, v]) => { if (v) lt[k] = Number(v); });
                        if (Object.keys(lt).length) optsBuilder.setLivenessThresholds(lt);
                    }

                    if (config.videoRecordTime) {
                        optsBuilder.setVideoRecordTime(config.videoRecordTime);
                    }

                    // SPEECH_TEST modülü — sesli doğrulama beklenen metin
                    if (config.speechExpectedText) {
                        optsBuilder.setSpeechExpectedText(config.speechExpectedText);
                    }
                    // Ses tanıma dili (boşsa SDK oturum dilinden türetir).
                    if (config.speechLanguage) {
                        optsBuilder.setSpeechLanguage(config.speechLanguage);
                    }

                    // VIDEO_RECORD ses doğrulama seçenekleri
                    if (config.videoRecordSpeechEnabled) {
                        optsBuilder.enableVideoRecordSpeech();
                    }
                    if (config.videoRecordSpeechExpectedText) {
                        optsBuilder.setVideoRecordExpectedText(config.videoRecordSpeechExpectedText);
                    }
                    if (config.videoRecordSpeechThreshold) {
                        optsBuilder.setVideoRecordSpeechThreshold(Number(config.videoRecordSpeechThreshold));
                    }

                    const stunEmpty = !config.stun.ip || !config.stun.port;
                    const turnEmpty = !config.turn.ip || !config.turn.port;
                    if (stunEmpty || turnEmpty) {
                        console.warn('[App] STUN/TURN bilgileri boş — sunucu encrypted_turn_credential sağlamazsa görüşme çalışmayabilir.');
                    }

                    if (!config.hatDetection)        (optsBuilder as any).disableHatDetection();
                    if (!config.sunglassesDetection) (optsBuilder as any).disableSunglassesDetection();
                    if (!config.skinCheck)           (optsBuilder as any).disableSkinCheck();

                    // Liveness'i aktive et (proje ayarı da açık olmalı). İki mod:
                    const lv = config.liveness;
                    if (lv.bundled) {
                        const poseModelUrl = lv.poseModelUrl || '/mediapipe/pose_landmarker_lite.task';
                        (optsBuilder as any).enablePoseDetection(poseModelUrl);
                    } else if (lv?.wasmUrl && lv?.modelUrl && lv.visionUrl) {
                        if (lv.poseModelUrl) {
                            (optsBuilder as any).enablePoseDetection(lv.poseModelUrl);
                        }
                    }
                    // Tüm optsBuilder ayarları tamamlandıktan sonra build et.
                    const opts = optsBuilder.build();

                    const builder = new IdentifySdkBuilder()
                        .setApi(config.api_url)
                        .setStun(config.stun.ip, config.stun.port)
                        .setTurn(config.turn.ip, config.turn.port, config.turn.username, config.turn.pass)
                        .setLogLevel(Number(config.logLevel) || IdentifyLogLevels.INFO)
                        .setOptions(opts);

                    if (config.turn.secret) {
                        builder.setTurnSecretKey(config.turn.secret);
                    }

                    if (config.wsSecret) {
                        builder.setWsSecretKey(config.wsSecret);
                    }

                    if (config.useApiForSpeech) {
                        builder.setUseApiForSpeech();
                    }

                    if (lv.bundled) {
                        const wasmUrl      = lv.wasmUrl      || '/mediapipe/wasm';
                        const modelUrl     = lv.modelUrl     || '/mediapipe/face_landmarker.task';
                        const handModelUrl = lv.handModelUrl || '/mediapipe/hand_landmarker.task';
                        const vision = await import('@mediapipe/tasks-vision');
                        builder.setLivenessVisionModule(vision, wasmUrl, modelUrl, handModelUrl);
                        if (lv.interval) builder.setLivenessInterval(Number(lv.interval));
                    } else if (lv?.wasmUrl && lv?.modelUrl && lv.visionUrl) {
                        const handModelUrl = lv.handModelUrl || null;
                        builder.setLivenessAssets(lv.visionUrl, lv.wasmUrl, lv.modelUrl, handModelUrl);
                        if (lv.interval) builder.setLivenessInterval(Number(lv.interval));
                    }

                    identifyObject.current = builder
                        .setLifeCycle({
                            socket: {
                                onConnectionLost: () => console.log('[LifeCycle] Socket bağlantısı koptu'),
                                onError: (e: any) => console.error('[LifeCycle] Socket hata:', e),
                            },
                            sdk: {
                                onReady: async () => {
                                    console.log('[LifeCycle] Socket bağlantısı açıldı');
                                    setContext((c) => ({...c, isSocketConnected: true}));

                                    await identifyObject.current.openModule();
                                },
                            },
                            module: {
                                onStepChanged: (mod: any) => {
                                    console.log('[LifeCycle] Modül değişti:', mod)

                                    setContext((c) => ({...c, activeModule: mod}));
                                }
                            },
                            liveness: {
                                // Ident detail çekilince bir kez: paket/asset kontrol özeti.
                                onCheck: (c: any) => console.log('[LifeCycle] Liveness kontrol:', c),
                                onPreparing: () => console.log('[LifeCycle] Liveness paketleri hazırlanıyor'),
                                onReady: () => console.log('[LifeCycle] Liveness modeli hazır'),
                                onError: (e: any) => console.warn('[LifeCycle] Liveness hata:', e?.message || e),
                                onSkip: (reason: any) => console.log('[LifeCycle] Liveness atlandı:', reason),
                                onStart: () => console.log('[LifeCycle] Liveness raporlama başladı'),
                                onStop: () => console.log('[LifeCycle] Liveness raporlama durdu'),
                                // Tek noktadan ekran güncellemesi:
                                onStatusChange: (status: any) =>
                                    setContext((c) => ({...c, livenessStatus: status})),
                            },
                        })
                        .build();

                    identifyObject.current.lifeCycle.sdk.onAllModulesCompleted = () => {
                        console.log('[LifeCycle] Tüm modüller tamamlandı');
                        setAllCompleted(true);
                    };

                    console.log('[App] Identification başlatılıyor...');
                    await identifyObject.current.startIdentification(
                        config.ident_id,
                        config.language,
                        config.sign_lang
                    );

                    setContext((c) => ({
                        ...c,
                        isIdentificationStarted: true
                    }));
                } catch (err: any) {
                    console.error('[App] Hata:', err.message);
                    setContext((c) => ({...c, error: err.message || 'Bilinmeyen hata'}));
                }
            };

            initIdentification();
        }
    }, [config]);

    const livenessText = livenessLabel[context.livenessStatus] || '';
    const livenessStatusClass =
        context.livenessStatus === 'reporting' ? 'id-status-success' :
        context.livenessStatus === 'error'     ? 'id-status-error'   :
        context.livenessStatus === 'preparing' ? 'id-status-warning' :
        'id-status-idle';

    return (
        <div className="app">
            <div className="id-header">
                <div className="id-logo">
                    <img src="https://identify.com.tr/wp-content/uploads/2023/04/surface1.svg"
                         alt="identify"/>
                </div>
                <span className="id-header-badge">SDK Demo</span>
            </div>

            {context.isInitialized && context.activeModule && livenessText && (
                <div className={`id-liveness-bar ${livenessStatusClass}`} style={{marginBottom: '10px'}}>
                    <div className="id-status-dot" />
                    {livenessText}
                </div>
            )}
            {!context.isInitialized ? (
                <ConfigForm
                    onNext={(data) => {
                        // Kamera + mikrofon iznini click handler'da (gesture context) al ve hemen bırak.
                        // Bir kez alınan izin tüm modüller için geçerli olur, tekrar sorulmaz.
                        navigator.mediaDevices.getUserMedia({video: true, audio: true})
                            .then(s => s.getTracks().forEach(t => t.stop()))
                            .catch(() => {});

                        // Seçim sırası akış sırasıdır: önce tanılama adımları, en son görüşme.
                        const selectedModules = [];
                        if (data['module-liveness'] === 'true')
                            selectedModules.push(IdentifyModuleTypes.LIVENESS_TEST);
                        if (data['module-speech'] === 'true')
                            selectedModules.push(IdentifyModuleTypes.SPEECH_TEST);
                        if (data['module-video-record'] === 'true')
                            selectedModules.push(IdentifyModuleTypes.VIDEO_RECORD);
                        if (data['module-agent-call'] === 'true')
                            selectedModules.push(IdentifyModuleTypes.AGENT_CALL);

                        setConfig({
                            ident_id: data['ident_id'],
                            language: data['language'] || 'tr',
                            sign_lang: data['sign_lang'] || 'false',
                            api_url: data['api-url'],
                            stun: {ip: data['stun-ip'], port: data['stun-port']},
                            turn: {
                                ip: data['turn-ip'],
                                port: data['turn-port'],
                                username: data['turn-username'],
                                pass: data['turn-pass'],
                                secret: data['turn-secret'] || ''
                            },
                            logLevel: data['logLevel'],
                            modules: selectedModules,
                            videoRecordTime: Number(data['video-record-time']) || null,
                            wsSecret: data['ws-secret'] || '',
                            speechExpectedText: data['speech-expected-text'] || '',
                            speechLanguage: data['speech-language'] || '',
                            videoRecordSpeechEnabled: data['video-record-speech-enabled'] === 'true',
                            videoRecordSpeechExpectedText: data['video-record-speech-expected-text'] || '',
                            videoRecordSpeechThreshold: data['video-record-speech-threshold'] || '',
                            useApiForSpeech: data['use-api-for-speech'] === 'true',
                            liveness: {
                                bundled: data['liveness-bundled'] === 'true',
                                visionUrl: data['liveness-vision-url'] || '',
                                wasmUrl: data['liveness-wasm-url'] || '',
                                modelUrl: data['liveness-model-url'] || '',
                                handModelUrl: data['liveness-hand-model-url'] || '',
                                interval: data['liveness-interval'] || '',
                                poseModelUrl: data['liveness-pose-model-url'] || '',
                            },
                            hatDetection:        data['liveness-hat-detection']        !== 'false',
                            sunglassesDetection: data['liveness-sunglasses-detection'] !== 'false',
                            skinCheck:           data['liveness-skin-check']           !== 'false',
                            colorDebugMode: data['liveness-color-debug'] === 'true',
                            livenessThresholds: {
                                faceCenterMultNear:    data['liveness-face-center-mult-near']    || '',
                                faceCenterMultMid:     data['liveness-face-center-mult-mid']     || '',
                                faceCenterMultFar:     data['liveness-face-center-mult-far']     || '',
                                faceSizeNearThreshold: data['liveness-face-size-near-threshold'] || '',
                                faceSizeFarThreshold:  data['liveness-face-size-far-threshold']  || '',
                                faceCenterMin:         data['liveness-face-center-min']          || '',
                                faceCenterMax:         data['liveness-face-center-max']          || '',
                                faceCenterMaxNear:     data['liveness-face-center-max-near']     || '',
                                faceCenterMaxMid:      data['liveness-face-center-max-mid']      || '',
                                faceCenterMaxFar:      data['liveness-face-center-max-far']      || '',
                                smilingProbability:    data['liveness-t-smiling']                || '',
                                blinkProbability:      data['liveness-t-blink']                  || '',
                                browUpProbability:     data['liveness-t-brow-up']                || '',
                                eyeWideProbability:    data['liveness-t-eye-wide']               || '',
                                leftYawAngle:          data['liveness-t-yaw-left']               || '',
                                rightYawAngle:         data['liveness-t-yaw-right']              || '',
                                nodDownAngle:          data['liveness-t-nod-down']               || '',
                                nodUpAngle:            data['liveness-t-nod-up']                 || '',
                                lookUpProbability:     data['liveness-t-look-up']                || '',
                                lookDownProbability:   data['liveness-t-look-down']              || '',
                                winkProbability:       data['liveness-t-wink']                   || '',
                                gazeProbability:       data['liveness-t-gaze']                   || '',
                            }
                        });
                        setContext((c) => ({...c, isInitialized: true}));
                    }}
                />
            ) : allCompleted ? (
                <div className="id-card id-card-module">
                    <div className="id-module">
                        <div className="id-module-media" style={{background:'linear-gradient(135deg,#14532d,#16a34a)', flexDirection:'column', gap:0}}>
                            <div style={{fontSize:80, userSelect:'none'}}>✅</div>
                            <div style={{color:'rgba(255,255,255,0.8)', fontSize:14, fontWeight:500, marginTop:16, textAlign:'center', padding:'0 24px'}}>
                                Görüşme tamamlandı
                            </div>
                        </div>
                        <div className="id-module-panel">
                            <div>
                                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--slate-400)',marginBottom:6}}>Kimlik Doğrulama</div>
                                <div className="id-module-title">Tamamlandı</div>
                            </div>
                            <div className="id-status id-status-success">
                                <div className="id-status-dot"/>
                                Tüm adımlar başarıyla tamamlandı
                            </div>
                            <p style={{fontSize:13,color:'var(--slate-400)',margin:0,lineHeight:1.6}}>
                                Kimlik doğrulama süreciniz tamamlanmıştır. Bu pencereyi kapatabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            ) : context.activeModule === IdentifyModuleTypes.LIVENESS_TEST ? (
                <div className="id-card id-card-module"><LivenessDetectionInterface identifyObject={identifyObject} colorDebugMode={config?.colorDebugMode}/></div>
            ) : context.activeModule === IdentifyModuleTypes.SPEECH_TEST ? (
                <div className="id-card id-card-module"><SpeechInterface identifyObject={identifyObject}/></div>
            ) : context.activeModule === IdentifyModuleTypes.VIDEO_RECORD ? (
                <div className="id-card id-card-module"><VideoRecordInterface identifyObject={identifyObject}/></div>
            ) : context.activeModule == IdentifyModuleTypes.AGENT_CALL ? (
                <div className="id-card id-card-module"><CallInterface identifyObject={identifyObject} config={config} setContext={setContext}/></div>
            ) : context.error ? (
                <div className="id-card id-card-module">
                    <div className="id-module">
                        <div className="id-module-media" style={{background:'linear-gradient(135deg,#7f1d1d,#dc2626)'}}>
                            <div style={{fontSize:64,userSelect:'none'}}>⚠️</div>
                        </div>
                        <div className="id-module-panel">
                            <div>
                                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',
                                             color:'var(--slate-400)',marginBottom:6}}>Hata</div>
                                <div className="id-module-title">Bağlantı Kurulamadı</div>
                            </div>
                            <div className="id-status id-status-error">
                                <div className="id-status-dot"/>
                                {context.error}
                            </div>
                            <div style={{fontSize:13,color:'var(--slate-500)',lineHeight:1.6}}>
                                Ident ID'yi ve API URL'yi kontrol edin. Sunucu erişilebilir olduğundan emin olun.
                            </div>
                            <button className="id-btn id-btn-primary id-btn-lg"
                                    onClick={() => window.location.reload()}>
                                Tekrar Dene
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="id-card id-card-module">
                    <div className="id-module">
                        <div className="id-module-media">
                            <div style={{
                                width:56,height:56,borderRadius:'50%',
                                border:'3px solid rgba(255,255,255,0.2)',
                                borderTopColor:'#fff',
                                animation:'id-spin 1s linear infinite'
                            }}/>
                        </div>
                        <div className="id-module-panel">
                            <div>
                                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',
                                             color:'var(--slate-400)',marginBottom:6}}>Hazırlanıyor</div>
                                <div className="id-module-title">Modül Yükleniyor</div>
                            </div>
                            <div className="id-status id-status-idle">
                                <div className="id-status-dot"/>
                                Sunucuyla bağlantı kuruluyor...
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
