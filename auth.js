import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB5yhL17Vkyen4LAYCGkTofI8sC5m2c6TQ",
    authDomain: "gestion-clients-pro.firebaseapp.com",
    projectId: "gestion-clients-pro",
    storageBucket: "gestion-clients-pro.firebasestorage.app",
    messagingSenderId: "1097093078000",
    appId: "1:1097093078000:web:bc62af7f039e20d9a11b35"
  };
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginForm").addEventListener("submit", (e) => {
e.preventDefault();

signInWithEmailAndPassword(auth, email.value, password.value)
.then(() => {
window.location.href = "dashboard.html";
})
.catch(() => {
alert("Erreur de connexion");
});
});

// Exemple de ce qu'il faut mettre dans ton auth.js
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    window.location.href = "dashboard.html";
  })
  .catch((error) => {
    // Affiche le message d'erreur en rouge
    document.getElementById('authError').style.display = 'block';
  });