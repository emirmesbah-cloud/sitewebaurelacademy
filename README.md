# Aurel Academy — Site web public

Site statique déployé sur **[aurel-academy.com](https://aurel-academy.com)**.

## Pages

| Route | Description |
|---|---|
| `/` | Home (présentation programmes) |
| `/pflege/inscription/` | Landing principale Pflege (FR + AR, RTL) |
| `/allemand/` | Landing programme A1 → B2 (FR + AR) |
| `/merci/` | Page de confirmation post-inscription |
| `/mentions/` | Mentions légales (FR + AR) |
| `/conditions/` | Conditions générales (FR + AR) |
| `/confidentialite/` | Politique de confidentialité RGPD-style (FR + AR) |
| `/cours/` | Espace étudiant existant (WordPress) |

## Assets partagés

- `/assets/fonts/` : self-hosting Inter + Noto Sans Arabic + Reem Kufi + Playfair Display
- `/css/` : style.css du home
- `/js/` : animations.js, lead-form.js, ui.js (du home)

## Stack

- HTML5 / CSS3 / JS vanilla (pas de framework)
- GSAP 3.12.5 chargé en CDN sur desktop uniquement (skip mobile pour perf)
- i18n maison (data-i18n attrs + dict JS, FR + AR)
- Apps Script Google → Sheet pour les inscriptions (routing closer round-robin)

## Déploiement

cPanel — upload via File Manager dans `public_html/` à la racine du domaine.

`.htaccess` à la racine définit le no-cache HTML + long-cache CSS/JS/woff2.

## Repo lié

Plateforme étudiant (login, dashboard, admin) → repo `aurel-academy-platform`
(domaine `app.aurel-academy.com`).
