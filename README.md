# Identify JS SDK

Identify JS SDK, web platformları için geliştirilmiş bir video çağrı SDK'sıdır. WebSocket ve WebRTC kullanarak kimlik tespiti süreçlerini destekler.

---

## ✨ Kurulum

```html
<script src="https://your-cdn.com/dist/identify-sdk.bundle.js"></script>
```

## 📁 Yapı

SDK, Builder pattern kullanarak konfigüre edilir.

```js
const options = new IdentifySDK.IdentifyOptionBuilder()
    .setIdentityType([[IdentifySDK.IdentifyModuleTypes.AGENT_CALL]])
    .build();

const sdk = new IdentifySDK.IdentifySdkBuilder()
    .setApi("https://api.example.com")
    .setStun("stun.example.com", 3478)
    .setTurn("turn.example.com", 3478, "user", "pass")
    .setLifeCycle(...)
    .setMyVideoElement(document.getElementById("myVideo"))
    .setPeerVideoElement(document.getElementById("peerVideo"))
    .setOptions(options)
    .build();
```

---

## 🔧 API Referansı

### IdentifyOptionBuilder

Kimlik tespit davranışını ayarlamak için kullanılır.

| Metot                           | Açıklama                          |
| ------------------------------- | --------------------------------- |
| `.setIdentityType(Array)`       | Tanıma modları (AGENT_CALL)   |
| `.setNfcExceptionCount(number)` | NFC deneme sınırı                 |
| `.setCallConnectionTimeOut(ms)` | Bağlantı zaman aşımı              |
| `.setVideoRecordTime(ms)`       | Video kayıt süre uzunluğu         |
| `.setOpenIntroPage(boolean)`    | Tanıtım sayfası açılsın mı        |
| `.build()`                      | `IdentityOptions` nesnesini döner |

### IdentifySdkBuilder

SDK'nın tüm ayarlarını yapar.

| Metot                             | Açıklama                      |
| --------------------------------- | ----------------------------- |
| `.setApi(url)`                    | REST API URL                  |
| `.setSocket(url)`                 | WebSocket URL                 |
| `.setStun(url, port)`             | STUN sunucu bilgisi           |
| `.setTurn(url, port, user, pass)` | TURN sunucu bilgisi           |
| `.setMyVideoElement(el)`          | Kendi video elemanı           |
| `.setPeerVideoElement(el)`        | Karşı tarafın video elemanı   |
| `.setLifeCycle(callbacks)`        | Olay döngüsü                  |
| `.setOptions(options)`            | `IdentityOptions` nesnesi     |
| `.setLogLevel(level)`             | Log seviyesi                  |
| `.build()`                        | `IdentifySdk` nesnesini döner |

### IdentifySdk

Ana kimlik tespit süreci buradan yürütülür.

| Metot                                          | Açıklama                                           |
| ---------------------------------------------- | -------------------------------------------------- |
| `startIdentification(identId, lang, signLang)` | Kimlik tespiti sürecini başlatır                   |
| `answerCall()`                                 | Gelen aramayı kabul eder                           |
| `answerCallWithElements(myEl, peerEl)`         | Video elementlerini sonradan tanımlayarak cevaplar |
| `close()`                                      | Tüm kaynakları temizler ve oturumu kapatır         |

---

## 🔢 Log Seviyeleri

Identify SDK içinde aşağıdaki log seviyeleri kullanılabilir:

| Seviye Adı  | Değer | Açıklama                                 |
|-------------|--------|-------------------------------------------|
| `CLOSE`     | -1     | Loglama tamamen kapalıdır                |
| `EMERGENCY` | 0      | Sistem kullanılamaz durumda              |
| `ALERT`     | 1      | Derhal müdahale edilmesi gereken durum   |
| `CRITICAL`  | 2      | Kritik hata, işlevselliği etkiler        |
| `ERROR`     | 3      | Hata mesajları                           |
| `WARNING`   | 4      | Uyarılar                                 |
| `NOTICE`    | 5      | Normal ama dikkat gerektiren durumlar    |
| `INFO`      | 6      | Bilgilendirici mesajlar                  |
| `DEBUG`     | 7      | Geliştirici düzeyinde ayrıntılı loglar   |

---

## ♻LifeCycle Callback'leri

```js
{
  socket: {
    onConnectionLost: () => {},
    onError: (err) => {}
  },
  room: {
    onAgentCome: (data) => {},
    onAgentLeave: (data) => {}
  },
  videoCall: {
    onQueueUpdate: (data) => {},
    onCancel: () => {},
    onCall: (data) => {},
    onTerminate: () => {},
    onRefuse: (reason) => {}
  }
}
```

---

## 🚀 Kullanım Adımları


`identify-sdk.bundle.js` dosyasını HTML'e dahil edin:

```html
<script src="../dist/identify-sdk.bundle.js?v=YOUR_VERSION"></script>
```

### 1. SDK Kurulumu

```js
const identityOptions = new IdentifySDK.IdentifyOptionBuilder()
  .setIdentityType([IdentifySDK.IdentifyModuleTypes.AGENT_CALL])
  .build();

const sdk = await new IdentifySDK.IdentifySdkBuilder()
  .setApi(apiUrl)
  .setStun(stunIp, stunPort)
  .setTurn(turnIp, turnPort, turnUsername, turnPassword)
  .setLogLevel(logLevel)
  .setLifeCycle({
    socket: {
      onConnectionLost() {
        // bağlantı koptu
      },
      onError(data) {
        // genel hata
      }
    },
    videoCall: {
      onQueueUpdate(data) {
        // sıra bilgisi
      },
      onCall(data) {
        // Çağrı geldi
        answerCall();
      },
      onCancel() {
        // çağrı iptal edildi
      },
      onTerminate() {
        // çağrı bitti
      },
      onRefuse(msg) {
        // çağrı reddedildi
      }
    }
  })
  .setOptions(identityOptions)
  .build();
```

### 2. Identification Başlatma

```js
await sdk.startIdentification(identId, language, signLang)
  .then(() => {
    console.log("Bağlantı başarılı");
  })
  .catch(err => {
    console.error("Bağlantı hatası:", err.message);
  });
```

### 3. Çağrı Yanıtlama

```js
await sdk.answerCallWithElements(
  document.getElementById('myVideo'),
  document.getElementById('peerVideo')
);
```

### 4. Çağrı Sonlandırma

```js
await sdk.close();
```

---

## 🔍 Örnek Dosya

Kullanım örneği [example/index.html](example/index.html) dosyasına göz atabilirsiniz.


## 📡 Tarayıcı Uyumluluğu

Aşağıdaki tarayıcılar desteklenmektedir:

* Chrome 60+
* Firefox 55+
* Edge Chromium 79+
* Opera 47+

Uyumluluk kontrolü için:

```js
IdentifySdk.checkBrowserCompatibility();
```

## 📍 Cihaz Bilgisi

SDK, aşağıdaki bilgileri otomatik olarak toplar:

* Platform
* Tarayıcı Adı ve Versiyonu

## 📝 Notlar

- SDK yalnızca tarayıcı ortamında çalışır.
- `video` elementleri `autoplay` ve `playsinline` attribute’ları ile kullanılmalıdır.