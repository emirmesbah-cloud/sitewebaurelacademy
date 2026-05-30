// ============================================================
// AUREL ACADEMY — Réservations + Routing closers (Pflege + Allemand)
// v9 — Emails closers via RESEND, destinataire UNIQUE : Amine
// ============================================================
//
// ⚠️ SÉCURITÉ : la clé Resend N'EST PAS dans ce fichier (placeholder).
//   La vraie clé vit uniquement dans l'éditeur Apps Script (constante
//   RESEND_API_KEY) — NE JAMAIS committer une vraie clé dans public_html.
// ============================================================

// Seul Amine reçoit les emails de leads (Amir + closers retirés).
// Le closer reste assigné dans le Sheet (col L) + indiqué dans l'objet.
const NOTIFY_EMAILS = [
  'aminetbalia6@gmail.com',   // Amine (seul destinataire)
];

const CLOSERS = [
  { name: 'Hana',    email: 'hanabenabderrahim0@gmail.com', whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Aymen',   email: 'aymanesido09@gmail.com',       whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Djihane', email: 'Djihanesedour@gmail.com',      whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Hadjer',  email: 'mezdourhadjer7@gmail.com',     whatsapp: '', programs: ['Pflege', 'Allemand'] },
  { name: 'Ryma',    email: 'Messyryma@gmail.com',          whatsapp: '', programs: ['Pflege', 'Allemand'] },
];

// ─── Resend config ──────────────────────────────────────────
// Remplace le placeholder ci-dessous par la vraie clé UNIQUEMENT dans
// l'éditeur Apps Script (jamais dans ce fichier public_html).
const RESEND_API_KEY  = 'RESEND_API_KEY_PLACEHOLDER';
const RESEND_FROM     = 'Aurel Academy — Leads <noreply@aurel-academy.com>';
const RESEND_REPLY_TO = 'aurel@aurel-academy.com';

// ============================================================
// CODE — NE PAS MODIFIER EN DESSOUS
// ============================================================

const TAB_BY_PROGRAM = {
  'Pflege':   'Leads-Pflege',
  'Allemand': 'Leads-Allemand',
};
const FALLBACK_TAB = 'Leads';

const HEADERS = [
  'Timestamp', 'Programme', 'Nom complet', 'WhatsApp', 'Email',
  'Profession', 'Niveau DE', 'Tier', 'Statut', 'Wilaya',
  'Adresse', 'Closer assigné', 'Lang',
];

const PLACEHOLDER_TEXT = 'À remplir par le closer';
const PLACEHOLDER_COLUMNS = [5, 6, 10, 11];
const PROTECTED_COLUMN = 12;
const ALLOWED_EDITORS = ['aminetbalia6@gmail.com', 'emirmesbah@gmail.com'];

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

function buildTelLink(phone) {
  const num = String(phone || '').replace(/[^0-9+]/g, '');
  if (!num) return '';
  return 'tel:' + (num.startsWith('+') ? num : '+' + num);
}

function buildEmailBodyText(program, data, closer) {
  const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim();
  return [
    '🔥 Nouveau lead ' + program + ' — ' + (data.tier || ''),
    '',
    closer ? ('Closer assigné : ' + closer.name) : '(Aucun closer configuré)',
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
  ].join('\n');
}

function buildEmailBodyHtml(program, data, closer) {
  const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim();
  const telLink = buildTelLink(data.whatsapp);
  const ORANGE = '#F97316';
  const DARK = '#0A0A0A';
  const RED = '#DC2626';

  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F8F8F6;font-family:-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif;color:#111;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F8F6;padding:32px 16px;">',
      '<tr><td align="center">',
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">',
          '<tr><td style="background:' + DARK + ';padding:20px 24px;color:#fff;">',
            '<div style="font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:' + ORANGE + ';font-weight:700;">🔥 Nouveau lead — ' + program + '</div>',
            '<div style="font-size:22px;font-weight:700;margin-top:4px;">' + (data.tier || '') + '</div>',
          '</td></tr>',
          '<tr><td style="padding:24px 24px 8px 24px;">',
            '<p style="margin:0;font-size:16px;line-height:1.5;color:#444;">',
              '<strong>' + (fullName || 'Un nouveau lead') + '</strong> vient de réserver une place sur <strong>' + program + (data.tier ? ' — ' + data.tier : '') + '</strong>.',
            '</p>',
            (closer ? '<p style="margin:8px 0 0 0;font-size:15px;color:#111;">👤 Closer assigné : <strong>' + closer.name + '</strong></p>' : ''),
          '</td></tr>',
          telLink ? (
            '<tr><td style="padding:8px 24px;" align="center">' +
              '<a href="' + telLink + '" style="display:block;background:' + DARK + ';color:#fff;text-decoration:none;padding:18px 24px;border-radius:10px;text-align:center;">' +
                '<div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:' + ORANGE + ';font-weight:700;margin-bottom:4px;">📞 Tape pour appeler maintenant</div>' +
                '<div style="font-size:24px;font-weight:700;letter-spacing:.02em;">' + (data.whatsapp || '') + '</div>' +
              '</a>' +
            '</td></tr>'
          ) : '',
          '<tr><td style="padding:16px 24px 8px 24px;">',
            '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAF8;border:1px solid #EAEAE6;border-radius:10px;padding:16px;">',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;width:120px;">Nom</td><td style="padding:6px 0;font-size:15px;font-weight:600;">' + (fullName || '—') + '</td></tr>',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;">Niveau DE</td><td style="padding:6px 0;font-size:15px;font-weight:600;">' + (data.niveau_allemand || '—') + '</td></tr>',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;">Tier</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:' + ORANGE + ';">' + (data.tier || '—') + '</td></tr>',
              '<tr><td style="padding:6px 0;font-size:14px;color:#666;">Langue</td><td style="padding:6px 0;font-size:15px;">' + (data.lang === 'ar' ? 'Arabe 🇩🇿' : 'Français 🇫🇷') + '</td></tr>',
            '</table>',
          '</td></tr>',
          '<tr><td style="padding:16px 24px;">',
            '<p style="margin:0;font-size:15px;line-height:1.6;color:#7F1D1D;background:#FEF2F2;border-left:3px solid ' + RED + ';padding:14px 16px;border-radius:6px;">',
              '⚡ <strong>STANDARD ÉQUIPE : APPELLE CE LEAD MAINTENANT.</strong><br>',
              '<span style="color:#991B1B;">Pas dans 5 minutes. Pas dans 1h. Maintenant.</span><br>',
              '<span style="color:#666;font-size:13px;">Le lead est chaud uniquement à l\'instant T où il vient de soumettre. Quand l\'appel est fini, mets son statut à jour dans le Sheet 👌</span>',
            '</p>',
          '</td></tr>',
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

// ─── ENVOI via RESEND ───────────────────────────────────────
function sendViaResend(toArr, ccArr, subject, html, text) {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'RESEND_API_KEY_PLACEHOLDER') {
    console.error('❌ RESEND_API_KEY manquante (placeholder). Colle la vraie clé dans l\'éditeur Apps Script.');
    return false;
  }
  const payload = {
    from: RESEND_FROM,
    to: toArr,
    subject: subject,
    html: html,
    text: text,
    reply_to: RESEND_REPLY_TO,
  };
  if (ccArr && ccArr.length) payload.cc = ccArr;

  const res = UrlFetchApp.fetch('https://api.resend.com/emails', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + RESEND_API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code >= 200 && code < 300) return true;
  console.error('❌ Resend ' + code + ' : ' + res.getContentText());
  return false;
}

// Envoie UN SEUL email, au(x) destinataire(s) de NOTIFY_EMAILS (= Amine).
function notifyByEmail(program, data, closer) {
  const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim();
  const subject = '🔥 ' + program + ' · ' + (data.tier || '?') + ' · ' + (fullName || 'Lead') + (closer ? (' (→ ' + closer.name + ')') : '');
  const bodyText = buildEmailBodyText(program, data, closer);
  const bodyHtml = buildEmailBodyHtml(program, data, closer);
  const recipients = (NOTIFY_EMAILS || []).filter(Boolean);

  if (recipients.length) {
    sendViaResend(recipients, [], subject, bodyHtml, bodyText);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const program = data.program || '';
    const tabName = TAB_BY_PROGRAM[program] || FALLBACK_TAB;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) sheet = ss.insertSheet(tabName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      formatHeaderRow(sheet);
      sheet.setColumnWidths(1, HEADERS.length, 160);
    }

    const closer = pickCloserRoundRobin(program);
    const fullName = ((data.prenom || '') + ' ' + (data.nom || '')).trim() || (data.nom_complet || '');
    const ph = (val) => val && String(val).trim() !== '' ? val : PLACEHOLDER_TEXT;

    const row = [
      data.timestamp || new Date().toISOString(),
      program,
      fullName,
      data.whatsapp || '',
      ph(data.email),
      ph(data.profession),
      data.niveau_allemand || '',
      data.tier || '',
      'Nouveau',
      ph(data.wilaya),
      ph(data.adresse),
      closer ? closer.name : '',
      data.lang || '',
    ];
    sheet.appendRow(row);
    applyPlaceholderStyleToRow(sheet, sheet.getLastRow());

    notifyByEmail(program, data, closer);

    return ContentService.createTextOutput(JSON.stringify({ success: true, tab: tabName, closer: closer ? closer.name : null })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    service: 'aurel-bookings-v9-resend-amine',
    tabs: TAB_BY_PROGRAM,
    closers_configured: CLOSERS.length,
    managers_configured: (NOTIFY_EMAILS || []).filter(Boolean).length,
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HELPERS DEBUG
// ============================================================

function _diagnoseEmail() {
  console.log('🔑 Test d\'envoi via Resend (destinataire : Amine)...');
  const ok = sendViaResend(
    (NOTIFY_EMAILS || []).filter(Boolean),
    [],
    '✅ TEST Resend Aurel — ' + new Date().toLocaleTimeString(),
    '<p style="font-size:16px;">Si <strong>Amine</strong> reçoit ça, tout marche 🎉</p>',
    'Test Resend OK.'
  );
  console.log(ok ? '✅ Resend a envoyé. Vérifiez la boîte d\'Amine (+ spam).' : '❌ Échec — voir l\'erreur ci-dessus.');
}

function _resetCloserRotation() {
  const props = PropertiesService.getScriptProperties();
  CLOSERS.forEach(c => props.deleteProperty('closerCount_' + c.email));
  Object.keys(TAB_BY_PROGRAM).forEach(p => props.deleteProperty('lastCloserIdx_' + p));
  console.log('Closer counters reset.');
}

function _showCloserStats() {
  const props = PropertiesService.getScriptProperties();
  console.log('=== Stats leads par closer ===');
  CLOSERS.forEach(c => {
    const count = parseInt(props.getProperty('closerCount_' + c.email) || '0', 10);
    console.log(c.name + ' (' + c.email + ') : ' + count + ' lead(s)');
  });
}

function applyPlaceholderStyleToRow(sheet, rowIdx) {
  PLACEHOLDER_COLUMNS.forEach((col) => {
    const cell = sheet.getRange(rowIdx, col);
    const val = cell.getValue();
    if (val === PLACEHOLDER_TEXT) {
      cell.setFontColor('#9CA3AF').setFontStyle('italic').setFontSize(10);
    } else {
      cell.setFontColor('#000000').setFontStyle('normal').setFontSize(10);
    }
  });
}

function applyConditionalFormatting(sheet) {
  sheet.clearConditionalFormatRules();
  const lastRow = Math.max(1000, sheet.getLastRow() + 200);
  const rules = [];
  PLACEHOLDER_COLUMNS.forEach((col) => {
    const colLetter = String.fromCharCode(64 + col);
    const range = sheet.getRange(2, col, lastRow - 1, 1);
    const formula = '=AND(LOWER($I2)="closed",OR($' + colLetter + '2="' + PLACEHOLDER_TEXT + '",$' + colLetter + '2=""))';
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground('#FECACA')
      .setFontColor('#991B1B')
      .setRanges([range])
      .build());
  });
  sheet.setConditionalFormatRules(rules);
}

function protectCloserColumn(sheet) {
  const lastRow = Math.max(1000, sheet.getLastRow() + 200);
  const range = sheet.getRange(2, PROTECTED_COLUMN, lastRow - 1, 1);

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

  ALLOWED_EDITORS.forEach((email) => {
    try { protection.addEditor(email); } catch (e) { console.log('Cannot add editor ' + email + ': ' + e); }
  });

  const allEditors = protection.getEditors().map(u => u.getEmail()).filter(Boolean);
  const toRemove = allEditors.filter(e => !ALLOWED_EDITORS.includes(e));
  if (toRemove.length) {
    try { protection.removeEditors(toRemove); } catch (e) { console.log('removeEditors error: ' + e); }
  }

  if (protection.canDomainEdit && protection.canDomainEdit()) {
    protection.setDomainEdit(false);
  }
}

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

  if (lastRow === 0) {
    sheet.appendRow(HEADERS);
    formatHeaderRow(sheet);
    applyConditionalFormatting(sheet);
    protectCloserColumn(sheet);
    return;
  }

  const allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const oldHeaders = allValues[0].map(h => String(h).trim());
  const dataRows = allValues.slice(1);
  const oldIdx = {};
  oldHeaders.forEach((h, i) => { oldIdx[h] = i; });
  const getOld = (row, key) => oldIdx[key] !== undefined ? row[oldIdx[key]] : '';
  const wasAlreadyMigrated = oldIdx['Nom complet'] !== undefined;

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

  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.appendRow(HEADERS);
  if (newRows.length > 0) {
    sheet.getRange(2, 1, newRows.length, HEADERS.length).setValues(newRows);
  }
  formatHeaderRow(sheet);
  sheet.setColumnWidths(1, HEADERS.length, 160);

  for (let r = 2; r <= sheet.getLastRow(); r++) {
    applyPlaceholderStyleToRow(sheet, r);
  }
  applyConditionalFormatting(sheet);
  protectCloserColumn(sheet);
}

function formatHeaderRow(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#0A0A0A')
    .setFontColor('#F97316');
  sheet.setFrozenRows(1);
}
