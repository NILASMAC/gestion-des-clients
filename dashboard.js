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
// ÉTAT GLOBAL DES SERVICES SÉLECTIONNÉS
// ==========================================
let servicesSelectionnes = {};

// ==========================================
// GESTION DES CARTES DE SERVICES
// ==========================================
function initialiserServices() {
  const cartes = document.querySelectorAll('.service-card');
  
  cartes.forEach(carte => {
    carte.addEventListener('click', function(e) {
      // Ne pas déclencher si on clique sur un input
      if (e.target.tagName === 'INPUT') return;
      
      const serviceId = this.dataset.service;
      const type = this.dataset.type;
      
      // Toggle de la sélection
      if (this.classList.contains('selected')) {
        // Désélectionner
        this.classList.remove('selected');
        delete servicesSelectionnes[serviceId];
        
        // Cacher l'input kg si existe
        const kgInput = this.querySelector('.service-kg-input');
        if (kgInput) {
          kgInput.style.display = 'none';
          const input = kgInput.querySelector('input');
          if (input) input.value = '';
        }
      } else {
        // Sélectionner
        this.classList.add('selected');
        servicesSelectionnes[serviceId] = {
          id: serviceId,
          nom: this.querySelector('.service-name').textContent,
          prixUnitaire: parseFloat(this.dataset.prix),
          type: type,
          quantite: type === 'kg' ? 0 : 1,
          prixCalcule: type === 'kg' ? 0 : parseFloat(this.dataset.prix)
        };
        
        // Afficher l'input kg si nécessaire
        if (type === 'kg') {
          const kgInput = this.querySelector('.service-kg-input');
          if (kgInput) {
            kgInput.style.display = 'block';
            // Focus sur l'input
            setTimeout(() => {
              kgInput.querySelector('input').focus();
            }, 100);
          }
        }
      }
      
      // Mettre à jour le récapitulatif
      mettreAJourRecap();
    });
    
    // Gestion des inputs de kilos
    const kgInput = carte.querySelector('.kg-input');
    if (kgInput) {
      kgInput.addEventListener('input', function(e) {
        e.stopPropagation();
        const serviceId = this.dataset.service;
        const valeur = parseFloat(this.value) || 0;
        
        if (servicesSelectionnes[serviceId]) {
          servicesSelectionnes[serviceId].quantite = valeur;
          servicesSelectionnes[serviceId].prixCalcule = 
            servicesSelectionnes[serviceId].prixUnitaire * valeur;
        }
        
        mettreAJourRecap();
      });
      
      // Empêcher la propagation du clic sur l'input
      kgInput.addEventListener('click', (e) => e.stopPropagation());
    }
  });
}

// ==========================================
// MISE À JOUR DU RÉCAPITULATIF
// ==========================================
function mettreAJourRecap() {
  const recapContainer = document.getElementById('recapContainer');
  const recapList = document.getElementById('recapList');
  const recapTotal = document.getElementById('recapTotal');
  const submitBtn = document.getElementById('submitBtn');
  const montantInput = document.getElementById('montant');
  
  let total = 0;
  let servicesValides = 0;
  let html = '';
  
  // Vérifier chaque service sélectionné
  Object.values(servicesSelectionnes).forEach(service => {
    if (service.type === 'kg' && service.quantite <= 0) {
      // Service au kg sans quantité valide
      html += `
        <div class="recap-item" style="border-left-color: #f44336;">
          <span class="recap-item-name">${service.nom}</span>
          <span class="recap-item-price" style="color: #f44336;">
            ⚠️ Saisir les kilos
          </span>
        </div>
      `;
    } else {
      // Service valide
      total += service.prixCalcule;
      servicesValides++;
      html += `
        <div class="recap-item">
          <span class="recap-item-name">${service.nom}</span>
          <span class="recap-item-price">${service.prixCalcule.toLocaleString()} FCFA</span>
        </div>
      `;
    }
  });
  
  // Afficher ou masquer le récapitulatif
  if (Object.keys(servicesSelectionnes).length > 0) {
    recapContainer.style.display = 'block';
    recapList.innerHTML = html;
    recapTotal.querySelector('span:last-child').textContent = total.toLocaleString() + ' FCFA';
    montantInput.value = total;
    
    // Activer/désactiver le bouton submit
    submitBtn.disabled = servicesValides !== Object.keys(servicesSelectionnes).length;
  } else {
    recapContainer.style.display = 'none';
    submitBtn.disabled = true;
  }
}

