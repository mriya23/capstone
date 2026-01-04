import './style.css';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKTn5zBzy0w5iaiedXq150vK5eESW4dJc",
  authDomain: "goat-milk-monitor.firebaseapp.com",
  databaseURL: "https://goat-milk-monitor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "goat-milk-monitor",
  storageBucket: "goat-milk-monitor.firebasestorage.app",
  messagingSenderId: "782450512071",
  appId: "1:782450512071:web:02f757a206ac3cc3d6aee2",
  measurementId: "G-VYWBXL2GY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Thresholds (sesuaikan dengan kebutuhan)
const THRESHOLDS = {
  WARNA_GRADE_A: 400,
  WARNA_GRADE_B: 800,
  BATAS_BAU: 2500,
  PH_MIN: 6.0,
  PH_MAX: 7.5
};

// DOM Elements
const appElement = document.getElementById('app');

// Initial Loading State
appElement.innerHTML = `
  <div class="loading">
    <div class="loading__spinner"></div>
    <p class="loading__text">Menghubungkan ke sensor...</p>
  </div>
`;

// Parse RGB string to values
function parseRGB(rgbString) {
  if (!rgbString) return { red: 0, green: 0, blue: 0, avg: 0 };
  const parts = rgbString.split(',').map(s => parseInt(s.trim()));
  const red = parts[0] || 0;
  const green = parts[1] || 0;
  const blue = parts[2] || 0;
  const avg = Math.round((red + green + blue) / 3);
  return { red, green, blue, avg };
}

// Determine grade based on data
function calculateGrade(data) {
  const ph = data.pH || 0;
  const gas = data.mq135 || 0;
  const colorText = data.color || '';
  
  const phOK = (ph >= THRESHOLDS.PH_MIN && ph <= THRESHOLDS.PH_MAX);
  const gasOK = (gas < THRESHOLDS.BATAS_BAU);
  
  // Determine color status from text
  let statusWarna = 1; // Default: Cukup
  const colorLower = colorText.toLowerCase();
  
  if (colorLower.includes('putih') && !colorLower.includes('kuning')) {
    statusWarna = 2; // Putih Sempurna
  } else if (colorLower.includes('kuning') || colorLower.includes('pudar')) {
    statusWarna = 1; // Agak Pudar
  } else if (colorLower.includes('gelap') || colorLower.includes('coklat') || colorLower.includes('rusak')) {
    statusWarna = 0; // Buruk
  }

  let grade, status, penyebab;

  if (statusWarna >= 1 && phOK && gasOK) {
    if (statusWarna === 2) {
      grade = 'A';
      status = 'SUSU SEGAR (PREMIUM)';
      penyebab = 'Kualitas Terbaik. Sangat Segar.';
    } else {
      grade = 'B';
      status = 'SUSU CUKUP (GRADE B)';
      penyebab = 'Warna sedikit menurun, namun pH & bau masih aman.';
    }
  } else if (statusWarna === 0 && phOK && gasOK) {
    grade = 'C';
    status = 'WARNA TIDAK WAJAR';
    penyebab = 'pH normal, tapi warna terdeteksi gelap/berubah.';
  } else {
    grade = 'F';
    status = 'SUSU BASI / RUSAK';
    penyebab = 'Masalah: ';
    const issues = [];
    if (!phOK) issues.push('pH Buruk');
    if (statusWarna === 0) issues.push('Warna Rusak');
    if (!gasOK) issues.push('Bau Busuk');
    penyebab += issues.join(' + ');
  }

  return { grade, status, penyebab, phOK, gasOK, statusWarna };
}

