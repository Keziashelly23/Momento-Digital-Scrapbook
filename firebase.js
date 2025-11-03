// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMK3YVY8G159USlVmOT6oEZOzAhkQ27f8",
  authDomain: "scrapbookapp-18607.firebaseapp.com",
  projectId: "scrapbookapp-18607",
  storageBucket: "scrapbookapp-18607.firebasestorage.app",
  messagingSenderId: "667662870843",
  appId: "1:667662870843:web:66c2c87051cdecf84f6f1e",
  measurementId: "G-TQKC9FX2T6"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
