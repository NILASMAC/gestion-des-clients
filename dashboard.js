import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, 
  query, where, updateDoc, doc, deleteDoc, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyB5yhL17Vkyen4LAYCGkTofI8sC5m2c6TQ",
  authDomain: "gestion-clients-pro.firebaseapp.com",
  projectId: "gestion-clients-pro",
  storageBucket: "gestion-clients-pro.firebasestorage.app",
  messagingSenderId: "1097093078000",
  appId: "1:1097093078000:web:bc62af7f039e20d9a11b35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- SECURITÉ ET DÉCONNEXION ---
onAuthStateChanged(auth, (user) => { if (!user) window.location.href = "index.html"; });
window.logout = () => { signOut(auth).then(() => window.location.href = "index.html"); };

// ==========================================
// 1. CALCULS STATISTIQUES (KPI)
// ==========================================
async function mettreAJourStats() {
    const snapCmd = await getDocs(collection(db, "commandes"));
    const snapClient = await getDocs(collection(db, "clients"));
    
    let totalCA = 0;
    let nbLivre = 0;
    let ages = [];
    let clientsFideles = 0;

    snapCmd.forEach(d => {
        const data = d.data();
        totalCA += data.montant || 0;
        if (data.statut === "Livré") nbLivre++;
    });

    snapClient.forEach(d => {
        const data = d.data();
        if (data.dateNaissance) {
            const age = new Date().getFullYear() - new Date(data.dateNaissance).getFullYear();
            ages.push(age);
        }
        if (data.nbCommandes > 1) clientsFideles++;
    });

    ages.sort((a, b) => a - b);
    const mediane = ages.length === 0 ? 0 : ages[Math.floor(ages.length / 2)];
    const retention = snapClient.size === 0 ? 0 : ((clientsFideles / snapClient.size) * 100).toFixed(0);

    document.getElementById("stats").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="stat-box" style="background:#e3f2fd; padding:10px; border-radius:8px;">💰 CA: <b>${totalCA.toLocaleString()}</b></div>
            <div class="stat-box" style="background:#f1f8e9; padding:10px; border-radius:8px;">📦 Livrés: <b>${nbLivre}</b></div>
        </div>
    `;

    document.getElementById("extraStats").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top:10px;">
            <div class="stat-box" style="background:#fff3e0; padding:10px; border-radius:8px;">🎂 Âge Médian: <b>${mediane} ans</b></div>
            <div class="stat-box" style="background:#f3e5f5; padding:10px; border-radius:8px;">🔄 Rétention: <b>${retention}%</b></div>
        </div>
    `;
}

// ==========================================
// 2. ENREGISTREMENT ET CRM
// ==========================================
const form = document.getElementById("formCommande");
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const tel = document.getElementById("telephone").value;
    const nom = document.getElementById("nom").value;
    const montant = parseFloat(document.getElementById("montant").value);

    const dataCommande = {
        nom, telephone: tel,
        quartier: document.getElementById("quartier").value,
        typeLavage: document.getElementById("typeLavage").value,
        dateEntree: document.getElementById("dateEntree").value,
        dateRetrait: document.getElementById("dateRetrait").value,
        kilos: document.getElementById("kilos").value,
        typeArticles: document.getElementById("articles").value,
        montant,
        canalAcquisition: document.getElementById("canalAcquisition").value,
        statut: "En cours",
        dateAjout: new Date()
    };

    try {
        await addDoc(collection(db, "commandes"), dataCommande);

        // Gestion du profil client (Segmentation)
        const q = query(collection(db, "clients"), where("telephone", "==", tel));
        const snap = await getDocs(q);

        if (snap.empty) {
            await addDoc(collection(db, "clients"), {
                nom, telephone: tel,
                dateNaissance: document.getElementById("dateNaissance").value,
                nbCommandes: 1,
                totalDepense: montant,
                lastVisite: new Date(),
                segment: "Prospect"
            });
        } else {
            const clientDoc = snap.docs[0];
            const d = clientDoc.data();
            const nNb = d.nbCommandes + 1;
            const segment = nNb >= 3 ? "Régulier" : "Occasionnel";
            
            if (nNb % 10 === 0) alert("⭐ CLIENT VIP : 10ème commande ! Offrez une réduction.");

            await updateDoc(doc(db, "clients", clientDoc.id), {
                nbCommandes: nNb,
                totalDepense: d.totalDepense + montant,
                segment,
                lastVisite: new Date()
            });
        }

        form.reset();
        await chargerTout();
    } catch (err) { alert("Erreur : " + err.message); }
});

// ==========================================
// 3. ACTIONS (LIVRAISON, RELANCE, WHATSAPP)
// ==========================================
window.actionLivre = async (id) => {
    if(confirm("Confirmer la livraison ?")) {
        await updateDoc(doc(db, "commandes", id), { statut: "Livré" });
        await chargerTout();
    }
};

window.actionWA = async (id) => {
    // Ici on simule l'envoi WhatsApp avec les données de la commande
    alert("Ouverture de WhatsApp pour l'envoi du ticket...");
};

window.relancerInactifs = async () => {
    const snap = await getDocs(collection(db, "clients"));
    const deuxSemaines = 14 * 24 * 60 * 60 * 1000;
    let relancesCount = 0;

    snap.forEach(d => {
        const c = d.data();
        const diff = new Date() - c.lastVisite.toDate();
        if (diff > deuxSemaines) {
            const msg = `Bonjour ${c.nom}, votre pressing vous manque ? Profitez de -10% sur votre prochaine commande !`;
            window.open(`https://wa.me/${c.telephone}?text=${encodeURIComponent(msg)}`, '_blank');
            relancesCount++;
        }
    });
    if(relancesCount === 0) alert("Tous vos clients sont venus récemment ! ✨");
};

// ==========================================
// 4. CHARGEMENT DES DONNÉES
// ==========================================
async function chargerCommandes() {
    const snap = await getDocs(query(collection(db, "commandes"), orderBy("dateAjout", "desc")));
    const tbody = document.getElementById("listeCommandes");
    tbody.innerHTML = "";

    snap.forEach(d => {
        const cmd = d.data();
        const isLivre = cmd.statut === "Livré";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><b>${cmd.nom}</b><br><small style="color:#777">${cmd.canalAcquisition}</small></td>
            <td>${cmd.montant.toLocaleString()}</td>
            <td style="color: ${isLivre ? '#4CAF50' : '#FF9800'}; font-weight:bold;">${cmd.statut}</td>
            <td>
                <button onclick="actionWA('${d.id}')" style="background:#25D366; border:none; color:white; padding:5px 8px; border-radius:4px;">WA</button>
                <button onclick="actionLivre('${d.id}')" style="background:#2196F3; border:none; color:white; padding:5px 8px; border-radius:4px;" ${isLivre ? 'disabled' : ''}>L</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function chargerTout() {
    await chargerCommandes();
    await mettreAJourStats();
}

chargerTout();