# Points de Pression - ENPQ Trainer

Application web (PWA) d'entraînement aux 13 points de pression policiers, pour étudiants ENPQ.

## Fonctionnalités
- Mode Classique : questions aléatoires, score, série
- Mode Chrono : réponds aux 13 points le plus vite possible
- Révision libre : clique n'importe où sur le corps pour voir la fiche
- Par catégorie : pratique un objectif tactique précis (asseoir, lever, lâcher, etc.)
- Fonctionne hors-ligne une fois chargé (Service Worker)
- Installable sur mobile (Ajouter à l'écran d'accueil)

## Déploiement sur GitHub Pages (3 étapes)

1. Crée un nouveau repository public sur GitHub (ex: `pressure-points-trainer`).
2. Upload tous les fichiers de ce dossier (`index.html`, `style.css`, `script.js`, `manifest.json`, `service-worker.js`) à la racine du repo.
3. Va dans **Settings > Pages**, sous "Source" choisis la branche `main` et le dossier `/ (root)`, clique Save.

Ton site sera en ligne à l'adresse :
`https://TON-USERNAME.github.io/pressure-points-trainer/`

Partage ce lien avec tes collègues ENPQ — aucune installation requise, ça marche dans n'importe quel navigateur.

## Notes techniques
- 100% HTML/CSS/JS vanilla, aucune dépendance, aucun build step.
- Les données des 13 points sont dans `script.js` (tableau `POINTS`), faciles à modifier si besoin.
- Les icônes PWA (`icon-192.png`, `icon-512.png`) ne sont pas incluses — ajoute tes propres icônes ou retire ces lignes du `manifest.json` si tu ne veux pas installer l'app.
