let commandes = JSON.parse(localStorage.getItem("commandes")) || [];

const form = document.getElementById("formCommande");
const liste = document.getElementById("liste");
const classement = document.getElementById("classement");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const commande = {
    nom: nom.value,
    quartier: quartier.value,
    telephone: telephone.value,
    montant: parseFloat(montant.value),
    dateEntree: dateEntree.value,
    dateRetrait: dateRetrait.value,
    livre: false
  };

  commandes.push(commande);
  sauvegarder();
  afficher();
  form.reset();
});

function sauvegarder() {
  localStorage.setItem("commandes", JSON.stringify(commandes));
}

function calculStatut(c) {
  const aujourd = new Date().toISOString().split("T")[0];

  if (c.livre) return "Livré";
  if (aujourd < c.dateRetrait) return "En cours";
  return "Colis prêt - NON livré";
}

function calculRelance(c) {
  const aujourd = new Date();
  const entree = new Date(c.dateEntree);
  const diff = (aujourd - entree) / (1000 * 60 * 60 * 24);

  if (diff > 14) return "A RELANCER";
  return "Actif";
}

function afficher() {
  liste.innerHTML = "";

  commandes.forEach((c, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${c.nom}</td>
      <td>${c.quartier}</td>
      <td>${c.telephone}</td>
      <td>${c.montant}</td>
      <td>${calculStatut(c)}</td>
      <td>${calculRelance(c)}</td>
      <td><button onclick="livrer(${index})">Valider</button></td>
    `;

    liste.appendChild(tr);
  });

  afficherClassement();
}

function livrer(index) {
  commandes[index].livre = true;
  sauvegarder();
  afficher();
}

function afficherClassement() {
  classement.innerHTML = "";

  let stats = {};

  commandes.forEach(c => {
    if (!stats[c.nom]) {
      stats[c.nom] = {
        commandes: 0,
        total: 0
      };
    }

    stats[c.nom].commandes += 1;
    stats[c.nom].total += c.montant;
  });

  let tableau = Object.keys(stats).map(nom => ({
    nom,
    commandes: stats[nom].commandes,
    total: stats[nom].total,
    points: stats[nom].commandes * 10
  }));

  tableau.sort((a, b) => b.total - a.total);

  tableau.forEach(client => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${client.nom}</td>
      <td>${client.commandes}</td>
      <td>${client.total}</td>
      <td>${client.points}</td>
    `;
    classement.appendChild(tr);
  });
}

afficher();