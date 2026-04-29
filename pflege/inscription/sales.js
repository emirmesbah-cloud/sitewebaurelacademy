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
      'cta.reserve': 'Réserver ma place →',

      'hero.badge': '🏥 Formation spécialisée',
      'hero.title.before': 'Deutsch für ',
      'hero.title.accent': 'Pflegekräfte',
      'hero.sub': "L'allemand médical pour les métiers de la santé. Programme spécialisé pour infirmiers et aides-soignants algériens.",
      'hero.stats.modules': '10 modules',
      'hero.stats.lessons': '18 leçons',
      'hero.stats.duration': '4h30',
      'hero.stats.suffix': 'de contenu premium',
      'hero.cta.primary': 'Réserver ma place →',
      'hero.cta.secondary': 'Voir le programme ▼',
      'hero.proof': '__html__<strong>4.9/5</strong> · Basé sur les retours de la promo pilote',

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
      'form.tier.au.desc': 'Self-paced · Accès à vie · Tous les bonus inclus.',
      'form.tier.au.feat.1': '18 leçons vidéo (~4h30)',
      'form.tier.au.feat.2': 'Glossaire 150 termes médicaux trilingue (DE/FR/Darija)',
      'form.tier.au.feat.3': 'Guide Anerkennung Trilingue + 30 Pflegeheim',
      'form.tier.au.feat.4': '7 bonus exclusifs · Accès à vie',
      'form.tier.ac.title': 'Accompagné',
      'form.tier.ac.price': '42800 DA',
      'form.tier.ac.exclusive': 'CERCLE PRIVÉ · PLACES ULTRA-LIMITÉES',
      'form.tier.ac.desc': 'Coaching direct avec Aurel · Suivi personnalisé jusqu\'au premier contrat.',
      'form.tier.ac.ribbon': '⭐ Recommandé',
      'form.tier.ac.feat.1': 'Tout Autonome inclus',
      'form.tier.ac.feat.2': '8 sessions live avec Aurel (1/semaine pendant 8 semaines)',
      'form.tier.ac.feat.3': 'Suivi WhatsApp prioritaire jusqu\'à signature',
      'form.tier.ac.feat.4': 'Cercle privé d\'apprenants Aurel',
      'form.submit.premium': '📩 Rejoindre le cercle privé →',
      'form.submit.standard': '📩 Réserver Autonome →',
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
      'form.note': "Tes données ne seront utilisées que pour te contacter. Aucune newsletter automatique.",
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
      'problem.title.before': 'Tu es infirmier, tu veux partir en Allemagne. ',
      'problem.title.accent': 'Mais...',
      'problem.card1.title': "L'allemand général ne suffit pas",
      'problem.card1.desc': "Goethe B1 ne t'apprend pas Dekubitus, Pflegebericht, ou Mobilisation.",
      'problem.card2.title': 'Les recruteurs veulent du concret',
      'problem.card2.desc': 'Ils ne testent pas ta grammaire. Ils te font jouer un scénario patient.',
      'problem.card3.title': "L'Anerkennung est un labyrinthe",
      'problem.card3.desc': "Quels papiers ? Quelle Behörde ? Combien ça coûte ? Personne ne t'explique clairement.",
      'problem.card4.title': 'Les agences coûtent 300–800 €',
      'problem.card4.desc': 'Pour te donner un template générique que tu aurais pu trouver en 10 minutes de recherche.',

      'solution.eyebrow': 'La solution',
      'solution.title.p1': 'Une formation pensée ',
      'solution.title.accent1': 'par un Algérien',
      'solution.title.p2': ', pour ',
      'solution.title.accent2': 'les Algériens',
      'solution.title.p3': '.',
      'solution.lead': "Une formation linguistique structurée pour maîtriser l'allemand médical : 10 modules actionnables, en français et en arabe.",
      'solution.before.head': 'Avant',
      'solution.before.li1': '❌ Vocabulaire médical introuvable',
      'solution.before.li2': "❌ Stress à l'entretien Pflegeheim",
      'solution.before.li3': '❌ Dossier Anerkennung incomplet',
      'solution.before.li4': '❌ Dépendance aux agences payantes',
      'solution.before.li5': '❌ Isolement, pas de communauté',
      'solution.after.head': 'Après',
      'solution.after.li1': '✅ 150 termes médicaux maîtrisés',
      'solution.after.li2': '✅ Simulation entretien en confiance',
      'solution.after.li3': '✅ Guide Anerkennung pas-à-pas',
      'solution.after.li4': '✅ Autonomie totale sur ton dossier',
      'solution.after.li5': "✅ Communauté d'apprenants pour s'entraîner",

      'prog.eyebrow': 'Le programme',
      'prog.title.accent': '10 modules',
      'prog.title.suffix': '. 18 leçons. 4h30 de contenu premium.',
      'prog.lead': "Chaque module est un bloc d'action concret. Pas de remplissage.",
      'prog.m0.title': 'Introduction',
      'prog.m0.meta': '1 vidéo · 8 min',
      'prog.m0.l1': "Bienvenue + plan d'action",
      'prog.mA.title': 'Réalité du secteur Pflege',
      'prog.mA.meta': '2 vidéos · 26–30 min',
      'prog.mA.l1': 'Le marché allemand en 2026 : chiffres, salaires, demande',
      'prog.mA.l2': 'Les types de postes : Altenpflege / Krankenpflege / Betreuungskraft',
      'prog.m1.title': 'Vocabulaire médical essentiel',
      'prog.m1.meta': '2 vidéos · 20 min',
      'prog.m1.l1': '75 termes cliniques prioritaires (trilingue DE/FR/DAR)',
      'prog.m1.l2': '75 termes anatomie + pathologies courantes',
      'prog.m2.title': 'Communication avec patients',
      'prog.m2.meta': '1 vidéo · 15 min',
      'prog.m2.l1': 'Phrases clés pour rassurer, expliquer, anamnèse',
      'prog.m3.title': "Communication avec l'équipe",
      'prog.m3.meta': '1 vidéo · 15 min',
      'prog.m3.l1': 'Übergabe, handover, Besprechung : comment passer les consignes pro',
      'prog.mD.title': 'Dokumentation / Pflegebericht',
      'prog.mD.meta': '2 vidéos · 26–30 min',
      'prog.mD.l1': "Comment rédiger un rapport de soin qui passe l'inspection",
      'prog.mD.l2': 'Abbréviations et codes officiels utilisés dans les Pflegeheim',
      'prog.m4.title': 'Entretien recruteur Pflegeheim',
      'prog.m4.meta': '2 vidéos · 20 min',
      'prog.m4.l1': 'Les 15 questions qui reviennent systématiquement',
      'prog.m4.l2': 'Stratégie de réponse + copies types en allemand',
      'prog.mC.title': 'Simulations complètes',
      'prog.mC.meta': '3 vidéos · 42–51 min',
      'prog.mC.l1': 'Simulation 1 : entretien téléphonique recruteur',
      'prog.mC.l2': 'Simulation 2 : journée type en Pflegeheim',
      'prog.mC.l3': "Simulation 3 : gestion conflit / situation d'urgence",
      'prog.mB.title': 'Anerkennung (reconnaissance diplôme)',
      'prog.mB.meta': '3 vidéos · 42–51 min',
      'prog.mB.l1': 'Quels papiers réunir en Algérie (liste exacte)',
      'prog.mB.l2': 'Quelle Behörde contacter selon ton Land',
      'prog.mB.l3': 'Timeline réelle + coûts réels',
      'prog.m5.title': "Conclusion & plan d'action",
      'prog.m5.meta': '1 vidéo · 5 min',
      'prog.m5.l1': 'Ta roadmap personnelle 3–6–12 mois',
      'prog.bonus.title': '🎁 Bonus inclus dans tous les tiers',
      'prog.bonus.l1': '📖 Glossaire PDF 150 termes médicaux (DE/FR/AR)',
      'prog.bonus.l2': '🎯 Interview Prep Trainer (15 questions interactives)',
      'prog.bonus.l3': '📄 Templates CV + Anschreiben en allemand',
      'prog.bonus.l4': '📘 Guide Anerkennung par Land',
      'prog.bonus.l5': '🏥 Liste de 50 Pflegeheim qui recrutent',

      'forwhom.eyebrow': 'Pour qui',
      'forwhom.title.before': "Cette formation n'est ",
      'forwhom.title.accent': 'pas pour tout le monde',
      'forwhom.title.suffix': '.',
      'forwhom.for.head': "✅ C'est pour toi si...",
      'forwhom.for.li1': 'Tu es infirmier, aide-soignant ou étudiant en santé',
      'forwhom.for.li2': "Tu as déjà un minimum d'allemand (A1/A2) ou tu es prêt à l'acquérir en parallèle",
      'forwhom.for.li3': 'Tu veux un poste concret en Allemagne, pas juste « voir »',
      'forwhom.for.li4': 'Tu préfères apprendre avec un Algérien qui connaît le chemin',
      'forwhom.for.li5': 'Tu es prêt à mettre 4h30 à regarder + 10–20h à pratiquer',
      'forwhom.notfor.head': "❌ Ce n'est pas pour toi si...",
      'forwhom.notfor.li1': "Tu cherches un cours d'allemand général (prends plutôt A1→B2)",
      'forwhom.notfor.li2': "Tu veux un diplôme reconnu immédiatement (ce n'est pas un Goethe)",
      'forwhom.notfor.li3': "Tu n'as aucune motivation pour l'Allemagne",
      'forwhom.notfor.li4': 'Tu veux que quelqu\'un fasse ton dossier Anerkennung à ta place',
      'forwhom.notfor.li5': 'Tu attends des miracles sans effort',

      'pricing.eyebrow': 'Tarifs',
      'pricing.title.before': 'Deux façons de rejoindre ',
      'pricing.title.accent': 'Aurel Academy',
      'pricing.title.suffix': '.',
      'pricing.lead': 'Self-paced ou cercle privé avec coaching direct. Choisis selon tes besoins.',

      'tier.au.pill': 'AUTONOME',
      'tier.au.tag': 'Self-paced',
      'tier.au.price.amount': '12 900',
      'tier.au.price.currency': 'DA',
      'tier.au.sub': 'Paiement unique · Accès à vie',
      'tier.au.li1': '18 leçons vidéo (~4h30)',
      'tier.au.li2': 'Glossaire 150 termes médicaux trilingue (DE/FR/Darija)',
      'tier.au.li3': 'Guide Anerkennung Trilingue + 30 Pflegeheim',
      'tier.au.li4': '7 bonus exclusifs · Accès à vie',
      'tier.au.cta': 'Réserver mon accès →',

      'tier.ac.ribbon': '⭐ Recommandé',
      'tier.ac.pill': 'ACCOMPAGNÉ',
      'tier.ac.tag': 'Cercle privé',
      'tier.ac.price.amount': '42 800',
      'tier.ac.price.currency': 'DA',
      'tier.ac.sub': 'Cercle privé · Places ultra-limitées · Accompagnement direct par Aurel',
      'tier.ac.li1': '<strong>Tout Autonome inclus</strong>',
      'tier.ac.li2': '<strong>8 sessions live avec Aurel</strong> (1/semaine pendant 8 semaines)',
      'tier.ac.li3': '<strong>Suivi WhatsApp prioritaire</strong> jusqu\'à signature',
      'tier.ac.li4': '<strong>Cercle privé</strong> d\'apprenants Aurel',
      'tier.ac.cta': 'Rejoindre le cercle →',
      'tier.ac.note': 'Toutes les candidatures sont étudiées — objectif qualité, pas quantité.',

      'story.eyebrow': 'À propos',
      'story.title.before': 'Pourquoi ',
      'story.title.accent': 'Aurel Academy',
      'story.title.suffix': ' ?',
      'story.lead': "Apprendre l'allemand, sérieusement.",
      'why.f1.title': 'Une école pensée pour les francophones',
      'why.f1.desc': "Cours en français pour comprendre, exercices en allemand pour ancrer. La méthode qui réduit la charge cognitive.",
      'why.f2.title': "L'allemand médical à part",
      'why.f2.desc': "Vocabulaire spécialisé Pflegeheim, dialogues patient-soignant, documentation Pflegebericht. Pas un cours d'allemand classique.",
      'why.f3.title': 'Tout en ligne, à ton rythme',
      'why.f3.desc': "Vidéos accessibles 24/7, supports téléchargeables, exercices d'application. Tu apprends depuis Alger, Oran, Constantine ou ton village.",
      'why.f4.title': 'Pratique orale chaque semaine',
      'why.f4.desc': "Session live hebdomadaire pour parler en allemand, corriger la prononciation, gagner en aisance.",
      'why.f5.title': 'Des supports, pas des promesses',
      'why.f5.desc': "Glossaire 150 termes, templates CV/lettres en allemand, guide Anerkennung trilingue. Tu repars avec des outils concrets.",
      'why.f6.title': 'Communauté privée',
      'why.f6.desc': "Espace Telegram entre apprenants Aurel pour s'entraider, partager les ressources, poser des questions.",

      'faq.eyebrow': 'FAQ',
      'faq.title.before': 'Questions ',
      'faq.title.accent': 'fréquentes',
      'faq.title.suffix': '.',
      'faq.q1': 'Il faut déjà parler allemand pour suivre ?',
      'faq.a1': "Un niveau A1/A2 est recommandé mais pas obligatoire. Les modules sont en français, le vocabulaire est traduit. Si tu es débutant complet, on te conseille de suivre A1→B2 en parallèle.",
      'faq.q2': 'Combien de temps pour être prêt à passer un entretien ?',
      'faq.a2': '1 à 3 mois selon ton niveau de départ et ton temps de pratique. Le rythme dépend de ton investissement et de la régularité de ton entraînement.',
      'faq.q3': 'Je suis aide-soignant et pas infirmier diplômé, ça marche pour moi ?',
      'faq.a3': 'Oui. Le marché Pflege allemand recrute massivement les Altenpfleger (aides-soignants en soins aux personnes âgées). La formation couvre les deux profils.',
      'faq.q4': 'Quelle est la différence entre Autonome et Accompagné ?',
      'faq.a4': "Autonome = tu suis les vidéos à ton rythme, accès à vie. Accompagné = tout ça + 8 sessions live avec Aurel + coaching personnalisé sur ton dossier Anerkennung + communauté privée. Recommandé si tu veux un résultat rapide et certain.",
      'faq.q5': 'Comment se passe le paiement ?',
      'faq.a5': "Tu remplis le formulaire de réservation. On te rappelle sous 24h pour valider et t'envoyer les infos virement (CCP / BaridiMob / Edahabia). Dès confirmation, tu reçois tes accès dans les minutes.",
      'faq.q6': 'Les vidéos sont en français ou en allemand ?',
      'faq.a6': "Explications en français (avec quelques passages en arabe dialectal quand c'est utile). Vocabulaire, phrases clés et simulations en allemand. C'est le meilleur mix pour apprendre vite.",
      'faq.q7': 'Il y a un certificat à la fin ?',
      'faq.a7': "Oui, un certificat de complétion Aurel Academy. Ce n'est pas un diplôme officiel Goethe, mais un document professionnel qui montre ton engagement spécifique pour le secteur Pflege.",
      'faq.q8': 'Si ça ne me convient pas, je peux me faire rembourser ?',
      'faq.a8': "<strong>Garantie 14 jours</strong> : si dans les 14 jours après ton accès tu considères que la formation ne correspond pas à ce qui est promis, remboursement intégral, aucune question.",
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

      'hero.badge': '🏥 تكوين متخصص',
      'hero.title.before': 'Deutsch für ',
      'hero.title.accent': 'Pflegekräfte',
      'hero.sub': 'الألمانية الطبية لمهن الصحة. برنامج متخصّص للممرضين ومساعدي التمريض الجزائريين.',
      'hero.stats.modules': '10 وحدات',
      'hero.stats.lessons': '18 درساً',
      'hero.stats.duration': '4 ساعات و30 دقيقة',
      'hero.stats.suffix': 'من المحتوى المتميز',
      'hero.cta.primary': 'احجز مكانك ←',
      'hero.cta.secondary': 'شاهد البرنامج ▼',
      'hero.proof': '__html__<strong>4.9/5</strong> · بناءً على آراء أول دفعة',

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
      'form.tier.au.desc': 'على وتيرتك · وصول مدى الحياة · جميع المكافآت مدرجة.',
      'form.tier.au.feat.1': '18 درساً فيديو (~4 ساعات و30 دقيقة)',
      'form.tier.au.feat.2': 'معجم 150 مصطلحاً طبياً ثلاثي اللغات (DE/FR/Darija)',
      'form.tier.au.feat.3': 'دليل Anerkennung ثلاثي اللغات + 30 Pflegeheim',
      'form.tier.au.feat.4': '7 مكافآت حصرية · وصول مدى الحياة',
      'form.tier.ac.title': 'مرافَق',
      'form.tier.ac.price': '42800 DA',
      'form.tier.ac.exclusive': 'دائرة خاصة · أماكن محدودة جداً',
      'form.tier.ac.desc': 'مرافقة مباشرة من أوريل · متابعة شخصية حتى أول عقد.',
      'form.tier.ac.ribbon': '⭐ موصى به',
      'form.tier.ac.feat.1': 'كل ما هو مدرج في باقة مستقل',
      'form.tier.ac.feat.2': '8 جلسات مباشرة مع أوريل (واحدة أسبوعياً لمدة 8 أسابيع)',
      'form.tier.ac.feat.3': 'متابعة واتساب ذات أولوية حتى التوقيع',
      'form.tier.ac.feat.4': 'دائرة خاصة من متعلمي Aurel',
      'form.submit.premium': '📩 انضم إلى الدائرة الخاصة ←',
      'form.submit.standard': '📩 احجز مستقل ←',
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
      'problem.title.before': 'أنت ممرض، تريد السفر إلى ألمانيا. ',
      'problem.title.accent': 'لكن...',
      'problem.card1.title': 'الألمانية العامة لا تكفي',
      'problem.card1.desc': 'شهادة Goethe B1 لا تعلمك Dekubitus، Pflegebericht، أو Mobilisation.',
      'problem.card2.title': 'المشغّلون يطلبون ما هو ملموس',
      'problem.card2.desc': 'لا يختبرون قواعد لغتك. يجعلونك تلعب سيناريو مع مريض.',
      'problem.card3.title': 'الـ Anerkennung متاهة',
      'problem.card3.desc': 'أي أوراق ؟ أي Behörde ؟ كم يكلف ؟ لا أحد يشرح لك بوضوح.',
      'problem.card4.title': 'الوكالات تكلف 300–800 €',
      'problem.card4.desc': 'لتقدم لك نموذجاً عاماً يمكنك الحصول عليه في 10 دقائق من البحث.',

      'solution.eyebrow': 'الحل',
      'solution.title.p1': 'تكوين صُمّم ',
      'solution.title.accent1': 'من قِبل جزائري',
      'solution.title.p2': '، من أجل ',
      'solution.title.accent2': 'الجزائريين',
      'solution.title.p3': '.',
      'solution.lead': 'تكوين لغوي منظّم لإتقان الألمانية الطبية : 10 وحدات عملية، بالفرنسية والعربية.',
      'solution.before.head': 'قبل',
      'solution.before.li1': '❌ مفردات طبية لا توجد',
      'solution.before.li2': '❌ توتر في مقابلات Pflegeheim',
      'solution.before.li3': '❌ ملف Anerkennung ناقص',
      'solution.before.li4': '❌ تبعية للوكالات المدفوعة',
      'solution.before.li5': '❌ عزلة، بدون مجتمع',
      'solution.after.head': 'بعد',
      'solution.after.li1': '✅ إتقان 150 مصطلحاً طبياً',
      'solution.after.li2': '✅ محاكاة مقابلة بثقة',
      'solution.after.li3': '✅ دليل Anerkennung خطوة بخطوة',
      'solution.after.li4': '✅ استقلالية كاملة في ملفك',
      'solution.after.li5': '✅ مجتمع متعلمين للتدرّب معاً',

      'prog.eyebrow': 'البرنامج',
      'prog.title.accent': '10 وحدات',
      'prog.title.suffix': '. 18 درساً. 4 ساعات و30 دقيقة من المحتوى المتميز.',
      'prog.lead': 'كل وحدة هي كتلة عملية ملموسة. بدون حشو.',
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
      'prog.bonus.title': '🎁 مكافآت مدرجة في جميع الباقات',
      'prog.bonus.l1': '📖 مسرد PDF 150 مصطلحاً طبياً (DE/FR/AR)',
      'prog.bonus.l2': '🎯 مدرّب التحضير للمقابلة (15 سؤالاً تفاعلياً)',
      'prog.bonus.l3': '📄 قوالب CV + Anschreiben بالألمانية',
      'prog.bonus.l4': '📘 دليل Anerkennung حسب Land',
      'prog.bonus.l5': '🏥 قائمة 50 Pflegeheim توظف',

      'forwhom.eyebrow': 'لمن',
      'forwhom.title.before': 'هذا التكوين ',
      'forwhom.title.accent': 'ليس للجميع',
      'forwhom.title.suffix': '.',
      'forwhom.for.head': '✅ هو لك إذا...',
      'forwhom.for.li1': 'أنت ممرض، مساعد ممرض أو طالب في الصحة',
      'forwhom.for.li2': 'لديك حد أدنى من الألمانية (A1/A2) أو مستعد لاكتسابها بالتوازي',
      'forwhom.for.li3': 'تريد منصباً ملموساً في ألمانيا، ليس فقط « نظرة »',
      'forwhom.for.li4': 'تفضل التعلم مع جزائري يعرف الطريق',
      'forwhom.for.li5': 'مستعد لتخصيص 4 ساعات و30 دقيقة للمشاهدة + 10-20 ساعة للتطبيق',
      'forwhom.notfor.head': '❌ ليس لك إذا...',
      'forwhom.notfor.li1': 'تبحث عن دورة ألمانية عامة (خذ A1→B2 بدلاً)',
      'forwhom.notfor.li2': 'تريد شهادة معترف بها فوراً (هذه ليست Goethe)',
      'forwhom.notfor.li3': 'ليس لديك أي دافع لألمانيا',
      'forwhom.notfor.li4': 'تريد أن يقوم شخص ما بملف Anerkennung الخاص بك',
      'forwhom.notfor.li5': 'تنتظر معجزات بدون مجهود',

      'pricing.eyebrow': 'الأسعار',
      'pricing.title.before': 'طريقتان للانضمام إلى ',
      'pricing.title.accent': 'Aurel Academy',
      'pricing.title.suffix': '.',
      'pricing.lead': 'على وتيرتك أو دائرة خاصة مع مرافقة مباشرة. اختر حسب احتياجاتك.',

      'tier.au.pill': 'مستقل',
      'tier.au.tag': 'على وتيرتك',
      'tier.au.price.amount': '12 900',
      'tier.au.price.currency': 'د.ج',
      'tier.au.sub': 'دفعة واحدة · وصول مدى الحياة',
      'tier.au.li1': '18 درساً فيديو (~4 ساعات و30 دقيقة)',
      'tier.au.li2': 'معجم 150 مصطلحاً طبياً ثلاثي اللغات (DE/FR/Darija)',
      'tier.au.li3': 'دليل Anerkennung ثلاثي اللغات + 30 Pflegeheim',
      'tier.au.li4': '7 مكافآت حصرية · وصول مدى الحياة',
      'tier.au.cta': 'احجز وصولي ←',

      'tier.ac.ribbon': '⭐ موصى به',
      'tier.ac.pill': 'مرافَق',
      'tier.ac.tag': 'دائرة خاصة',
      'tier.ac.price.amount': '42 800',
      'tier.ac.price.currency': 'د.ج',
      'tier.ac.sub': 'دائرة خاصة · أماكن محدودة جداً · مرافقة مباشرة من أوريل',
      'tier.ac.li1': '<strong>كل ما هو مدرج في باقة مستقل</strong>',
      'tier.ac.li2': '<strong>8 جلسات مباشرة مع أوريل</strong> (واحدة أسبوعياً لمدة 8 أسابيع)',
      'tier.ac.li3': '<strong>متابعة واتساب ذات أولوية</strong> حتى التوقيع',
      'tier.ac.li4': '<strong>دائرة خاصة</strong> من متعلمي Aurel',
      'tier.ac.cta': 'انضم إلى الدائرة ←',
      'tier.ac.note': 'تتم دراسة جميع الترشيحات — الهدف الجودة، ليس الكمية.',

      'story.eyebrow': 'عنا',
      'story.title.before': 'لماذا ',
      'story.title.accent': 'Aurel Academy',
      'story.title.suffix': ' ؟',
      'story.lead': 'تعلّم الألمانية، بجدية.',
      'why.f1.title': 'مدرسة مصمّمة للناطقين بالفرنسية',
      'why.f1.desc': 'دروس بالفرنسية للفهم، تمارين بالألمانية للتثبيت. منهجية تخفّف العبء المعرفي.',
      'why.f2.title': 'الألمانية الطبية على حدة',
      'why.f2.desc': 'مفردات متخصّصة Pflegeheim، حوارات مريض-ممرّض، توثيق Pflegebericht. ليس درس ألمانية كلاسيكي.',
      'why.f3.title': 'كل شيء عبر الإنترنت، حسب وتيرتك',
      'why.f3.desc': 'فيديوهات متاحة 24/7، مرفقات قابلة للتحميل، تمارين تطبيقية. تتعلّم من الجزائر، وهران، قسنطينة أو قريتك.',
      'why.f4.title': 'تدرّب شفهي كل أسبوع',
      'why.f4.desc': 'حصة Live أسبوعية للتحدّث بالألمانية، تصحيح النطق، اكتساب الثقة.',
      'why.f5.title': 'موارد، لا وعود',
      'why.f5.desc': 'قاموس 150 مصطلحاً، نماذج CV/خطابات بالألمانية، دليل Anerkennung ثلاثي اللغات. تخرج بأدوات ملموسة.',
      'why.f6.title': 'مجتمع خاص',
      'why.f6.desc': 'فضاء Telegram بين متعلمي Aurel للتعاون، مشاركة الموارد، طرح الأسئلة.',

      'faq.eyebrow': 'الأسئلة الشائعة',
      'faq.title.before': 'أسئلة ',
      'faq.title.accent': 'متكررة',
      'faq.title.suffix': '.',
      'faq.q1': 'هل يجب أن أتحدث الألمانية للمتابعة ؟',
      'faq.a1': 'مستوى A1/A2 موصى به ولكن ليس إلزامياً. الوحدات بالفرنسية، المفردات مترجمة. إذا كنت مبتدئاً تماماً، ننصحك بمتابعة A1→B2 بالتوازي.',
      'faq.q2': 'كم من الوقت لتكون جاهزاً لاجتياز مقابلة ؟',
      'faq.a2': 'من 1 إلى 3 أشهر حسب مستواك الأولي ووقت تطبيقك. الإيقاع يعتمد على استثمارك وانتظام تدرّبك.',
      'faq.q3': 'أنا مساعد ممرض ولست ممرضاً مختصاً، هل يصلح لي ؟',
      'faq.a3': 'نعم. سوق Pflege الألماني يوظف بكثرة Altenpfleger (مساعدي رعاية المسنين). التكوين يغطي كلا الملفين.',
      'faq.q4': 'ما الفرق بين مستقل ومرافَق ؟',
      'faq.a4': 'مستقل = تتابع الفيديوهات على وتيرتك، وصول مدى الحياة. مرافَق = كل ذلك + 8 جلسات مباشرة مع أوريل + مرافقة شخصية على ملف Anerkennung + مجتمع خاص. موصى به إذا كنت تريد نتيجة سريعة ومضمونة.',
      'faq.q5': 'كيف يتم الدفع ؟',
      'faq.a5': 'تملأ نموذج الحجز. نتصل بك خلال 24 ساعة لتأكيد وإرسال معلومات التحويل (CCP / BaridiMob / Edahabia). بمجرد التأكيد، تحصل على وصولك في دقائق.',
      'faq.q6': 'هل الفيديوهات بالفرنسية أم بالألمانية ؟',
      'faq.a6': 'الشروحات بالفرنسية (مع بعض المقاطع بالعربية الجزائرية عند الفائدة). المفردات، العبارات الرئيسية والمحاكاة بالألمانية. هذا أفضل مزيج للتعلم بسرعة.',
      'faq.q7': 'هل توجد شهادة في النهاية ؟',
      'faq.a7': 'نعم، شهادة إتمام Aurel Academy. ليست شهادة Goethe رسمية، بل وثيقة مهنية تظهر التزامك المحدد بقطاع Pflege.',
      'faq.q8': 'إذا لم يناسبني، هل يمكنني استرداد المبلغ ؟',
      'faq.a8': '<strong>ضمان 14 يوماً</strong> : إذا اعتبرت خلال 14 يوماً بعد وصولك أن التكوين لا يطابق ما هو موعود به، استرداد كامل، بدون أي سؤال.',
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

        const payload = {
          timestamp: new Date().toISOString(),
          program: 'Pflege',
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
