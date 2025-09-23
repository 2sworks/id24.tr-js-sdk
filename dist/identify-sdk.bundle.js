var IdentifySDK = (function (exports) {
    'use strict';

    const IdentifyLogLevels = {
        CLOSE: -1,
        EMERGENCY: 0,
        ALERT: 1,
        CRITICAL: 2,
        ERROR: 3,
        WARNING: 4,
        NOTICE: 5,
        INFO: 6,
        DEBUG: 7,
    };

    class IdentifyLogger {
        currentLogLevel = IdentifyLogLevels.INFO;

        constructor(logLevel) {
            this.currentLogLevel = logLevel;
        }

        setLevel(level) {
            this.currentLogLevel = level;
        }

        log(level, message, context = {}) {
            if (level <= this.currentLogLevel) {
                const levelName = Object.keys(IdentifyLogLevels).find(key => IdentifyLogLevels[key] === level);
                const timestamp = new Date().toISOString();
                const formatted = `[${timestamp}] [${levelName}] ${message}`;

                switch (level) {
                    case IdentifyLogLevels.EMERGENCY:
                    case IdentifyLogLevels.ALERT:
                    case IdentifyLogLevels.CRITICAL:
                    case IdentifyLogLevels.ERROR:
                        console.error(formatted, context);
                        break;
                    case IdentifyLogLevels.WARNING:
                        console.warn(formatted, context);
                        break;
                    case IdentifyLogLevels.NOTICE:
                    case IdentifyLogLevels.INFO:
                        console.info(formatted, context);
                        break;
                    case IdentifyLogLevels.DEBUG:
                        console.debug(formatted, context);
                        break;
                }
            }
        }

        emergency(msg, ctx) {
            this.log(IdentifyLogLevels.EMERGENCY, msg, ctx);
        }

        alert(msg, ctx) {
            this.log(IdentifyLogLevels.ALERT, msg, ctx);
        }

        critical(msg, ctx) {
            this.log(IdentifyLogLevels.CRITICAL, msg, ctx);
        }

        error(msg, ctx) {
            this.log(IdentifyLogLevels.ERROR, msg, ctx);
        }

        warning(msg, ctx) {
            this.log(IdentifyLogLevels.WARNING, msg, ctx);
        }

        notice(msg, ctx) {
            this.log(IdentifyLogLevels.NOTICE, msg, ctx);
        }

        info(msg, ctx) {
            this.log(IdentifyLogLevels.INFO, msg, ctx);
        }

        debug(msg, ctx) {
            this.log(IdentifyLogLevels.DEBUG, msg, ctx);
        }

        called(msg, ctx) {
            this.log(IdentifyLogLevels.DEBUG, "Çağırılan method" + msg, ctx);
        }
    }

    class IdentifySdk {
        constructor(builder) {
            this.api = builder.api;
            this.socket = builder.socket;
            this.stun = builder.stun;
            this.turn = builder.turn;
            this.lifeCycle = builder.lifeCycle;
            this.options = builder.options;
            this.myVideoElement = builder.myVideoElement;
            this.peerVideoElement = builder.peerVideoElement;
            this.logger = new IdentifyLogger(builder.logLevel);
            this.peerConnection = null;
            this.webSocket = null;
            this.startCallTimeout = null;
            this.closed = false;
            this.context = {
                identId: null,
                identData: {
                    customer_uid: null,
                    ws_url: null
                },
                lang: null,
                projectId: null,
                uid: null,
                deviceInfo: {
                    platform: null,
                    osVersion: null,
                    deviceModel: null,
                    deviceBrand: null
                },
                sign_lang: null
            };

            this.logger.info("Identification kuruldu", null);
        }

        async startIdentification(identId, lang, sign_lang) {
            if (!identId || !lang) {
                throw new Error("identId ve lang zorunludur");
            }

            this.context.deviceInfo = this.getDeviceInfo();
            this.context.sign_lang = sign_lang;

            try {
                const response = await fetch(`${this.api}/mobile/getIdentDetails/${identId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(
                        this.options.identityType
                    )
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    this.logger.error("Fetch başarısız (getIdentDetails)", error.message || response.statusText);
                    throw new Error("Müşteri bilgileri alınamadı: " + (error.message || response.statusText));

                } else {
                    const responseData = await response.json();

                    if (!responseData.result || responseData.response_status !== 200) {
                        throw new Error("Müşteri bilgileri alınamadı");
                    }

                    this.context.identData = responseData.data;

                    this.socket.url = this.context.identData?.ws_url;
                    this.context.projectId = this.context.identData?.project_id;
                    this.context.uid = this.context.identData?.customer_uid;

                    this.logger.debug("Ident Detayları = " + JSON.stringify(this.context.identData));
                }
            } catch (e) {
                this.logger.error("Fetch sırasında beklenmedik hata", e.message);
                throw new Error("İşlem sırasında hata oluştu: " + e.message);
            }

            const socketUrl = `${this.socket.url}?sessionId=${identId}&lang=${lang}`;

            try {
                this.webSocket = new WebSocket(socketUrl);

                const wsRef = this.webSocket;

                window.addEventListener("beforeunload", () => {
                    this.logger.warning("[WS] Sayfa yenilemesi öncesi socket kapatılıyor");
                    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
                        this.logger.warning("[WS] Sayfa yenilemesi öncesi socket kapatıldı");
                        wsRef.close(1000, "Page refresh/close");
                    }
                });

                this.webSocket.onopen = () => {
                    this.logger.info('[WS] Bağlantı başlatıldı');

                    this.context.identId = identId;
                    this.context.lang = lang;

                    try {
                        this.webSocket.send(JSON.stringify({type: 'start', identId, lang}));
                        this.logger.info("WebSocket bağlantısı kuruldu ve başlatma mesajı gönderildi.");
                    } catch (sendError) {
                        this.logger.error("Başlatma mesajı gönderilemedi", sendError.message);
                        throw new Error("Başlatma mesajı gönderilemedi: " + sendError.message);
                    }
                };

                this.webSocket.onerror = (event) => {
                    this.logger.error("WebSocket bağlantı hatası", event?.message || event);
                    this.lifeCycle?.socket?.onError?.(event);
                    if (this.startCallTimeout) {
                        clearTimeout(this.startCallTimeout);
                        this.startCallTimeout = null;
                    }

                    throw new Error("WebSocket bağlantı hatası: " + (event?.message || "Bilinmeyen hata"));
                };

                this.webSocket.onclose = () => {
                    if (this.startCallTimeout) {
                        clearTimeout(this.startCallTimeout);
                        this.startCallTimeout = null;
                    }

                    if (!this.closed) {
                        this.logger.info('[WS] Bağlantı kapatıldı');
                        this.lifeCycle?.socket?.onConnectionLost?.();
                    }
                };

                const ws = this.webSocket;
                const originalSend = ws.send;

                ws.send = (data) => {
                    try {
                        this.logger.debug('[WS] Mesaj gönderiliyor', data);
                        if (ws.readyState === WebSocket.OPEN) {
                            return originalSend.call(ws, data);
                        } else {
                            this.logger.warning("WS kapalı, mesaj gönderilemedi", data);
                        }
                    } catch (e) {
                        this.logger.error("WS gönderim hatası", e.message);
                    }
                };

                this.webSocket.onmessage = async (event) => {
                    this.logger.debug('[WS] Mesaj geldi', event.data);

                    let data;
                    try {
                        data = JSON.parse(event.data);
                    } catch (e) {
                        this.logger.error("Gelen mesaj parse edilemedi", e.message);
                        return;
                    }

                    this.logger.debug('[WS] Mesaj geldi', event.data);

                    const action = data.action;

                    switch (action) {
                        case 'sysMsg':
                            this.subscribe();
                            break
                        case 'newSub':
                            this.newSub();
                            break
                        case 'subscribed':
                            this.subscribed();
                            break
                        case 'preSub':
                            break
                        case 'subRejected':
                            await this.refuseJoin(data);
                            break
                        case 'queueInfo':
                            break
                        case 'imOnline':
                            break
                        case 'getQueueInfo':
                            break
                        case 'queueStats':
                            this.lifeCycle?.videoCall?.onQueueUpdate?.(data);

                            if (data?.countMember === 0) {
                                this.lifeCycle?.room?.onAgentCome?.(data);
                            }
                            break
                        case 'enableCallButton':
                            //Adminde odada çağrı başlatılkabilir
                            break
                        case 'imOffline':
                            await this._clearPeerData();
                            this.lifeCycle?.room?.onAgentLeave?.(data);
                            break
                        case 'initCall':
                            //Admin çağrıyı başlattı
                            this.lifeCycle?.videoCall?.onCall?.(data);
                            break
                        case 'missedCall':
                            if (this.startCallTimeout) {
                                clearTimeout(this.startCallTimeout);
                                this.startCallTimeout = null;
                            }

                            this.lifeCycle?.videoCall?.onCancel?.(data);
                            break
                        case 'startCall':
                            //Client çağrıya cevap verdi
                            await this._startCall(false);
                            break
                        case 'sdp':
                            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                            break;
                        case 'candidate':
                            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                            break;
                        case 'terminateCall':
                            if (this.startCallTimeout) {
                                clearTimeout(this.startCallTimeout);
                                this.startCallTimeout = null;
                            }

                            await this._terminateCall();
                            break;
                        default:
                            this.logger.warning(`Bilinmeyen WS action alındı: ${action}`);
                            break;
                    }
                };
            } catch (e) {
                this.logger.error("WebSocket başlatılamadı", e.message);
                throw new Error("WebSocket başlatılamadı: " + e.message);
            }
        }

        async answerCall() {
            if (!this.myVideoElement || !this.peerVideoElement) {
                this.logger.error("myVideoElement ve peerVideoElement boş olamaz");
                throw new Error("myVideoElement ve peerVideoElement boş olamaz");
            }

            this.startCallTimeout = setTimeout(async () => {
                await this._startCall(true);

                this.startCallTimeout = null;
            }, 3000);
        }

        async answerCallWithElements(myVideoElement, peerVideoElement) {
            if (!myVideoElement || !peerVideoElement) {
                this.logger.error("myVideoElement ve peerVideoElement boş olamaz");
                throw new Error("myVideoElement ve peerVideoElement boş olamaz");
            }

            this.startCallTimeout = setTimeout(async () => {
                this.myVideoElement = myVideoElement;
                this.peerVideoElement = peerVideoElement;

                await this._startCall(true);
                this.startCallTimeout = null;
            }, 3000);
        }

        async _terminateCall() {
            await this._clearPeerData();

            this.lifeCycle?.videoCall?.onTerminate();
        }

        async _clearPeerData() {
            if (this.peerConnection) {
                const senders = this.peerConnection.getSenders();
                senders.forEach(sender => {
                    if (sender.track) sender.track.stop();
                });

                this.peerConnection.close();
            } else {
                return
            }

            if (this.myVideoElement.srcObject) {
                this.myVideoElement.srcObject.getTracks().forEach(track => track.stop());
                this.myVideoElement.srcObject = null;
            }

            if (this.peerVideoElement.srcObject) {
                this.peerVideoElement.srcObject.getTracks().forEach(track => track.stop());
                this.peerVideoElement.srcObject = null;
            }
        }

        getDeviceInfo() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;

            const info = {
                deviceModel: null,
                platform: null,
            };

            info.platform = "JSSDK";

            if (/windows phone/i.test(userAgent)) {
                info.deviceModel = "Windows Phone";
            } else if (/windows/i.test(userAgent)) {
                info.deviceModel = "Windows";
            } else if (/android/i.test(userAgent)) {
                info.deviceModel = "Android";
            } else if (/iPad|iPhone|iPod/.test(userAgent)) {
                info.deviceModel = "iOS";
            } else if (/Mac OS X/.test(userAgent)) {
                info.deviceModel = "macOS";
            } else if (/linux/i.test(userAgent)) {
                info.deviceModel = "Linux";
            }

            if (/firefox|fxios/i.test(userAgent)) {
                info.deviceModel = "Firefox";
            } else if (/chrome|crios/i.test(userAgent)) {
                info.deviceModel = "Chrome";
            } else if (/safari/i.test(userAgent)) {
                info.deviceModel = "Safari";
            } else if (/edg/i.test(userAgent)) {
                info.deviceModel = "Edge";
            }

            this.logger.debug("Cihaz bilgisi", JSON.stringify(info));

            return info;
        }

        async refuseJoin(data) {
            let message = data?.message ?? (data?.content ?? null);

            this.logger.warning("Görüşme reddedildi", message || "Unknown");

            if (message) {
                this.lifeCycle?.videoCall?.onRefuse?.(message);
            } else {
                this.lifeCycle?.videoCall?.onRefuse?.('Unknown');
            }
        }

        subscribe() {
            this.logger.debug("subscribe() çağrıldı");

            this.webSocket.send(JSON.stringify({
                    action: 'subscribe',
                    room: this.context.uid,
                    project_id: this.context.projectId,
                    location: "Call Wait Screen",
                    deviceInfo: this.context.deviceInfo
                }
            ));
        }

        subscribed() {
            this.logger.debug("subscribed() çağrıldı");

            const steps = {
                "steps": {
                    "video": false,

                }
            };

            if (this.context.sign_lang != null) {
                steps.sign_language = this.context.sign_lang ? 1 : 0;
            }

            this.webSocket.send(JSON.stringify(
                {
                    "action": "stepChanged",
                    "location": "Call Wait Screen",
                    "project_id": this.context.projectId,
                    "room": this.context.uid,
                    steps
                }
            ));
        }

        newSub() {
            this.logger.debug("newSub() çağrıldı");

            this.webSocket.send(JSON.stringify(
                {
                    "action": "imOnline",
                    "room": this.context.uid,
                }
            ));
        }

        async close() {
            try {
                this.closed = true;

                if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
                    this.webSocket.close(1000, "Finished");
                }

                if (this.peerConnection) {
                    const senders = this.peerConnection.getSenders();
                    senders.forEach(sender => {
                        if (sender.track) sender.track.stop();
                    });

                    await this._clearPeerData();
                    this.peerConnection = null;
                }
            } catch (err) {
                this.logger.error("[WS] kapatılırken hata oluştu:", err?.message);
            }
        }

        async _startCall(isCaller) {
            try {
                this.peerConnection = new RTCPeerConnection({
                        iceServers: [
                            {urls: 'stun:' + this.stun.url + ':' + this.stun.port},
                            {
                                urls: 'turn:' + this.turn.api + ':' + this.turn.port,
                                credential: this.turn.password,
                                username: this.turn.username,
                            }
                        ]
                    }
                );
            } catch (e) {
                this.logger.error("PeerConnection oluşturulamadı", e.message);
                throw e;
            }

            await this._setLocalMedia(isCaller);

            this.peerConnection.onicecandidate = (e) => {
                if (e.candidate) {
                    this.webSocket.send(JSON.stringify({
                        action: 'candidate',
                        candidate: e.candidate,
                        room: this.context.uid
                    }));
                }
            };

            this.peerConnection.ontrack = (e) => {
                if (!this.peerVideoElement.srcObject) {
                    this.peerVideoElement.srcObject = e.streams[0];
                    this.peerVideoElement.muted = false;
                    this.peerVideoElement.volume = 1;
                }
            };

            this.peerConnection.oniceconnectionstatechange = () => {
                switch (this.peerConnection.iceConnectionState) {
                    case 'disconnected':
                    case 'failed':
                        this.logger.error("Ice connection state is failed/disconnected");
                        break;

                    case 'closed':
                        this.logger.error("Ice connection state is 'closed'");
                        break;
                }
            };

            this.peerConnection.onsignalingstatechange = async () => {

                this.logger.debug("Signalling durumu değişti, yeni durum =" + this.peerConnection.signalingState);

                switch (this.peerConnection.signalingState) {
                    case 'closed':
                        this.logger.info("Signalling state is 'closed'");
                        await this._terminateCall();
                        break;
                }
            };
        }

        async _setLocalMedia(isCaller) {
            this.logger.called("_setLocalMedia");

            await navigator.mediaDevices.getUserMedia(
                {
                    video: {facingMode: 'user'},
                    audio: true
                }
            ).then(async (myStream) => {
                this.myVideoElement.srcObject = myStream;
                myStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, myStream);
                });

                if (isCaller) {
                    await this.peerConnection.createOffer().then(
                        async (desc) => {
                            this.webSocket.send(JSON.stringify({
                                action: 'startCall',
                                room: this.context.uid
                            }));

                            await this._description(desc);
                            this.webSocket.send(JSON.stringify({
                                action: 'sdp',
                                sdp: desc,
                                room: this.context.uid
                            }));
                        }
                    );


                } else {
                    await this.peerConnection.createAnswer().then(
                        async (desc) => {
                            await this._description(desc);
                        }
                    );
                }
            }).catch((e) => {
                switch (e.name) {
                    case 'SecurityError':
                        this.logger.error("SET_LOCAL_MEDIA EX Message = ", e.message);
                        break;

                    case 'NotAllowedError':
                        this.logger.error("SET_LOCAL_MEDIA EX Message = ", e.message);
                        break;

                    case 'NotFoundError':
                        this.logger.error("SET_LOCAL_MEDIA EX Message = ", e.message);
                        break;

                    case 'NotReadableError':
                    case 'AbortError':
                        this.logger.error("SET_LOCAL_MEDIA EX Message = ", e.message);
                        break;
                    default:
                        this.logger.error("SET_LOCAL_MEDIA EX Message = ", e.message);
                }
            });
        }

        static checkBrowserCompatibility() {
            const ua = navigator.userAgent;
            const browserMatch = ua.match(/(firefox|msie|trident|chrome|safari|opr|edg)\/?\s*(\d+)/i) || [];
            const browser = browserMatch[1] ? browserMatch[1].toLowerCase() : '';
            const version = parseInt(browserMatch[2], 10);

            const isSupported = (
                (browser === 'chrome' && version >= 60) ||
                (browser === 'firefox' && version >= 55) ||
                (browser === 'edg' && version >= 79) || // Edge Chromium
                (browser === 'safari' && version >= 12) || // Safari (version check is tricky below)
                (browser === 'opr' && version >= 47)     // Opera
            );

            if (browser === 'safari') {
                const isIOS = /iP(hone|od|ad)/.test(ua);
                const safariVersionMatch = ua.match(/Version\/(\d+)/);
                const safariVersion = safariVersionMatch ? parseInt(safariVersionMatch[1], 10) : 0;
                if ((isIOS || ua.includes('Macintosh')) && safariVersion >= 12) {
                    return; // destekleniyor
                }
            }

            return isSupported;
        }


        async _description(desc) {
            this.logger.debug("Local SDP set ediliyor", desc?.type);
            await this.peerConnection.setLocalDescription(desc);
        }
    }

    class IdentifySdkBuilder {
        constructor() {
            this.api = '';
            this.socket = {url: '', port: ''};
            this.stun = {url: '', port: ''};
            this.turn = {url: '', port: '', username: '', password: ''};
            this.myVideoElement = null;
            this.peerVideoElement = null;
            this.logLevel = IdentifyLogLevels.INFO;
            this.lifeCycle = {
                socket: {
                    onConnectionLost() {
                    },
                    onError() {
                    }
                },
                room: {
                    onAgentCome(data) {
                    },
                    onAgentLeave(data) {
                    }
                },
                videoCall: {
                    onQueueUpdate(data) {
                    },
                    onCancel(data) {
                    },
                    onCall(data) {
                    },
                    onTerminate() {
                    },
                    onRefuse() {
                    }
                }
            };
            this.options = null;
        }

        setApi(api) {
            this.api = api;
            return this;
        }

        setStun(url, port) {
            this.stun = {url, port};
            return this;
        }

        setTurn(url, port, username, password) {
            this.turn = {url, port, username, password};
            return this;
        }

        setMyVideoElement(myVideoElement) {
            this.myVideoElement = myVideoElement;
            return this;
        }

        setPeerVideoElement(peerVideoElement) {
            this.peerVideoElement = peerVideoElement;
            return this;
        }

        setLifeCycle(lifeCycle) {
            this.lifeCycle = lifeCycle;
            return this;
        }

        setOptions(options) {
            this.options = options;
            return this;
        }

        setLogLevel(logLevel) {
            this.logLevel = logLevel;
            return this;
        }

        build() {
            return new IdentifySdk(this);
        }
    }

    class IdentityOptions {
        constructor(builder) {
            this.identityType = builder.identityType;
            this.nfcExceptionCount = builder.nfcExceptionCount;
            this.callConnectionTimeOut = builder.callConnectionTimeOut;
            this.videoRecordTime = builder.videoRecordTime;
            this.openIntroPage = builder.openIntroPage;
        }

        toJSON() {
            return {
                identityType: this.identityType,
                nfcExceptionCount: this.nfcExceptionCount,
                callConnectionTimeOut: this.callConnectionTimeOut,
                videoRecordTime: this.videoRecordTime,
                openIntroPage: this.openIntroPage
            };
        }
    }

    class IdentifyOptionBuilder {
        constructor() {
            this.identityType = [];
            this.nfcExceptionCount = 3;
            this.callConnectionTimeOut = 10000;
            this.videoRecordTime = 5000;
            this.openIntroPage = true;
        }

        setIdentityType(identityType) {
            if (Array.isArray(identityType)) {
                this.identityType = identityType;
            }
            return this;
        }

        setNfcExceptionCount(nfcExceptionCount) {
            this.nfcExceptionCount = nfcExceptionCount;
            return this;
        }

        setCallConnectionTimeOut(callConnectionTimeOut) {
            this.callConnectionTimeOut = callConnectionTimeOut;
            return this;
        }

        setVideoRecordTime(videoRecordTime) {
            this.videoRecordTime = videoRecordTime;
            return this;
        }

        setOpenIntroPage(openIntroPage) {
            this.openIntroPage = openIntroPage;
            return this;
        }

        build() {
            return new IdentityOptions(this);
        }
    }

    const IdentifyModuleTypes = {
        SIGNATURE: 'SIGNATURE',
        VIDEO_RECORD: 'VIDEO_RECORD',
        TAKE_SELFIE: 'TAKE_SELFIE',
        SPEECH_TEST: 'SPEECH_TEST',
        IDENTIFICATION_INFORMATION_WITH_CARD_PHOTO: 'IDENTIFICATION_INFORMATION_WITH_CARD_PHOTO',
        LIVENESS_TEST: 'LIVENESS_TEST',
        IDENTIFICATION_INFORMATION_WITH_NFC: 'IDENTIFICATION_INFORMATION_WITH_NFC',
        AGENT_CALL: 'AGENT_CALL'
    };

    exports.IdentifyLogLevels = IdentifyLogLevels;
    exports.IdentifyLogger = IdentifyLogger;
    exports.IdentifyModuleTypes = IdentifyModuleTypes;
    exports.IdentifyOptionBuilder = IdentifyOptionBuilder;
    exports.IdentifySdk = IdentifySdk;
    exports.IdentifySdkBuilder = IdentifySdkBuilder;
    exports.IdentityOptions = IdentityOptions;

    return exports;

})({});
