// Configuration globale du jeu

export const GAME_CONFIG = {
    STARTING_MONEY: 20,
    DEFAULT_MAX_DECK_SIZE: 4,
    CARD_VISIBLE_TIME: 3000, // 3 secondes
    CARD_HIDDEN_TIME: 1000, // 1 seconde
    INCOME_INTERVAL: 1000, // 1 seconde
    SELL_PRICE: 10,
    DECK_UPGRADE_PRICE: 80,
    UPGRADED_DECK_SIZE: 6
};

// Base de données des cartes
export const CARDS_DATABASE = [
    { name: "Magicarpe", rarity: "Commune", price: 10, income: 2 },
    { name: "Rattata", rarity: "Commune", price: 10, income: 2 },
    { name: "Dracaufeu", rarity: "Rare", price: 15, income: 3 },
    { name: "Tortank", rarity: "Rare", price: 15, income: 3 },
    { name: "Florizarre", rarity: "Rare", price: 15, income: 3 },
    { name: "Mewtwo", rarity: "Épique", price: 20, income: 5 },
    { name: "Lugia", rarity: "Épique", price: 20, income: 5 },
    { name: "Ho-Oh", rarity: "Épique", price: 20, income: 5 },
    { name: "Rayquaza", rarity: "Épique", price: 20, income: 5 },
    { name: "Mew", rarity: "Mythique", price: 35, income: 10 },
    { name: "Celebi", rarity: "Mythique", price: 35, income: 10 },
    { name: "Arceus", rarity: "Légendaire", price: 50, income: 15 },
];

// Styles de rareté
export const RARITY_STYLES = {
    "Commune": { emoji: "⚪", color: "#cbd5e0" },
    "Rare": { emoji: "🔵", color: "#90cdf4" },
    "Épique": { emoji: "✨", color: "#9b59b6" },
    "Mythique": { emoji: "💫", color: "#fbb6ce" },
    "Légendaire": { emoji: "🌟", color: "#fbd38d" }
};
