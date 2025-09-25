import React, { useRef, useState } from 'react';
import { ConfigForm } from './components/ConfigForm';
import { CallInterface } from './components/CallInterface';

export const App: React.FC = () => {
    const identifyObject = useRef<any>(null);
    const [context, setContext] = useState({
        isInitialized: false,
        isIdentificationStarted: false,
    });
    const [config, setConfig] = useState<any | null>(null);

    return (
        <div className="app">
            {!context.isInitialized ? (
                <ConfigForm onNext={(data) => {
                    setConfig({
                        ident_id: data['ident_id'],
                        language: data['language'] || 'tr',
                        sign_lang: data['sign_lang'] || 'false',
                        api_url: data['api-url'],
                        stun: {
                            ip: data['stun-ip'],
                            port: data['stun-port']
                        },
                        turn: {
                            ip: data['turn-ip'],
                            port: data['turn-port'],
                            username: data['turn-username'],
                            pass: data['turn-pass']
                        },
                        logLevel: data['logLevel']
                    });

                    setContext((ctx) => ({ ...ctx, isInitialized: true }));
                }} />
            ) : (
                <CallInterface config={config} identifyObject={identifyObject} setContext={setContext} />
            )}
        </div>
    );
};