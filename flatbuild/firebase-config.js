/* ============================================================
   ME-RIISE QUIZ — Firebase configuration
   ------------------------------------------------------------
   NOTE: This project uses the Firebase *compat* SDK loaded via
   <script> tags (no bundler / no import statements). So we only
   need the config values below — NOT the "import { initializeApp }"
   snippet the console shows by default.

   1) Web app config values → pasted below.
   2) Realtime Database URL → paste into databaseURL (Phase 3).
   3) Enable Authentication → Email/Password + add admin user.
   4) Deploy rules from firebase-rules.json.
   ============================================================ */
window.MR = window.MR || {};

MR.firebaseConfig = {
  apiKey:            "AIzaSyAHI4mNG_yqmZDbqyjCoR0fjtAu41iOuus",
  authDomain:        "meriise-quiz.firebaseapp.com",
  databaseURL:       "https://meriise-quiz-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "meriise-quiz",
  storageBucket:     "meriise-quiz.firebasestorage.app",
  messagingSenderId: "419026474359",
  appId:             "1:419026474359:web:cb0d642cf4889b705bbd72",
  measurementId:     "G-XJ36W26NZS"
};

// Optional: Google Apps Script Web App URL for pushing results to Google Sheets.
// Deploy apps-script/Code.gs as a Web App ("Anyone") and paste the /exec URL here.
MR.SHEETS_WEBHOOK = "";

// Detect whether real Firebase credentials AND a database URL have been supplied.
// Until the databaseURL is filled in (Phase 3), the app safely stays in local demo mode.
MR.isConfigured =
  !String(MR.firebaseConfig.apiKey).includes("PASTE") &&
  !!MR.firebaseConfig.databaseURL &&
  !String(MR.firebaseConfig.databaseURL).includes("PASTE");

MR.initFirebase = function () {
  if (!MR.isConfigured) {
    console.warn("[ME-RIISE] Firebase not fully configured — running in local DEMO mode.");
    return false;
  }
  if (!firebase.apps.length) firebase.initializeApp(MR.firebaseConfig);
  MR.db = firebase.database();
  // Auth is created lazily (only the Admin page needs it) so Host/Student pages
  // never fail if Authentication isn't enabled yet.
  return true;
};
