// auth.js

const signInBtn = document.getElementById("googleSignIn");
const userStatus = document.getElementById("userStatus");

signInBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => alert("❌ " + err.message));
});

auth.onAuthStateChanged(user => {
  if (user) {
    userStatus.textContent = `Signed in as ${user.displayName || user.email}`;
  } else {
    userStatus.textContent = "Not signed in";
  }
});
sss