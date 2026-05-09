// ============================================================
// AUREL ACADEMY — Réservations + Routing closers (Pflege + Allemand)
// Apps Script bound au Sheet « Aurel Academy — Réservations »
// v7 — Sheet 13 cols + placeholder cells + cond. formatting + protection Closer col
// ============================================================
//
// FONCTIONNALITÉS
// 1. Reçoit les soumissions des landings (Pflege / Allemand)
// 2. Route chaque lead vers l'onglet correspondant (Leads-Pflege / Leads-Allemand)
// 3. Assigne automatiquement chaque lead à un closer en round-robin équitable
// 4. Envoie un email HTML friendly au closer (avec toi en CC)
//    → numéro de téléphone cliquable pour appeler en 1 clic (tel:)
// 5. Si aucun closer configuré, envoie l'email à NOTIFY_EMAIL uniquement
//
// SETUP — REMPLIR CETTE SECTION
// ============================================================

// Liste des managers qui reçoivent TOUS les leads en CC (même ceux assignés à un closer).
// Utile pour : toi (owner) + un closer manager qui supervise toute l'équipe.
// Mets [] pour désactiver complètement les notifs CC.
const NOTIFY_EMAILS = [
  'amirmesbah510@gmail.com',  // Toi (owner)
  'aminetbalia6@gmail.com',   // Closer manager
];

// Liste des closers de ton équipe.
//   - name      : prénom du closer (affiché dans le Sheet + email)
//   - email     : email du closer (recevra la notif instantanée)
//   - whatsapp  : (optionnel) son numéro, juste pour info dans le mail
//   - programs  : ['Pflege', 'Allemand'] pour les 2, ou ['Pflege'] seulement, etc.
//
// Round-robin équitable : chaque nouveau lead va au closer éligible qui en a reçu
// le moins jusqu'ici. Si tu veux désactiver le routing : laisse CLOSERS = []
const CLOSERS = [
  { name: 'Hana',    email: 'hanabenabderrahim0@gmail.com', whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Aymen',   email: 'aymanesido09@gmail.com',       whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Djihane', email: 'Djihanesedour@gmail.com',      whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Hadjer',  email: 'mezdourhadjer7@gmail.com',     whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Ryma',    email: 'Messyryma@gmail.com',          whatsapp: '', programs: ['Pflege', 'Allemand'] },
];

// ============================================================
// CODE — NE PAS MODIFIER EN DESSOUS (sauf si tu sais ce que tu fais)
// ============================================================

const TAB_BY_PROGRAM = {
  'Pflege':   'Leads-Pflege',
  'Allemand': 'Leads-Allemand',
};
const FALLBACK_TAB = 'Leads';

// Nouvelle structure 13 colonnes (v7)
//   A:Timestamp  B:Programme  C:Nom complet  D:WhatsApp  E:Email
//   F:Profession  G:Niveau DE  H:Tier  I:Statut  J:Wilaya
//   K:Adresse  L:Closer assigné  M:Lang
const HEADERS = [
  'Timestamp',      // A
  'Programme',      // B
  'Nom complet',    // C
  'WhatsApp',       // D
  'Email',          // E (placeholder closer)
  'Profession',     // F (placeholder closer)
  'Niveau DE',      // G
  'Tier',           // H
  'Statut',         // I
  'Wilaya',         // J (placeholder closer)
  'Adresse',        // K (placeholder closer)
  'Closer assigné', // L (protected)
  'Lang',           // M
];

// Colonnes à pré-remplir avec "À remplir par le closer" (en gris/italique/petit)
const PLACEHOLDER_TEXT = 'À remplir par le closer';
const PLACEHOLDER_COLUMNS = [5, 6, 10, 11]; // E, F, J, K

// Colonne protégée : seuls les emails ci-dessous peuvent l'éditer
const PROTECTED_COLUMN = 12; // L (Closer assigné)
const ALLOWED_EDITORS = ['aminetbalia6@gmail.com', 'emirmesbah@gmail.com'];