// ==========================================
// FONCTION PDF (Design Pro Ticket de Caisse)
// ==========================================
function genererFacturePDF(commande) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200]
  });

  doc.setDrawColor(33, 150, 243);
  doc.setLineWidth(0.8);
  doc.rect(2, 2, 76, 196);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(33, 150, 243);
  doc.text("PRESSING PRO", 40, 12, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Reçu Officiel", 40, 18, { align: "center" });
  doc.line(10, 21, 70, 21);

  doc.setTextColor(0);
  doc.setFontSize(9);
  let y = 30;
  const x = 8;
  const s = 6;

  const row = (label, val) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, y);
    doc.setFont("helvetica", "normal");
    let valeur = val || "Non spécifié";
    if (valeur.length > 25) valeur = valeur.substring(0, 22) + "...";
    doc.text(`${valeur}`, 32, y);
    y += s;
  };

  // Informations client
  row("Client", commande.nom);
  row("Téléphone", commande.telephone);
  row("Quartier", commande.quartier);
  
  y += 2;
  doc.line(8, y-1, 72, y-1);
  y += 3;
  
  // Services
  doc.setFont("helvetica", "bold");
  doc.text("Services:", x, y);
  y += s;
  doc.setFont("helvetica", "normal");
  
  if (commande.services && commande.services.length > 0) {
    commande.services.forEach(service => {
      const ligne = `${service.nom}: ${service.prixCalcule.toLocaleString()} FCFA`;
      doc.text(ligne, x + 2, y);
      y += 5;
    });
  } else {
    doc.text(commande.typeLavage || "Non spécifié", x + 2, y);
    y += 5;
  }
  
  y += 2;
  
  // Articles
  if (commande.typeArticles) {
    doc.setFont("helvetica", "bold");
    doc.text("Articles:", x, y);
    y += s;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    const articles = doc.splitTextToSize(commande.typeArticles, 65);
    doc.text(articles, x + 2, y);
    y += (articles.length * 4) + 5;
  }

  // Zone Montant
  doc.setFillColor(33, 150, 243);
  doc.rect(5, y, 70, 10, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: ${commande.montant.toLocaleString()} FCFA`, 40, y + 7, { align: "center" });

  y += 15;
  
  doc.setTextColor(150);
  doc.setFontSize(6);
  doc.text("Conservez ce reçu pour le retrait.", 40, y, { align: "center" });
  doc.text("Merci de votre confiance !", 40, y + 3, { align: "center" });

  doc.save(`Recu_${commande.nom}_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ==========================================
// FONCTION WHATSAPP
// ==========================================
async function envoyerWhatsAppAvecPDF(commande) {
  genererFacturePDF(commande);

  let tel = commande.telephone.replace(/\s+/g, '').replace(/[+]/g, '');
  if (tel.length === 9) tel = "237" + tel;

  // Construire la liste des services
  let servicesTexte = '';
  if (commande.services && commande.services.length > 0) {
    servicesTexte = commande.services.map(s => 
      `• ${s.nom}: ${s.prixCalcule.toLocaleString()} FCFA`
    ).join('%0A');
  } else {
    servicesTexte = `• ${commande.typeLavage}`;
  }

  const msg = 
    `✨ *PRESSING PRO - REÇU NUMÉRIQUE* ✨%0A` +
    `════════════════════════════════%0A` +
    `👤 *CLIENT :* ${commande.nom.toUpperCase()}%0A` +
    `📞 *TÉL :* ${commande.telephone}%0A` +
    `🏠 *QUARTIER :* ${commande.quartier}%0A` +
    `════════════════════════════════%0A` +
    `🧼 *SERVICES :*%0A${servicesTexte}%0A` +
    `════════════════════════════════%0A` +
    `💰 *TOTAL :* *${commande.montant.toLocaleString()} FCFA*%0A` +
    `════════════════════════════════%0A` +
    `🙏 _Merci de votre confiance !_`;

  setTimeout(() => {
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  }, 1000); 
}

// ==========================================
// STATISTIQUES
// ==========================================
async function mettreAJourStats() {
  const snap = await getDocs(collection(db, "commandes"));
  let totalCA = 0;
  let nbCmd = snap.size;
  let nbLivre = 0;
  let totalKilos = 0;

  snap.forEach(d => {
    const data = d.data();
    totalCA += data.montant || 0;
    if (data.statut === "Livré") nbLivre++;
    
    // Calculer le total des kilos si présents
    if (data.services) {
      data.services.forEach(s => {
        if (s.type === 'kg') totalKilos += s.quantite || 0;
      });
    }
  });

  const statsDiv = document.getElementById("stats");
  if (statsDiv) {
    statsDiv.innerHTML = `
      <div class="stat-card" style="background: #e3f2fd; border-left: 5px solid #2196f3;">
        <small style="color: #666;">Chiffre d'Affaires</small><br>
        <strong style="font-size: 1.3em; color: #1565c0;">${totalCA.toLocaleString()} FCFA</strong>
      </div>
      <div class="stat-card" style="background: #f1f8e9; border-left: 5px solid #4caf50;">
        <small style="color: #666;">Commandes Livrées</small><br>
        <strong style="font-size: 1.3em; color: #2e7d32;">${nbLivre} / ${nbCmd}</strong>
      </div>
      <div class="stat-card" style="background: #fff3e0; border-left: 5px solid #ff9800;">
        <small style="color: #666;">Total Kilos</small><br>
        <strong style="font-size: 1.3em; color: #ed6c02;">${totalKilos.toFixed(1)} Kg</strong>
      </div>
      <div class="stat-card" style="background: #fce4ec; border-left: 5px solid #e91e63;">
        <small style="color: #666;">Taux de livraison</small><br>
        <strong style="font-size: 1.3em; color: #c2185b;">${nbCmd ? ((nbLivre/nbCmd)*100).toFixed(1) : 0}%</strong>
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
  
  // Récupérer les services sélectionnés
  const servicesListe = Object.values(servicesSelectionnes).filter(s => 
    !(s.type === 'kg' && s.quantite <= 0)
  );
  
  if (servicesListe.length === 0) {
    alert("Veuillez sélectionner au moins un service");
    return;
  }
  
  // Vérifier que tous les services au kg ont des kilos
  const servicesKgIncomplets = Object.values(servicesSelectionnes).filter(s => 
    s.type === 'kg' && s.quantite <= 0
  );
  
  if (servicesKgIncomplets.length > 0) {
    alert("Veuillez saisir le nombre de kilos pour tous les services sélectionnés");
    return;
  }
  
  const data = {
    nom: document.getElementById("nom").value,
    age: document.getElementById("age")?.value || null,
    dateNaissance: document.getElementById("dateNaissance")?.value || null,
    profession: document.getElementById("profession")?.value || null,
    telephone: document.getElementById("telephone").value,
    quartier: document.getElementById("quartier").value,
    lieuResidence: document.getElementById("lieuResidence")?.value || null,
    canal: document.getElementById("canal")?.value || null,
    dateEntree: document.getElementById("dateEntree").value,
    dateRetrait: document.getElementById("dateRetrait").value,
    typeArticles: document.getElementById("articles")?.value || "",
    montant: parseFloat(document.getElementById("montant").value),
    services: servicesListe,
    typeLavage: servicesListe.map(s => s.nom).join(", "),
    kilos: servicesListe.reduce((acc, s) => acc + (s.quantite || 0), 0)
  };

  try {
    await addDoc(collection(db, "commandes"), {
      ...data,
      statut: "En cours",
      dateAjout: new Date().toISOString()
    });
    
    // Réinitialiser le formulaire
    form.reset();
    servicesSelectionnes = {};
    document.querySelectorAll('.service-card').carte => carte.classList.remove('selected'));
    document.querySelectorAll('.service-kg-input').forEach(input => input.style.display = 'none');
    document.getElementById('recapContainer').style.display = 'none';
    document.getElementById('submitBtn').disabled = true;
    
    await chargerTout();
    alert("✅ Commande enregistrée avec succès !");
  } catch (err) { 
    alert("❌ Erreur : " + err.message); 
  }
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

    // Services à afficher
    const servicesText = cmd.services ? 
      cmd.services.map(s => `${s.nom} (${s.prixCalcule.toLocaleString()} FCFA)`).join('<br>') : 
      cmd.typeLavage || "Non spécifié";

    row.innerHTML = `
      <td>
        <strong>${cmd.nom}</strong><br>
        <small style="color: #666;">${cmd.telephone}</small>
      </td>
      <td><small>${servicesText}</small></td>
      <td><strong>${cmd.montant.toLocaleString()} FCFA</strong></td>
      <td style="color: ${isLivre ? '#4CAF50' : '#FF9800'}; font-weight: bold;">${cmd.statut}</td>
      <td>
        <button class="action-btn btn-wa" onclick='envoyerWhatsAppAvecPDF(${JSON.stringify(cmd).replace(/'/g, "\\'")})'>📄 PDF+WA</button>
        <button class="action-btn btn-livre" onclick='livrerCommande("${id}")' ${isLivre ? 'disabled' : ''}>✅ LIVRÉ</button>
        <button class="action-btn btn-del" onclick='supprimerCommande("${id}")'>🗑️</button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Fonctions globales pour les boutons
window.livrerCommande = async (id) => {
  if(confirm("Valider la livraison ?")) {
    await updateDoc(doc(db, "commandes", id), { statut: "Livré" });
    await chargerTout();
  }
};

window.supprimerCommande = async (id) => {
  if(confirm("Supprimer cette commande ?")) {
    await deleteDoc(doc(db, "commandes", id));
    await chargerTout();
  }
};

// --- INITIALISATION ---
async function chargerTout() {
  await chargerCommandes();
  await mettreAJourStats();
}

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
  initialiserServices();
  chargerTout();
});