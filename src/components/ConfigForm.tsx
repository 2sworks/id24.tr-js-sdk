import React, {useEffect, useState} from 'react';

const fieldIds = [
    "ident_id", "api-url", "logLevel"
];

const optionalFieldIds = [
    "stun-ip", "stun-port",
    "turn-ip", "turn-port", "turn-username", "turn-pass",
    "liveness-vision-url", "liveness-wasm-url", "liveness-model-url", "liveness-hand-model-url", "liveness-interval",
    "liveness-pose-model-url",
    "liveness-face-center-mult-near", "liveness-face-center-mult-mid", "liveness-face-center-mult-far",
    "liveness-face-size-near-threshold", "liveness-face-size-far-threshold",
    "liveness-face-center-min", "liveness-face-center-max",
    "liveness-face-center-max-near", "liveness-face-center-max-mid", "liveness-face-center-max-far",
    "liveness-t-smiling", "liveness-t-blink", "liveness-t-brow-up", "liveness-t-eye-wide",
    "liveness-t-yaw-left", "liveness-t-yaw-right", "liveness-t-nod-down", "liveness-t-nod-up",
    "liveness-t-look-up", "liveness-t-look-down", "liveness-t-wink", "liveness-t-gaze",
    "turn-secret", "ws-secret", "speech-expected-text", "speech-language",
    "video-record-speech-expected-text", "video-record-speech-threshold",
    "video-record-time",
];

type FormData = { [key: string]: string };
type Props = { onNext: (data: FormData) => void };

