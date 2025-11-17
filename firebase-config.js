// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyBMK3YVY8G159USlVmOT6oEZOzAhkQ27f8",
  authDomain: "scrapbookapp-18607.firebaseapp.com",
  projectId: "scrapbookapp-18607",
  storageBucket: "scrapbookapp-18607.appspot.com"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
