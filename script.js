// On attend que le contenu de la page soit chargé avant d'exécuter le script
document.addEventListener('DOMContentLoaded', () => {

  // --- Constantes et Configuration ---
  const SHEET_ID = "1qP34VnnoJgxTX3rdont0mlpvpzApgmobklKx5soJvio";
  const GID = "0";
  const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
  const REFRESH_INTERVAL = 30000; // 30 secondes

  // On stocke la référence à l'élément du DOM pour ne pas le rechercher à chaque fois
  const patientGrid = document.getElementById('patient-grid');

  /**
   * Détermine la classe CSS de statut en fonction de la date d'hospitalisation.
   * @param {string} dateStr - La date au format 'jj/mm/aaaa'.
   * @returns {string} La classe CSS ('status-ok', 'status-warning', 'status-danger').
   */
  const getStatusClass = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';

    // new Date(année, mois - 1, jour)
    const hospitalDate = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // On ignore l'heure pour comparer les jours

    const diffTime = today - hospitalDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "status-ok";
    if (diffDays <= 3) return "status-warning";
    return "status-danger";
  };

  /**
   * Récupère les données depuis Google Sheets et met à jour l'affichage.
   * Utilisation de async/await pour un code plus clair.
   */
  const fetchAndDisplayData = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const text = await response.text();
      // On retire l'enrobage JSONP pour obtenir un JSON valide
      const jsonStr = text.substring(47).slice(0, -2);
      const data = JSON.parse(jsonStr);

      const rows = data.table.rows;

      // Si pas de données, on affiche un message
      if (rows.length === 0) {
        patientGrid.innerHTML = '<p>Aucun patient à afficher.</p>';
        return;
      }

      // On utilise map() pour transformer les données en HTML, puis join() pour tout assembler
      const htmlContent = rows.slice(0, 20).map(row => {
        const [box, nom, date] = row.c.map(cell => cell?.v || "");
        const statusClass = getStatusClass(date);

        return `
          <div class="box ${statusClass}">
            <div class="box-id">${box}</div>
            <div class="box-name">${nom}</div>
            <div class="box-date">${date}</div>
          </div>
        `;
      }).join('');

      patientGrid.innerHTML = htmlContent;

    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      patientGrid.innerHTML = "<p>❌ Impossible de charger les informations des patients.</p>";
    }
  };

  // Lancement initial et mise en place de l'actualisation
  fetchAndDisplayData();
  setInterval(fetchAndDisplayData, REFRESH_INTERVAL);
});