// ============================================================
// AUREL ACADEMY — Réservations + Routing closers (Pflege + Allemand)
// Apps Script bound au Sheet « Aurel Academy — Réservations »
// v5 — Friendly email + appel direct (tel: link) + form 3 champs
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

// Ton email principal (tu reçois TOUS les leads en CC, même ceux assignés à un closer).
// Mets '' pour désactiver complètement les notifs.
const NOTIFY_EMAIL = 'aurel@aurel-academy.com';  // ← REMPLACE par ton vrai email

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
];

// ============================================================
// CODE — NE PAS MODIFIER EN DESSOUS (sauf si tu sais ce que tu fais)
// ============================================================

const TAB_BY_PROGRAM = {
  'Pflege':   'Leads-Pflege',
  'Allemand': 'Leads-Allemand',
};
const FALLBACK_TAB = 'Leads';

const HEADERS = [
  'Timestamp',
  'Programme',
  'Prénom',
  'Nom',
  'WhatsApp',
  'Email',
  'Profession',
  'Niveau DE',
  'Tier',
  'Wilaya',
  'Adresse',
  'Statut',
  'Closer assigné',
  'Lang',
  'URL landing',
  'Referrer',
  'User Agent',
];

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

  // Cas 1 : closer assigné → email au closer + CC toi
  if (closer && closer.email) {
    try {
      const opts = {
        to: closer.email,
        subject: subject,
        body: bodyText,
        htmlBody: bodyHtml,
        name: 'Aurel Academy — Leads',
      };
      if (NOTIFY_EMAIL) opts.cc = NOTIFY_EMAIL;
      MailApp.sendEmail(opts);
    } catch (err) { console.error('Closer mail error', err); }
    return;
  }

  // Cas 2 : pas de closer → email direct à toi
  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
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

    const row = [
      data.timestamp || new Date().toISOString(),
      program,
      data.prenom || '',
      data.nom || '',
      data.whatsapp || '',
      data.email || '',
      data.profession || '',
      data.niveau_allemand || '',
      data.tier || '',
      data.wilaya || '',
      data.adresse || '',
      'Nouveau',
      closer ? closer.name : '',
      data.lang || '',
      data.landing_url || '',
      data.referrer || '',
      data.user_agent || '',
    ];
    sheet.appendRow(row);

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
      service: 'aurel-bookings-v4',
      tabs: TAB_BY_PROGRAM,
      closers_configured: CLOSERS.length,
      notify_email_set: !!NOTIFY_EMAIL,
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
