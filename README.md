# 🥛 Goat Milk Monitor

Real-time milk quality monitoring system using ESP32 sensors and Firebase.

![Dashboard Preview](https://goat-milk-monitor.vercel.app)

## 🌟 Features

- **Real-time Monitoring**: Data sensor diperbarui setiap 3 detik
- **Multi-Sensor Support**: pH, Warna (RGB), dan Gas
- **Smart Grading**: Sistem penilaian otomatis (Grade A, B, C, F)
- **Beautiful UI**: Dashboard modern dengan dark mode dan glassmorphism
- **Responsive**: Tampilan optimal di desktop dan mobile

## 📁 Project Structure

```
CAPSTONE/
├── arduino/
│   ├── MilkMonitor_Firebase.ino   # Kode ESP32
│   └── README.md                   # Panduan Arduino
└── web/
    ├── index.html                  # Entry point
    ├── main.js                     # Firebase & Logic
    ├── style.css                   # Stylesheet
    ├── vercel.json                 # Vercel config
    └── public/
        └── milk-icon.svg           # Favicon
```

## 🚀 Quick Start

### Arduino/ESP32

1. Buka `arduino/MilkMonitor_Firebase.ino` di Arduino IDE
2. Install library: **Firebase Arduino Client Library for ESP8266 and ESP32**
3. Update WiFi credentials jika perlu
4. Upload ke ESP32

### Web App (Local Development)

```bash
cd web
npm install
npm run dev
```

### Deploy ke Vercel

1. Push ke GitHub
2. Connect repository di [Vercel](https://vercel.com)
3. Deploy!

Atau gunakan Vercel CLI:

```bash
cd web
npx vercel
```

## 🔧 Configuration

### Firebase Rules (Development)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Firebase Rules (Production)

```json
{
  "rules": {
    "sensor_data": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## 📊 Data Structure

```
sensor_data/
└── current/
    ├── ph: number           # Nilai pH (0-14)
    ├── gas: number          # Nilai gas (ppm)
    ├── red: number          # Nilai merah
    ├── green: number        # Nilai hijau
    ├── blue: number         # Nilai biru
    ├── avgWarna: number     # Rata-rata RGB
    ├── statusWarna: number  # 0=Buruk, 1=Cukup, 2=Baik
    ├── textWarna: string    # Deskripsi warna
    ├── phOK: boolean        # Status pH
    ├── gasOK: boolean       # Status gas
    ├── grade: string        # "A", "B", "C", atau "F"
    ├── status: string       # Status keseluruhan
    ├── penyebab: string     # Alasan status
    └── timestamp: number    # Waktu update
```

## 🎨 Grading System

| Grade | Kriteria | Warna   | pH               | Gas     |
| ----- | -------- | ------- | ---------------- | ------- |
| **A** | Premium  | < 400   | 6.0-7.5          | < 2500  |
| **B** | Cukup    | 400-800 | 6.0-7.5          | < 2500  |
| **C** | Warning  | > 800   | 6.0-7.5          | < 2500  |
| **F** | Rusak    | Any     | < 6.0 atau > 7.5 | >= 2500 |

## 📱 Screenshots

### Grade A - Premium Quality

Fresh milk with perfect color, pH, and no odor.

### Grade B - Acceptable Quality

Slight color degradation but still safe.

### Grade F - Spoiled

Do not consume!

## 🛠️ Tech Stack

- **Hardware**: ESP32, TCS3200 Color Sensor, MQ-135 Gas Sensor, pH Sensor
- **Backend**: Firebase Realtime Database
- **Frontend**: Vite, Vanilla JavaScript, CSS3
- **Deployment**: Vercel

## 👥 Contributors

- Kelompk G - Developer

## 📄 License

MIT License - feel free to use and modify!

---

Capstone Project 2026
