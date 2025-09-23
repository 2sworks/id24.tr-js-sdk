let elStatusMessage = null;

const context = {
    isInitialized: false,
    isConnected: false,
    isIdentificationStarted: false,
}

document.addEventListener("DOMContentLoaded", () => {
    elStatusMessage = document.getElementById('callStatus');

    const fields = [
        "language", "sign_lang",
        "ident_id", "api-url",
        "stun-ip", "stun-port",
        "turn-ip", "turn-port", "turn-username", "turn-pass",
        "logLevel"
    ];

    fields.forEach(id => {
        const el = document.getElementById(id);
        const val = localStorage.getItem("config_" + id);
        if (val !== null && el) {
            el.value = val;
        }
    });
});

const fields = [
    "ident_id", "api-url",
    "stun-ip", "stun-port",
    "turn-ip", "turn-port", "turn-username", "turn-pass",
    "logLevel"
];

function saveLocalStorage() {
    for (const id of fields) {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
            alert("Lütfen tüm alanları doldurun! Eksik: " + id);
            el.focus();
            return;
        }
    }

    if (!confirm("Tüm bilgileri tarayıcınıza kaydetmek istiyor musunuz?")) {
        return;
    }

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            localStorage.setItem("config_" + id, el.value.trim());
        }
    });

    alert("Bilgiler başarıyla tarayıcınıza kaydedildi!");
}

function goMoveCall() {
    for (const id of fields) {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
            alert("Lütfen tüm alanları doldurun! Eksik: " + id);
            el.focus();
            return;
        }
    }

    document.querySelector(".config-container").classList.remove("active");
    document.querySelector(".call-container").classList.add("active");
}

function getFormConfig() {
    return {
        ident_id: document.getElementById("ident_id").value.trim(),
        language: document.getElementById("language").value,
        sign_lang: document.getElementById("sign_lang").value,
        api_url: document.getElementById("api-url").value.trim(),
        stun: {
            ip: document.getElementById("stun-ip").value.trim(),
            port: document.getElementById("stun-port").value.trim()
        },
        turn: {
            ip: document.getElementById("turn-ip").value.trim(),
            port: document.getElementById("turn-port").value.trim(),
            username: document.getElementById("turn-username").value.trim(),
            pass: document.getElementById("turn-pass").value.trim()
        },
        logLevel: document.getElementById("logLevel").value
    };
}

function again() {
    window.location.reload();
}

function changeMessage(message){
    elStatusMessage.innerHTML = message;
}