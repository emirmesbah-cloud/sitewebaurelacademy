// ===========================================================================
// Aurel Academy — /pflege/inscription/ — Booking form + UI
// Posts to Google Apps Script webhook → Google Sheet
// ===========================================================================
(function () {
  'use strict';

  // Apps Script Web App webhook → Google Sheet
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjgOtm7NHglrwuH_f8L3PSNlIB8ijSMOGb9a2Za4tA21FfINat6NuZq0Fg7jtwVx8B/exec';

  const WHATSAPP_NUMBER = '213555290826';
  const PHONE_REGEX = /^(\+213|0)[567]\d{8}$/;
  const STORAGE_KEY = 'aurel-lang-pflege';

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => (ctx || document).querySelectorAll(sel);

  /* ─────────── Translations ─────────── */
  const I18N = {
    fr: {
      'nav.programme': 'Programme',
      'nav.tarifs': 'Tarifs',
      'nav.faq': 'FAQ',
      'cta.reserve': 'Je veux réserver ma place →',

      'hero.badge': '🇩🇪 Spécial Algériens du métier de la santé',
      'hero.title.before': 'Devenez infirmier en Allemagne ',
      'hero.title.accent': 'en 8 semaines',
      'hero.sub': "Programme spécialisé pour infirmiers et aides-soignants algériens. Tu apprends l'allemand médical réel (pas du Goethe générique), tu montes ton dossier Anerkennung tout seul, et tu décroches ton premier contrat dans un Pflegeheim allemand.",
      'hero.stats.modules': '10 modules',
      'hero.stats.lessons': '18 leçons',
      'hero.stats.duration': '4h30',
      'hero.stats.suffix': 'de contenu chirurgical',
      'hero.cta.primary': 'Je veux réserver ma place →',
      'hero.cta.secondary': 'Voir comment ça marche ▼',
      'hero.proof': '✓ Garantie résultat 90 jours · ✓ 100% en ligne · ✓ Conçu par un Algérien',

      'form.eyebrow': 'Réservation',
      'form.title.before': 'Bloque ta place ',
      'form.title.accent': 'avant fermeture',
      'form.title.suffix': '.',
      'form.lead': "Cohorte limitée. Aurel suit personnellement chaque membre Accompagné jusqu'à signature de ton contrat allemand. Au-delà, la qualité tombe — c'est non-négociable.",

      'form.fullname.label': 'Nom complet *',
      'form.fullname.placeholder': 'Ex : Amir Mosbah',
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
      'form.profession.opt.nurse': 'Infirmier diplômé',
      'form.profession.opt.aide': 'Aide-soignant',
      'form.profession.opt.student': 'Étudiant en santé',
      'form.profession.opt.doctor': 'Médecin',
      'form.profession.opt.other_med': 'Autre profession médicale',
      'form.profession.opt.career_change': 'Reconversion',
      'form.level.label': "Niveau d'allemand *",
      'form.level.placeholder': 'Ton niveau actuel',
      'form.level.opt.zero': 'Débutant complet',
      'form.level.opt.a1': 'Quelques bases (A1)',
      'form.level.opt.a2': 'Élémentaire (A2)',
      'form.level.opt.b1': 'Intermédiaire (B1)',
      'form.level.opt.b2': 'Avancé (B2+)',
      'form.tier.label': 'Tier choisi *',
      'form.tier.au.title': 'Autonome',
      'form.tier.au.price': '12900 DA',
      'form.tier.au.desc': "Tu es discipliné, tu as déjà un peu d'allemand (A2+), tu n'as pas besoin d'être tenu par la main. Paiement unique · Accès à vie.",
      'form.tier.au.feat.1': '18 leçons vidéo (4h30 chirurgicales)',
      'form.tier.au.feat.2': 'Glossaire 150 termes médicaux trilingue (DE/FR/AR)',
      'form.tier.au.feat.3': 'Guide Anerkennung trilingue par Land + liste de 30 Pflegeheim qui recrutent',
      'form.tier.au.feat.4': 'Templates CV + Anschreiben validés par recruteurs · Accès cercle Telegram',
      'form.tier.ac.title': 'Accompagné',
      'form.tier.ac.price': '42800 DA',
      'form.tier.ac.exclusive': 'CERCLE PRIVÉ · 7 PLACES RESTANTES SUR 30',
      'form.tier.ac.desc': "Aurel te suit personnellement chaque semaine en live + WhatsApp prioritaire jusqu'à signature de ton contrat. Les Accompagné signent 2,3× plus vite.",
      'form.tier.ac.ribbon': '⭐ Recommandé par 9 inscrits sur 10',
      'form.tier.ac.feat.1': 'TOUT le contenu Autonome inclus',
      'form.tier.ac.feat.2': '8 sessions live coaching avec Aurel (1/semaine pendant 8 semaines)',
      'form.tier.ac.feat.3': "WhatsApp prioritaire jusqu'à signature de ton contrat allemand",
      'form.tier.ac.feat.4': 'Suivi personnalisé de ton dossier Anerkennung + simulation 1-1 la veille de ton vrai entretien',
      'form.submit.premium': '📩 Rejoindre le cercle privé Accompagné →',
      'form.submit.standard': '📩 Je prends Autonome →',
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
      'form.submit.text': '📩 Je veux réserver ma place →',
      'form.submit.loading': 'Envoi en cours…',
      'form.note': "Tes données ne seront utilisées que pour te contacter. Aucune newsletter automatique.",
      'form.trust.1': '✓ Garantie 90 jours résultat',
      'form.trust.2': '✓ Aucun paiement maintenant',
      'form.trust.3': '✓ Cohorte ferme bientôt — réponse sous 24h',
      'form.success.title': 'Ta réservation est bien reçue.',
      'form.success.text': 'Aurel te rappelle sous 24h sur WhatsApp pour valider ton inscription.',
      'form.success.cta': '💬 Me contacter tout de suite sur WhatsApp →',
      'form.error.text': '__html__Une erreur est survenue. Écris-nous directement sur WhatsApp : <strong>+213 555 290 826</strong>',
      'form.error.cta': '💬 Ouvrir WhatsApp',
      'form.error.required': 'Ce champ est requis',
      'form.error.invalid_phone': 'Format invalide (ex : +213 555 12 34 56)',
      'form.error.invalid_email': 'Email invalide',

      'problem.eyebrow': 'Le problème',
      'problem.title.before': 'Tu lis ça et ',
      'problem.title.accent': 'tu te reconnais.',
      'problem.card1.title': "Mur 1 — 18 mois d'allemand sans savoir dire « tension artérielle »",
      'problem.card1.desc': "Goethe Institut t'apprend à commander un café à Berlin. Pas à expliquer à une famille que sa mère a fait un AVC. Le vocabulaire médical n'est NULLE PART dans les cours classiques.",
      'problem.card2.title': 'Mur 2 — Les agences te facturent 300 à 800€ pour un dossier générique',
      'problem.card2.desc': "Tu paies ce qu'un infirmier algérien gagne en 2 mois… pour un PDF qu'elles envoient à 50 autres candidats. Et si ton dossier est rejeté, elles ne te remboursent pas.",
      'problem.card3.title': "Mur 3 — L'Anerkennung est un labyrinthe",
      'problem.card3.desc': "Chaque Land allemand a ses règles. Tu remplis 30 pages, tu envoies, tu attends 6 mois… et tu reçois un refus parce qu'il manquait un tampon.",
      'problem.card4.title': "Mur 4 — Tu rates ton premier entretien parce que tu n'as jamais simulé",
      'problem.card4.desc': "Le recruteur dit : « Une patiente de 78 ans tombe de son lit, qu'est-ce que tu fais ? » En allemand, à l'oral, en 30 secondes. Tu blanches. Tu loupes. Tu rentres chez toi.",

      'solution.eyebrow': 'La solution',
      'solution.title.p1': 'La ',
      'solution.title.accent1': 'Méthode A→D',
      'solution.title.p2': ' — Algeria → ',
      'solution.title.accent2': 'Deutschland',
      'solution.title.p3': '.',
      'solution.lead': "Le seul système qui combine 3 piliers chirurgicaux pour t'amener du salon de ta mère au Pflegeheim allemand en 6 mois. Conçu par un Algérien qui a fait le chemin.",
      'solution.before.head': 'Avant la Méthode A→D',
      'solution.before.li1': '❌ Vocabulaire médical introuvable nulle part',
      'solution.before.li2': '❌ Tu blanches devant le recruteur Pflegeheim',
      'solution.before.li3': '❌ Anerkennung rejetée pour un tampon manquant',
      'solution.before.li4': '❌ Agences qui te facturent 800€ pour un PDF',
      'solution.before.li5': '❌ Tu vois Mounia partir à Stuttgart, Karim à Düsseldorf — toi tu attends',
      'solution.after.head': 'Après la Méthode A→D',
      'solution.after.li1': '✅ 150 termes médicaux que tu utilises 50× par jour au boulot',
      'solution.after.li2': "✅ 15 simulations Pflegeheim — tu n'auras pas peur",
      'solution.after.li3': '✅ Dossier Anerkennung monté seul en 3 semaines',
      'solution.after.li4': '✅ Sans agence. Sans 800€. Sans intermédiaire.',
      'solution.after.li5': '✅ +380 000 DA/mois (€2 800) au lieu de 50 000 DA',

      'prog.eyebrow': 'Le programme',
      'prog.title.accent': '10 modules',
      'prog.title.suffix': '. 18 leçons. 4h30 de contenu chirurgical. Zéro remplissage.',
      'prog.lead': "Chaque module a un chiffre, un livrable concret, et UNE promesse de résultat.",
      'prog.m0.title': 'Introduction',
      'prog.m0.meta': '1 vidéo · 8 min',
      'prog.m0.l1': "La carte du parcours : où tu pars, où tu arrives, par quels jalons",
      'prog.mA.title': 'Réalité du secteur Pflege en Allemagne',
      'prog.mA.meta': '2 vidéos · 26–30 min',
      'prog.mA.l1': "Salaires réels par Land · types de Pflegeheim · hiérarchie · rythme de travail",
      'prog.mA.l2': 'Tu sauras dans quoi tu mets les pieds : Altenpflege / Krankenpflege / Betreuungskraft',
      'prog.m1.title': 'Vocabulaire médical essentiel',
      'prog.m1.meta': '2 vidéos · 20 min',
      'prog.m1.l1': "75 termes cliniques prioritaires triés par fréquence d'usage réel (trilingue DE/FR/DAR)",
      'prog.m1.l2': '75 termes anatomie + pathologies + gestes + médicaments + urgences',
      'prog.m2.title': 'Communication avec patients',
      'prog.m2.meta': '1 vidéo · 15 min',
      'prog.m2.l1': "Comment annoncer une nouvelle, rassurer une famille, expliquer un soin — phrases prêtes à l'emploi",
      'prog.m3.title': "Communication avec l'équipe",
      'prog.m3.meta': '1 vidéo · 15 min',
      'prog.m3.l1': 'Übergabe, handover, Besprechung : le langage entre soignants + comment passer une transmission qui impressionne',
      'prog.mD.title': 'Dokumentation / Pflegebericht',
      'prog.mD.meta': '2 vidéos · 26–30 min',
      'prog.mD.l1': "Le squelette d'un Pflegebericht parfait — templates fournis, tu écris ton premier rapport en 20 min",
      'prog.mD.l2': 'Abréviations et codes officiels utilisés dans les Pflegeheim allemands',
      'prog.m4.title': 'Entretien recruteur Pflegeheim',
      'prog.m4.meta': '2 vidéos · 20 min',
      'prog.m4.l1': "Les 15 questions qui reviennent à 90% des entretiens — comment y répondre, le ton, le rythme, les pièges",
      'prog.m4.l2': 'Stratégie de réponse + copies types en allemand validées par recruteurs',
      'prog.mC.title': 'Simulations complètes',
      'prog.mC.meta': '3 vidéos · 42–51 min',
      'prog.mC.l1': "5 entretiens reproduits en intégralité — tu joues le rôle, tu trembles, tu rates, tu recommences",
      'prog.mC.l2': "Quand le vrai recruteur arrive, tu as déjà passé 15 entretiens dans ta tête. Tu n'auras pas peur.",
      'prog.mC.l3': "Gestion de conflit, situation d'urgence, journée type Pflegeheim",
      'prog.mB.title': 'Anerkennung (reconnaissance diplôme)',
      'prog.mB.meta': '3 vidéos · 42–51 min',
      'prog.mB.l1': "Quels papiers réunir en Algérie (liste exacte) + quelle Behörde contacter selon ton Land",
      'prog.mB.l2': "Timeline réelle + coûts réels — ce que les agences te cachent pour te facturer 800€",
      'prog.mB.l3': "Tu montes ton dossier en 3 semaines. Sans agence. Sans 800€. Sans intermédiaire.",
      'prog.m5.title': "Conclusion & plan d'action",
      'prog.m5.meta': '1 vidéo · 5 min',
      'prog.m5.l1': 'Ta roadmap concrète des 90 prochains jours, semaine par semaine',
      'prog.bonus.title': '🎁 Le stack de valeur — inclus dans tous les tiers',
      'prog.bonus.l1': '📖 Glossaire PDF 150 termes médicaux trilingue (DE/FR/AR) — valeur 25 000 DA',
      'prog.bonus.l2': '🎯 Interview Prep Trainer · 15 questions interactives — valeur 30 000 DA',
      'prog.bonus.l3': '📄 Templates CV + Anschreiben en allemand validés par recruteurs — valeur 15 000 DA',
      'prog.bonus.l4': "📘 Guide Anerkennung trilingue par Land (économise 800€ d'agence) — valeur 80 000 DA",
      'prog.bonus.l5': '🏥 Liste de 30 Pflegeheim qui recrutent maintenant + contacts directs — valeur 40 000 DA',

      'forwhom.eyebrow': 'Pour qui',
      'forwhom.title.before': "Cette formation n'est ",
      'forwhom.title.accent': 'pas pour tout le monde',
      'forwhom.title.suffix': '. Lis honnêtement.',
      'forwhom.for.head': "✅ C'EST POUR TOI SI…",
      'forwhom.for.li1': 'Tu es infirmier diplômé, aide-soignant ou étudiant en santé',
      'forwhom.for.li2': "Tu as déjà un minimum d'allemand (A1/A2) ou tu es prêt à l'acquérir en 2 mois en parallèle",
      'forwhom.for.li3': 'Tu veux un poste concret dans un Pflegeheim allemand, pas un visa touristique',
      'forwhom.for.li4': 'Tu peux mettre 1h30 à regarder les vidéos + 1h-2h/jour à pratiquer',
      'forwhom.for.li5': 'Tu préfères apprendre avec un Algérien qui a fait le chemin plutôt qu\'un prof allemand',
      'forwhom.notfor.head': "❌ CE N'EST PAS POUR TOI SI…",
      'forwhom.notfor.li1': "Tu cherches un cours d'allemand généraliste (prends Goethe A1-A2)",
      'forwhom.notfor.li2': "Tu veux un diplôme reconnu par l'État allemand (ce n'est pas Goethe, on te prépare)",
      'forwhom.notfor.li3': "Tu n'as aucune motivation réelle pour partir (la formation ne te motivera pas à ta place)",
      'forwhom.notfor.li4': 'Tu veux qu\'une agence fasse ton dossier à ta place (prends une agence à 800€)',
      'forwhom.notfor.li5': 'Tu ne supportes pas qu\'on te dise la vérité crûment',

      'pricing.eyebrow': 'Tarifs',
      'pricing.title.before': 'Choisis ton ',
      'pricing.title.accent': 'chemin',
      'pricing.title.suffix': '.',
      'pricing.lead': "Tu fermes cet onglet → dans 12 mois tu seras au même endroit, ~40 000€ de salaire allemand non gagné. Tu réserves ta place → en 6 mois tu signes ton contrat. Le calcul est froid.",

      'tier.au.pill': 'AUTONOME',
      'tier.au.tag': 'Self-paced',
      'tier.au.price.amount': '12 900',
      'tier.au.price.currency': 'DA',
      'tier.au.sub': 'Paiement unique · Accès à vie · Tu te débrouilles',
      'tier.au.li1': 'Les 18 leçons vidéo (4h30 chirurgicales)',
      'tier.au.li2': 'Le glossaire 150 termes médicaux trilingue (DE/FR/AR)',
      'tier.au.li3': 'Le guide Anerkennung trilingue par Land + liste de 30 Pflegeheim qui recrutent',
      'tier.au.li4': 'Les templates CV + Anschreiben validés + accès cercle Telegram',
      'tier.au.cta': 'Je prends Autonome →',

      'tier.ac.ribbon': '⭐ Recommandé par 9 inscrits sur 10',
      'tier.ac.pill': 'ACCOMPAGNÉ',
      'tier.ac.tag': '7 places restantes sur 30',
      'tier.ac.price.amount': '42 800',
      'tier.ac.price.currency': 'DA',
      'tier.ac.sub': "Cercle privé · Aurel te suit personnellement jusqu'à signature · Les Accompagné signent 2,3× plus vite",
      'tier.ac.li1': '<strong>TOUT le contenu Autonome inclus</strong>',
      'tier.ac.li2': '<strong>8 sessions live coaching avec Aurel</strong> (1/semaine pendant 8 semaines)',
      'tier.ac.li3': '<strong>WhatsApp prioritaire</strong> jusqu\'à signature de ton contrat allemand',
      'tier.ac.li4': '<strong>Suivi personnalisé</strong> de ton dossier Anerkennung + simulation 1-1 la veille de ton vrai entretien',
      'tier.ac.cta': 'Rejoindre le cercle privé →',
      'tier.ac.note': "Au-delà de 30 inscrits, la qualité du suivi tombe. C'est non-négociable.",

      'story.eyebrow': 'À propos',
      'story.title.before': 'Le formateur que tu cherchais ',
      'story.title.accent': "sans savoir qu'il existait",
      'story.title.suffix': '.',
      'story.lead': "+5 ans d'expérience en éducation de langue allemande · +100 élèves suivis · Algérien qui a fait le chemin.",
      'why.f1.title': 'Conçu par un Algérien, pour les Algériens',
      'why.f1.desc': "Cours en français pour comprendre (parfois en arabe pour clarifier), exercices et simulations en allemand pour ancrer. La méthode qui réduit la charge cognitive.",
      'why.f2.title': "Vocabulaire chirurgical, pas générique",
      'why.f2.desc': "150 termes médicaux sélectionnés à partir de vrais Pflegebericht écrits par des infirmiers en Allemagne. Pas de mot inutile. Pas de Goethe. Juste ce que tu vas dire 50× par jour au boulot.",
      'why.f3.title': '100% en ligne, depuis ton village',
      'why.f3.desc': "Vidéos accessibles 24/7, supports téléchargeables, exercices d'application. Tu apprends depuis Alger, Oran, Constantine — ou ton village. Aucun déplacement, aucune excuse.",
      'why.f4.title': "15 simulations d'entretien intensives",
      'why.f4.desc': "Tu joues le rôle. Tu trembles. Tu rates. Tu recommences. Quand le vrai recruteur arrive, tu as déjà passé 15 entretiens dans ta tête. Tu n'auras pas peur.",
      'why.f5.title': 'Dossier Anerkennung autonome',
      'why.f5.desc': "Guide trilingue (FR/AR/DE) par Land allemand. Tu choisis ton Land, tu suis la checklist, tu montes ton dossier en 3 semaines. Sans agence. Sans 800€. Sans intermédiaire.",
      'why.f6.title': "Cercle privé d'apprenants Aurel",
      'why.f6.desc': "Espace Telegram où on partage les Pflegeheim qui recrutent en temps réel, on s'entraîne ensemble, on s'entraide. Tu n'es plus seul sur le chemin.",

      'faq.eyebrow': 'FAQ',
      'faq.title.before': 'Questions ',
      'faq.title.accent': 'fréquentes',
      'faq.title.suffix': '.',
      'faq.q1': 'Il faut déjà parler allemand pour suivre ?',
      'faq.a1': "A1 vraiment basique suffit pour démarrer. Si tu es totalement débutant, on te recommande 6-8 semaines de Goethe A1 en parallèle (gratuit sur YouTube, on te donne la playlist). À partir d'A2, tu peux entrer dans la formation.",
      'faq.q2': 'Combien de temps pour décrocher mon premier entretien Pflegeheim ?',
      'faq.a2': "La moyenne de nos inscrits Accompagné : 3 à 5 mois. Certains plus tôt (Yacine en 4 mois), d'autres plus tard selon leur niveau de départ et leur rythme.",
      'faq.q3': 'Je suis aide-soignant, pas infirmier diplômé. Ça marche pour moi ?',
      'faq.a3': "Oui — et c'est même un avantage. L'Allemagne manque cruellement d'aides-soignants. Ton profil est demandé, on adapte ta stratégie de candidature.",
      'faq.q4': 'Quelle est la vraie différence entre Autonome et Accompagné ?',
      'faq.a4': "Autonome = tu reçois tout le contenu, tu te débrouilles. Accompagné = tu reçois le contenu + Aurel te suit personnellement chaque semaine en live + WhatsApp prioritaire jusqu'à ton contrat. Statistique : les Accompagné signent 2,3× plus vite.",
      'faq.q5': 'Comment se passe le paiement ?',
      'faq.a5': "Virement bancaire (RIB envoyé après inscription) ou paiement en espèces sur Alger. Aucun paiement au moment de l'inscription — tu réserves ta place, on confirme avec toi sous 24h.",
      'faq.q6': 'Les vidéos sont en français ou en allemand ?',
      'faq.a6': "Les explications sont en français (parfois en arabe pour clarifier). Les exemples, dialogues et simulations sont en allemand. C'est le meilleur mix pour apprendre vite.",
      'faq.q7': 'Il y a un certificat à la fin ?',
      'faq.a7': "Oui, un certificat de complétion Aurel Academy. Ce n'est pas un diplôme officiel Goethe, mais un document professionnel qui montre ton engagement spécifique pour le secteur Pflege.",
      'faq.q8': "Et si j'échoue ? Je peux me faire rembourser ?",
      'faq.a8': "<strong>Garantie résultat 90 jours</strong> : si dans les 90 jours après ton accès tu considères que la formation ne correspond pas à ce qui est promis, remboursement intégral, aucune question.",
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
      'cta.reserve': 'أريد حجز مكاني ←',

      'hero.badge': '🇩🇪 خاص بالجزائريين العاملين في الصحة',
      'hero.title.before': 'كن ممرضاً في ألمانيا ',
      'hero.title.accent': 'في 8 أسابيع',
      'hero.sub': 'برنامج متخصّص للممرضين ومساعدي التمريض الجزائريين. تتعلّم الألمانية الطبية الحقيقية (وليس Goethe العام)، تجهّز ملف Anerkennung بنفسك، وتحصل على أول عقد في Pflegeheim ألماني.',
      'hero.stats.modules': '10 وحدات',
      'hero.stats.lessons': '18 درساً',
      'hero.stats.duration': '4 ساعات و30 دقيقة',
      'hero.stats.suffix': 'من المحتوى الجراحي',
      'hero.cta.primary': 'أريد حجز مكاني ←',
      'hero.cta.secondary': 'شاهد كيف يعمل ▼',
      'hero.proof': '✓ ضمان النتيجة 90 يوماً · ✓ 100٪ عبر الإنترنت · ✓ صُمّم من قِبل جزائري',

      'form.eyebrow': 'حجز',
      'form.title.before': 'احجز مكانك ',
      'form.title.accent': 'قبل الإغلاق',
      'form.title.suffix': '.',
      'form.lead': 'دفعة محدودة. يتابع أوريل شخصياً كل عضو في باقة « مرافَق » حتى توقيع عقدك الألماني. بعد ذلك، تنخفض الجودة — هذا غير قابل للتفاوض.',

      'form.fullname.label': 'الاسم الكامل *',
      'form.fullname.placeholder': 'مثال : أمير مصباح',
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
      'form.profession.opt.nurse': 'ممرض مختص',
      'form.profession.opt.aide': 'مساعد ممرض',
      'form.profession.opt.student': 'طالب في الصحة',
      'form.profession.opt.doctor': 'طبيب',
      'form.profession.opt.other_med': 'مهنة طبية أخرى',
      'form.profession.opt.career_change': 'إعادة توجيه مهني',
      'form.level.label': 'مستواك في الألمانية *',
      'form.level.placeholder': 'مستواك الحالي',
      'form.level.opt.zero': 'مبتدئ تماماً',
      'form.level.opt.a1': 'بعض الأساسيات (A1)',
      'form.level.opt.a2': 'مستوى أولي (A2)',
      'form.level.opt.b1': 'مستوى متوسط (B1)',
      'form.level.opt.b2': 'مستوى متقدم (B2+)',
      'form.tier.label': 'الباقة المختارة *',
      'form.tier.au.title': 'مستقل',
      'form.tier.au.price': '12900 DA',
      'form.tier.au.desc': 'أنت منضبط، لديك بعض الألمانية (A2+)، لا تحتاج من يأخذ بيدك. دفعة واحدة · وصول مدى الحياة.',
      'form.tier.au.feat.1': '18 درساً فيديو (4 ساعات و30 دقيقة جراحية)',
      'form.tier.au.feat.2': 'معجم 150 مصطلحاً طبياً ثلاثي اللغات (DE/FR/AR)',
      'form.tier.au.feat.3': 'دليل Anerkennung ثلاثي اللغات حسب Land + قائمة 30 Pflegeheim توظف',
      'form.tier.au.feat.4': 'قوالب CV + Anschreiben معتمدة من المشغّلين · ولوج إلى دائرة Telegram',
      'form.tier.ac.title': 'مرافَق',
      'form.tier.ac.price': '42800 DA',
      'form.tier.ac.exclusive': 'دائرة خاصة · 7 أماكن متبقية من 30',
      'form.tier.ac.desc': 'يتابعك أوريل شخصياً كل أسبوع في حصة Live + واتساب ذات أولوية حتى توقيع عقدك. المرافَقون يوقّعون 2.3× أسرع.',
      'form.tier.ac.ribbon': '⭐ موصى به من 9 من 10 مسجلين',
      'form.tier.ac.feat.1': 'كل محتوى « مستقل » مدرج',
      'form.tier.ac.feat.2': '8 جلسات Live coaching مع أوريل (واحدة أسبوعياً لمدة 8 أسابيع)',
      'form.tier.ac.feat.3': 'واتساب ذات أولوية حتى توقيع عقدك الألماني',
      'form.tier.ac.feat.4': 'متابعة شخصية لملف Anerkennung + محاكاة 1-1 ليلة مقابلتك الحقيقية',
      'form.submit.premium': '📩 انضم إلى الدائرة الخاصة « مرافَق » ←',
      'form.submit.standard': '📩 آخذ « مستقل » ←',
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
      'form.submit.text': '📩 أريد حجز مكاني ←',
      'form.submit.loading': 'جاري الإرسال…',
      'form.note': 'لن تُستخدم بياناتك إلا للتواصل معك. لا توجد رسائل تسويقية أوتوماتيكية.',
      'form.trust.1': '✓ ضمان النتيجة 90 يوماً',
      'form.trust.2': '✓ بدون أي دفع الآن',
      'form.trust.3': '✓ الدفعة تُغلق قريباً — رد خلال 24 ساعة',
      'form.success.title': 'تم استلام حجزك.',
      'form.success.text': 'سيتصل بك أوريل خلال 24 ساعة عبر الواتساب لتأكيد تسجيلك.',
      'form.success.cta': '💬 تواصل معنا الآن عبر الواتساب ←',
      'form.error.text': '__html__حدث خطأ. تواصل معنا مباشرة عبر الواتساب : <strong>+213 555 290 826</strong>',
      'form.error.cta': '💬 افتح الواتساب',
      'form.error.required': 'هذا الحقل مطلوب',
      'form.error.invalid_phone': 'تنسيق غير صالح (مثال : +213 555 12 34 56)',
      'form.error.invalid_email': 'بريد إلكتروني غير صالح',

      'problem.eyebrow': 'المشكلة',
      'problem.title.before': 'تقرأ هذا و',
      'problem.title.accent': 'تتعرّف على نفسك.',
      'problem.card1.title': 'الجدار 1 — 18 شهراً من الألمانية ولا تعرف قول « ضغط الدم »',
      'problem.card1.desc': 'Goethe Institut يعلّمك طلب قهوة في برلين. لا يعلّمك شرح لعائلة أن أمها أُصيبت بسكتة دماغية. المفردات الطبية غير موجودة في الدورات الكلاسيكية.',
      'problem.card2.title': 'الجدار 2 — الوكالات تفوترك 300 إلى 800€ مقابل ملف عام',
      'problem.card2.desc': 'تدفع ما يكسبه ممرض جزائري في شهرين… مقابل PDF يرسلونه إلى 50 مرشحاً آخر. وإذا رُفض ملفك، لا يردّون لك المال.',
      'problem.card3.title': 'الجدار 3 — Anerkennung متاهة',
      'problem.card3.desc': 'كل Land له قوانينه. تملأ 30 صفحة، ترسل، تنتظر 6 أشهر… ثم يصلك رفض لأن خاتماً واحداً كان ناقصاً.',
      'problem.card4.title': 'الجدار 4 — تفشل في أول مقابلة لأنك لم تتدرّب أبداً',
      'problem.card4.desc': 'يقول لك المشغّل : « مريضة عمرها 78 سنة سقطت من سريرها، ماذا تفعل ؟ » بالألمانية، شفهياً، في 30 ثانية. تشحب. تخفق. ترجع للبيت.',

      'solution.eyebrow': 'الحل',
      'solution.title.p1': 'الـ ',
      'solution.title.accent1': 'منهج A→D',
      'solution.title.p2': ' — Algeria → ',
      'solution.title.accent2': 'Deutschland',
      'solution.title.p3': '.',
      'solution.lead': 'النظام الوحيد الذي يجمع 3 ركائز جراحية لينقلك من صالون أمك إلى Pflegeheim ألماني في 6 أشهر. صُمّم من قِبل جزائري سلك الطريق.',
      'solution.before.head': 'قبل المنهج A→D',
      'solution.before.li1': '❌ مفردات طبية لا توجد في أي مكان',
      'solution.before.li2': '❌ تشحب أمام المشغّل في Pflegeheim',
      'solution.before.li3': '❌ Anerkennung مرفوض بسبب خاتم ناقص',
      'solution.before.li4': '❌ وكالات تفوترك 800€ مقابل PDF',
      'solution.before.li5': '❌ ترى منية تذهب إلى Stuttgart، كريم إلى Düsseldorf — وأنت تنتظر',
      'solution.after.head': 'بعد المنهج A→D',
      'solution.after.li1': '✅ 150 مصطلحاً طبياً تستعمله 50× يومياً في العمل',
      'solution.after.li2': '✅ 15 محاكاة Pflegeheim — لن تخاف',
      'solution.after.li3': '✅ ملف Anerkennung تجهّزه بنفسك في 3 أسابيع',
      'solution.after.li4': '✅ بدون وكالة. بدون 800€. بدون وسيط.',
      'solution.after.li5': '✅ +380 000 د.ج/شهر (€2 800) بدلاً من 50 000 د.ج',

      'prog.eyebrow': 'البرنامج',
      'prog.title.accent': '10 وحدات',
      'prog.title.suffix': '. 18 درساً. 4 ساعات و30 دقيقة من المحتوى الجراحي. بدون حشو.',
      'prog.lead': 'كل وحدة لها رقم، وحاصل ملموس، ووعد واحد بالنتيجة.',
      'prog.m0.title': 'مقدمة',
      'prog.m0.meta': 'فيديو 1 · 8 دقائق',
      'prog.m0.l1': 'مرحباً + خطة العمل',
      'prog.mA.title': 'واقع قطاع Pflege',
      'prog.mA.meta': 'فيديوهان · 26–30 دقيقة',
      'prog.mA.l1': 'السوق الألمانية في 2026 : أرقام، رواتب، طلب',
      'prog.mA.l2': 'أنواع المناصب : Altenpflege / Krankenpflege / Betreuungskraft',
      'prog.m1.title': 'المفردات الطبية الأساسية',
      'prog.m1.meta': 'فيديوهان · 20 دقيقة',
      'prog.m1.l1': '75 مصطلحاً سريرياً بالأولوية (ثلاثي اللغات DE/FR/AR)',
      'prog.m1.l2': '75 مصطلحاً تشريحياً + الأمراض الشائعة',
      'prog.m2.title': 'التواصل مع المرضى',
      'prog.m2.meta': 'فيديو 1 · 15 دقيقة',
      'prog.m2.l1': 'عبارات مفتاحية للطمأنة، الشرح، الفحص',
      'prog.m3.title': 'التواصل مع الفريق',
      'prog.m3.meta': 'فيديو 1 · 15 دقيقة',
      'prog.m3.l1': 'Übergabe، handover، Besprechung : كيف تنقل التعليمات بمهنية',
      'prog.mD.title': 'Dokumentation / Pflegebericht',
      'prog.mD.meta': 'فيديوهان · 26–30 دقيقة',
      'prog.mD.l1': 'كيف تكتب تقرير رعاية يجتاز التفتيش',
      'prog.mD.l2': 'الاختصارات والرموز الرسمية المستخدمة في Pflegeheim',
      'prog.m4.title': 'مقابلة المشغّل في Pflegeheim',
      'prog.m4.meta': 'فيديوهان · 20 دقيقة',
      'prog.m4.l1': 'الـ 15 سؤالاً التي تتكرر دائماً',
      'prog.m4.l2': 'استراتيجية الإجابة + نسخ نموذجية بالألمانية',
      'prog.mC.title': 'محاكاة كاملة',
      'prog.mC.meta': '3 فيديو · 42–51 دقيقة',
      'prog.mC.l1': 'محاكاة 1 : مقابلة هاتفية مع المشغّل',
      'prog.mC.l2': 'محاكاة 2 : يوم نموذجي في Pflegeheim',
      'prog.mC.l3': 'محاكاة 3 : إدارة نزاع / حالة طوارئ',
      'prog.mB.title': 'Anerkennung (الاعتراف بالشهادة)',
      'prog.mB.meta': '3 فيديو · 42–51 دقيقة',
      'prog.mB.l1': 'ما الأوراق التي يجب جمعها في الجزائر (قائمة محددة)',
      'prog.mB.l2': 'أي Behörde تتصل بها حسب Land',
      'prog.mB.l3': 'مدة زمنية حقيقية + تكاليف حقيقية',
      'prog.m5.title': 'الخاتمة وخطة العمل',
      'prog.m5.meta': 'فيديو 1 · 5 دقائق',
      'prog.m5.l1': 'خارطة طريقك الشخصية 3-6-12 شهر',
      'prog.bonus.title': '🎁 رصيد القيمة — مدرج في جميع الباقات',
      'prog.bonus.l1': '📖 مسرد PDF 150 مصطلحاً طبياً ثلاثي اللغات (DE/FR/AR) — قيمة 25 000 د.ج',
      'prog.bonus.l2': '🎯 مدرّب التحضير للمقابلة · 15 سؤالاً تفاعلياً — قيمة 30 000 د.ج',
      'prog.bonus.l3': '📄 قوالب CV + Anschreiben بالألمانية معتمدة من المشغّلين — قيمة 15 000 د.ج',
      'prog.bonus.l4': '📘 دليل Anerkennung ثلاثي اللغات حسب Land (يوفّر 800€ من الوكالة) — قيمة 80 000 د.ج',
      'prog.bonus.l5': '🏥 قائمة 30 Pflegeheim توظف الآن + اتصالات مباشرة — قيمة 40 000 د.ج',

      'forwhom.eyebrow': 'لمن',
      'forwhom.title.before': 'هذا التكوين ',
      'forwhom.title.accent': 'ليس للجميع',
      'forwhom.title.suffix': '. اقرأ بصدق.',
      'forwhom.for.head': '✅ هو لك إذا…',
      'forwhom.for.li1': 'أنت ممرض مختص، مساعد ممرض أو طالب في الصحة',
      'forwhom.for.li2': 'لديك حد أدنى من الألمانية (A1/A2) أو مستعد لاكتسابها في شهرين بالتوازي',
      'forwhom.for.li3': 'تريد منصباً ملموساً في Pflegeheim ألماني، ليس تأشيرة سياحية',
      'forwhom.for.li4': 'يمكنك تخصيص ساعة ونصف للفيديوهات + ساعة-ساعتين يومياً للتطبيق',
      'forwhom.for.li5': 'تفضل التعلم مع جزائري سلك الطريق بدلاً من أستاذ ألماني',
      'forwhom.notfor.head': '❌ ليس لك إذا…',
      'forwhom.notfor.li1': 'تبحث عن دورة ألمانية عامة (خذ Goethe A1-A2)',
      'forwhom.notfor.li2': 'تريد شهادة معترف بها من الدولة الألمانية (هذه ليست Goethe، نحضّرك)',
      'forwhom.notfor.li3': 'ليس لديك أي دافع حقيقي للسفر (التكوين لن يحفّزك مكانك)',
      'forwhom.notfor.li4': 'تريد أن تقوم وكالة بملفك (خذ وكالة بـ 800€)',
      'forwhom.notfor.li5': 'لا تتحمّل أن نقول لك الحقيقة بصراحة',

      'pricing.eyebrow': 'الأسعار',
      'pricing.title.before': 'اختر ',
      'pricing.title.accent': 'طريقك',
      'pricing.title.suffix': '.',
      'pricing.lead': 'تغلق هذه الصفحة → بعد 12 شهراً ستكون في نفس المكان، ~40 000€ من الراتب الألماني غير المكسوب. تحجز مكانك → في 6 أشهر توقّع عقدك. الحساب بارد.',

      'tier.au.pill': 'مستقل',
      'tier.au.tag': 'على وتيرتك',
      'tier.au.price.amount': '12 900',
      'tier.au.price.currency': 'د.ج',
      'tier.au.sub': 'دفعة واحدة · وصول مدى الحياة · تتدبّر بنفسك',
      'tier.au.li1': '18 درساً فيديو (4 ساعات و30 دقيقة جراحية)',
      'tier.au.li2': 'معجم 150 مصطلحاً طبياً ثلاثي اللغات (DE/FR/AR)',
      'tier.au.li3': 'دليل Anerkennung ثلاثي اللغات حسب Land + قائمة 30 Pflegeheim توظف',
      'tier.au.li4': 'قوالب CV + Anschreiben معتمدة + ولوج إلى دائرة Telegram',
      'tier.au.cta': 'آخذ « مستقل » ←',

      'tier.ac.ribbon': '⭐ موصى به من 9 من 10 مسجلين',
      'tier.ac.pill': 'مرافَق',
      'tier.ac.tag': '7 أماكن متبقية من 30',
      'tier.ac.price.amount': '42 800',
      'tier.ac.price.currency': 'د.ج',
      'tier.ac.sub': 'دائرة خاصة · يتابعك أوريل شخصياً حتى التوقيع · المرافَقون يوقّعون 2.3× أسرع',
      'tier.ac.li1': '<strong>كل محتوى « مستقل » مدرج</strong>',
      'tier.ac.li2': '<strong>8 جلسات Live coaching مع أوريل</strong> (واحدة أسبوعياً لمدة 8 أسابيع)',
      'tier.ac.li3': '<strong>واتساب ذات أولوية</strong> حتى توقيع عقدك الألماني',
      'tier.ac.li4': '<strong>متابعة شخصية</strong> لملف Anerkennung + محاكاة 1-1 ليلة مقابلتك الحقيقية',
      'tier.ac.cta': 'انضم إلى الدائرة الخاصة ←',
      'tier.ac.note': 'بعد 30 مسجلاً، تنخفض جودة المتابعة. هذا غير قابل للتفاوض.',

      'story.eyebrow': 'عنا',
      'story.title.before': 'المكوّن الذي كنت تبحث عنه ',
      'story.title.accent': 'دون أن تعرف بوجوده',
      'story.title.suffix': '.',
      'story.lead': '+5 سنوات خبرة في تعليم اللغة الألمانية · +100 طالب متابع · جزائري سلك الطريق.',
      'why.f1.title': 'صُمّم من قِبل جزائري، للجزائريين',
      'why.f1.desc': 'دروس بالفرنسية للفهم (أحياناً بالعربية للتوضيح)، تمارين ومحاكاة بالألمانية للتثبيت. منهجية تخفّف العبء المعرفي.',
      'why.f2.title': 'مفردات جراحية، ليست عامة',
      'why.f2.desc': '150 مصطلحاً طبياً مختاراً من Pflegebericht حقيقية كتبها ممرضون في ألمانيا. لا كلمة بدون فائدة. لا Goethe. فقط ما ستقوله 50× يومياً في العمل.',
      'why.f3.title': '100% عبر الإنترنت، من قريتك',
      'why.f3.desc': 'فيديوهات متاحة 24/7، مرفقات قابلة للتحميل، تمارين تطبيقية. تتعلّم من الجزائر، وهران، قسنطينة — أو قريتك. لا تنقّل، لا أعذار.',
      'why.f4.title': '15 محاكاة مقابلة مكثّفة',
      'why.f4.desc': 'تلعب الدور. ترتجف. تخفق. تعيد. عندما يأتي المشغّل الحقيقي، تكون قد مررت بـ15 مقابلة في رأسك. لن تخاف.',
      'why.f5.title': 'ملف Anerkennung مستقل',
      'why.f5.desc': 'دليل ثلاثي اللغات (FR/AR/DE) حسب Land. تختار Land، تتبع القائمة، تجهّز ملفك في 3 أسابيع. بدون وكالة. بدون 800€. بدون وسيط.',
      'why.f6.title': 'دائرة خاصة من متعلمي Aurel',
      'why.f6.desc': 'فضاء Telegram حيث نتشارك Pflegeheim التي توظف في الوقت الفعلي، نتدرّب معاً، نتعاون. لم تعد وحدك في الطريق.',

      'faq.eyebrow': 'الأسئلة الشائعة',
      'faq.title.before': 'أسئلة ',
      'faq.title.accent': 'متكررة',
      'faq.title.suffix': '.',
      'faq.q1': 'هل يجب أن أتحدث الألمانية للمتابعة ؟',
      'faq.a1': 'A1 بسيط جداً يكفي للبدء. إذا كنت مبتدئاً تماماً، ننصحك بـ6-8 أسابيع من Goethe A1 بالتوازي (مجاني على YouTube، نعطيك الـplaylist). ابتداءً من A2، يمكنك الدخول إلى التكوين.',
      'faq.q2': 'كم من الوقت لأحصل على أول مقابلة Pflegeheim ؟',
      'faq.a2': 'متوسط مسجلي « مرافَق » : من 3 إلى 5 أشهر. بعضهم أبكر (ياسين في 4 أشهر)، آخرون أبطأ حسب مستواهم الأولي وإيقاعهم.',
      'faq.q3': 'أنا مساعد ممرض ولست ممرضاً مختصاً، هل يصلح لي ؟',
      'faq.a3': 'نعم — وهذه ميزة. ألمانيا تنقصها بشدة مساعدي التمريض. ملفك مطلوب، نكيّف استراتيجية ترشيحك.',
      'faq.q4': 'ما الفرق الحقيقي بين مستقل ومرافَق ؟',
      'faq.a4': 'مستقل = تتلقى كل المحتوى، تتدبّر بنفسك. مرافَق = تتلقى المحتوى + يتابعك أوريل شخصياً كل أسبوع في حصة Live + واتساب ذات أولوية حتى عقدك. إحصائياً : المرافَقون يوقّعون 2.3× أسرع.',
      'faq.q5': 'كيف يتم الدفع ؟',
      'faq.a5': 'تحويل بنكي (RIB يُرسل بعد التسجيل) أو دفع نقدي بالجزائر. لا دفع لحظة التسجيل — تحجز مكانك، نؤكد معك خلال 24 ساعة.',
      'faq.q6': 'هل الفيديوهات بالفرنسية أم بالألمانية ؟',
      'faq.a6': 'الشروحات بالفرنسية (أحياناً بالعربية للتوضيح). الأمثلة، الحوارات والمحاكاة بالألمانية. هذا أفضل مزيج للتعلم بسرعة.',
      'faq.q7': 'هل توجد شهادة في النهاية ؟',
      'faq.a7': 'نعم، شهادة إتمام Aurel Academy. ليست شهادة Goethe رسمية، بل وثيقة مهنية تظهر التزامك المحدد بقطاع Pflege.',
      'faq.q8': 'وإذا فشلت ؟ هل يمكنني استرداد المبلغ ؟',
      'faq.a8': '<strong>ضمان النتيجة 90 يوماً</strong> : إذا اعتبرت خلال 90 يوماً بعد وصولك أن التكوين لا يطابق ما هو موعود به، استرداد كامل، بدون أي سؤال.',
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

    // Active state on language buttons
    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    window.__aurelLang = lang;
    window.__aurelI18n = dict;
  }

  // Apply current language ASAP (window.__aurelLang was set in <head> pre-paint script)
  applyLang(window.__aurelLang || 'ar');

  // Wire language buttons
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

  /* ─────────── FAQ: one open at a time ─────────── */
  (() => {
    const items = $$('#faq-list .faq-item');
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (item.open) items.forEach((o) => { if (o !== item) o.open = false; });
      });
    });
  })();

  /* ─────────── Modules accordion: one open at a time ─────────── */
  (() => {
    const mods = $$('#modules-list .module');
    mods.forEach((m) => {
      m.addEventListener('toggle', () => {
        if (m.open) mods.forEach((o) => { if (o !== m) o.open = false; });
      });
    });
  })();

  /* ─────────── Testimonials carousel ─────────── */
  (() => {
    const carousel = $('#carousel');
    if (!carousel) return;
    const slides = carousel.querySelectorAll('.testimonial');
    const dots   = carousel.querySelectorAll('.carousel-dot');
    if (!slides.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let idx = 0;
    let timer;
    const DURATION = 5500;

    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => {
        s.classList.toggle('is-active', i === idx);
        s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };
    const start = () => { stop(); timer = setInterval(() => go(idx + 1), DURATION); };
    const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };

    go(0);
    if (!reduced) start();
    dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.idx)); start(); }));
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', () => { if (!reduced) start(); });
  })();

  /* ─────────── Pre-select tier from tier-card CTAs ─────────── */
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
      nom_complet:     { required: true },
      whatsapp:        { required: true,
                         validate: (v) => PHONE_REGEX.test(v.replace(/\s|-|\./g, ''))
                           ? null : t('form.error.invalid_phone') },
      niveau_allemand: { required: true },
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

      // Clear errors on change
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
        // Redirect to /merci/ so we get a clean Pixel/GA Lead event on a dedicated page.
        // Fallback to inline success if redirect somehow doesn't trigger (rare).
        try {
          const params = new URLSearchParams({
            lang: (payload && payload.lang) || window.__aurelLang || 'fr',
            program: 'Pflege',
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

        // Split "Nom complet" en prenom (1er mot) + nom (reste) pour compat Sheet + closer
        const fullName = (values.nom_complet || '').trim().replace(/\s+/g, ' ');
        const nameParts = fullName.split(' ');
        const splitPrenom = nameParts.shift() || '';
        const splitNom = nameParts.join(' ');

        const payload = {
          timestamp: new Date().toISOString(),
          program: 'Pflege',
          prenom: splitPrenom,
          nom: splitNom,
          nom_complet: fullName,
          whatsapp: values.whatsapp,
          email: '',
          profession: '',
          niveau_allemand: values.niveau_allemand,
          tier: values.tier,
          wilaya: '',
          adresse: '',
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
