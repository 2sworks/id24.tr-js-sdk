import React, {useEffect, useState} from 'react';

const fieldIds = [
    "ident_id", "api-url",
    "stun-ip", "stun-port",
    "turn-ip", "turn-port", "turn-username", "turn-pass",
    "logLevel"
];

type FormData = {
    [key: string]: string;
};

type Props = {
    onNext: (data: FormData) => void;
};

export const ConfigForm: React.FC<Props> = ({onNext}) => {
    const [formData, setFormData] = useState<FormData>({});

    useEffect(() => {
        const newForm: FormData = {};
        fieldIds.forEach(id => {
            const val = localStorage.getItem("config_" + id);
            if (val !== null) newForm[id] = val;
        });
        setFormData(newForm);
    }, []);

    const handleChange = (id: string, value: string) => {
        setFormData(prev => ({...prev, [id]: value}));
    };

    const handleSave = () => {
        for (const id of fieldIds) {
            if (!formData[id]?.trim()) {
                alert("Lütfen tüm alanları doldurun! Eksik: " + id);
                return;
            }
        }

        if (!confirm("Tüm bilgileri tarayıcınıza kaydetmek istiyor musunuz?")) return;

        fieldIds.forEach(id => {
            localStorage.setItem("config_" + id, formData[id]);
        });

        alert("Bilgiler başarıyla tarayıcınıza kaydedildi!");
    };

    const handleNext = () => {
        for (const id of fieldIds) {
            if (!formData[id]?.trim()) {
                alert("Lütfen tüm alanları doldurun! Eksik: " + id);
                return;
            }
        }
        onNext(formData);
    };

    return (
        <div className="config-container active">
            <div className="status connected">SDK ayarlarını tanımlayınız</div>
            <h3>Ident</h3>
            <div className="form-group">
                <input type="text" id="ident_id" placeholder="Ident Id" value={formData['ident_id'] || ''}
                       onChange={e => handleChange('ident_id', e.target.value)}/>
            </div>
            <h3>Opsiyonlar</h3>
            <div className="form-row col-2">
                <div>
                    <label>Dil</label>
                    <select id="language" onChange={e => handleChange('language', e.target.value)}>
                        <option value="tr">Türkçe</option>
                    </select>
                </div>
                <div>
                    <label>İşaret Dili</label>
                    <select id="sign_lang" onChange={e => handleChange('sign_lang', e.target.value)}>
                        <option value="true">Evet</option>
                        <option value="false">Hayır</option>
                    </select>
                </div>
            </div>
            <h3>API</h3>
            <div className="form-group">
                <input type="text" id="api-url" placeholder="API" value={formData['api-url'] || ''}
                       onChange={e => handleChange('api-url', e.target.value)}/>
            </div>
            <h3>Stun</h3>
            <div className="form-row col-2">
                <input type="text" id="stun-ip" placeholder="Stun IP" value={formData['stun-ip'] || ''}
                       onChange={e => handleChange('stun-ip', e.target.value)}/>
                <input type="text" id="stun-port" placeholder="Stun Port" value={formData['stun-port'] || ''}
                       onChange={e => handleChange('stun-port', e.target.value)}/>
            </div>
            <h3>Turn</h3>
            <div className="form-row col-4">
                <input type="text" id="turn-ip" placeholder="Turn IP" value={formData['turn-ip'] || ''}
                       onChange={e => handleChange('turn-ip', e.target.value)}/>
                <input type="text" id="turn-port" placeholder="Turn Port" value={formData['turn-port'] || ''}
                       onChange={e => handleChange('turn-port', e.target.value)}/>
                <input type="text" id="turn-username" placeholder="Turn Kullanıcı"
                       value={formData['turn-username'] || ''}
                       onChange={e => handleChange('turn-username', e.target.value)}/>
                <input type="text" id="turn-pass" placeholder="Turn Şifre" value={formData['turn-pass'] || ''}
                       onChange={e => handleChange('turn-pass', e.target.value)}/>
            </div>
            <h3>Log Seviyesi</h3>
            <select id="logLevel" name="logLevel" value={formData['logLevel'] || ''}
                    onChange={e => handleChange('logLevel', e.target.value)}>
                <option value="-1">Kapalı</option>
                <option value="0">Acil</option>
                <option value="1">Alarm</option>
                <option value="2">Kritik</option>
                <option value="3">Hata</option>
                <option value="4">Uyarı</option>
                <option value="5">Bildirim</option>
                <option value="6">Bilgi</option>
                <option value="7">Hata Ayıklama</option>
            </select>

            <div className="buttons">
                <button className="btn btn-prev" onClick={handleSave}>Tarayıcıma Kaydet</button>
                <button className="btn btn-next" onClick={handleNext}>İleri</button>
            </div>
        </div>
    );
};