// ─────────────────────────────────────────────────────────────
// Round-robin équitable
// ─────────────────────────────────────────────────────────────
function pickCloserRoundRobin(program) {
  const eligible = CLOSERS.filter(c => !c.programs || c.programs.length === 0 || c.programs.includes(program));
  if (eligible.length === 0) return null;

  const props = PropertiesService.getScriptProperties();
  const stats = eligible.map((c, i) => {
    const key = 'closerCount_' + c.email;
    const count = parseInt(props.getProperty(key) || '0', 10);
    return { closer: c, count: count, idx: i, key: key };
  });

  stats.sort((a, b) => (a.count - b.count) || (a.idx - b.idx));
  const chosen = stats[0];
  props.setProperty(chosen.key, String(chosen.count + 1));
  return chosen.closer;
}

// ─────────────────────────────────────────────────────────────
// Helpers — numéro cliquable (tel:)
// ─────────────────────────────────────────────────────────────
function buildTelLink(phone) {
  // Garde + et chiffres pour le format tel: (E.164)
  const num = String(phone || '').replace(/[^0-9+]/g, '');
  if (!num) return '';
  // S'assure du + initial pour les numéros internationaux
  return 'tel:' + (num.startsWith('+') ? num : '+' + num);
}

// ─────────────────────────────────────────────────────────────
// Email body — version texte (fallback) + version HTML
// ─────────────────────────────────────────────────────────────
function buildEmailBodyText(program, data, closer) {
  const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim();
  const lines = [
    '🔥 Nouveau lead ' + program + ' — ' + (data.tier || ''),
    '',
    closer ? ('Hey ' + closer.name + ' 👋 Tu as été assigné·e à ce lead.') : '(Aucun closer configuré)',
    '',
    'Nom        : ' + fullName,
    'Téléphone  : ' + (data.whatsapp || ''),
    'Niveau DE  : ' + (data.niveau_allemand || ''),
    'Tier       : ' + (data.tier || ''),
    'Langue     : ' + (data.lang || ''),
    '',
    '📞 STANDARD ÉQUIPE : APPELLE CE LEAD MAINTENANT.',
    'Pas dans 5 minutes. Pas dans 1h. Maintenant.',
    'Le lead est chaud uniquement à l\'instant T où il vient de soumettre.',
    '',
    'Quand l\'appel est fini, mets son statut à jour dans le Sheet.',
    '',
    'Source : ' + (data.landing_url || ''),
  ];
  return lines.join('\n');
}