// Render Dashboard
function renderDashboard(data) {
  if (!data) {
    renderNoData();
    return;
  }

  const rgb = parseRGB(data.rgb);
  const gradeInfo = calculateGrade(data);
  const gradeClass = getGradeClass(gradeInfo.grade);
  const statusIcon = getStatusIcon(gradeInfo.grade);
  
  appElement.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header__icon">🥛</div>
      <h1 class="header__title">Goat Milk Monitor</h1>
      <p class="header__subtitle">Sistem monitoring kualitas susu kambing secara real-time menggunakan sensor IoT</p>
    </header>

    <!-- Status Banner -->
    <section class="status-banner status-banner--${gradeClass}">
      <div class="status-banner__grade">${gradeInfo.grade || '-'}</div>
      <div class="status-banner__icon">${statusIcon}</div>
      <h2 class="status-banner__title">${gradeInfo.status || 'Menunggu Data...'}</h2>
      <span class="status-banner__reason">${gradeInfo.penyebab || 'Belum ada data dari sensor'}</span>
    </section>

    <!-- Sensor Grid -->
    <section class="sensor-grid">
      <!-- pH Sensor Card -->
      <article class="sensor-card sensor-card--ph">
        <div class="sensor-card__header">
          <div class="sensor-card__icon">🧪</div>
          <div class="sensor-card__status ${gradeInfo.phOK ? '' : 'sensor-card__status--danger'}"></div>
        </div>
        <p class="sensor-card__label">Sensor pH</p>
        <p class="sensor-card__value">${data.pH?.toFixed ? data.pH.toFixed(2) : data.pH || '--'}</p>
        <p class="sensor-card__subtext">${gradeInfo.phOK ? '✓ Normal (6.0 - 7.5)' : '✗ Tidak Normal'}</p>
      </article>

      <!-- Color Sensor Card -->
      <article class="sensor-card sensor-card--color">
        <div class="sensor-card__header">
          <div class="sensor-card__icon">🎨</div>
          <div class="sensor-card__status ${getColorStatusClass(gradeInfo.statusWarna)}"></div>
        </div>
        <p class="sensor-card__label">Kualitas Warna</p>
        <p class="sensor-card__value">${data.color || '--'}</p>
        <p class="sensor-card__subtext">RGB: ${data.rgb || '--'}</p>
      </article>

      <!-- Gas Sensor Card -->
      <article class="sensor-card sensor-card--gas">
        <div class="sensor-card__header">
          <div class="sensor-card__icon">💨</div>
          <div class="sensor-card__status ${gradeInfo.gasOK ? '' : 'sensor-card__status--danger'}"></div>
        </div>
        <p class="sensor-card__label">Sensor Gas MQ-135</p>
        <p class="sensor-card__value">${data.mq135 || '--'}<span class="sensor-card__unit"> ppm</span></p>
        <p class="sensor-card__subtext">${gradeInfo.gasOK ? '✓ Tidak Berbau' : '✗ Bau Terdeteksi'}</p>
      </article>
    </section>

    <!-- RGB Values -->
    <section class="sensor-grid">
      <article class="sensor-card" style="grid-column: 1 / -1;">
        <div class="sensor-card__header">
          <div class="sensor-card__icon" style="background: linear-gradient(135deg, #ef4444, #22c55e, #3b82f6);">RGB</div>
        </div>
        <p class="sensor-card__label">Detail Warna (Red, Green, Blue)</p>
        <div style="display: flex; gap: 2rem; margin-top: 0.5rem; flex-wrap: wrap;">
          <div>
            <span style="color: #ef4444; font-weight: 700; font-size: 1.5rem;">${rgb.red}</span>
            <span style="color: rgba(255,255,255,0.5); font-size: 0.75rem;"> RED</span>
          </div>
          <div>
            <span style="color: #22c55e; font-weight: 700; font-size: 1.5rem;">${rgb.green}</span>
            <span style="color: rgba(255,255,255,0.5); font-size: 0.75rem;"> GREEN</span>
          </div>
          <div>
            <span style="color: #3b82f6; font-weight: 700; font-size: 1.5rem;">${rgb.blue}</span>
            <span style="color: rgba(255,255,255,0.5); font-size: 0.75rem;"> BLUE</span>
          </div>
          <div style="margin-left: 1rem; padding-left: 1rem; border-left: 1px solid rgba(255,255,255,0.2);">
            <span style="color: #fff; font-weight: 700; font-size: 1.5rem;">${rgb.avg}</span>
            <span style="color: rgba(255,255,255,0.5); font-size: 0.75rem;"> AVG</span>
          </div>
        </div>
      </article>
    </section>

    <!-- Criteria Section -->
    <section class="criteria-section">
      <h3 class="criteria-section__title">KRITERIA WARNA SUSU</h3>
      <div class="criteria-grid">
        <div class="criteria-item">
          <span class="criteria-item__label">Grade A (Segar):</span>
          <span class="criteria-item__value">&lt; ${THRESHOLDS.WARNA_GRADE_A}</span>
        </div>
        <div class="criteria-item">
          <span class="criteria-item__label">Grade B (Cukup):</span>
          <span class="criteria-item__value">${THRESHOLDS.WARNA_GRADE_A} - ${THRESHOLDS.WARNA_GRADE_B}</span>
        </div>
        <div class="criteria-item">
          <span class="criteria-item__label">Grade C (Rusak):</span>
          <span class="criteria-item__value">&gt; ${THRESHOLDS.WARNA_GRADE_B}</span>
        </div>
      </div>
      
      <h3 class="criteria-section__title" style="margin-top: 1.5rem;">PARAMETER LAIN</h3>
      <div class="criteria-grid">
        <div class="criteria-item">
          <span class="criteria-item__label">pH Normal:</span>
          <span class="criteria-item__value">${THRESHOLDS.PH_MIN} - ${THRESHOLDS.PH_MAX}</span>
        </div>
        <div class="criteria-item">
          <span class="criteria-item__label">Udara (Bau):</span>
          <span class="criteria-item__value">&lt; ${THRESHOLDS.BATAS_BAU}</span>
        </div>
      </div>

      <!-- Last Update -->
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
          <span style="font-size: 1.25rem;">🕐</span>
          <div style="text-align: center;">
            <p style="font-size: 0.7rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem;">Last Update</p>
            <p style="font-size: 1rem; font-weight: 600; color: #667eea;" id="last-update">${new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>🥛 Goat Milk Monitor &copy; 2026 | Powered by <a href="https://firebase.google.com" target="_blank" class="footer__link">Firebase</a></p>
      <p style="margin-top: 0.5rem;">Real-time IoT Monitoring System</p>
    </footer>

    <!-- Connection Status -->
    <div class="connection-status" id="connection-status">
      <div class="connection-status__dot"></div>
      <span>Terhubung ke Firebase</span>
    </div>
  `;
}

function renderNoData() {
  appElement.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header__icon">🥛</div>
      <h1 class="header__title">Goat Milk Monitor</h1>
      <p class="header__subtitle">Sistem monitoring kualitas susu kambing secara real-time menggunakan sensor IoT</p>
    </header>

    <!-- Status Banner -->
    <section class="status-banner">
      <div class="status-banner__icon">📡</div>
      <h2 class="status-banner__title">Menunggu Data Sensor...</h2>
      <span class="status-banner__reason">Pastikan ESP32 terhubung dan mengirim data ke Firebase</span>
    </section>

    <!-- Loading Cards -->
    <section class="sensor-grid">
      <article class="sensor-card sensor-card--ph">
        <div class="sensor-card__header">
          <div class="sensor-card__icon">🧪</div>
          <div class="sensor-card__status sensor-card__status--warning"></div>
        </div>
        <p class="sensor-card__label">Sensor pH</p>
        <div class="skeleton skeleton--value"></div>
      </article>
      
      <article class="sensor-card sensor-card--color">
        <div class="sensor-card__header">
          <div class="sensor-card__icon">🎨</div>
          <div class="sensor-card__status sensor-card__status--warning"></div>
        </div>
        <p class="sensor-card__label">Kualitas Warna</p>
        <div class="skeleton skeleton--value"></div>
      </article>
      
      <article class="sensor-card sensor-card--gas">
        <div class="sensor-card__header">
          <div class="sensor-card__icon">💨</div>
          <div class="sensor-card__status sensor-card__status--warning"></div>
        </div>
        <p class="sensor-card__label">Sensor Gas MQ-135</p>
        <div class="skeleton skeleton--value"></div>
      </article>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>🥛 Goat Milk Monitor &copy; 2026 | Powered by <a href="https://firebase.google.com" target="_blank" class="footer__link">Firebase</a></p>
    </footer>

    <!-- Connection Status -->
    <div class="connection-status" id="connection-status">
      <div class="connection-status__dot connection-status__dot--disconnected"></div>
      <span>Menunggu data...</span>
    </div>
  `;
}

// Helper Functions
function getGradeClass(grade) {
  switch(grade) {
    case 'A': return 'grade-a';
    case 'B': return 'grade-b';
    case 'C': return 'grade-c';
    case 'F': return 'grade-f';
    default: return '';
  }
}

function getStatusIcon(grade) {
  switch(grade) {
    case 'A': return '🥛✨';
    case 'B': return '🥛';
    case 'C': return '🎨';
    case 'F': return '⚠️';
    default: return '📡';
  }
}

function getColorStatusClass(statusWarna) {
  switch(statusWarna) {
    case 2: return ''; // Green (OK)
    case 1: return 'sensor-card__status--warning'; // Yellow
    case 0: return 'sensor-card__status--danger'; // Red
    default: return 'sensor-card__status--warning';
  }
}

function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) { // Less than 1 minute
    return `${Math.floor(diff / 1000)}s ago`;
  } else if (diff < 3600000) { // Less than 1 hour
    return `${Math.floor(diff / 60000)}m ago`;
  } else {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
}

