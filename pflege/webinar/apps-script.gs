// ============================================================
// AUREL ACADEMY — Webinar Leads Capture
// Google Apps Script à déployer en Web App (URL à coller dans webinar.js)
// ============================================================
//
// SETUP (5 minutes) :
// 1. Crée un Google Sheet vide. Renomme-le "Aurel Pflege Live Leads"
// 2. Extensions → Apps Script
// 3. Remplace le code par défaut par CE fichier entier (Ctrl+A puis paste)
// 4. Remplace SPREADSHEET_ID ci-dessous par l'ID de ton Sheet
//    (l'ID est dans l'URL : docs.google.com/spreadsheets/d/<ID>/edit)
// 5. Déployer → Nouveau déploiement :
//    • Type : Application Web
//    • Exécuter en tant que : Moi
//    • Accès : Tout le monde
//    Clique "Déployer", copie l'URL /macros/s/.../exec
// 6. Colle cette URL dans /pflege/webinar/webinar.js → APPS_SCRIPT_URL
//
// Ton Sheet se remplira automatiquement à chaque inscription.
// ============================================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'Leads';

// Headers créés automatiquement à la première soumission
const HEADERS = [
  'Date soumission',
  'Prénom',
  'Téléphone',
  'Wilaya',
  'Niveau allemand',
  'Profil santé',
  'Source',
  'URL page',
  'Referrer',
  'User Agent'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setFontWeight('bold')
        .setBackground('#0891B2')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    const row = [
      data.submitted_at || new Date().toISOString(),
      data.firstname || '',
      data.phone || '',
      data.wilaya || '',
      germanLabel(data.german_level),
      profileLabel(data.health_profile),
      data.source || '',
      data.landing_url || '',
      data.referrer || '',
      data.user_agent || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  // Health check endpoint
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'aurel-webinar-leads' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function germanLabel(value) {
  const map = {
    aucun: 'Aucun (débutant)',
    a1: 'A1 (bases)',
    a2: 'A2 (élémentaire)',
    b1: 'B1 (intermédiaire)',
    b2: 'B2 (intermédiaire avancé)',
    c1: 'C1 ou plus'
  };
  return map[value] || value || '';
}

function profileLabel(value) {
  const map = {
    etudiant: 'Étudiant·e en soins',
    ide_moins_2: 'Infirmier·ère diplômé·e (< 2 ans)',
    ide_2_5: 'Infirmier·ère diplômé·e (2-5 ans)',
    ide_5_plus: 'Infirmier·ère diplômé·e (5 ans et +)',
    autre_paramedical: 'Autre paramédical',
    reconversion: 'Reconversion (hors santé)'
  };
  return map[value] || value || '';
}