function buildEmailBodyHtml(program, data, closer) {
  const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim();
  const telLink = buildTelLink(data.whatsapp);

  // Couleurs Aurel Academy (orange + dark)
  const ORANGE = '#F97316';
  const DARK = '#0A0A0A';
  const RED = '#DC2626';

  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8F8F6;font-family:-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif;color:#111;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F8F6;padding:32px 16px;">',
      '<tr><td align="center">',
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">',

          // Header
          '<tr><td style="background:' + DARK + ';padding:20px 24px;color:#fff;">',
            '<div style="font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:' + ORANGE + ';font-weight:700;">🔥 Nouveau lead — ' + program + '</div>',
            '<div style="font-size:22px;font-weight:700;margin-top:4px;">' + (data.tier || '') + '</div>',
          '</td></tr>',

          // Greeting
          '<tr><td style="padding:24px 24px 8px 24px;">',
            '<p style="margin:0;font-size:16px;line-height:1.5;">' +
              (closer ? ('Hey <strong>' + closer.name + '</strong> 👋') : '👋') +
            '</p>',
            '<p style="margin:8px 0 0 0;font-size:16px;line-height:1.5;color:#444;">',
              '<strong>' + (fullName || 'Un nouveau lead') + '</strong> vient de réserver une place sur <strong>' + program + (data.tier ? ' — ' + data.tier : '') + '</strong>. ' +
              (closer ? 'Il est pour toi.' : ''),
            '</p>',
          '</td></tr>',

          // Phone — gros et cliquable
          telLink ? (
            '<tr><td style="padding:8px 24px;" align="center">' +
              '<a href="' + telLink + '" style="display:block;background:' + DARK + ';color:#fff;text-decoration:none;padding:18px 24px;border-radius:10px;text-align:center;">' +
                '<div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:' + ORANGE + ';font-weight:700;margin-bottom:4px;">📞 Tape pour appeler maintenant</div>' +
                '<div style="font-size:24px;font-weight:700;letter-spacing:.02em;">' + (data.whatsapp || '') + '</div>' +
              '</a>' +
            '</td></tr>'
          ) : '',

          // Lead info card
          '<tr><td style="padding:16px 24px 8px 24px;">',
            '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAF8;border:1px solid #EAEAE6;border-radius:10px;padding:16px;">',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;width:120px;">Nom</td><td style="padding:6px 0;font-size:15px;font-weight:600;">' + (fullName || '—') + '</td></tr>',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;">Niveau DE</td><td style="padding:6px 0;font-size:15px;font-weight:600;">' + (data.niveau_allemand || '—') + '</td></tr>',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;">Tier</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:' + ORANGE + ';">' + (data.tier || '—') + '</td></tr>',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;">Langue</td><td style="padding:6px 0;font-size:15px;">' + (data.lang === 'ar' ? 'Arabe 🇩🇿' : 'Français 🇫🇷') + '</td></tr>',
            '</table>',
          '</td></tr>',

          // Action note — appel MAINTENANT
          '<tr><td style="padding:16px 24px;">',
            '<p style="margin:0;font-size:15px;line-height:1.6;color:#7F1D1D;background:#FEF2F2;border-left:3px solid ' + RED + ';padding:14px 16px;border-radius:6px;">',
              '⚡ <strong>STANDARD ÉQUIPE : APPELLE CE LEAD MAINTENANT.</strong><br>',
              '<span style="color:#991B1B;">Pas dans 5 minutes. Pas dans 1h. Maintenant.</span><br>',
              '<span style="color:#666;font-size:13px;">Le lead est chaud uniquement à l\'instant T où il vient de soumettre. Quand l\'appel est fini, mets son statut à jour dans le Sheet 👌</span>',
            '</p>',
          '</td></tr>',

          // Footer
          '<tr><td style="padding:16px 24px 24px 24px;border-top:1px solid #EAEAE6;">',
            '<p style="margin:0;font-size:12px;color:#999;line-height:1.5;">',
              '<strong>Source :</strong> ' + (data.landing_url || '—') + '<br>',
              '<strong>Reçu :</strong> ' + (data.timestamp || new Date().toISOString()),
            '</p>',
          '</td></tr>',

        '</table>',
      '</td></tr>',
    '</table>',
    '</body></html>',
  ].join('');
}

// ─────────────────────────────────────────────────────────────
// Send email
// ─────────────────────────────────────────────────────────────
function notifyByEmail(program, data, closer) {
  const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim();
  const subject = '🔥 ' + program + ' · ' + (data.tier || '?') + ' · ' + (fullName || 'Lead') +
                  (closer ? (' (→ ' + closer.name + ')') : '');
  const bodyText = buildEmailBodyText(program, data, closer);
  const bodyHtml = buildEmailBodyHtml(program, data, closer);

  // Liste CC : tous les managers (toi + closer manager)
  const ccList = (NOTIFY_EMAILS || []).filter(Boolean).join(',');

  // Cas 1 : closer assigné → email au closer + CC managers
  if (closer && closer.email) {
    try {
      const opts = {
        to: closer.email,
        subject: subject,
        body: bodyText,
        htmlBody: bodyHtml,
        name: 'Aurel Academy — Leads',
      };
      if (ccList) opts.cc = ccList;
      MailApp.sendEmail(opts);
    } catch (err) { console.error('Closer mail error', err); }
    return;
  }

  // Cas 2 : pas de closer → email direct aux managers
  if (ccList) {
    try {
      MailApp.sendEmail({
        to: ccList,
        subject: subject,
        body: bodyText,
        htmlBody: bodyHtml,
        name: 'Aurel Academy — Leads',
      });
    } catch (err) { console.error('Notify mail error', err); }
  }
}