// Firebase Realtime Listener - Listen to 'readings' node
// Listen to the entire node and get the latest entry
const readingsRef = ref(database, 'readings');

onValue(readingsRef, (snapshot) => {
  const allData = snapshot.val();
  console.log('📡 Firebase update received!');
  
  if (allData) {
    // Get all keys and sort them - Firebase push keys are chronological!
    const keys = Object.keys(allData).sort();
    
    // The LAST key is the newest entry (Firebase keys are sorted chronologically)
    const newestKey = keys[keys.length - 1];
    const latestData = allData[newestKey];
    
    console.log('✅ Latest reading:', latestData);
    console.log('🔑 Key:', newestKey);
    console.log('📊 Total entries:', keys.length);
    renderDashboard(latestData);
    
    // Update connection status to show we're connected
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="connection-status__dot"></div>
        <span>🟢 Live - Terhubung (${keys.length} data)</span>
      `;
    }
  } else {
    renderNoData();
  }
}, (error) => {
  console.error('❌ Firebase error:', error);
  renderNoData();
  
  // Update connection status
  const statusEl = document.getElementById('connection-status');
  if (statusEl) {
    statusEl.innerHTML = `
      <div class="connection-status__dot connection-status__dot--disconnected"></div>
      <span>Koneksi terputus</span>
    `;
  }
});

// Console log for debugging
console.log('🥛 Goat Milk Monitor initialized');
console.log('📡 Listening to Firebase:', firebaseConfig.databaseURL);
console.log('📂 Reading from: /readings (latest entry)');
