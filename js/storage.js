// Gestion centralisée du localStorage

import { GAME_CONFIG } from './config.js';

const STORAGE_KEY = 'idleCardGame';

/**
 * Crée un état de jeu par défaut
 */
export function createDefaultGameState() {
    return {
        money: GAME_CONFIG.STARTING_MONEY,
        deck: [],
        maxDeckSize: GAME_CONFIG.DEFAULT_MAX_DECK_SIZE,
        currentCard: null,
        cardVisible: false,
        quests: [
            { id: 1, completed: false, claimed: false, unlocked: true },
            { id: 2, completed: false, claimed: false, unlocked: false },
            { id: 3, completed: false, claimed: false, unlocked: false }
        ]
    };
}

/**
 * Charge l'état du jeu depuis localStorage
 */
export function loadGameState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (!saved) {
        return createDefaultGameState();
    }
    
    try {
        const state = JSON.parse(saved);
        
        // Validation et correction des données
        if (!state.maxDeckSize) {
            state.maxDeckSize = GAME_CONFIG.DEFAULT_MAX_DECK_SIZE;
        }
        if (state.cardVisible === undefined) {
            state.cardVisible = false;
        }
        if (!state.currentCard) {
            state.currentCard = null;
        }
        if (!Array.isArray(state.deck)) {
            state.deck = [];
        }
        if (typeof state.money !== 'number') {
            state.money = GAME_CONFIG.STARTING_MONEY;
        }
        if (!state.quests || !Array.isArray(state.quests)) {
            state.quests = [
                { id: 1, completed: false, claimed: false, unlocked: true },
                { id: 2, completed: false, claimed: false, unlocked: false },
                { id: 3, completed: false, claimed: false, unlocked: false }
            ];
        }
        
        return state;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return createDefaultGameState();
    }
}

/**
 * Sauvegarde l'état du jeu dans localStorage
 */
export function saveGameState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Réinitialise complètement le jeu
 */
export function resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    return createDefaultGameState();
}
