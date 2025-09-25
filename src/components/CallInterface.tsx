import React, {useRef, useState} from 'react';
import {
    IdentifyLogLevels,
    IdentifyModuleTypes,
    IdentifyOptionBuilder,
    IdentifySdk,
    IdentifySdkBuilder
} from '@2sworks/identify-sdk';

interface CallInterfaceProps {
    config: any;
    identifyObject: any
    setContext: React.Dispatch<React.SetStateAction<any>>;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({config, identifyObject, setContext}) => {
    const myVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerVideoRef = useRef<HTMLVideoElement | null>(null);
    const [status, setStatus] = useState('SDK Kurulumu Bekleniyor...');

    const hideVideos = () => {
        if (myVideoRef.current) myVideoRef.current.parentElement!.style.display = 'none';
        if (peerVideoRef.current) peerVideoRef.current.parentElement!.style.display = 'none';
    };

    const showVideos = () => {
        if (myVideoRef.current) myVideoRef.current.parentElement!.style.display = '';
        if (peerVideoRef.current) peerVideoRef.current.parentElement!.style.display = '';
    };

    const initializeSDK = async () => {
        if (!IdentifySdk.checkBrowserCompatibility()) {
            setStatus('Tarayıcı desteklenmiyor. Lütfen Chrome, Firefox, Safari vb. kullanın.');
            return;
        }

        const identityOptions = new IdentifyOptionBuilder()
            .setIdentityType([IdentifyModuleTypes.AGENT_CALL])
            .build();

        identifyObject.current = await new IdentifySdkBuilder()
            .setApi(config.api_url)
            .setStun(config.stun.ip, config.stun.port)
            .setTurn(config.turn.ip, config.turn.port, config.turn.username, config.turn.pass)
            .setLogLevel(IdentifyLogLevels.DEBUG)
            .setLifeCycle({
                socket: {
                    onConnectionLost: () => setStatus('Bağlantı koptu'),
                    onError: (e: any) => setStatus('Hata: ' + e?.message || e)
                },
                videoCall: {
                    onQueueUpdate: (data: any) => {
                        setStatus(data.countMember === 0 ?
                            'Temsilci hazırlanıyor...' :
                            `Sıra Numarası = ${data.countMember}, Ortalama bekleme süresi (dk) = ${data.apprWaitFor}`);
                    },
                    onCancel: () => {
                        identifyObject.current.close();
                        hideVideos();
                        setStatus('Çağrı iptal edildi');
                    },
                    onCall: () => answerCall(),
                    onTerminate: () => {
                        hideVideos();
                        setStatus('Çağrı sonlandı');
                    },
                    onRefuse: (msg: any) => {
                        hideVideos();
                        setStatus('Çağrı reddedildi: ' + msg);
                    }
                }
            })
            .setOptions(identityOptions)
            .build();

        setStatus('SDK kuruldu, Identification bekleniyor...');
        setContext((ctx: any) => ({...ctx, isInitialized: true}));
    };

    const startIdentification = async () => {
        try {
            setStatus('Bağlantı başlatılıyor...');
            await identifyObject.current.startIdentification(config.ident_id, config.language, config.sign_lang);
            setStatus('Bağlantı başarılı, çağrı bekleniyor...');
            setContext((ctx: any) => ({...ctx, isIdentificationStarted: true}));
        } catch (err: any) {
            setStatus('Hata: ' + err.message);
        }
    };

    const answerCall = async () => {
        showVideos();
        if (myVideoRef.current && peerVideoRef.current) {
            await identifyObject.current.answerCallWithElements(myVideoRef.current, peerVideoRef.current);
        }
        setStatus('Çağrı başladı');
    };

    const again = () => {
        window.location.reload();
    };

    return (
        <div className="call-container active">
            <div className="status waiting">{status}</div>

            <div className="video-preview" style={{display: 'none'}}>
                <h4>Müşteri Görüntüsü</h4>
                <video ref={myVideoRef} autoPlay playsInline muted></video>
            </div>
            <div className="video-preview" style={{display: 'none'}}>
                <h4>Temsilci Görüntüsü</h4>
                <video ref={peerVideoRef} autoPlay playsInline muted loop></video>
            </div>

            <div className="buttons">
                <button className="btn btn-wait" onClick={initializeSDK}>1. SDK Kurulum</button>
                <button className="btn btn-call" onClick={startIdentification}>2. Identification Başlat</button>
                <button className="btn btn-end" onClick={again}>Yeniden Başlat</button>
            </div>
        </div>
    );
};
