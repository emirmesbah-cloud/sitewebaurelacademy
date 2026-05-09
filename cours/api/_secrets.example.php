<?php
// ============================================================
// AUREL ACADEMY — Secrets template
// ============================================================
// Copie ce fichier en `_secrets.php` (dans le même dossier) et
// remplace les valeurs par les vraies. `_secrets.php` est dans
// .gitignore et ne sera JAMAIS committé sur GitHub.
//
// Si tu déploies sur un nouveau serveur :
//   cp _secrets.example.php _secrets.php
//   nano _secrets.php  (édite les valeurs)
// ============================================================

// Mot de passe admin pour /cours/#admin et toutes les API admin
// Choisis-en un fort : >16 caractères, chiffres + lettres + symboles
define('ADMIN_PWD', '<PUT_YOUR_NEW_ADMIN_PASSWORD_HERE>');

// Clé API VDOCipher (secret) — utilisée par video.php pour générer
// les OTP de lecture des vidéos protégées.
// Récupérable sur dashboard.vdocipher.com → Settings → API Keys
define('VDOCIPHER_API_SECRET', '<PUT_YOUR_VDOCIPHER_API_SECRET_HERE>');
