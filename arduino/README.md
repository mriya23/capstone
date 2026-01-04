# 🥛 Goat Milk Monitor - Arduino ESP32

## Instalasi Library

Sebelum upload kode ke ESP32, install library berikut di Arduino IDE:

### 1. Firebase ESP Client

- Buka Arduino IDE
- **Sketch > Include Library > Manage Libraries**
- Cari: `Firebase ESP Client`
- Install: **Firebase Arduino Client Library for ESP8266 and ESP32** by Mobizt

### 2. Pengaturan Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project: `goat-milk-monitor`
3. **Build > Realtime Database**

   - Pastikan database sudah dibuat
   - Rules (untuk development):

   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

   ⚠️ **PENTING**: Untuk production, gunakan rules yang lebih aman!

4. **Build > Authentication**
   - Klik **Get Started**
   - Enable **Anonymous** sign-in method

### 3. Board Settings di Arduino IDE

- **Board**: ESP32 Dev Module
- **Upload Speed**: 115200
- **Flash Frequency**: 80MHz
- **Flash Size**: 4MB

### 4. Upload Kode

1. Hubungkan ESP32 ke komputer
2. Pilih port yang benar
3. Klik Upload

### 5. Cek Serial Monitor

Buka Serial Monitor (115200 baud) untuk melihat:

- Status koneksi WiFi
- Status Firebase
- Data yang dikirim

## Struktur Data di Firebase

```
sensor_data/
├── current/
│   ├── ph: 6.8
│   ├── gas: 1200
│   ├── red: 350
│   ├── green: 380
│   ├── blue: 340
│   ├── avgWarna: 356
│   ├── statusWarna: 2
│   ├── textWarna: "Putih Sempurna"
│   ├── phOK: true
│   ├── gasOK: true
│   ├── grade: "A"
│   ├── status: "SUSU SEGAR (PREMIUM)"
│   ├── penyebab: "Kualitas Terbaik. Sangat Segar."
│   └── timestamp: 123456789
└── history/ (opsional)
    └── {timestamp}/
        └── ...
```

## Troubleshooting

| Masalah                | Solusi                                      |
| ---------------------- | ------------------------------------------- |
| WiFi tidak connect     | Cek SSID dan password                       |
| Firebase Sign Up Error | Enable Anonymous Auth di Firebase Console   |
| Data tidak terkirim    | Cek Database Rules, pastikan `.write: true` |