// ─────────────────────────────────────────────────────────────
// Webhook handler
// ─────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const program = data.program || '';
    const tabName = TAB_BY_PROGRAM[program] || FALLBACK_TAB;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setFontWeight('bold')
        .setBackground('#0A0A0A')
        .setFontColor('#F97316');
      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, HEADERS.length, 160);
    }

    // Assign a closer (round-robin équitable)
    const closer = pickCloserRoundRobin(program);

    const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim() || (data.nom_complet || '');

    // Si la cellule du form est vide → mettre le placeholder pour le closer
    const ph = (val) => val && String(val).trim() !== '' ? val : PLACEHOLDER_TEXT;

    const row = [
      data.timestamp || new Date().toISOString(), // A Timestamp
      program,                                     // B Programme
      fullName,                                    // C Nom complet
      data.whatsapp || '',                         // D WhatsApp
      ph(data.email),                              // E Email (placeholder si vide)
      ph(data.profession),                         // F Profession (placeholder si vide)
      data.niveau_allemand || '',                  // G Niveau DE
      data.tier || '',                             // H Tier
      'Nouveau',                                   // I Statut
      ph(data.wilaya),                             // J Wilaya (placeholder si vide)
      ph(data.adresse),                            // K Adresse (placeholder si vide)
      closer ? closer.name : '',                   // L Closer assigné
      data.lang || '',                             // M Lang
    ];
    sheet.appendRow(row);

    // Applique le style "placeholder" (gris/italique/petit) aux cellules E F J K de la nouvelle ligne
    const newRowIdx = sheet.getLastRow();
    applyPlaceholderStyleToRow(sheet, newRowIdx);

    // Send notifications
    notifyByEmail(program, data, closer);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, tab: tabName, closer: closer ? closer.name : null }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      service: 'aurel-bookings-v7',
      tabs: TAB_BY_PROGRAM,
      closers_configured: CLOSERS.length,
      managers_configured: (NOTIFY_EMAILS || []).filter(Boolean).length,
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HELPERS DEBUG (à exécuter manuellement depuis l'éditeur Apps Script)
// ============================================================
function _resetCloserRotation() {
  const props = PropertiesService.getScriptProperties();
  CLOSERS.forEach(c => props.deleteProperty('closerCount_' + c.email));
  Object.keys(TAB_BY_PROGRAM).forEach(p => props.deleteProperty('lastCloserIdx_' + p));
  console.log('Closer counters reset for all closers and programs.');
}

function _showCloserStats() {
  const props = PropertiesService.getScriptProperties();
  console.log('=== Stats leads par closer ===');
  CLOSERS.forEach(c => {
    const count = parseInt(props.getProperty('closerCount_' + c.email) || '0', 10);
    console.log(c.name + ' (' + c.email + ') : ' + count + ' lead(s)');
  });
}

// ─────────────────────────────────────────────────────────────
// FORMATTING — placeholder (gris/italique/petit) sur cellules E F J K
// ─────────────────────────────────────────────────────────────
function applyPlaceholderStyleToRow(sheet, rowIdx) {
  PLACEHOLDER_COLUMNS.forEach((col) => {
    const cell = sheet.getRange(rowIdx, col);
    const val = cell.getValue();
    if (val === PLACEHOLDER_TEXT) {
      cell.setFontColor('#9CA3AF')   // gris clair
          .setFontStyle('italic')
          .setFontSize(10);
    } else {
      // Reset au cas où le closer a déjà rempli — texte normal noir
      cell.setFontColor('#000000')
          .setFontStyle('normal')
          .setFontSize(10);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// CONDITIONAL FORMATTING — cellule rouge si Statut = "closed"
// ET la cellule contient encore le placeholder (donc pas remplie)
// ─────────────────────────────────────────────────────────────
function applyConditionalFormatting(sheet) {
  sheet.clearConditionalFormatRules();

  const lastRow = Math.max(1000, sheet.getLastRow() + 200); // marge pour les futures lignes
  const rules = [];

  PLACEHOLDER_COLUMNS.forEach((col) => {
    const colLetter = String.fromCharCode(64 + col); // 5 → 'E', 6 → 'F', etc.
    const range = sheet.getRange(2, col, lastRow - 1, 1);

    // Formule : Statut (col I) = "closed" ET cellule contient placeholder ou est vide
    const formula = '=AND(LOWER($I2)="closed",OR($' + colLetter + '2="' + PLACEHOLDER_TEXT + '",$' + colLetter + '2=""))';

    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground('#FECACA')   // rouge clair
      .setFontColor('#991B1B')    // rouge foncé
      .setRanges([range])
      .build();

    rules.push(rule);
  });

  sheet.setConditionalFormatRules(rules);
}

// ─────────────────────────────────────────────────────────────
// PROTECTION — colonne L (Closer assigné) éditable seulement par
// aminetbalia6@gmail.com et emirmesbah@gmail.com
// ─────────────────────────────────────────────────────────────
function protectCloserColumn(sheet) {
  const lastRow = Math.max(1000, sheet.getLastRow() + 200);
  const range = sheet.getRange(2, PROTECTED_COLUMN, lastRow - 1, 1);

  // Supprime les protections existantes sur cette colonne pour éviter les doublons
  const existing = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  existing.forEach((p) => {
    try {
      const r = p.getRange();
      if (r && r.getColumn() === PROTECTED_COLUMN && r.getSheet().getName() === sheet.getName()) {
        p.remove();
      }
    } catch (e) {}
  });

  const protection = range.protect();
  protection.setDescription('Closer assigné — édition réservée managers (' + sheet.getName() + ')');

  // Étape 1 : ajoute les éditeurs autorisés (idempotent — pas d'erreur si déjà présents)
  ALLOWED_EDITORS.forEach((email) => {
    try { protection.addEditor(email); } catch (e) { console.log('Cannot add editor ' + email + ': ' + e); }
  });

  // Étape 2 : retire tous les autres éditeurs (Google retient automatiquement
  // le propriétaire du fichier, donc pas besoin de l'identifier nous-mêmes)
  const allEditors = protection.getEditors().map(u => u.getEmail()).filter(Boolean);
  const toRemove = allEditors.filter(e => !ALLOWED_EDITORS.includes(e));
  if (toRemove.length) {
    try { protection.removeEditors(toRemove); } catch (e) { console.log('removeEditors error: ' + e); }
  }

  if (protection.canDomainEdit && protection.canDomainEdit()) {
    protection.setDomainEdit(false);
  }
}

// ─────────────────────────────────────────────────────────────
// MIGRATION — convertit l'ancienne structure 17 cols vers nouvelle 13 cols
// + applique placeholder + conditional formatting + protection
// SAFE : à exécuter une seule fois après mise à jour du script.
// ─────────────────────────────────────────────────────────────
function _migrateAndFormatSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabsToMigrate = Object.values(TAB_BY_PROGRAM).concat([FALLBACK_TAB]);

  tabsToMigrate.forEach((tabName) => {
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      console.log('⏭️  Onglet introuvable, skip : ' + tabName);
      return;
    }
    console.log('🔄 Migration onglet : ' + tabName);
    migrateOneSheet(sheet);
    console.log('✅ Onglet migré : ' + tabName);
  });

  console.log('🎉 Migration terminée. Recharge le Sheet pour voir le résultat.');
}

function migrateOneSheet(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  // Si onglet vide → juste écrire les nouveaux headers
  if (lastRow === 0) {
    sheet.appendRow(HEADERS);
    formatHeaderRow(sheet);
    applyConditionalFormatting(sheet);
    protectCloserColumn(sheet);
    return;
  }

  // Lit toute la donnée existante
  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const oldHeaders = allValues[0].map(h => String(h).trim());
  const dataRows = allValues.slice(1);

  // Construit un index ancien-header → ancienne colonne (zero-based)
  const oldIdx = {};
  oldHeaders.forEach((h, i) => { oldIdx[h] = i; });

  // Helper : récupère une valeur par nom de colonne (ancienne ou nouvelle)
  const getOld = (row, key) => oldIdx[key] !== undefined ? row[oldIdx[key]] : '';

  // Détecte si c'est l'ancienne structure (avec Prénom/Nom séparés) ou la nouvelle
  const wasAlreadyMigrated = oldIdx['Nom complet'] !== undefined;

  // Reconstruit chaque ligne dans la nouvelle structure
  const newRows = dataRows.map((row) => {
    const fullName = wasAlreadyMigrated
      ? String(getOld(row, 'Nom complet') || '').trim()
      : ((String(getOld(row, 'Prénom') || '') + ' ' + String(getOld(row, 'Nom') || '')).trim());

    const ph = (val) => val && String(val).trim() !== '' ? val : PLACEHOLDER_TEXT;

    return [
      getOld(row, 'Timestamp'),
      getOld(row, 'Programme'),
      fullName,
      getOld(row, 'WhatsApp'),
      ph(getOld(row, 'Email')),
      ph(getOld(row, 'Profession')),
      getOld(row, 'Niveau DE'),
      getOld(row, 'Tier'),
      getOld(row, 'Statut') || 'Nouveau',
      ph(getOld(row, 'Wilaya')),
      ph(getOld(row, 'Adresse')),
      getOld(row, 'Closer assigné'),
      getOld(row, 'Lang'),
    ];
  });

  // Clear l'onglet et réécrit avec la nouvelle structure
  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.appendRow(HEADERS);
  if (newRows.length > 0) {
    sheet.getRange(2, 1, newRows.length, HEADERS.length).setValues(newRows);
  }

  // Format header
  formatHeaderRow(sheet);
  sheet.setColumnWidths(1, HEADERS.length, 160);

  // Applique le style placeholder à toutes les lignes
  for (let r = 2; r <= sheet.getLastRow(); r++) {
    applyPlaceholderStyleToRow(sheet, r);
  }

  // Conditional formatting (rouge si closed + placeholder)
  applyConditionalFormatting(sheet);

  // Protection colonne L
  protectCloserColumn(sheet);
}

function formatHeaderRow(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#0A0A0A')
    .setFontColor('#F97316');
  sheet.setFrozenRows(1);
}

// Test rapide — exécute depuis l'éditeur Apps Script pour voir un email exemple
function _testEmailPreview() {
  const fakeData = {
    timestamp: new Date().toISOString(),
    program: 'Pflege',
    prenom: 'Karim',
    nom: 'Mosbah',
    whatsapp: '+213 555 290 826',
    niveau_allemand: 'Intermédiaire (B1)',
    tier: 'Accompagné',
    lang: 'fr',
    landing_url: 'https://aurel-academy.com/pflege/inscription/',
  };
  const fakeCloser = CLOSERS[0] || null;
  console.log('--- SUBJECT ---');
  console.log('🔥 Pflege · Accompagné · Karim Mosbah' + (fakeCloser ? ' (→ ' + fakeCloser.name + ')' : ''));
  console.log('--- TEXT BODY ---');
  console.log(buildEmailBodyText('Pflege', fakeData, fakeCloser));
  console.log('--- HTML BODY (longueur) ---');
  console.log(buildEmailBodyHtml('Pflege', fakeData, fakeCloser).length + ' caractères');
}
