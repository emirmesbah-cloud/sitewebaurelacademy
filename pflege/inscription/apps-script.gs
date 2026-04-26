// ============================================================
// AUREL ACADEMY — Réservations + Routing closers (Pflege + Allemand)
// Apps Script bound au Sheet « Aurel Academy — Réservations »
// ============================================================
//
// FONCTIONNALITÉS
// 1. Reçoit les soumissions des landings (Pflege / Allemand)
// 2. Route chaque lead vers l'onglet correspondant (Leads-Pflege / Leads-Allemand)
// 3. Assigne automatiquement chaque lead à un closer en round-robin
// 4. Envoie un email instant au closer assigné (avec toi en CC)
// 5. Si aucun closer configuré, envoie l'email à NOTIFY_EMAIL uniquement
//
// SETUP — REMPLIR CETTE SECTION
// ============================================================

// Ton email principal (tu reçois TOUS les leads en CC, même ceux assignés à un closer).
// Mets '' pour désactiver complètement les notifs.
const NOTIFY_EMAIL = 'aurel@aurel-academy.com';  // ← REMPLACE par ton vrai email

// Liste des closers de ton équipe.
// Chaque entrée :
//   - name      : prénom du closer (affiché dans le Sheet + email)
//   - email     : email du closer (recevra la notif instantanée)
//   - whatsapp  : son numéro (pour info uniquement, dans le corps de l'email)
//   - programs  : ['Pflege', 'Allemand'] = il prend les 2.
//                 ['Pflege'] = il ne reçoit que les leads Pflege.
//
// Round-robin : le 1er lead Pflege va à closer #1, le 2e à closer #2, le 3e revient au #1, etc.
// Si tu veux désactiver le routing et tout envoyer à NOTIFY_EMAIL : laisse CLOSERS = []
//
// Exemple :
// const CLOSERS = [
//   { name: 'Sara',  email: 'sara@aurel-academy.com',  whatsapp: '+213555111111', programs: ['Pflege', 'Allemand'] },
//   { name: 'Karim', email: 'karim@aurel-academy.com', whatsapp: '+213555222222', programs: ['Pflege'] },
//   { name: 'Lina',  email: 'lina@aurel-academy.com',  whatsapp: '+213555333333', programs: ['Allemand'] },
// ];

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

// Load-balancing équitable : on assigne chaque lead au closer ÉLIGIBLE qui en
// a reçu le moins jusqu'ici (tous programmes confondus).
// → Garantit une répartition strictement équitable même si le mix Pflege/Allemand
//   est déséquilibré, et même si on ajoute/retire un closer plus tard.
// Compteurs persistants dans PropertiesService (clé : closerCount_<email>).
function pickCloserRoundRobin(program) {
  const eligible = CLOSERS.filter(c => !c.programs || c.programs.length === 0 || c.programs.includes(program));
  if (eligible.length === 0) return null;

  const props = PropertiesService.getScriptProperties();

  // Lecture des compteurs actuels pour chaque closer éligible
  const stats = eligible.map((c, i) => {
    const key = 'closerCount_' + c.email;
    const count = parseInt(props.getProperty(key) || '0', 10);
    return { closer: c, count: count, idx: i, key: key };
  });

  // Tri : compteur croissant, puis ordre de la liste CLOSERS pour départager les ex-aequo
  stats.sort((a, b) => (a.count - b.count) || (a.idx - b.idx));

  const chosen = stats[0];
  props.setProperty(chosen.key, String(chosen.count + 1));
  return chosen.closer;
}

function buildEmailBody(program, data, closer) {
  const lines = [
    '🔥 Nouveau lead ' + program + ' — ' + (data.tier || ''),
    '',
    closer ? ('Tu as été assigné·e à ce lead, ' + closer.name + '.') : '(Aucun closer configuré)',
    '',
    '─────────────────────────────',
    'Nom        : ' + (data.prenom || '') + ' ' + (data.nom || ''),
    'WhatsApp   : ' + (data.whatsapp || ''),
    'Email      : ' + (data.email || ''),
    '',
    'Profession : ' + (data.profession || ''),
    'Niveau DE  : ' + (data.niveau_allemand || ''),
    'Wilaya     : ' + (data.wilaya || ''),
    'Adresse    : ' + (data.adresse || ''),
    '',
    'Tier       : ' + (data.tier || ''),
    'Langue     : ' + (data.lang || ''),
    'Source     : ' + (data.landing_url || ''),
    '─────────────────────────────',
    '',
    'Action : appelle/whatsappe ce lead sous 1h.',
    'Mets à jour son statut dans le Sheet quand tu as terminé.',
  ];
  return lines.join('\n');
}

function notifyByEmail(program, data, closer) {
  const subject = '🔥 Nouveau lead ' + program + ' — ' + (data.prenom || '?') +
                  (closer ? (' (assigné à ' + closer.name + ')') : '');
  const body = buildEmailBody(program, data, closer);

  // Cas 1 : closer assigné → email au closer + CC toi
  if (closer && closer.email) {
    try {
      const opts = { to: closer.email, subject: subject, body: body };
      if (NOTIFY_EMAIL) opts.cc = NOTIFY_EMAIL;
      MailApp.sendEmail(opts);
    } catch (err) { console.error('Closer mail error', err); }
    return;
  }

  // Cas 2 : pas de closer → email direct à toi
  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: body });
    } catch (err) { console.error('Notify mail error', err); }
  }
}

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

    // Assign a closer (round-robin)
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
      service: 'aurel-bookings-v3',
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
  // Reset les compteurs de leads par closer (utile si tu modifies la liste CLOSERS).
  const props = PropertiesService.getScriptProperties();
  // Supprime les nouveaux compteurs (load-balancing par closer)
  CLOSERS.forEach(c => props.deleteProperty('closerCount_' + c.email));
  // Et les anciens (round-robin par programme), au cas où.
  Object.keys(TAB_BY_PROGRAM).forEach(p => props.deleteProperty('lastCloserIdx_' + p));
  console.log('Closer counters reset for all closers and programs.');
}

function _showCloserStats() {
  // Affiche le nombre de leads reçus par chaque closer (logs de l'éditeur Apps Script).
  const props = PropertiesService.getScriptProperties();
  console.log('=== Stats leads par closer ===');
  CLOSERS.forEach(c => {
    const count = parseInt(props.getProperty('closerCount_' + c.email) || '0', 10);
    console.log(c.name + ' (' + c.email + ') : ' + count + ' lead(s)');
  });
}
