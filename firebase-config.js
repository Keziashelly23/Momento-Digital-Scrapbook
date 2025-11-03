// Firebase initialization (compat build) and helper for Firestore
// 1) Create a Firebase project and copy your config here.
// 2) Replace the placeholder values below with your actual project config.

(function(){
  if (window.firebaseConfigLoaded) return;

  // Add the compat SDKs via script tags dynamically so pages don't need module loads
  function loadScript(src, onload) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    s.onerror = function() { console.error('Failed to load', src); };
    document.head.appendChild(s);
  }

  // Load compat SDKs (firebase-app-compat and firestore-compat)
  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', () => {
    loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js', initFirebase);
  });

  function initFirebase() {
    // Firebase project configuration — updated from user input
    // NOTE: storageBucket should end with .appspot.com
    const firebaseConfig = {
      apiKey: "AIzaSyBMK3YVY8G159USlVmOT6oEZOzAhkQ27f8",
      authDomain: "scrapbookapp-18607.firebaseapp.com",
      projectId: "scrapbookapp-18607",
      storageBucket: "scrapbookapp-18607.appspot.com",
      messagingSenderId: "667662870843",
      appId: "1:667662870843:web:66c2c87051cdecf84f6f1e",
      measurementId: "G-TQKC9FX2T6"
    };

    if (!window.firebase) {
      console.error('Firebase SDK not available');
      return;
    }

    try {
      firebase.initializeApp(firebaseConfig);
      window.db = firebase.firestore();
      window.firebaseConfigLoaded = true;
      console.log('Firebase initialized (compat).');
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
    }
  }
})();

// Helper functions (optional): get/set journals using users/{userId}.doc -> { journals: [...] }
async function fetchJournalsForUser(userId) {
  if (!window.db) throw new Error('Firestore not initialized');
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  return (snap.exists && snap.data().journals) ? snap.data().journals : [];
}

async function saveJournalsForUser(userId, journals) {
  if (!window.db) throw new Error('Firestore not initialized');
  const ref = db.collection('users').doc(userId);
  await ref.set({ journals: journals });
}
