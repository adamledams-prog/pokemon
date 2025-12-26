# 🎮 Jeu de Collection de Cartes Idle

Un jeu de collection de cartes type "idle game" où vous achetez des cartes qui génèrent automatiquement de l'argent.

## 🚀 Comment lancer

1. Ouvrez `index.html` dans votre navigateur
2. Ou hébergez sur GitHub Pages / Netlify / Vercel

## 🎯 Fonctionnalités

- **Système de cartes rotatives** : Une carte aléatoire apparaît toutes les 3 secondes
- **Achat simple** : Cliquez sur la carte pour l'acheter
- **Revenus passifs** : Vos cartes génèrent de l'argent automatiquement
- **Gestion du deck** : Maximum 4 cartes (extensible à 6)
- **Vente de cartes** : Récupérez 10$ par carte vendue
- **Améliorations** : Page dédiée pour acheter des upgrades

## 📁 Structure du projet

```
pokemon/
├── index.html              # Page principale du jeu
├── pages/
│   └── upgrades.html       # Page des améliorations
├── css/
│   ├── common.css          # Styles partagés
│   ├── game.css            # Styles de la page principale
│   └── upgrades.css        # Styles de la page d'améliorations
├── js/
│   ├── config.js           # Configuration et données des cartes
│   ├── storage.js          # Gestion du localStorage
│   ├── game.js             # Logique du jeu principal
│   └── upgrades.js         # Logique des améliorations
└── README.md               # Ce fichier
```

## 🎴 Types de cartes

| Rareté | Prix | Revenu/s |
|--------|------|----------|
| Commune | 10$ | 2$/s |
| Rare | 15$ | 3$/s |
| Épique | 20$ | 5$/s |
| Mythique | 35$ | 10$/s |
| Légendaire | 50$ | 15$/s |

## 💰 Système économique

- **Départ** : 20$
- **Vente de carte** : 10$ (fixe)
- **Amélioration deck** : 80$ (4 → 6 places)
- **Sauvegarde** : Automatique dans le navigateur (localStorage)

## 🛠️ Technologies

- HTML5
- CSS3 (avec animations)
- JavaScript ES6 Modules
- LocalStorage pour la sauvegarde

## 📝 Notes de développement

- Code modulaire et réutilisable
- Séparation des responsabilités (config, storage, logique)
- Gestion d'erreurs pour les anciennes sauvegardes
- Compatible tous navigateurs modernes

## 🚧 Améliorations futures possibles

- [ ] Plus de types d'améliorations
- [ ] Système de prestige
- [ ] Événements spéciaux
- [ ] Animations plus élaborées
- [ ] Sons et musique
- [ ] Mode sombre/clair

## 📜 Licence

Libre d'utilisation - Projet personnel
