#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Provide the token generation process info
#include "addons/TokenHelper.h"
// Provide the RTDB payload printing info
#include "addons/RTDBHelper.h"

// ==========================================
// 1. PENGATURAN WIFI & FIREBASE
// ==========================================
const char* ssid = "PEREMPUAN DALAM PELUKAN";      
const char* password = "Oktober23!";    

// Firebase Credentials
#define API_KEY "AIzaSyAKTn5zBzy0w5iaiedXq150vK5eESW4dJc"
#define DATABASE_URL "https://goat-milk-monitor-default-rtdb.asia-southeast1.firebasedatabase.app"

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;
unsigned long sendDataPrevMillis = 0;
const unsigned long SEND_INTERVAL = 3000; // Kirim data setiap 3 detik

// ==========================================
// 2. PIN SENSOR
// ==========================================
#define S0 18
#define S1 19
#define S2 23
#define S3 17
#define COLOR_OUT 5

#define GAS_AO 35
#define GAS_DO 33
#define PH_PIN 32 

// ==========================================
// 3. KALIBRASI & KRITERIA (THRESHOLDS)
// ==========================================
const int WARNA_GRADE_A = 400;
const int WARNA_GRADE_B = 800;
const int BATAS_BAU = 2500;    
float calibration_value = 28.38; 
const float PH_MIN = 6.0;      
const float PH_MAX = 7.5; 

// ==========================================
// 4. FUNGSI BACA SENSOR
// ==========================================
int bacaWarna(bool s2, bool s3) {
  digitalWrite(S2, s2);
  digitalWrite(S3, s3);
  delay(20); 
  return pulseIn(COLOR_OUT, LOW);
}

float bacaPH() {
  unsigned long total = 0;
  for(int i=0; i<10; i++) {
    total += analogRead(PH_PIN);
    delay(10);
  }
  int adc = total / 10;
  float voltageESP = adc * (3.3 / 4095.0);
  float voltageAsli = voltageESP * 1.5; 
  float pH = -5.70 * voltageAsli + calibration_value;
  return pH;
}

// Fungsi untuk menentukan deskripsi warna
String getColorDescription(int avgWarna) {
  if (avgWarna <= WARNA_GRADE_A) {
    return "Putih Sempurna";
  } else if (avgWarna <= WARNA_GRADE_B) {
    return "Putih Kekuningan";
  } else {
    return "Berubah Warna/Gelap";
  }
}

// ==========================================
// 5. FUNGSI KIRIM DATA KE FIREBASE
// ==========================================
void sendToFirebase() {
  // Cek apakah Firebase ready
  if (!Firebase.ready()) {
    Serial.println("Firebase belum ready...");
    return;
  }
  
  if (!signupOK) {
    Serial.println("Firebase belum sign up...");
    return;
  }

  if (millis() - sendDataPrevMillis > SEND_INTERVAL || sendDataPrevMillis == 0) {
    sendDataPrevMillis = millis();
    
    // --- A. AMBIL DATA SENSOR ---
    Serial.println("\n--- Membaca sensor... ---");
    
    int red   = bacaWarna(LOW, LOW);
    int green = bacaWarna(HIGH, HIGH);
    int blue  = bacaWarna(LOW, HIGH);
    int gasAO = analogRead(GAS_AO);
    float pH  = bacaPH();
    int avgWarna = (red + green + blue) / 3;

    Serial.print("Red: "); Serial.println(red);
    Serial.print("Green: "); Serial.println(green);
    Serial.print("Blue: "); Serial.println(blue);
    Serial.print("Gas: "); Serial.println(gasAO);
    Serial.print("pH: "); Serial.println(pH);

    // --- B. FORMAT DATA ---
    String colorDesc = getColorDescription(avgWarna);
    String rgbString = String(red) + "," + String(green) + "," + String(blue);
    
    // --- C. KIRIM KE FIREBASE ---
    Serial.println("Mengirim ke Firebase...");
    
    // Buat JSON object
    FirebaseJson json;
    json.set("color", colorDesc);
    json.set("mq135", gasAO);
    json.set("pH", pH);
    json.set("rgb", rgbString);
    json.set("timestamp", (unsigned long)millis()); // Gunakan millis() sebagai timestamp
    
    // Push ke /readings
    if (Firebase.RTDB.pushJSON(&fbdo, "/readings", &json)) {
      Serial.println("=== DATA TERKIRIM KE FIREBASE ===");
      Serial.print("pH: "); Serial.println(pH);
      Serial.print("MQ-135 (Gas): "); Serial.println(gasAO);
      Serial.print("RGB: "); Serial.println(rgbString);
      Serial.print("Warna: "); Serial.println(colorDesc);
      Serial.print("Key: "); Serial.println(fbdo.pushName());
      Serial.println("=================================");
    } else {
      Serial.println("!!! GAGAL mengirim ke Firebase !!!");
      Serial.print("Alasan: ");
      Serial.println(fbdo.errorReason());
      Serial.print("HTTP Code: ");
      Serial.println(fbdo.httpCode());
    }
  }
}

// ==========================================
// 6. SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=============================");
  Serial.println("   GOAT MILK MONITOR v1.0");
  Serial.println("=============================\n");
  
  // Setup Sensor Pins
  pinMode(S0, OUTPUT); 
  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT); 
  pinMode(S3, OUTPUT);
  pinMode(COLOR_OUT, INPUT);
  digitalWrite(S0, HIGH); 
  digitalWrite(S1, LOW); 
  pinMode(GAS_AO, INPUT);
  pinMode(PH_PIN, INPUT);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  
  Serial.println("[1/3] Sensor pins configured");

  // Connect to WiFi
  Serial.println("[2/3] Connecting to WiFi...");
  Serial.print("      SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 30) { 
    delay(500); 
    Serial.print(".");
    wifiAttempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n      WiFi CONNECTED!");
    Serial.print("      IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n      WiFi FAILED! Check credentials.");
    Serial.println("      Continuing anyway...");
  }

  // Configure Firebase
  Serial.println("[3/3] Connecting to Firebase...");
  
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Set timeout (penting!)
  fbdo.setBSSLBufferSize(4096, 1024);
  fbdo.setResponseSize(2048);

  // Anonymous sign-in
  Serial.println("      Signing up anonymously...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("      Firebase Sign Up: OK!");
    signupOK = true;
  } else {
    Serial.println("      Firebase Sign Up: FAILED!");
    Serial.print("      Error: ");
    Serial.println(config.signer.signupError.message.c_str());
    Serial.println("\n      >>> Pastikan Anonymous Auth ENABLED di Firebase Console! <<<");
  }

  config.token_status_callback = tokenStatusCallback;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("\n=============================");
  Serial.println("   SETUP COMPLETE!");
  Serial.println("=============================");
  Serial.println("Sending data every 3 seconds...\n");
}

// ==========================================
// 7. LOOP
// ==========================================
void loop() {
  sendToFirebase();
  delay(100); // Small delay untuk stabilitas
}
