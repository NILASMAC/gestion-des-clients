import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, 
  query, where, updateDoc, doc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// --- AUTHENTIFICATION ---
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
});

window.logout = function() {
  signOut(auth).then(() => window.location.href = "index.html");
};

// ==========================================
// FONCTION PDF (Design Pro Ticket de Caisse)
// ==========================================
function genererFacturePDF(commande) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 160] // Format étroit style reçu
  });

  // Bordure bleue élégante
  doc.setDrawColor(33, 150, 243);
  doc.setLineWidth(0.8);
  doc.rect(2, 2, 76, 156); 

  // En-tête
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(33, 150, 243);
  doc.text("MON PRESSING PRO", 40, 12, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Reçu  Officiel", 40, 18, { align: "center" });
  doc.line(10, 21, 70, 21);

  // Contenu
  doc.setTextColor(0);
  doc.setFontSize(10);
  let y = 30;
  const x = 8;
  const s = 7;

  const row = (label, val) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${val}`, 32, y);
    y += s;
  };

  row("Client", commande.nom);
  row("Téléphone", commande.telephone);
  row("Quartier", commande.quartier);
  row("Service", commande.typeLavage);
  row("Dépôt", commande.dateEntree);
  row("Retrait", commande.dateRetrait);
  row("Poids", `${commande.kilos} Kg`);

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Articles détaillés:", x, y);
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const textSplit = doc.splitTextToSize(commande.typeArticles, 65);
  doc.text(textSplit, x, y);
  
  y += (textSplit.length * 4) + 5;

  // Zone Montant
  doc.setFillColor(33, 150, 243);
  doc.rect(5, y, 70, 10, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: ${commande.montant} FCFA`, 40, y + 7, { align: "center" });

  // Pied de page
  doc.setTextColor(150);
  doc.setFontSize(7);
  doc.text("Conservez ce reçu pour le retrait.", 40, 152, { align: "center" });

  doc.save(`Recu_${commande.nom}.pdf`);
}

// ==========================================
// FONCTION WHATSAPP (Message Ultra-Détaillé)
// ==========================================
async function envoyerWhatsAppAvecPDF(commande) {
  // 1. Télécharge le PDF sur l'appareil
  genererFacturePDF(commande);

  // 2. Formate le numéro
  let tel = commande.telephone.replace(/\s+/g, '').replace(/[+]/g, '');
  if (tel.length === 9) tel = "237" + tel;

  // 3. Message complet pour compenser l'envoi manuel du fichier
  const msg = 
    `✨ *MON PRESSING PRO - REÇU NUMÉRIQUE* ✨%0A` +
    `--------------------------------------------%0A` +
    `👤 *CLIENT :* ${commande.nom.toUpperCase()}%0A` +
    `📞 *TÉL :* ${commande.telephone}%0A` +
    `🏠 *QUARTIER :* ${commande.quartier}%0A` +
    `--------------------------------------------%0A` +
    `🧼 *SERVICE :* ${commande.typeLavage}%0A` +
    `🧥 *ARTICLES :* ${commande.typeArticles}%0A` +
    `⚖️ *POIDS :* ${commande.kilos} Kg%0A` +
    `--------------------------------------------%0A` +
    `📥 *DÉPÔT :* ${commande.dateEntree}%0A` +
    `📅 *RETRAIT PRÉVU :* ${commande.dateRetrait}%0A` +
    `--------------------------------------------%0A` +
    `💰 *TOTAL À PAYER :* *${commande.montant.toLocaleString()} FCFA*%0A` +
    `--------------------------------------------%0A` +
    `🙏 _Merci de votre confiance ! ` +
    `📌 _Veuillez présenter ce message lors du retrait._`;

  // 4. Ouvre WhatsApp après un court délai
  setTimeout(() => {
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  }, 1000); 
}

// ==========================================
// STATISTIQUES AUTOMATIQUES
// ==========================================
async function mettreAJourStats() {
  const snap = await getDocs(collection(db, "commandes"));
  let totalCA = 0;
  let nbCmd = snap.size;
  let nbLivre = 0;

  snap.forEach(d => {
    const data = d.data();
    totalCA += data.montant;
    if (data.statut === "Livré") nbLivre++;
  });

  const statsDiv = document.getElementById("stats");
  if (statsDiv) {
    statsDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: center;">
        <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; border-left: 5px solid #2196f3;">
          <small style="color: #666;">Chiffre d'Affaires</small><br>
          <strong style="font-size: 1.3em; color: #1565c0;">${totalCA.toLocaleString()} FCFA</strong>
        </div>
        <div style="background: #f1f8e9; padding: 15px; border-radius: 10px; border-left: 5px solid #4caf50;">
          <small style="color: #666;">Commandes Livrées</small><br>
          <strong style="font-size: 1.3em; color: #2e7d32;">${nbLivre} / ${nbCmd}</strong>
        </div>
      </div>
    `;
  }
}

// ==========================================
// GESTION DES COMMANDES
// ==========================================
const form = document.getElementById("formCommande");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    nom: document.getElementById("nom").value,
    telephone: document.getElementById("telephone").value,
    quartier: document.getElementById("quartier").value,
    typeLavage: document.getElementById("typeLavage").value, // Doit être un <select> dans HTML
    dateEntree: document.getElementById("dateEntree").value,
    dateRetrait: document.getElementById("dateRetrait").value,
    kilos: document.getElementById("kilos").value,
    typeArticles: document.getElementById("articles").value,
    montant: parseFloat(document.getElementById("montant").value)
  };

  try {
    await addDoc(collection(db, "commandes"), {
      ...data,
      statut: "En cours",
      dateAjout: new Date()
    });
    form.reset();
    await chargerTout();
  } catch (err) { alert("Erreur : " + err.message); }
});

async function chargerCommandes() {
  const snap = await getDocs(collection(db, "commandes"));
  const tbody = document.getElementById("listeCommandes");
  tbody.innerHTML = "";

  snap.forEach(d => {
    const cmd = d.data();
    const id = d.id;
    const row = document.createElement("tr");
    const isLivre = cmd.statut === "Livré";

    row.innerHTML = `
      <td>${cmd.nom}</td>
      <td>${cmd.montant.toLocaleString()}</td>
      <td style="color: ${isLivre ? '#4CAF50' : '#FF9800'}; font-weight: bold;">${cmd.statut}</td>
      <td>
        <button class="wa-pdf-btn" style="background:#25D366; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">PDF + WA</button>
        <button class="livre-btn" style="background:#2196F3; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;" ${isLivre ? 'disabled' : ''}>LIVRÉ</button>
        <button class="del-btn" style="background:#f44336; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">X</button>
      </td>
    `;

    row.querySelector(".wa-pdf-btn").onclick = () => envoyerWhatsAppAvecPDF(cmd);
    
    row.querySelector(".livre-btn").onclick = async () => {
      if(confirm("Valider la livraison ?")) {
        await updateDoc(doc(db, "commandes", id), { statut: "Livré" });
        await chargerTout();
      }
    };

    row.querySelector(".del-btn").onclick = async () => {
      if(confirm("Supprimer cette commande ?")) {
        await deleteDoc(doc(db, "commandes", id));
        await chargerTout();
      }
    };
    tbody.appendChild(row);
  });
}

// --- INITIALISATION ---
async function chargerTout() {
  await chargerCommandes();
  await mettreAJourStats();
}

chargerTout();