export const ConfigForm: React.FC<Props> = ({onNext}) => {
    const [formData, setFormData] = useState<FormData>({});

    useEffect(() => {
        const newForm: FormData = {};
        [...fieldIds, ...optionalFieldIds].forEach(id => {
            const val = localStorage.getItem("config_" + id);
            if (val !== null) newForm[id] = val;
        });
        newForm['speech-language']              = localStorage.getItem('config_speech-language')              || '';
        newForm['module-video-record']         = localStorage.getItem('config_module-video-record')         || 'false';
        newForm['module-agent-call']           = localStorage.getItem('config_module-agent-call')           || 'false';
        newForm['module-liveness']             = localStorage.getItem('config_module-liveness')             || 'false';
        newForm['module-speech']               = localStorage.getItem('config_module-speech')               || 'false';
        newForm['liveness-bundled']            = localStorage.getItem('config_liveness-bundled')            || 'false';
        newForm['liveness-color-debug']        = localStorage.getItem('config_liveness-color-debug')        || 'false';
        newForm['liveness-hat-detection']      = localStorage.getItem('config_liveness-hat-detection')      ?? 'true';
        newForm['liveness-sunglasses-detection']= localStorage.getItem('config_liveness-sunglasses-detection') ?? 'true';
        newForm['liveness-skin-check']         = localStorage.getItem('config_liveness-skin-check')         ?? 'true';
        newForm['video-record-speech-enabled'] = localStorage.getItem('config_video-record-speech-enabled') || 'false';
        newForm['use-api-for-speech']          = localStorage.getItem('config_use-api-for-speech')          || 'false';
        setFormData(newForm);
    }, []);

    const set  = (id: string, value: string) => setFormData(prev => ({...prev, [id]: value}));
    const bool = (id: string) => formData[id] === 'true';

    const handleSave = () => {
        for (const id of fieldIds) {
            if (!formData[id]?.trim()) { alert("Eksik alan: " + id); return; }
        }
        if (!confirm("Bilgileri tarayıcınıza kaydetmek istiyor musunuz?")) return;
        fieldIds.forEach(id => localStorage.setItem("config_" + id, formData[id]));
        optionalFieldIds.forEach(id => localStorage.setItem("config_" + id, formData[id] || ''));
        localStorage.setItem('config_module-video-record',         formData['module-video-record']         || 'false');
        localStorage.setItem('config_module-agent-call',           formData['module-agent-call']           || 'false');
        localStorage.setItem('config_module-liveness',             formData['module-liveness']             || 'false');
        localStorage.setItem('config_module-speech',               formData['module-speech']               || 'false');
        localStorage.setItem('config_liveness-bundled',               formData['liveness-bundled']               || 'false');
        localStorage.setItem('config_liveness-color-debug',           formData['liveness-color-debug']           || 'false');
        localStorage.setItem('config_liveness-hat-detection',         formData['liveness-hat-detection']         ?? 'true');
        localStorage.setItem('config_liveness-sunglasses-detection',  formData['liveness-sunglasses-detection']  ?? 'true');
        localStorage.setItem('config_liveness-skin-check',            formData['liveness-skin-check']            ?? 'true');
        localStorage.setItem('config_video-record-speech-enabled',    formData['video-record-speech-enabled']    || 'false');
        localStorage.setItem('config_use-api-for-speech',          formData['use-api-for-speech']          || 'false');
        alert("Kaydedildi!");
    };

    const handleNext = () => {
        for (const id of fieldIds) {
            if (!formData[id]?.trim()) { alert("Eksik alan: " + id); return; }
        }
        onNext(formData);
    };

    return (
        <div className="id-card id-config-card">
            <div className="id-card-header">
                <div className="id-card-title">Kimlik Doğrulama Oturumu Başlat</div>
            </div>

            <div className="id-card-body">
                <div className="id-config-grid">

                    {/* ── Sol kolon ─────────────────────────────────── */}
                    <div className="id-config-col">

                        {/* Oturum */}
                        <div className="id-section">
                            <div className="id-section-label">Oturum</div>
                            <div className="id-field">
                                <label className="id-label">Ident ID</label>
                                <input className="id-input" type="text" placeholder="Ident kimliğini girin"
                                       value={formData['ident_id'] || ''}
                                       onChange={e => set('ident_id', e.target.value)}/>
                            </div>
                            <div className="id-row">
                                <div className="id-field">
                                    <label className="id-label">Dil</label>
                                    <select className="id-input id-select"
                                            value={formData['language'] || 'tr'}
                                            onChange={e => set('language', e.target.value)}>
                                        <option value="tr">Türkçe</option>
                                        <option value="en">English</option>
                                        <option value="de">Deutsch</option>
                                        <option value="az">Azərbaycan</option>
                                    </select>
                                </div>
                                <div className="id-field">
                                    <label className="id-label">İşaret Dili</label>
                                    <select className="id-input id-select"
                                            value={formData['sign_lang'] || 'false'}
                                            onChange={e => set('sign_lang', e.target.value)}>
                                        <option value="false">Hayır</option>
                                        <option value="true">Evet</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Modüller */}
                        <div className="id-section">
                            <div className="id-section-label">Modüller</div>
                            <div className="id-checkbox-grid">
                                {[
                                    {id: 'module-liveness',     label: 'Canlılık Testi'},
                                    {id: 'module-speech',       label: 'Sesli Doğrulama'},
                                    {id: 'module-video-record', label: 'Kısa Video'},
                                    {id: 'module-agent-call',   label: 'Görüşme'},
                                ].map(({id, label}) => (
                                    <label key={id} className="id-checkbox-row">
                                        <input type="checkbox" checked={bool(id)}
                                               onChange={e => set(id, String(e.target.checked))}/>
                                        {label}
                                    </label>
                                ))}
                            </div>

                            {bool('module-speech') && (
                                <div style={{marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6}}>
                                    <div className="id-field">
                                        <label className="id-label">Ses tanıma dili</label>
                                        <select className="id-input id-select"
                                                value={formData['speech-language'] || ''}
                                                onChange={e => set('speech-language', e.target.value)}>
                                            <option value="">Otomatik (oturumdan)</option>
                                            <option value="tr-TR">Türkçe (tr-TR)</option>
                                            <option value="en-US">English (en-US)</option>
                                            <option value="de-DE">Deutsch (de-DE)</option>
                                            <option value="az-AZ">Azərbaycan (az-AZ)</option>
                                        </select>
                                    </div>
                                    <div className="id-field">
                                        <label className="id-label">Sesli doğrulama metni</label>
                                        <textarea className="id-input" rows={3} placeholder="Boşsa varsayılan: İstanbul"
                                               style={{resize:'vertical', fontFamily:'inherit'}}
                                               value={formData['speech-expected-text'] || ''}
                                               onChange={e => set('speech-expected-text', e.target.value)}/>
                                    </div>
                                </div>
                            )}

                            {bool('module-video-record') && (
                                <div style={{marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6}}>
                                    <div className="id-field">
                                        <label className="id-label">Kayıt süresi (ms)</label>
                                        <input className="id-input" type="number" placeholder="5000"
                                               value={formData['video-record-time'] || ''}
                                               onChange={e => set('video-record-time', e.target.value)}/>
                                    </div>
                                    <label className="id-checkbox-row">
                                        <input type="checkbox" checked={bool('video-record-speech-enabled')}
                                               onChange={e => set('video-record-speech-enabled', String(e.target.checked))}/>
                                        Konuşma doğrulama
                                    </label>
                                    {bool('video-record-speech-enabled') && (
                                        <div style={{paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6}}>
                                            <div className="id-field">
                                                <label className="id-label">Kısa video sesli doğrulama metni</label>
                                                <textarea className="id-input" rows={3} placeholder="Boşsa: İstanbul"
                                                       style={{resize:'vertical', fontFamily:'inherit'}}
                                                       value={formData['video-record-speech-expected-text'] || ''}
                                                       onChange={e => set('video-record-speech-expected-text', e.target.value)}/>
                                            </div>
                                            <div className="id-field">
                                                <label className="id-label">Benzerlik eşiği (0–1)</label>
                                                <input className="id-input" type="number" placeholder="0.75"
                                                       min="0" max="1" step="0.05"
                                                       value={formData['video-record-speech-threshold'] || ''}
                                                       onChange={e => set('video-record-speech-threshold', e.target.value)}/>
                                            </div>
                                            <label className="id-checkbox-row">
                                                <input type="checkbox" checked={bool('use-api-for-speech')}
                                                       onChange={e => set('use-api-for-speech', String(e.target.checked))}/>
                                                API ile ses tanıma
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Log seviyesi */}
                        <div className="id-section">
                            <div className="id-section-label">Log Seviyesi</div>
                            <select className="id-input id-select"
                                    value={formData['logLevel'] || '6'}
                                    onChange={e => set('logLevel', e.target.value)}>
                                <option value="-1">Kapalı</option>
                                <option value="3">Hata</option>
                                <option value="4">Uyarı</option>
                                <option value="6">Bilgi</option>
                                <option value="7">Hata Ayıklama</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Sağ kolon ─────────────────────────────────── */}
                    <div className="id-config-col">

                        {/* Bağlantı */}
                        <div className="id-section" style={{marginTop: 0}}>
                            <div className="id-section-label">Bağlantı</div>
                            <div className="id-field">
                                <label className="id-label">API URL</label>
                                <input className="id-input" type="text" placeholder="https://api.ornek.com"
                                       value={formData['api-url'] || ''}
                                       onChange={e => set('api-url', e.target.value)}/>
                            </div>
                            <div className="id-row">
                                <div className="id-field">
                                    <label className="id-label">STUN IP <span style={{fontWeight:400,opacity:.6}}>— opsiyonel</span></label>
                                    <input className="id-input" type="text" placeholder="stun.ornek.com"
                                           value={formData['stun-ip'] || ''}
                                           onChange={e => set('stun-ip', e.target.value)}/>
                                </div>
                                <div className="id-field" style={{maxWidth: 90}}>
                                    <label className="id-label">Port</label>
                                    <input className="id-input" type="text" placeholder="3478"
                                           value={formData['stun-port'] || ''}
                                           onChange={e => set('stun-port', e.target.value)}/>
                                </div>
                            </div>
                            <div className="id-row">
                                <div className="id-field">
                                    <label className="id-label">TURN IP <span style={{fontWeight:400,opacity:.6}}>— opsiyonel</span></label>
                                    <input className="id-input" type="text" placeholder="turn.ornek.com"
                                           value={formData['turn-ip'] || ''}
                                           onChange={e => set('turn-ip', e.target.value)}/>
                                </div>
                                <div className="id-field" style={{maxWidth: 90}}>
                                    <label className="id-label">Port</label>
                                    <input className="id-input" type="text" placeholder="3478"
                                           value={formData['turn-port'] || ''}
                                           onChange={e => set('turn-port', e.target.value)}/>
                                </div>
                            </div>
                            <div className="id-row">
                                <div className="id-field">
                                    <label className="id-label">TURN Kullanıcı</label>
                                    <input className="id-input" type="text" placeholder="kullanici"
                                           value={formData['turn-username'] || ''}
                                           onChange={e => set('turn-username', e.target.value)}/>
                                </div>
                                <div className="id-field">
                                    <label className="id-label">TURN Şifre</label>
                                    <input className="id-input" type="password" placeholder="••••••••"
                                           value={formData['turn-pass'] || ''}
                                           onChange={e => set('turn-pass', e.target.value)}/>
                                </div>
                            </div>
                            <div className="id-field">
                                <label className="id-label">TURN Secret Key <span style={{fontWeight:400,opacity:.6}}>— opsiyonel</span></label>
                                <input className="id-input" type="text" placeholder="Short-term credential için"
                                       value={formData['turn-secret'] || ''}
                                       onChange={e => set('turn-secret', e.target.value)}/>
                            </div>
                            <div className="id-field">
                                <label className="id-label">WS Secret Key <span style={{fontWeight:400,opacity:.6}}>— SOCKET_AUTH aktifse</span></label>
                                <input className="id-input" type="text" placeholder="WebSocket token için"
                                       value={formData['ws-secret'] || ''}
                                       onChange={e => set('ws-secret', e.target.value)}/>
                            </div>
                        </div>

                        {/* Liveness */}
                        <div className="id-section">
                            <details>
                            <summary style={{cursor:'pointer',fontWeight:700,fontSize:12,
                                             color:'var(--slate-400)',letterSpacing:'0.7px',textTransform:'uppercase',
                                             padding:'6px 0',userSelect:'none'}}>
                                Liveness
                            </summary>
                            <div style={{marginTop:8}}>

                            {/* Mod Seçimi: Gömülü / CDN */}
                            <div style={{display:'flex', borderRadius:8, overflow:'hidden',
                                         border:'1px solid var(--border)', marginBottom:8}}>
                                {(['bundled','cdn'] as const).map((mode, i) => (
                                    <button key={mode} type="button"
                                            onClick={() => set('liveness-bundled', String(mode === 'bundled'))}
                                            style={{
                                                flex:1, padding:'8px 0', fontSize:13, fontWeight:600,
                                                border:'none', cursor:'pointer',
                                                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                                                background: bool('liveness-bundled') === (mode === 'bundled')
                                                    ? 'var(--primary,#6366f1)' : 'transparent',
                                                color: bool('liveness-bundled') === (mode === 'bundled')
                                                    ? '#fff' : 'var(--slate-400,#94a3b8)',
                                            }}>
                                        {mode === 'bundled' ? 'Gömülü' : 'CDN'}
                                    </button>
                                ))}
                            </div>

                            {/* Mod açıklaması + hızlı doldur butonu */}
                            <div style={{fontSize:12, color:'var(--slate-400)', marginBottom:8}}>
                                {bool('liveness-bundled')
                                    ? '@mediapipe/tasks-vision uygulamaya dahil — npm ile yüklü olmalı.'
                                    : 'MediaPipe runtime\'da CDN\'den yüklenir — ekstra kurulum gerekmez.'}
                            </div>
                            <button type="button" className="id-btn id-btn-ghost"
                                    style={{fontSize:12, padding:'5px 12px', marginBottom:12}}
                                    onClick={() => {
                                        if (bool('liveness-bundled')) {
                                            // Gömülü: varsayılan yerel yollar
                                            set('liveness-wasm-url',       '/mediapipe/wasm');
                                            set('liveness-model-url',      '/mediapipe/face_landmarker.task');
                                            set('liveness-hand-model-url', '/mediapipe/hand_landmarker.task');
                                            set('liveness-pose-model-url', '/mediapipe/pose_landmarker_lite.task');
                                        } else {
                                            // CDN: varsayılan CDN URL'leri
                                            set('liveness-vision-url',     'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm/vision_bundle.mjs');
                                            set('liveness-wasm-url',       'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm');
                                            set('liveness-model-url',      'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task');
                                            set('liveness-hand-model-url', 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task');
                                            set('liveness-pose-model-url',      'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task');
                                        }
                                    }}>
                                {bool('liveness-bundled') ? 'Varsayılan Gömülü Yollarını Doldur' : 'Varsayılan CDN URL\'lerini Doldur'}
                            </button>

                            {/* Opsiyonel algılama kontrolleri */}
                            <div style={{display:'flex', gap:16, flexWrap:'wrap', marginBottom:12}}>
                                <label style={{display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer'}}>
                                    <input type="checkbox"
                                           checked={formData['liveness-hat-detection'] !== 'false'}
                                           onChange={e => set('liveness-hat-detection', String(e.target.checked))}/>
                                    Şapka Tespiti
                                </label>
                                <label style={{display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer'}}>
                                    <input type="checkbox"
                                           checked={formData['liveness-sunglasses-detection'] !== 'false'}
                                           onChange={e => set('liveness-sunglasses-detection', String(e.target.checked))}/>
                                    Güneş Gözlüğü Tespiti
                                </label>
                                <label style={{display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer'}}>
                                    <input type="checkbox"
                                           checked={formData['liveness-skin-check'] !== 'false'}
                                           onChange={e => set('liveness-skin-check', String(e.target.checked))}/>
                                    Cilt Kontrolü
                                </label>
                                <label style={{display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer'}}>
                                    <input type="checkbox"
                                           checked={bool('liveness-color-debug')}
                                           onChange={e => set('liveness-color-debug', String(e.target.checked))}/>
                                    Renk Debug Modu
                                </label>
                            </div>

                            {/* Vision Bundle URL — sadece CDN modunda */}
                            {!bool('liveness-bundled') && (
                                <div className="id-field">
                                    <label className="id-label">Vision Bundle URL</label>
                                    <input className="id-input" type="text"
                                           placeholder="cdn.jsdelivr.net/.../vision_bundle.mjs"
                                           value={formData['liveness-vision-url'] || ''}
                                           onChange={e => set('liveness-vision-url', e.target.value)}/>
                                </div>
                            )}

                            <div className="id-row">
                                <div className="id-field">
                                    <label className="id-label">WASM {bool('liveness-bundled') ? 'Yolu' : 'URL'}</label>
                                    <input className="id-input" type="text"
                                           placeholder={bool('liveness-bundled') ? '/mediapipe/wasm' : 'cdn.jsdelivr.net/.../wasm'}
                                           value={formData['liveness-wasm-url'] || ''}
                                           onChange={e => set('liveness-wasm-url', e.target.value)}/>
                                </div>
                                <div className="id-field">
                                    <label className="id-label">Yüz Model {bool('liveness-bundled') ? 'Yolu' : 'URL'}</label>
                                    <input className="id-input" type="text"
                                           placeholder={bool('liveness-bundled') ? '/mediapipe/face_landmarker.task' : 'storage.googleapis.com/.../face_landmarker.task'}
                                           value={formData['liveness-model-url'] || ''}
                                           onChange={e => set('liveness-model-url', e.target.value)}/>
                                </div>
                            </div>
                            <div className="id-field">
                                <label className="id-label">El Model {bool('liveness-bundled') ? 'Yolu' : 'URL'} <span style={{fontWeight:400,opacity:.6}}>— opsiyonel</span></label>
                                <input className="id-input" type="text"
                                       placeholder={bool('liveness-bundled') ? '/mediapipe/hand_landmarker.task' : 'storage.googleapis.com/.../hand_landmarker.task'}
                                       value={formData['liveness-hand-model-url'] || ''}
                                       onChange={e => set('liveness-hand-model-url', e.target.value)}/>
                            </div>
                            <div className="id-field">
                                <label className="id-label">Poz Model {bool('liveness-bundled') ? 'Yolu' : 'URL'} <span style={{fontWeight:400,opacity:.6}}>— opsiyonel, yüz önü tespiti</span></label>
                                <input className="id-input" type="text"
                                       placeholder={bool('liveness-bundled') ? '/mediapipe/pose_landmarker_lite.task' : 'storage.googleapis.com/.../pose_landmarker_lite.task'}
                                       value={formData['liveness-pose-model-url'] || ''}
                                       onChange={e => set('liveness-pose-model-url', e.target.value)}/>
                            </div>
                            <div className="id-field">
                                <label className="id-label">Aralık (ms) — boşsa sunucudan / 5000</label>
                                <input className="id-input" type="number" placeholder="5000"
                                       value={formData['liveness-interval'] || ''}
                                       onChange={e => set('liveness-interval', e.target.value)}/>
                            </div>
                            <details style={{marginTop:10}}>
                                <summary style={{cursor:'pointer',fontWeight:700,fontSize:11,
                                                 color:'var(--slate-400)',letterSpacing:'0.6px',textTransform:'uppercase',
                                                 padding:'6px 0',userSelect:'none'}}>
                                    Yüz Merkezleme Toleransı
                                </summary>
                                <div style={{marginTop:8}}>
                                    <div style={{fontSize:11,color:'var(--slate-400)',marginBottom:6}}>
                                        faceW (yanak genişliği) mesafe proxy'si — boş bırakılırsa varsayılan kullanılır
                                    </div>
                                    <div className="id-row">
                                        <div className="id-field">
                                            <label className="id-label">Uzak çarpan <span style={{opacity:.6}}>(faceW&lt;0.35)</span></label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="2"
                                                   placeholder="0.50"
                                                   value={formData['liveness-face-center-mult-far'] || ''}
                                                   onChange={e => set('liveness-face-center-mult-far', e.target.value)}/>
                                        </div>
                                        <div className="id-field">
                                            <label className="id-label">Orta çarpan</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="2"
                                                   placeholder="0.63"
                                                   value={formData['liveness-face-center-mult-mid'] || ''}
                                                   onChange={e => set('liveness-face-center-mult-mid', e.target.value)}/>
                                        </div>
                                        <div className="id-field">
                                            <label className="id-label">Yakın çarpan <span style={{opacity:.6}}>(faceW&gt;0.65)</span></label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="2"
                                                   placeholder="0.80"
                                                   value={formData['liveness-face-center-mult-near'] || ''}
                                                   onChange={e => set('liveness-face-center-mult-near', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="id-row">
                                        <div className="id-field">
                                            <label className="id-label">Uzak eşiği (faceW&lt;X)</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="1"
                                                   placeholder="0.35"
                                                   value={formData['liveness-face-size-far-threshold'] || ''}
                                                   onChange={e => set('liveness-face-size-far-threshold', e.target.value)}/>
                                        </div>
                                        <div className="id-field">
                                            <label className="id-label">Yakın eşiği (faceW&gt;X)</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="1"
                                                   placeholder="0.65"
                                                   value={formData['liveness-face-size-near-threshold'] || ''}
                                                   onChange={e => set('liveness-face-size-near-threshold', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="id-row">
                                        <div className="id-field">
                                            <label className="id-label">Min offset</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="1"
                                                   placeholder="0.16"
                                                   value={formData['liveness-face-center-min'] || ''}
                                                   onChange={e => set('liveness-face-center-min', e.target.value)}/>
                                        </div>
                                        <div className="id-field">
                                            <label className="id-label">Max offset (genel)</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="1"
                                                   placeholder="0.48"
                                                   value={formData['liveness-face-center-max'] || ''}
                                                   onChange={e => set('liveness-face-center-max', e.target.value)}/>
                                        </div>
                                    </div>
                                    <div className="id-row">
                                        <div className="id-field">
                                            <label className="id-label">Max — uzak tavan</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="1"
                                                   placeholder="genel max"
                                                   value={formData['liveness-face-center-max-far'] || ''}
                                                   onChange={e => set('liveness-face-center-max-far', e.target.value)}/>
                                        </div>
                                        <div className="id-field">
                                            <label className="id-label">Max — orta tavan</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="1"
                                                   placeholder="genel max"
                                                   value={formData['liveness-face-center-max-mid'] || ''}
                                                   onChange={e => set('liveness-face-center-max-mid', e.target.value)}/>
                                        </div>
                                        <div className="id-field">
                                            <label className="id-label">Max — yakın tavan</label>
                                            <input className="id-input" type="number" step="0.01" min="0" max="1"
                                                   placeholder="genel max"
                                                   value={formData['liveness-face-center-max-near'] || ''}
                                                   onChange={e => set('liveness-face-center-max-near', e.target.value)}/>
                                        </div>
                                    </div>
                                </div>
                            </details>
                            </div>
                            </details>
                        </div>

                        {/* Hareket Eşikleri */}
                        <div className="id-section">
                            <details>
                                <summary style={{cursor:'pointer',fontWeight:700,fontSize:12,
                                                 color:'var(--slate-400)',letterSpacing:'0.7px',textTransform:'uppercase',
                                                 padding:'6px 0',userSelect:'none'}}>
                                    Hareket Eşikleri — boş = SDK varsayılanı
                                </summary>
                                <div style={{marginTop:8}}>
                                    <div style={{fontSize:11,fontWeight:600,color:'var(--slate-400)',marginBottom:4}}>
                                        Yüz İfadeleri (olasılık 0–1)
                                    </div>
                                    <div className="id-row" style={{flexWrap:'wrap'}}>
                                        {[
                                            {id:'liveness-t-smiling',  label:'Gülümseme',  ph:'0.70'},
                                            {id:'liveness-t-blink',    label:'Göz kırp.',  ph:'0.50'},
                                            {id:'liveness-t-brow-up',  label:'Kaş kaldır.',ph:'0.35'},
                                            {id:'liveness-t-eye-wide', label:'Göz aç.',    ph:'0.40'},
                                        ].map(({id, label, ph}) => (
                                            <div key={id} className="id-field" style={{minWidth:90}}>
                                                <label className="id-label">{label}</label>
                                                <input className="id-input" type="number" step="0.05" min="0" max="1"
                                                       placeholder={ph}
                                                       value={formData[id] || ''}
                                                       onChange={e => set(id, e.target.value)}/>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{fontSize:11,fontWeight:600,color:'var(--slate-400)',marginTop:8,marginBottom:4}}>
                                        Kafa Hareketi (derece)
                                    </div>
                                    <div className="id-row" style={{flexWrap:'wrap'}}>
                                        {[
                                            {id:'liveness-t-yaw-left',  label:'Sola çevir',  ph:'20'},
                                            {id:'liveness-t-yaw-right', label:'Sağa çevir',  ph:'-20'},
                                            {id:'liveness-t-nod-down',  label:'Öne eğ',      ph:'10'},
                                            {id:'liveness-t-nod-up',    label:'Geriye eğ',   ph:'-12'},
                                        ].map(({id, label, ph}) => (
                                            <div key={id} className="id-field" style={{minWidth:90}}>
                                                <label className="id-label">{label}</label>
                                                <input className="id-input" type="number" step="1"
                                                       placeholder={ph}
                                                       value={formData[id] || ''}
                                                       onChange={e => set(id, e.target.value)}/>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{fontSize:11,fontWeight:600,color:'var(--slate-400)',marginTop:8,marginBottom:4}}>
                                        Göz Hareketi (olasılık 0–1)
                                    </div>
                                    <div className="id-row" style={{flexWrap:'wrap'}}>
                                        {[
                                            {id:'liveness-t-look-up',   label:'Yukarı bak', ph:'0.35'},
                                            {id:'liveness-t-look-down', label:'Aşağı bak',  ph:'0.35'},
                                            {id:'liveness-t-wink',      label:'Wink',        ph:'0.50'},
                                            {id:'liveness-t-gaze',      label:'Gaze',        ph:'0.40'},
                                        ].map(({id, label, ph}) => (
                                            <div key={id} className="id-field" style={{minWidth:90}}>
                                                <label className="id-label">{label}</label>
                                                <input className="id-input" type="number" step="0.05" min="0" max="1"
                                                       placeholder={ph}
                                                       value={formData[id] || ''}
                                                       onChange={e => set(id, e.target.value)}/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </details>
                        </div>

                    </div>
                </div>

                {/* ── Eşik Değerleri Rehberi ─────────────────────────── */}
                <details style={{marginTop:16}}>
                    <summary style={{cursor:'pointer',fontWeight:700,fontSize:12,
                                     color:'var(--slate-400)',letterSpacing:'0.7px',textTransform:'uppercase',
                                     padding:'8px 0',userSelect:'none'}}>
                        Eşik Değerleri Rehberi — Kolaylaştırma / Zorlaştırma
                    </summary>
                    <div style={{marginTop:8,fontSize:12,lineHeight:1.6,color:'var(--slate-300)'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                            <thead>
                                <tr style={{borderBottom:'1px solid var(--slate-600)'}}>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'var(--slate-400)'}}>Eşik</th>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'var(--slate-400)'}}>Varsayılan</th>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'#4ade80'}}>Düşük → Kolay</th>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'#f87171'}}>Yüksek → Zor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['smilingProbability','0.70','Hafif gülümseme algılanır','Belirgin gülümseme gerekir'],
                                    ['blinkProbability',  '0.50','Hafif kırpma yeterli',    'Tam göz kapama gerekir'],
                                    ['browUpProbability', '0.35','Hafif kaş kaldırma',       'Belirgin kaş kaldırma'],
                                    ['eyeWideProbability','0.40','Hafif göz açma',           'Gözü iyice açmak gerekir'],
                                    ['winkProbability',   '0.50','Hafif göz kırpma',         'Belirgin tek göz kırpma'],
                                    ['gazeProbability',   '0.40','Kısa bakış yeterli',       'Uzun / belirgin bakış'],
                                    ['lookUpProbability', '0.35','Hafif yukarı bakma',        'Belirgin yukarı bakma'],
                                    ['lookDownProbability','0.35','Hafif aşağı bakma',        'Belirgin aşağı bakma'],
                                    ['leftYawAngle (°)',  '20',  'Küçük sola çevirme',       'Büyük sola çevirme'],
                                    ['rightYawAngle (°)', '-20', 'Küçük sağa çevirme',       'Büyük sağa çevirme (daha negatif)'],
                                    ['nodDownAngle (°)',  '10',  'Hafif öne eğme',           'Belirgin öne eğme'],
                                    ['nodUpAngle (°)',    '-12', 'Hafif geriye eğme',         'Belirgin geriye eğme (daha negatif)'],
                                ].map(([name, def, easy, hard]) => (
                                    <tr key={name as string} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                                        <td style={{padding:'3px 6px',fontWeight:600,color:'var(--slate-200)'}}>{name}</td>
                                        <td style={{padding:'3px 6px',color:'var(--slate-400)'}}>{def}</td>
                                        <td style={{padding:'3px 6px',color:'#86efac'}}>{easy}</td>
                                        <td style={{padding:'3px 6px',color:'#fca5a5'}}>{hard}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{marginTop:10,color:'var(--slate-400)',fontSize:11}}>
                            <strong style={{color:'var(--slate-300)'}}>Yüz Merkezleme:</strong>
                            {' '}faceCenterMult (çarpan) yüksekse kutu büyür → merkezleme toleransı artar → kolay.
                            faceCenterMax düşükse kutu küçülür → zor.
                            faceSizeNearThreshold / faceSizeFarThreshold mesafe zonlarını belirler.
                        </div>
                    </div>
                </details>

                {/* ── Tarayıcı Uyumluluğu ───────────────────────────── */}
                <details style={{marginTop:16}}>
                    <summary style={{cursor:'pointer',fontWeight:700,fontSize:12,
                                     color:'var(--slate-400)',letterSpacing:'0.7px',textTransform:'uppercase',
                                     padding:'8px 0',userSelect:'none'}}>
                        Tarayıcı Uyumluluğu
                    </summary>
                    <div style={{marginTop:10,fontSize:11,lineHeight:1.6,color:'var(--slate-300)'}}>

                        {/* SDK */}
                        <div style={{fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.6px',
                                     color:'var(--slate-400)',marginBottom:6}}>
                            jssdk
                        </div>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:16}}>
                            <thead>
                                <tr style={{borderBottom:'1px solid var(--slate-600)'}}>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'var(--slate-400)',minWidth:140}}>API / Özellik</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'#60a5fa'}}>Chrome</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'#fb923c'}}>Firefox</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'var(--slate-400)'}}>Safari</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'#60a5fa'}}>Edge</th>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'var(--slate-500)',minWidth:160}}>Not</th>
                                </tr>
                            </thead>
                            <tbody>
                                {([
                                    ['WebSocket',           '✓ 16+', '✓ 11+', '✓ 7+',   '✓ 12+', '',                                      '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['getUserMedia',        '✓ 53+', '✓ 36+', '✓ 11+',  '✓ 12+', 'HTTPS zorunlu',                          '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['WebAssembly',         '✓ 57+', '✓ 52+', '✓ 11+',  '✓ 16+', 'MediaPipe modelleri için gerekli',       '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['MediaRecorder',       '✓ 47+', '✓ 25+', '✓ 14.1+','✓ 79+', 'Safari: mp4; Chrome/FF: webm — SDK otomatik seçer','#4ade80','#4ade80','#facc15','#4ade80'],
                                    ['WebRTC (AGENT_CALL)', '✓ 56+', '✓ 44+', '✓ 11+',  '✓ 79+', 'Görüşme modülü',                        '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['Canvas 2D',           '✓',     '✓',     '✓',      '✓',     'Yüz/skin analizi için',                 '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['SpeechRecognition',   '✓',     '✗',     '⚠ kısıtlı','✓',   'Firefox\'ta yoktur; API modu fallback olur','#4ade80','#f87171','#facc15','#4ade80'],
                                    ['MediaPipe GPU delegate','✓',   '⚠',     '⚠ 15+',  '✓',    'Safari/FF sorununda CPU\'ya otomatik düşer','#4ade80','#facc15','#facc15','#4ade80'],
                                ] as [string,string,string,string,string,string,...string[]][]).map(([feat,ch,ff,sf,ed,note,cc,fc,sc,ec]) => (
                                    <tr key={feat} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                                        <td style={{padding:'3px 6px',fontWeight:600,color:'var(--slate-200)'}}>{feat}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:cc}}>{ch}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:fc}}>{ff}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:sc}}>{sf}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:ec}}>{ed}</td>
                                        <td style={{padding:'3px 6px',color:'var(--slate-500)',fontSize:10}}>{note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Demo App */}
                        <div style={{fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.6px',
                                     color:'var(--slate-400)',marginBottom:6}}>
                            Örnek Demo Uygulama
                        </div>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                            <thead>
                                <tr style={{borderBottom:'1px solid var(--slate-600)'}}>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'var(--slate-400)',minWidth:140}}>API / Özellik</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'#60a5fa'}}>Chrome</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'#fb923c'}}>Firefox</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'var(--slate-400)'}}>Safari</th>
                                    <th style={{textAlign:'center',padding:'4px 6px',color:'#60a5fa'}}>Edge</th>
                                    <th style={{textAlign:'left',padding:'4px 6px',color:'var(--slate-500)',minWidth:160}}>Not</th>
                                </tr>
                            </thead>
                            <tbody>
                                {([
                                    ['ES Modules / Dynamic import','✓','✓','✓ 10.1+','✓','@mediapipe CDN modu için',                '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['React 18',                   '✓','✓','✓',      '✓','Modern tarayıcı gerektirir',             '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['LocalStorage',               '✓','✓','✓',      '✓','Form ayarları kaydı için',               '#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['video playsInline',          '✓','✓','✓',      '✓','iOS Safari\'da zorunlu — SDK\'da set edilir','#4ade80','#4ade80','#4ade80','#4ade80'],
                                    ['Renk Debug (Canvas overlay)','✓','✓','✓',      '✓','willReadFrequently:true ile CPU yolunda','#4ade80','#4ade80','#4ade80','#4ade80'],
                                ] as [string,string,string,string,string,string,...string[]][]).map(([feat,ch,ff,sf,ed,note,cc,fc,sc,ec]) => (
                                    <tr key={feat} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                                        <td style={{padding:'3px 6px',fontWeight:600,color:'var(--slate-200)'}}>{feat}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:cc}}>{ch}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:fc}}>{ff}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:sc}}>{sf}</td>
                                        <td style={{padding:'3px 6px',textAlign:'center',color:ec}}>{ed}</td>
                                        <td style={{padding:'3px 6px',color:'var(--slate-500)',fontSize:10}}>{note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{marginTop:10,color:'var(--slate-400)',fontSize:10,lineHeight:1.5}}>
                            <strong style={{color:'var(--slate-300)'}}>Öneri:</strong>
                            {' '}Chrome 90+ veya Edge 90+ (Chromium). Firefox SpeechRecognition modülünü desteklemez — API modu veya sunucu tabanlı transkript kullanın. Safari 15+ desteklenir; GPU delegate başarısız olursa CPU'ya otomatik geçilir.
                        </div>
                    </div>
                </details>

                {/* ── SDK Referansı ─────────────────────────────────── */}
                <details style={{marginTop:16}}>
                    <summary style={{cursor:'pointer',fontWeight:700,fontSize:12,
                                     color:'var(--slate-400)',letterSpacing:'0.7px',textTransform:'uppercase',
                                     padding:'6px 0',userSelect:'none'}}>
                        SDK Kurulum &amp; Referans
                    </summary>
                    <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:20}}>

                        {/* Kurulum */}
                        <details open>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>Kurulum</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`npm install @2sworks/identify-sdk

import {
  IdentifySdkBuilder,
  IdentifyOptionBuilder,
  IdentifyModuleTypes,
  IdentifyLogLevels,
} from '@2sworks/identify-sdk';`}</pre>
                        </details>

                        {/* Builder Zinciri */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>SDK Builder</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`const sdk = new IdentifySdkBuilder()
  .setApi('https://api.example.com')
  .setStun(stunIp, stunPort)
  .setTurn(turnIp, turnPort, username, pass)
  .setTurnSecretKey(secret)          // opsiyonel
  .setWsSecretKey(wsSecret)          // opsiyonel
  .setLogLevel(IdentifyLogLevels.INFO)
  .setOptions(opts)
  .setLivenessVisionModule(vision, wasmUrl, modelUrl, handModelUrl) // bundled
  .setLivenessAssets(visionUrl, wasmUrl, modelUrl, handModelUrl)    // CDN
  .setLivenessInterval(5000)
  .setUseApiForSpeech()              // voice-tools sunucu modu
  .setLifeCycle({...})
  .build();

await sdk.startIdentification(identId, 'tr', false);
await sdk.openModule();
await sdk.nextModule();`}</pre>
                        </details>

                        {/* IdentifyOptionBuilder */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>IdentifyOptionBuilder</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`const opts = new IdentifyOptionBuilder()
  .setIdentityType([
    IdentifyModuleTypes.LIVENESS_TEST,
    IdentifyModuleTypes.SPEECH_TEST,
    IdentifyModuleTypes.VIDEO_RECORD,
    IdentifyModuleTypes.AGENT_CALL,
  ])
  .setOpenIntroPage(true)
  .setLivenessCount(3)
  .setEnableLivenessWrongAction(false)
  .setLivenessThresholds({
    smilingProbability:    0.70,
    blinkProbability:      0.50,
    leftYawAngle:          20,
    rightYawAngle:         -20,
    nodDownAngle:          10,
    nodUpAngle:            -12,
    eyeWideProbability:    0.40,
    lookUpProbability:     0.35,
    lookDownProbability:   0.35,
    winkProbability:       0.50,
    browUpProbability:     0.35,
    gazeProbability:       0.40,
    faceCenterMultNear:    0.45,
    faceCenterMultMid:     0.60,
    faceCenterMultFar:     0.55,
    faceSizeNearThreshold: 0.65,
    faceSizeFarThreshold:  0.35,
    faceCenterMin:         0.16,
    faceCenterMax:         0.48,
  })
  .setSpeechExpectedText('İstanbul')
  .setSpeechLanguage('tr-TR')
  .enableVideoRecordSpeech()
  .setVideoRecordSpeechThreshold(0.75)
  .setVideoRecordTime(5000)
  .enablePoseDetection(poseModelUrl)
  .disableHatDetection()         // varsayılan: açık
  .disableSunglassesDetection()  // varsayılan: açık
  .disableSkinCheck()            // varsayılan: açık
  .build();`}</pre>
                        </details>

                        {/* LifeCycle — SDK */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — sdk</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`sdk: {
  onReady()                // WebSocket bağlantısı açıldı
  onAllModulesCompleted()  // tüm modüller bitti
}`}</pre>
                        </details>

                        {/* LifeCycle — socket */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — socket</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`socket: {
  onConnectionLost()       // bağlantı kesildi
  onError(error)           // socket hatası
}`}</pre>
                        </details>

                        {/* LifeCycle — module */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — module</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`module: {
  onStepChanged(moduleType)  // aktif modül değişti
                             // moduleType: IdentifyModuleTypes.*
}`}</pre>
                        </details>

                        {/* LifeCycle — liveness */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — liveness</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`liveness: {
  onCheck(summary)                    // asset/paket kontrol özeti
  onPreparing()                       // model yükleniyor
  onReady()                           // model hazır
  onStart(challenges)                 // challenge listesi başladı
  onChallengeStart(ch, index, total)  // challenge başladı
  onChallengeCompleted(ch, index, total) // challenge tamamlandı
  onChallengeTimeout(ch, expected, performed) // süre doldu
  onCompleted()                       // tüm challenge'lar bitti
  onReset()                           // süreç baştan başladı
  onUploadStart()                     // kayıt yükleniyor
  onUploadCompleted()                 // kayıt yüklendi
  onUploadError(error)                // yükleme hatası → reset
  onFaceFound()                       // yüz bulundu
  onFaceLost()                        // yüz kayboldu
  onMultipleFaces()                   // birden fazla yüz
  onSingleFace()                      // tek yüz
  onFaceWarning(reason)               // yüz eksik/hatalı
  onFaceClear()                       // yüz uyarısı kalktı
  onHatDetected()                     // şapka/aksesuar algılandı
  onHatClear()                        // şapka uyarısı kalktı
  onSunglassesDetected()              // güneş gözlüğü algılandı
  onSunglassesClear()                 // gözlük uyarısı kalktı
  onSkip(reason)                      // liveness atlandı
  onError(error)                      // hata
  onStop()                            // raporlama durdu
  onStatusChange(status)              // durum: idle|preparing|ready|reporting|stopped|error
  onDebugFrame(landmarks, scores, debug) // her frame debug verisi
}`}</pre>
                        </details>

                        {/* LifeCycle — livenessDetection */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — livenessDetection</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`livenessDetection: {
  onStart(challenges)
  onChallengeStart(ch, index, total)
  onChallengeCompleted(ch, index, total)
  onCompleted()
  onReset()
  onUploadStart()
  onUploadCompleted()
  onUploadError(error)
  onFaceFound()
  onFaceLost()
  onMultipleFaces()
  onSingleFace()
  onFaceWarning(reason)
  onFaceClear()
  onHatDetected()
  onHatClear()
  onSunglassesDetected()
  onSunglassesClear()
  onModelLoading()
  onModelReady()
  onSkip()
  onError(error)
  onDebugFrame(landmarks, scores, debug)
}`}</pre>
                        </details>

                        {/* LifeCycle — speech */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — speech</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`speech: {
  onStart(expectedText)    // modül başladı, beklenen metin
  onListeningStart()       // kayıt başladı
  onListeningStop()        // kayıt durdu
  onTranscribing()         // ses sunucuya gönderiliyor (voice-server modu)
  onSpokenText(text)       // tanınan metin
  onCompleted()            // doğrulama başarılı
  onFailed(spokenText)     // metin eşleşmedi
  onSkip()                 // atlandı
  onError(error)           // hata
  onStop()                 // modül durdu
  onVoiceLoading()         // voice-browser: model yükleniyor
  onVoiceReady()           // voice-browser: model hazır
}`}</pre>
                        </details>

                        {/* LifeCycle — videoRecord */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — videoRecord</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`videoRecord: {
  onStart(stream)          // kayıt başladı, MediaStream
  onStop()                 // kayıt durdu
  onUploadStart()          // yükleme başladı
  onUploadCompleted()      // yükleme tamamlandı
  onUploadFailed()         // yükleme başarısız
  onSpeechResult(text, score) // ses tanıma sonucu
  onSpeechFailed(text, score) // ses eşleşmedi
  onConfirm()              // kullanıcı onayladı
}`}</pre>
                        </details>

                        {/* LifeCycle — videoCall */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>LifeCycle — videoCall</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`videoCall: {
  onCallStarted()          // görüşme başladı
  onCallEnded()            // görüşme bitti
  onTerminate()            // peer bağlantısı sonlandı
  onLocalStream(stream)    // yerel kamera stream'i hazır
  onRemoteStream(stream)   // karşı taraf stream'i hazır
}`}</pre>
                        </details>

                        {/* IdentifyModuleTypes */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>IdentifyModuleTypes</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`IdentifyModuleTypes.LIVENESS_TEST   // canlılık testi
IdentifyModuleTypes.SPEECH_TEST     // sesli doğrulama
IdentifyModuleTypes.VIDEO_RECORD    // video kayıt
IdentifyModuleTypes.AGENT_CALL      // görüntülü görüşme`}</pre>
                        </details>

                        {/* IdentifyLogLevels */}
                        <details>
                            <summary style={{cursor:'pointer',fontWeight:600,fontSize:12,color:'var(--slate-400)',padding:'4px 0',userSelect:'none'}}>IdentifyLogLevels</summary>
                            <pre style={{background:'var(--bg-2,#1e293b)',color:'#e2e8f0',borderRadius:8,padding:'12px 14px',fontSize:11,overflowX:'auto',marginTop:8}}>{`IdentifyLogLevels.DEBUG   // 0
IdentifyLogLevels.INFO    // 1
IdentifyLogLevels.WARNING // 2
IdentifyLogLevels.ERROR   // 3
IdentifyLogLevels.NONE    // 4`}</pre>
                        </details>

                    </div>
                </details>

                <div className="id-footer-actions">
                    <button className="id-btn id-btn-secondary" onClick={handleSave}>Tarayıcıma Kaydet</button>
                    <button className="id-btn id-btn-primary" onClick={handleNext}>Başlat →</button>
                </div>
            </div>
        </div>
    );
};
