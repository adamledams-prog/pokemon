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
    { name: "Magicarpe", rarity: "Épique", price: 15, income: 3 },
    { name: "Rattata", rarity: "Épique", price: 15, income: 3 },
    { name: "Dracaufeu", rarity: "Épique", price: 15, income: 3 },
    { name: "Tortank", rarity: "Épique", price: 15, income: 3 },
    { name: "Florizarre", rarity: "Épique", price: 15, income: 3 },
    { name: "Mewtwo", rarity: "Mythique", price: 25, income: 5 },
    { name: "Lugia", rarity: "Mythique", price: 25, income: 5 },
    { name: "Ho-Oh", rarity: "Mythique", price: 25, income: 5 },
    { name: "Rayquaza", rarity: "Mythique", price: 25, income: 5 },
    { name: "Arceus", rarity: "Légendaire", price: 50, income: 7 },
    { name: "Mew", rarity: "Légendaire", price: 50, income: 7 },
    { name: "Celebi", rarity: "Légendaire", price: 50, income: 7 },
    { name: "Mega Dracaufeu", rarity: "Mega", price: 200, income: 15 },
    { name: "Mega Mewtwo", rarity: "Mega", price: 200, income: 15 },
    { name: "Mega Rayquaza", rarity: "Mega", price: 200, income: 15 },
];

// Styles de rareté
export const RARITY_STYLES = {
    "Épique": { emoji: "✨", color: "#9b59b6" },
    "Mythique": { emoji: "💫", color: "#e74c3c" },
    "Légendaire": { emoji: "🌟", color: "#f1c40f" },
    "Mega": { emoji: "🔥", color: "#3498db" }
};
