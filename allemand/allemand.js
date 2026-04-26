// ===========================================================================
// Aurel Academy — /allemand/ — Booking form + UI + i18n (FR / AR)
// Posts to Google Apps Script webhook → Google Sheet (tab: Leads-Allemand)
// ===========================================================================
(function () {
  'use strict';

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjgOtm7NHglrwuH_f8L3PSNlIB8ijSMOGb9a2Za4tA21FfINat6NuZq0Fg7jtwVx8B/exec';
  const PHONE_REGEX = /^(\+213|0)[567]\d{8}$/;
  const STORAGE_KEY = 'aurel-lang-allemand';

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => (ctx || document).querySelectorAll(sel);

  /* ─────────── Translations ─────────── */
  const I18N = {
    fr: {
      'nav.programme': 'Programme',
      'nav.tarifs': 'Tarifs',
      'nav.faq': 'FAQ',
      'cta.reserve': 'Réserver ma place →',

      'hero.badge': '🇩🇪 Programme complet 8 mois',
      'hero.title.before': 'Allemand ',
      'hero.title.accent': 'A1 → B2',
      'hero.sub': 'De zéro à niveau B2 en 8 mois. Programme live mené par Aurel pour les Algériens qui partent travailler ou étudier en Allemagne.',
      'hero.stats.duration': '8 mois',
      'hero.stats.phases': '5 phases',
      'hero.stats.live': 'Live',
      'hero.stats.suffix': '+ Telegram privé',
      'hero.cta.primary': 'Réserver ma place →',
      'hero.cta.secondary': 'Voir le programme ▼',
      'hero.proof': '__html__<strong>50+ étudiants</strong> · 4.9/5 — placés en Ausbildung et emploi',

      'form.eyebrow': 'Réservation',
      'form.title.before': 'Réserve ta place ',
      'form.title.accent': 'maintenant',
      'form.title.suffix': '.',
      'form.lead': "On te rappelle sous 24h pour valider ton inscription et t'envoyer les infos de paiement.",

      'form.firstname.label': 'Prénom *',
      'form.firstname.placeholder': 'Ex : Amir',
      'form.lastname.label': 'Nom *',
      'form.lastname.placeholder': 'Ex : Mosbah',
      'form.whatsapp.label': 'Numéro WhatsApp *',
      'form.whatsapp.placeholder': '+213 5XX XXX XXX',
      'form.email.label': 'Email *',
      'form.email.placeholder': 'ton@email.com',
      'form.profession.label': 'Profession actuelle *',
      'form.profession.placeholder': 'Choisis ta profession',
      'form.profession.opt.student': 'Étudiant(e)',
      'form.profession.opt.employee': 'Salarié(e)',
      'form.profession.opt.unemployed': 'Sans emploi',
      'form.profession.opt.nurse': 'Infirmier / Aide-soignant',
      'form.profession.opt.doctor': 'Médecin / Profession médicale',
      'form.profession.opt.entrepreneur': 'Entrepreneur / Freelance',
      'form.profession.opt.other': 'Autre',
      'form.level.label': "Niveau d'allemand actuel *",
      'form.level.placeholder': 'Ton niveau actuel',
      'form.level.opt.zero': 'Débutant complet',
      'form.level.opt.a1': 'Quelques bases (A1)',
      'form.level.opt.a2': 'Élémentaire (A2)',
      'form.level.opt.b1': 'Intermédiaire (B1)',
      'form.level.opt.b2': 'Avancé (B2+)',
      'form.tier.label': 'Tier choisi *',
      'form.tier.std.title': 'Standard',
      'form.tier.std.price': 'Sur demande',
      'form.tier.std.desc': '5 phases A1→B2 en 8 mois · sessions live · Telegram privé.',
      'form.tier.std.feat.1': '5 phases A1 → B2 (8 mois)',
      'form.tier.std.feat.2': 'Sessions live hebdomadaires avec Aurel',
      'form.tier.std.feat.3': 'Communauté Telegram privée',
      'form.tier.std.feat.4': 'Préparation B2 (Goethe / TestDaF)',
      'form.tier.prem.title': 'Premium',
      'form.tier.prem.price': 'Sur demande',
      'form.tier.prem.exclusive': 'CERCLE PRIVÉ · 30 PLACES MAX',
      'form.tier.prem.desc': 'Coaching individuel + accompagnement Ausbildung & visa de A à Z.',
      'form.tier.prem.ribbon': '⭐ Recommandé',
      'form.tier.prem.feat.1': 'Tout Standard inclus',
      'form.tier.prem.feat.2': 'Coaching individuel hebdomadaire',
      'form.tier.prem.feat.3': 'Accompagnement Ausbildung A→Z',
      'form.tier.prem.feat.4': 'Préparation visa + simulation consulat',
      'form.tier.prem.feat.5': 'Suivi jusqu\'au premier contrat',
      'form.submit.premium': '📩 Rejoindre Premium →',
      'form.submit.standard': '📩 Réserver Standard →',
      'form.start.label': 'Quand veux-tu commencer ? *',
      'form.start.placeholder': 'Choisis une échéance',
      'form.start.opt.thisweek': 'Cette semaine',
      'form.start.opt.2weeks': 'Dans 2 semaines',
      'form.start.opt.month': 'Dans le mois',
      'form.start.opt.later': 'Plus tard',
      'form.source.label': 'Comment tu nous as connus ?',
      'form.source.placeholder': 'Optionnel',
      'form.source.opt.instagram': 'Instagram',
      'form.source.opt.tiktok': 'TikTok',
      'form.source.opt.friend': 'Ami / bouche à oreille',
      'form.source.opt.google': 'Recherche Google',
      'form.source.opt.ads': 'Ads',
      'form.source.opt.other': 'Autre',
      'form.message.label': 'Message (optionnel)',
      'form.message.placeholder': 'Une question ? Une spécificité de ta situation ?',
      'form.wilaya.label': 'Wilaya *',
      'form.wilaya.placeholder': 'Ex : Alger, Oran, Constantine…',
      'form.adresse.label': 'Adresse *',
      'form.adresse.placeholder': 'Rue, quartier, commune…',
      'form.submit.text': '📩 Réserver ma place →',
      'form.submit.loading': 'Envoi en cours…',
      'form.note': 'Tes données ne seront utilisées que pour te contacter. Aucune newsletter automatique.',
      'form.trust.1': '✓ Réponse sous 24h',
      'form.trust.2': '✓ Aucun paiement maintenant',
      'form.trust.3': '✓ Garantie 14 jours après inscription',
      'form.success.title': 'Ta réservation est bien reçue.',
      'form.success.text': 'Aurel te rappelle sous 24h sur WhatsApp pour valider ton inscription.',
      'form.success.cta': '💬 Me contacter tout de suite sur WhatsApp →',
      'form.error.text': '__html__Une erreur est survenue. Écris-nous directement sur WhatsApp : <strong>+213 555 290 826</strong>',
      'form.error.cta': '💬 Ouvrir WhatsApp',
      'form.error.required': 'Ce champ est requis',
      'form.error.invalid_phone': 'Format invalide (ex : +213 555 12 34 56)',
      'form.error.invalid_email': 'Email invalide',

      'problem.eyebrow': 'Le problème',
      'problem.title.before': 'Tu veux partir en Allemagne. ',
      'problem.title.accent': "Mais l'allemand te bloque.",
      'problem.card1.title': 'Les méthodes classiques sont trop lentes',
      'problem.card1.desc': 'Goethe Institut, manuels, apps comme Duolingo : tu progresses peut-être, mais à un rythme qui ne te mènera jamais à B2 en 8 mois.',
      'problem.card2.title': 'Les cours en ligne sont génériques',
      'problem.card2.desc': "Ils ne parlent pas de ton projet : Ausbildung, Anerkennung, Visa Schengen, démarches consulat — silence radio.",
      'problem.card3.title': 'Tu apprends seul, sans pratique réelle',
      'problem.card3.desc': "Lire des règles de grammaire ne t'apprend pas à parler. Sans interactions live, ton oral reste figé.",
      'problem.card4.title': 'Pendant ce temps, ton projet recule',
      'problem.card4.desc': 'Chaque mois sans progression = un trimestre Ausbildung manqué, un visa différé, une opportunité ratée.',

      'solution.eyebrow': 'La solution',
      'solution.title.before': 'Une formation ',
      'solution.title.accent': 'pensée pour ton projet algérien',
      'solution.title.suffix': '.',
      'solution.lead': "8 mois structurés en 5 phases. Chaque semaine : sessions live avec Aurel, exercices ciblés, feedback en groupe Telegram. À la fin, tu parles, tu écris, tu comprends — et ton dossier visa est prêt.",
      'solution.before.head': 'Avant',
      'solution.before.li1': '❌ Niveau zéro ou A1 figé depuis longtemps',
      'solution.before.li2': '❌ Pas de méthode claire pour avancer',
      'solution.before.li3': '❌ Aucune pratique orale réelle',
      'solution.before.li4': '❌ Dossier visa et lettres en français',
      'solution.before.li5': "❌ Pas d'idée du marché allemand",
      'solution.after.head': 'Après 8 mois',
      'solution.after.li1': '✅ Niveau B2 attesté, prêt pour Goethe',
      'solution.after.li2': '✅ Tu écris CV + Anschreiben en allemand',
      'solution.after.li3': '✅ Tu passes un entretien en allemand',
      'solution.after.li4': '✅ Dossier Ausbildung / visa structuré',
      'solution.after.li5': '✅ Cercle de 50+ Algériens placés',

      'prog.eyebrow': 'Le programme',
      'prog.title.accent': '5 phases',
      'prog.title.suffix': '. 8 mois. De zéro à B2.',
      'prog.lead': 'Chaque phase a un objectif précis, des sessions live hebdomadaires, et des évaluations pour valider ton avancée.',

      'prog.p1.title': 'Les Fondations — Mois 1 et 2',
      'prog.p1.meta': '2 mois · 24 sessions live',
      'prog.p1.l1': 'Alphabet, prononciation, structure des phrases simples',
      'prog.p1.l2': 'Vocabulaire du quotidien : maison, transport, alimentation',
      'prog.p1.l3': 'Conjugaison présent : verbes réguliers et irréguliers',
      'prog.p1.l4': 'Premières interactions : se présenter, demander, répondre',

      'prog.p2.title': 'Autonomie — Mois 3 et 4',
      'prog.p2.meta': '2 mois · 24 sessions live',
      'prog.p2.l1': 'Passé composé (Perfekt) et imparfait (Präteritum)',
      'prog.p2.l2': 'Vocabulaire travail, santé, démarches administratives',
      'prog.p2.l3': 'Lire des articles courts et tenir une conversation 5 min',
      'prog.p2.l4': 'Premiers exercices CV / lettre simple',

      'prog.p3.title': 'Fluidité — Mois 5 et 6',
      'prog.p3.meta': '2 mois · 24 sessions live',
      'prog.p3.l1': 'Subordonnées, conjonctions, déclinaisons avancées',
      'prog.p3.l2': 'Vocabulaire technique selon ton secteur (santé, BTP, IT, etc.)',
      'prog.p3.l3': 'Argumenter, négocier, exprimer une opinion en allemand',
      'prog.p3.l4': 'Préparation Ausbildung : entretien type, simulation de cas',

      'prog.p4.title': 'Maîtrise — Mois 7 et 8',
      'prog.p4.meta': '2 mois · 24 sessions live',
      'prog.p4.l1': 'Subjonctif, passif, structures complexes',
      'prog.p4.l2': "Compréhension d'articles longs, débats audio",
      'prog.p4.l3': "Rédaction d'essai, de lettre formelle, de motivation",
      'prog.p4.l4': "Préparation à l'examen Goethe / TestDaF / telc B2",

      'prog.p5.title': 'Préparation Pro — Continu sur les 8 mois',
      'prog.p5.meta': 'Sessions ciblées + accompagnement individuel',
      'prog.p5.l1': 'Dossier Ausbildung : CV, Anschreiben, Lebenslauf, lettre motivation',
      'prog.p5.l2': 'Rendez-vous consulat : préparation, simulation, validation papiers',
      'prog.p5.l3': 'Stratégie candidature : où postuler, comment, quand relancer',
      'prog.p5.l4': 'Codes culturels professionnels en Allemagne',

      'prog.bonus.title': '🎁 Inclus dans le programme',
      'prog.bonus.l1': '📱 Communauté Telegram privée 50+ étudiants actifs',
      'prog.bonus.l2': '🎯 Sessions live hebdomadaires avec Aurel (replay disponible)',
      'prog.bonus.l3': '📄 Templates CV + Anschreiben + lettre motivation Ausbildung',
      'prog.bonus.l4': '📘 Guide pas-à-pas dossier visa & rendez-vous consulat',
      'prog.bonus.l5': "🎓 Préparation à l'examen Goethe / TestDaF / telc B2",

      'forwhom.eyebrow': 'Pour qui',
      'forwhom.title.before': "Ce programme n'est ",
      'forwhom.title.accent': 'pas pour tout le monde',
      'forwhom.title.suffix': '.',
      'forwhom.for.head': "✅ C'est pour toi si...",
      'forwhom.for.li1': 'Tu as un projet sérieux : Ausbildung, études ou emploi en Allemagne',
      'forwhom.for.li2': 'Tu peux mettre 1 à 2h par jour pendant 8 mois',
      'forwhom.for.li3': 'Tu veux apprendre en français et arabe dialectal, pas tout en allemand',
      'forwhom.for.li4': 'Tu préfères les sessions live et le feedback humain aux apps automatiques',
      'forwhom.for.li5': 'Tu veux un cadre, pas juste des vidéos à regarder seul',
      'forwhom.notfor.head': "❌ Ce n'est pas pour toi si...",
      'forwhom.notfor.li1': "Tu cherches un cours d'allemand médical (prends plutôt Pflege)",
      'forwhom.notfor.li2': 'Tu veux apprendre seulement par curiosité, sans projet de départ',
      'forwhom.notfor.li3': 'Tu ne peux pas mettre régulièrement du temps chaque semaine',
      'forwhom.notfor.li4': "Tu attends que la formation parle pour toi — l'effort reste le tien",
      'forwhom.notfor.li5': 'Tu veux un diplôme reconnu officiel (passe par Goethe Institut directement)',

      'pricing.eyebrow': 'Tarifs',
      'pricing.title.before': 'Deux formules, ',
      'pricing.title.accent': 'un même objectif',
      'pricing.title.suffix': '.',
      'pricing.lead': 'Réserve une place pour la prochaine promo. Le détail des tarifs et les facilités de paiement sont envoyés sur WhatsApp après ta demande.',

      'tier.std.pill': 'STANDARD',
      'tier.std.tag': 'Programme complet',
      'tier.std.price': 'Sur demande',
      'tier.std.sub': 'Facilités de paiement disponibles',
      'tier.std.li1': '5 phases A1 → B2 (8 mois)',
      'tier.std.li2': 'Sessions live hebdomadaires avec Aurel',
      'tier.std.li3': 'Replays + exercices + corrections',
      'tier.std.li4': 'Communauté Telegram privée',
      'tier.std.li5': "Préparation à l'examen B2",
      'tier.std.li6': 'Templates CV + Anschreiben',
      'tier.std.cta': 'Réserver une place →',

      'tier.prem.ribbon': '⭐ Recommandé',
      'tier.prem.pill': 'PREMIUM',
      'tier.prem.tag': 'Coaching + Visa',
      'tier.prem.price': 'Sur demande',
      'tier.prem.sub': 'Coaching individuel · Accompagnement Ausbildung & visa · Places ultra-limitées',
      'tier.prem.li1': '<strong>Tout ce qui est inclus dans Standard</strong>',
      'tier.prem.li2': '<strong>Coaching individuel</strong> 30 min / semaine avec Aurel',
      'tier.prem.li3': '<strong>Accompagnement candidature Ausbildung</strong> de A à Z',
      'tier.prem.li4': '<strong>Préparation visa</strong> + simulation rendez-vous consulat',
      'tier.prem.li5': '<strong>Mise en relation</strong> avec alumni placés en Allemagne',
      'tier.prem.li6': '<strong>Suivi prioritaire</strong> jusqu\'à ton premier contrat',
      'tier.prem.cta': 'Rejoindre Premium →',
      'tier.prem.note': 'Toutes les candidatures sont étudiées — objectif qualité, pas quantité.',

      'story.eyebrow': 'À propos',
      'story.title.before': 'Pourquoi ',
      'story.title.accent': 'Aurel Academy',
      'story.title.suffix': ' ?',
      'story.h3': "2 ans à former des Algériens à l'allemand.",
      'story.body': "Je suis Aurel, fondateur d'Aurel Academy. J'ai commencé en aidant des amis qui voulaient partir en Allemagne. Deux ans plus tard, 50+ Algériens ont validé leur niveau B2 et décroché Ausbildung, Pflege ou emploi direct. La méthode est simple : on parle en français, on construit les bases pas-à-pas, et on s'entraîne en live chaque semaine. Pas de magie — juste un cadre, du sérieux, et une communauté qui avance ensemble.",
      'story.stat1.value': '50+',
      'story.stat1.label': 'Algériens placés',
      'story.stat2.value': '2 ans',
      'story.stat2.label': "d'expérience terrain",
      'story.stat3.value': '100%',
      'story.stat3.label': 'focus marché DE',

      'testi.eyebrow': 'Témoignages',
      'testi.title.before': 'Ils ont ',
      'testi.title.accent': 'commencé',
      'testi.title.suffix': ' leur aventure.',
      'testi.1.quote': "J'étais bloqué au chômage à Alger. Aujourd'hui j'ai un Ausbildung en Bavière et mon allemand est B1.",
      'testi.1.cite.name': 'Amine, 26 ans',
      'testi.1.cite.meta': 'Programme A1→B2 · Ausbildung en Bavière',
      'testi.2.quote': "L'accompagnement humain fait toute la différence. Aurel et l'équipe répondent vite, ils comprennent notre réalité.",
      'testi.2.cite.name': 'Sofiane, 24 ans',
      'testi.2.cite.meta': 'Programme A1→B2 · Visa Ausbildung en cours',
      'testi.3.quote': "J'ai économisé les 40 000 DA de cours en présentiel et j'ai plus progressé qu'avec un prof privé. Le rapport qualité-prix est imbattable.",
      'testi.3.cite.name': 'Nadia, 22 ans',
      'testi.3.cite.meta': 'Programme A1→B2 · Étudiante INFSPM Constantine',

      'faq.eyebrow': 'FAQ',
      'faq.title.before': 'Questions ',
      'faq.title.accent': 'fréquentes',
      'faq.title.suffix': '.',
      'faq.q1': "Je pars de zéro absolu, c'est possible ?",
      'faq.a1': 'Oui, le programme commence en A1. Phase 1 = bases pures (alphabet, prononciation, structure). Si tu sais lire et écrire le français, tu peux commencer.',
      'faq.q2': 'Combien de temps par jour faut-il consacrer ?',
      'faq.a2': '<strong>1 à 2h par jour</strong>, 5-6 jours par semaine. Les sessions live durent 1h. Le reste = exercices, vocabulaire, conversation Telegram. Si tu peux mettre plus, tu progresses plus vite.',
      'faq.q3': 'Quelle est la différence entre Standard et Premium ?',
      'faq.a3': 'Standard = formation complète A1→B2 en groupe live + Telegram. Premium = tout ça + coaching individuel hebdo + accompagnement personnalisé sur ton dossier Ausbildung et visa jusqu\'à ton premier contrat. Premium est recommandé si tu veux maximiser tes chances de partir vite.',
      'faq.q4': "Les sessions live, c'est à quelle heure ?",
      'faq.a4': "Le soir (généralement 19h–20h heure d'Alger) pour permettre à tous de participer après le travail / études. Toutes les sessions sont enregistrées et restent accessibles si tu rates.",
      'faq.q5': 'Si je veux passer Goethe / TestDaF, est-ce inclus ?',
      'faq.a5': "La <strong>préparation</strong> aux examens B2 (Goethe, TestDaF, telc) est incluse dans Phase B2. Le passage de l'examen lui-même se fait à l'institut Goethe ou ailleurs — frais d'inscription à l'examen non inclus.",
      'faq.q6': 'Et si je rate une session live ?',
      'faq.a6': 'Toutes les sessions sont enregistrées et disponibles en replay sous 24h. Tu peux rattraper à ton rythme. Les exercices écrits restent corrigés sur Telegram.',
      'faq.q7': 'Comment se passe le paiement ?',
      'faq.a7': 'Tu remplis le formulaire de réservation. On te rappelle sous 24h pour valider ton inscription, t\'envoyer les tarifs détaillés et les modalités (CCP / BaridiMob / Edahabia). Facilités de paiement disponibles selon le tier choisi.',
      'faq.q8': 'Garantie satisfait ou remboursé ?',
      'faq.a8': "<strong>14 jours</strong> : si dans les 14 jours après ton accès tu considères que la formation ne correspond pas à ce qui est promis, remboursement intégral, aucune question.",
      'faq.cta': '💬 Autre question ? Écris à Aurel sur WhatsApp →',

      'footer.tag': "Former la prochaine génération d'Algériens qui réussissent en Allemagne.",
      'footer.programs.title': 'Programmes',
      'footer.programs.student': 'Espace étudiant',
      'footer.contact.title': 'Contact',
      'footer.contact.whatsapp': 'WhatsApp : +213 555 290 826',
      'footer.copyright': '© 2026 Aurel Academy. Tous droits réservés.',
    },

    ar: {
      'nav.programme': 'البرنامج',
      'nav.tarifs': 'الأسعار',
      'nav.faq': 'الأسئلة',
      'cta.reserve': 'احجز مكانك ←',

      'hero.badge': '🇩🇪 برنامج كامل 8 أشهر',
      'hero.title.before': 'الألمانية ',
      'hero.title.accent': 'A1 → B2',
      'hero.sub': 'من الصفر إلى مستوى B2 في 8 أشهر. برنامج مباشر يقوده أوريل للجزائريين الذين يسافرون للعمل أو الدراسة في ألمانيا.',
      'hero.stats.duration': '8 أشهر',
      'hero.stats.phases': '5 مراحل',
      'hero.stats.live': 'مباشر',
      'hero.stats.suffix': '+ تيليغرام خاص',
      'hero.cta.primary': 'احجز مكانك ←',
      'hero.cta.secondary': 'شاهد البرنامج ▼',
      'hero.proof': '__html__<strong>50+ طالباً</strong> · 4.9/5 — تم توظيفهم في Ausbildung وفي العمل',

      'form.eyebrow': 'حجز',
      'form.title.before': 'احجز مكانك ',
      'form.title.accent': 'الآن',
      'form.title.suffix': '.',
      'form.lead': 'نتصل بك خلال 24 ساعة لتأكيد تسجيلك وإرسال معلومات الدفع.',

      'form.firstname.label': 'الاسم *',
      'form.firstname.placeholder': 'مثال : أمير',
      'form.lastname.label': 'اللقب *',
      'form.lastname.placeholder': 'مثال : مصباح',
      'form.whatsapp.label': 'رقم الواتساب *',
      'form.whatsapp.placeholder': '+213 5XX XXX XXX',
      'form.email.label': 'البريد الإلكتروني *',
      'form.email.placeholder': 'ton@email.com',
      'form.profession.label': 'المهنة الحالية *',
      'form.profession.placeholder': 'اختر مهنتك',
      'form.profession.opt.student': 'طالب(ة)',
      'form.profession.opt.employee': 'موظف(ة)',
      'form.profession.opt.unemployed': 'بدون عمل',
      'form.profession.opt.nurse': 'ممرض / مساعد ممرض',
      'form.profession.opt.doctor': 'طبيب / مهنة طبية',
      'form.profession.opt.entrepreneur': 'صاحب مشروع / Freelance',
      'form.profession.opt.other': 'أخرى',
      'form.level.label': 'مستواك في الألمانية الحالي *',
      'form.level.placeholder': 'مستواك الحالي',
      'form.level.opt.zero': 'مبتدئ تماماً',
      'form.level.opt.a1': 'بعض الأساسيات (A1)',
      'form.level.opt.a2': 'مستوى أولي (A2)',
      'form.level.opt.b1': 'مستوى متوسط (B1)',
      'form.level.opt.b2': 'مستوى متقدم (B2+)',
      'form.tier.label': 'الباقة المختارة *',
      'form.tier.std.title': 'ستاندرد',
      'form.tier.std.price': 'Sur demande',
      'form.tier.std.desc': '5 مراحل A1→B2 في 8 أشهر · جلسات مباشرة · تيليغرام خاص.',
      'form.tier.std.feat.1': '5 مراحل A1 → B2 (8 أشهر)',
      'form.tier.std.feat.2': 'جلسات مباشرة أسبوعية مع أوريل',
      'form.tier.std.feat.3': 'مجتمع تيليغرام خاص',
      'form.tier.std.feat.4': 'تحضير B2 (Goethe / TestDaF)',
      'form.tier.prem.title': 'بريميوم',
      'form.tier.prem.price': 'Sur demande',
      'form.tier.prem.exclusive': 'دائرة خاصة · 30 مكاناً فقط',
      'form.tier.prem.desc': 'مرافقة فردية + مرافقة Ausbildung وتأشيرة من الألف إلى الياء.',
      'form.tier.prem.ribbon': '⭐ موصى به',
      'form.tier.prem.feat.1': 'كل ما هو مدرج في باقة ستاندرد',
      'form.tier.prem.feat.2': 'مرافقة فردية أسبوعية',
      'form.tier.prem.feat.3': 'مرافقة Ausbildung من الألف إلى الياء',
      'form.tier.prem.feat.4': 'تحضير التأشيرة + محاكاة موعد القنصلية',
      'form.tier.prem.feat.5': 'متابعة حتى أول عقد',
      'form.submit.premium': '📩 انضم إلى بريميوم ←',
      'form.submit.standard': '📩 احجز ستاندرد ←',
      'form.start.label': 'متى تريد البدء ؟ *',
      'form.start.placeholder': 'اختر موعداً',
      'form.start.opt.thisweek': 'هذا الأسبوع',
      'form.start.opt.2weeks': 'خلال أسبوعين',
      'form.start.opt.month': 'خلال الشهر',
      'form.start.opt.later': 'لاحقاً',
      'form.source.label': 'كيف تعرفت علينا ؟',
      'form.source.placeholder': 'اختياري',
      'form.source.opt.instagram': 'إنستغرام',
      'form.source.opt.tiktok': 'تيك توك',
      'form.source.opt.friend': 'صديق / كلام شفهي',
      'form.source.opt.google': 'بحث جوجل',
      'form.source.opt.ads': 'إعلانات',
      'form.source.opt.other': 'أخرى',
      'form.message.label': 'رسالة (اختيارية)',
      'form.message.placeholder': 'سؤال ؟ خصوصية في وضعك ؟',
      'form.wilaya.label': 'الولاية *',
      'form.wilaya.placeholder': 'مثال : الجزائر، وهران، قسنطينة…',
      'form.adresse.label': 'العنوان *',
      'form.adresse.placeholder': 'الشارع، الحي، البلدية…',
      'form.submit.text': '📩 احجز مكانك ←',
      'form.submit.loading': 'جاري الإرسال…',
      'form.note': 'لن تُستخدم بياناتك إلا للتواصل معك. لا توجد رسائل تسويقية أوتوماتيكية.',
      'form.trust.1': '✓ رد خلال 24 ساعة',
      'form.trust.2': '✓ بدون أي دفع الآن',
      'form.trust.3': '✓ ضمان 14 يوماً بعد التسجيل',
      'form.success.title': 'تم استلام حجزك.',
      'form.success.text': 'سيتصل بك أوريل خلال 24 ساعة عبر الواتساب لتأكيد تسجيلك.',
      'form.success.cta': '💬 تواصل معنا الآن عبر الواتساب ←',
      'form.error.text': '__html__حدث خطأ. تواصل معنا مباشرة عبر الواتساب : <strong>+213 555 290 826</strong>',
      'form.error.cta': '💬 افتح الواتساب',
      'form.error.required': 'هذا الحقل مطلوب',
      'form.error.invalid_phone': 'تنسيق غير صالح (مثال : +213 555 12 34 56)',
      'form.error.invalid_email': 'بريد إلكتروني غير صالح',

      'problem.eyebrow': 'المشكلة',
      'problem.title.before': 'تريد السفر إلى ألمانيا. ',
      'problem.title.accent': 'لكن الألمانية تعرقلك.',
      'problem.card1.title': 'الطرق التقليدية بطيئة جداً',
      'problem.card1.desc': 'Goethe Institut، الكتب، تطبيقات مثل Duolingo : ربما تتقدم، ولكن بوتيرة لن تأخذك أبداً إلى B2 في 8 أشهر.',
      'problem.card2.title': 'الدورات على الإنترنت عامة',
      'problem.card2.desc': 'لا تتحدث عن مشروعك : Ausbildung، Anerkennung، تأشيرة Schengen، إجراءات القنصلية — صمت تام.',
      'problem.card3.title': 'تتعلم وحدك، بدون تطبيق حقيقي',
      'problem.card3.desc': 'قراءة قواعد النحو لا تعلمك التحدث. بدون تفاعلات مباشرة، تبقى ممارستك الشفهية جامدة.',
      'problem.card4.title': 'في هذا الوقت، مشروعك يتراجع',
      'problem.card4.desc': 'كل شهر بدون تقدم = فصل دراسي Ausbildung ضائع، تأشيرة مؤجلة، فرصة ضائعة.',

      'solution.eyebrow': 'الحل',
      'solution.title.before': 'تكوين ',
      'solution.title.accent': 'مصمم لمشروعك الجزائري',
      'solution.title.suffix': '.',
      'solution.lead': '8 أشهر منظمة في 5 مراحل. كل أسبوع : جلسات مباشرة مع أوريل، تمارين موجهة، ملاحظات في مجموعة تيليغرام. في النهاية، تتحدث، تكتب، تفهم — وملف تأشيرتك جاهز.',
      'solution.before.head': 'قبل',
      'solution.before.li1': '❌ مستوى صفر أو A1 مجمد منذ زمن',
      'solution.before.li2': '❌ لا توجد طريقة واضحة للتقدم',
      'solution.before.li3': '❌ لا تطبيق شفهي حقيقي',
      'solution.before.li4': '❌ ملف التأشيرة والرسائل بالفرنسية',
      'solution.before.li5': '❌ لا فكرة عن السوق الألمانية',
      'solution.after.head': 'بعد 8 أشهر',
      'solution.after.li1': '✅ مستوى B2 موثق، جاهز لـ Goethe',
      'solution.after.li2': '✅ تكتب CV + Anschreiben بالألمانية',
      'solution.after.li3': '✅ تجتاز مقابلة بالألمانية',
      'solution.after.li4': '✅ ملف Ausbildung / تأشيرة منظم',
      'solution.after.li5': '✅ دائرة من 50+ جزائرياً معيّناً',

      'prog.eyebrow': 'البرنامج',
      'prog.title.accent': '5 مراحل',
      'prog.title.suffix': '. 8 أشهر. من الصفر إلى B2.',
      'prog.lead': 'كل مرحلة لها هدف محدد، جلسات مباشرة أسبوعية، وتقييمات لتأكيد تقدمك.',

      'prog.p1.title': 'الأساسيات — الشهران 1 و 2',
      'prog.p1.meta': 'شهران · 24 جلسة مباشرة',
      'prog.p1.l1': 'الأبجدية، النطق، بنية الجمل البسيطة',
      'prog.p1.l2': 'مفردات الحياة اليومية : البيت، المواصلات، الغذاء',
      'prog.p1.l3': 'تصريف المضارع : الأفعال المنتظمة وغير المنتظمة',
      'prog.p1.l4': 'التفاعلات الأولى : التعريف بالنفس، السؤال، الإجابة',

      'prog.p2.title': 'الاستقلالية — الشهران 3 و 4',
      'prog.p2.meta': 'شهران · 24 جلسة مباشرة',
      'prog.p2.l1': 'الماضي المركب (Perfekt) والماضي البسيط (Präteritum)',
      'prog.p2.l2': 'مفردات العمل، الصحة، الإجراءات الإدارية',
      'prog.p2.l3': 'قراءة مقالات قصيرة وإجراء محادثة 5 دقائق',
      'prog.p2.l4': 'التمارين الأولى CV / رسالة بسيطة',

      'prog.p3.title': 'الطلاقة — الشهران 5 و 6',
      'prog.p3.meta': 'شهران · 24 جلسة مباشرة',
      'prog.p3.l1': 'الجمل التابعة، الروابط، التصريف المتقدم',
      'prog.p3.l2': 'مفردات تقنية حسب قطاعك (الصحة، البناء، IT، إلخ.)',
      'prog.p3.l3': 'الجدال، التفاوض، التعبير عن الرأي بالألمانية',
      'prog.p3.l4': 'تحضير Ausbildung : مقابلة نموذجية، محاكاة حالة',

      'prog.p4.title': 'الإتقان — الشهران 7 و 8',
      'prog.p4.meta': 'شهران · 24 جلسة مباشرة',
      'prog.p4.l1': 'الفعل الشرطي، المبني للمجهول، التراكيب المعقدة',
      'prog.p4.l2': 'فهم المقالات الطويلة، النقاشات الصوتية',
      'prog.p4.l3': 'كتابة مقال، رسالة رسمية، رسالة دافع',
      'prog.p4.l4': 'التحضير لامتحان Goethe / TestDaF / telc B2',

      'prog.p5.title': 'التحضير المهني — مستمر على مدى 8 أشهر',
      'prog.p5.meta': 'جلسات مستهدفة + مرافقة فردية',
      'prog.p5.l1': 'ملف Ausbildung : CV، Anschreiben، Lebenslauf، رسالة دافع',
      'prog.p5.l2': 'موعد القنصلية : التحضير، المحاكاة، التحقق من الأوراق',
      'prog.p5.l3': 'استراتيجية الترشيح : أين تتقدم، كيف، متى تتابع',
      'prog.p5.l4': 'الرموز الثقافية المهنية في ألمانيا',

      'prog.bonus.title': '🎁 مدرج في البرنامج',
      'prog.bonus.l1': '📱 مجتمع تيليغرام خاص 50+ طالباً نشطاً',
      'prog.bonus.l2': '🎯 جلسات مباشرة أسبوعية مع أوريل (إعادة المشاهدة متاحة)',
      'prog.bonus.l3': '📄 قوالب CV + Anschreiben + رسالة دافع Ausbildung',
      'prog.bonus.l4': '📘 دليل خطوة بخطوة لملف التأشيرة وموعد القنصلية',
      'prog.bonus.l5': '🎓 التحضير لامتحان Goethe / TestDaF / telc B2',

      'forwhom.eyebrow': 'لمن',
      'forwhom.title.before': 'هذا البرنامج ',
      'forwhom.title.accent': 'ليس للجميع',
      'forwhom.title.suffix': '.',
      'forwhom.for.head': '✅ هو لك إذا...',
      'forwhom.for.li1': 'لديك مشروع جدي : Ausbildung، دراسات أو عمل في ألمانيا',
      'forwhom.for.li2': 'يمكنك تخصيص 1 إلى 2 ساعة يومياً لمدة 8 أشهر',
      'forwhom.for.li3': 'تريد التعلم بالفرنسية والعربية الجزائرية، ليس كل شيء بالألمانية',
      'forwhom.for.li4': 'تفضل الجلسات المباشرة والملاحظات البشرية على التطبيقات الأوتوماتيكية',
      'forwhom.for.li5': 'تريد إطاراً، ليس فقط فيديوهات لمشاهدتها وحدك',
      'forwhom.notfor.head': '❌ ليس لك إذا...',
      'forwhom.notfor.li1': 'تبحث عن دورة ألمانية طبية (خذ Pflege بدلاً)',
      'forwhom.notfor.li2': 'تريد التعلم فقط من باب الفضول، بدون مشروع للسفر',
      'forwhom.notfor.li3': 'لا يمكنك تخصيص وقت بانتظام كل أسبوع',
      'forwhom.notfor.li4': 'تنتظر أن يتحدث التكوين عنك — الجهد يبقى لك',
      'forwhom.notfor.li5': 'تريد شهادة معترف بها رسمياً (مرّ عبر Goethe Institut مباشرة)',

      'pricing.eyebrow': 'الأسعار',
      'pricing.title.before': 'صيغتان، ',
      'pricing.title.accent': 'هدف واحد',
      'pricing.title.suffix': '.',
      'pricing.lead': 'احجز مكاناً للدفعة القادمة. تفاصيل الأسعار وتسهيلات الدفع تُرسل عبر الواتساب بعد طلبك.',

      'tier.std.pill': 'ستاندرد',
      'tier.std.tag': 'برنامج كامل',
      'tier.std.price': 'حسب الطلب',
      'tier.std.sub': 'تسهيلات الدفع متاحة',
      'tier.std.li1': '5 مراحل A1 → B2 (8 أشهر)',
      'tier.std.li2': 'جلسات مباشرة أسبوعية مع أوريل',
      'tier.std.li3': 'إعادات + تمارين + تصحيحات',
      'tier.std.li4': 'مجتمع تيليغرام خاص',
      'tier.std.li5': 'التحضير لامتحان B2',
      'tier.std.li6': 'قوالب CV + Anschreiben',
      'tier.std.cta': 'احجز مكاناً ←',

      'tier.prem.ribbon': '⭐ موصى به',
      'tier.prem.pill': 'بريميوم',
      'tier.prem.tag': 'مرافقة + تأشيرة',
      'tier.prem.price': 'حسب الطلب',
      'tier.prem.sub': 'مرافقة فردية · مرافقة Ausbildung وتأشيرة · أماكن محدودة جداً',
      'tier.prem.li1': '<strong>كل ما هو مدرج في ستاندرد</strong>',
      'tier.prem.li2': '<strong>مرافقة فردية</strong> 30 دقيقة / أسبوع مع أوريل',
      'tier.prem.li3': '<strong>مرافقة ترشيح Ausbildung</strong> من الألف إلى الياء',
      'tier.prem.li4': '<strong>تحضير التأشيرة</strong> + محاكاة موعد القنصلية',
      'tier.prem.li5': '<strong>ربط</strong> مع خرّيجين معيّنين في ألمانيا',
      'tier.prem.li6': '<strong>متابعة ذات أولوية</strong> حتى أول عقد',
      'tier.prem.cta': 'انضم إلى بريميوم ←',
      'tier.prem.note': 'تتم دراسة جميع الترشيحات — الهدف الجودة، ليس الكمية.',

      'story.eyebrow': 'عنا',
      'story.title.before': 'لماذا ',
      'story.title.accent': 'Aurel Academy',
      'story.title.suffix': ' ؟',
      'story.h3': 'سنتان في تكوين الجزائريين على الألمانية.',
      'story.body': 'أنا أوريل، مؤسس Aurel Academy. بدأت بمساعدة أصدقاء أرادوا الذهاب إلى ألمانيا. سنتان لاحقاً، أكثر من 50 جزائرياً صادقوا على مستوى B2 الخاص بهم وحصلوا على Ausbildung، Pflege أو عمل مباشر. الطريقة بسيطة : نتحدث بالفرنسية، نبني الأساسيات خطوة بخطوة، ونتدرب مباشرة كل أسبوع. لا سحر — فقط إطار، جدية، ومجتمع يتقدم معاً.',
      'story.stat1.value': '50+',
      'story.stat1.label': 'جزائري معيّن',
      'story.stat2.value': 'سنتان',
      'story.stat2.label': 'من الخبرة الميدانية',
      'story.stat3.value': '100%',
      'story.stat3.label': 'تركيز السوق الألماني',

      'testi.eyebrow': 'شهادات',
      'testi.title.before': 'لقد ',
      'testi.title.accent': 'بدؤوا',
      'testi.title.suffix': ' مغامرتهم.',
      'testi.1.quote': 'كنت محبوساً في البطالة بالجزائر العاصمة. اليوم لدي Ausbildung في بافاريا ومستوى ألمانيتي B1.',
      'testi.1.cite.name': 'أمين، 26 سنة',
      'testi.1.cite.meta': 'برنامج A1→B2 · Ausbildung في بافاريا',
      'testi.2.quote': 'الدعم الإنساني يحدث الفارق. أوريل والفريق يردون بسرعة، يفهمون واقعنا.',
      'testi.2.cite.name': 'سفيان، 24 سنة',
      'testi.2.cite.meta': 'برنامج A1→B2 · تأشيرة Ausbildung قيد المعالجة',
      'testi.3.quote': 'وفّرت 40 000 د.ج من الدورات الحضورية وتقدمت أكثر مما لو كان لدي مدرس خاص. نسبة الجودة-السعر لا تُضاهى.',
      'testi.3.cite.name': 'نادية، 22 سنة',
      'testi.3.cite.meta': 'برنامج A1→B2 · طالبة INFSPM قسنطينة',

      'faq.eyebrow': 'الأسئلة الشائعة',
      'faq.title.before': 'أسئلة ',
      'faq.title.accent': 'متكررة',
      'faq.title.suffix': '.',
      'faq.q1': 'أنا أبدأ من الصفر المطلق، هل هذا ممكن ؟',
      'faq.a1': 'نعم، البرنامج يبدأ في A1. المرحلة 1 = الأساسيات النقية (الأبجدية، النطق، البنية). إذا كنت تعرف القراءة والكتابة بالفرنسية، يمكنك البدء.',
      'faq.q2': 'كم من الوقت يومياً يجب تخصيصه ؟',
      'faq.a2': '<strong>1 إلى 2 ساعة يومياً</strong>، 5-6 أيام في الأسبوع. الجلسات المباشرة تستغرق ساعة. الباقي = تمارين، مفردات، محادثة تيليغرام. إذا أمكنك تخصيص أكثر، تتقدم أسرع.',
      'faq.q3': 'ما الفرق بين ستاندرد وبريميوم ؟',
      'faq.a3': 'ستاندرد = تكوين كامل A1→B2 في مجموعة مباشرة + تيليغرام. بريميوم = كل ذلك + مرافقة فردية أسبوعية + مرافقة شخصية على ملف Ausbildung وتأشيرة حتى أول عقد. بريميوم موصى به إذا كنت تريد تعظيم فرصك للسفر بسرعة.',
      'faq.q4': 'الجلسات المباشرة، في أي ساعة ؟',
      'faq.a4': 'في المساء (عادة 19h-20h بتوقيت الجزائر) للسماح للجميع بالمشاركة بعد العمل / الدراسات. جميع الجلسات مسجلة وتبقى متاحة إذا فاتتك.',
      'faq.q5': 'إذا أردت اجتياز Goethe / TestDaF، هل هذا مدرج ؟',
      'faq.a5': '<strong>التحضير</strong> لامتحانات B2 (Goethe، TestDaF، telc) مدرج في المرحلة B2. اجتياز الامتحان نفسه يتم في معهد Goethe أو في مكان آخر — رسوم تسجيل الامتحان غير مدرجة.',
      'faq.q6': 'وماذا لو فاتتني جلسة مباشرة ؟',
      'faq.a6': 'جميع الجلسات مسجلة ومتاحة كإعادة خلال 24 ساعة. يمكنك التعويض على وتيرتك. التمارين المكتوبة تبقى مصححة على تيليغرام.',
      'faq.q7': 'كيف يتم الدفع ؟',
      'faq.a7': 'تملأ نموذج الحجز. نتصل بك خلال 24 ساعة لتأكيد تسجيلك، إرسال الأسعار التفصيلية والطرق (CCP / BaridiMob / Edahabia). تسهيلات الدفع متاحة حسب الباقة المختارة.',
      'faq.q8': 'ضمان الرضا أو استرداد المبلغ ؟',
      'faq.a8': '<strong>14 يوماً</strong> : إذا اعتبرت خلال 14 يوماً بعد وصولك أن التكوين لا يطابق ما هو موعود به، استرداد كامل، بدون أي سؤال.',
      'faq.cta': '💬 سؤال آخر ؟ راسل أوريل عبر الواتساب ←',

      'footer.tag': 'تكوين الجيل القادم من الجزائريين الناجحين في ألمانيا.',
      'footer.programs.title': 'البرامج',
      'footer.programs.student': 'فضاء الطالب',
      'footer.contact.title': 'التواصل',
      'footer.contact.whatsapp': 'واتساب : +213 555 290 826',
      'footer.copyright': '© 2026 Aurel Academy. جميع الحقوق محفوظة.',
    },
  };

  /* ─────────── Apply language ─────────── */
  function applyLang(lang) {
    if (lang !== 'fr' && lang !== 'ar') lang = 'fr';
    const dict = I18N[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const v = dict[key];
      if (typeof v !== 'string') return;
      if (v.startsWith('__html__')) el.innerHTML = v.slice(8);
      else el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      const v = dict[key];
      if (typeof v === 'string') el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const v = dict[key];
      if (typeof v === 'string') el.placeholder = v;
    });

    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    window.__aurelLang = lang;
    window.__aurelI18n = dict;
  }

  applyLang(window.__aurelLang || 'fr');

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (btn && btn.dataset.lang) applyLang(btn.dataset.lang);
  });

  /* ─────────── Header scroll state ─────────── */
  (() => {
    const header = $('#header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ─────────── Mobile burger menu ─────────── */
  (() => {
    const burger = $('#burger');
    const menu = $('#mobileMenu');
    if (!burger || !menu) return;
    const close = () => {
      burger.classList.remove('is-open');
      menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
    };
    const open = () => {
      burger.classList.add('is-open');
      menu.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
    };
    burger.addEventListener('click', () => {
      burger.classList.contains('is-open') ? close() : open();
    });
    menu.addEventListener('click', (e) => { if (e.target.tagName === 'A') close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  })();

  /* ─────────── FAQ + modules accordion ─────────── */
  (() => {
    const items = $$('#faq-list .faq-item');
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (item.open) items.forEach((o) => { if (o !== item) o.open = false; });
      });
    });
  })();
  (() => {
    const mods = $$('#modules-list .module');
    mods.forEach((m) => {
      m.addEventListener('toggle', () => {
        if (m.open) mods.forEach((o) => { if (o !== m) o.open = false; });
      });
    });
  })();

  /* ─────────── Carousel ─────────── */
  (() => {
    const carousel = $('#carousel');
    if (!carousel) return;
    const slides = carousel.querySelectorAll('.testimonial');
    const dots = carousel.querySelectorAll('.carousel-dot');
    if (!slides.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idx = 0; let timer;
    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => {
        s.classList.toggle('is-active', i === idx);
        s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };
    const start = () => { stop(); timer = setInterval(() => go(idx + 1), 5500); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    go(0);
    if (!reduced) start();
    dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.idx)); start(); }));
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', () => { if (!reduced) start(); });
  })();

  /* ─────────── Tier preselect from CTA ─────────── */
  (() => {
    $$('[data-tier-select]').forEach((el) => {
      el.addEventListener('click', () => {
        const value = el.dataset.tierSelect;
        const radio = document.querySelector(`input[name="tier"][value="${value}"]`);
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  })();

  /* ─────────── Dual booking forms (Premium + Standard) ─────────── */
  (() => {
    const successBox = $('#booking-success');
    const errorBox   = $('#booking-error');
    const t = (key) => (window.__aurelI18n && window.__aurelI18n[key]) || I18N.fr[key] || key;

    const FIELD_DEFS = {
      prenom:          { required: true },
      nom:             { required: true },
      whatsapp:        { required: true,
                         validate: (v) => PHONE_REGEX.test(v.replace(/\s|-|\./g, ''))
                           ? null : t('form.error.invalid_phone') },
      email:           { required: true,
                         validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : t('form.error.invalid_email') },
      profession:      { required: true },
      niveau_allemand: { required: true },
      wilaya:          { required: true },
      adresse:         { required: true },
    };

    function wireForm(form) {
      if (!form) return;
      const tier = form.dataset.tier || '';
      const submitBtn = form.querySelector('.bf-submit');

      const getEl = (name) => form.querySelector(`[name="${name}"]:not([type="hidden"])`);

      const setError = (name, msg) => {
        const err = form.querySelector(`.field-error[data-for="${name}"]`);
        const el = getEl(name);
        if (msg) {
          if (el) { el.classList.add('is-invalid'); el.setAttribute('aria-invalid', 'true'); }
          if (err) { err.textContent = msg; err.classList.add('is-visible'); }
        } else {
          if (el) { el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); }
          if (err) { err.textContent = ''; err.classList.remove('is-visible'); }
        }
      };

      Object.keys(FIELD_DEFS).forEach((name) => {
        const el = getEl(name);
        if (!el) return;
        el.addEventListener('input',  () => setError(name, null));
        el.addEventListener('change', () => setError(name, null));
      });

      const collectValues = () => {
        const out = { tier };
        Object.keys(FIELD_DEFS).forEach((name) => {
          const el = getEl(name);
          out[name] = el ? (el.value || '').trim() : '';
        });
        return out;
      };

      const validate = (values) => {
        let firstInvalid = null;
        for (const name of Object.keys(FIELD_DEFS)) {
          const f = FIELD_DEFS[name];
          const v = values[name] || '';
          if (f.required && !v) {
            setError(name, t('form.error.required'));
            if (!firstInvalid) firstInvalid = getEl(name);
            continue;
          }
          if (f.validate && v) {
            const err = f.validate(v);
            if (err) {
              setError(name, err);
              if (!firstInvalid) firstInvalid = getEl(name);
              continue;
            }
          }
          setError(name, null);
        }
        return firstInvalid;
      };

      const setLoading = (loading) => {
        submitBtn.classList.toggle('is-loading', !!loading);
        submitBtn.disabled = !!loading;
      };
      const showSuccess = (payload) => {
        try {
          const params = new URLSearchParams({
            lang: (payload && payload.lang) || window.__aurelLang || 'fr',
            program: 'Allemand',
            tier: (payload && payload.tier) || '',
            p: (payload && payload.prenom) || '',
          });
          window.location.href = '/merci/?' + params.toString();
          return;
        } catch (e) {}
        document.querySelectorAll('.booking-form-card').forEach((f) => { f.hidden = true; });
        successBox.hidden = false;
        errorBox.hidden = true;
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      const showError = () => {
        errorBox.hidden = false;
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const values = collectValues();
        const firstInvalid = validate(values);
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        setLoading(true);

        const payload = {
          timestamp: new Date().toISOString(),
          program: 'Allemand',
          prenom: values.prenom,
          nom: values.nom,
          whatsapp: values.whatsapp,
          email: values.email,
          profession: values.profession,
          niveau_allemand: values.niveau_allemand,
          tier: values.tier,
          wilaya: values.wilaya,
          adresse: values.adresse,
          lang: window.__aurelLang || 'fr',
          landing_url: window.location.href,
          referrer: document.referrer || '',
          user_agent: navigator.userAgent || '',
        };

        try {
          if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'REPLACE_WITH_APPS_SCRIPT_URL') {
            console.warn('[aurel] APPS_SCRIPT_URL not set — payload NOT sent.', payload);
            setLoading(false);
            showSuccess(payload);
            return;
          }
          const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
          });
          let ok = res.ok;
          try {
            const data = await res.json();
            ok = ok && data && data.success !== false;
          } catch {}
          setLoading(false);
          if (ok) showSuccess(payload);
          else showError();
        } catch (err) {
          console.error('[aurel] submit failed', err);
          setLoading(false);
          showError();
        }
      });
    }

    document.querySelectorAll('.booking-form-card').forEach(wireForm);
  })();
})();
