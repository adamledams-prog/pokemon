// Logique de la page d'améliorations

import { GAME_CONFIG } from './config.js';
import { loadGameState, saveGameState } from './storage.js';

let gameState = null;

/**
 * Initialise la page d'améliorations
 */
function initUpgrades() {
    gameState = loadGameState();
    updateMoney();
    
    const btn = document.getElementById('buy-deck-upgrade');
    
    // Vérifier si l'amélioration a déjà été achetée
    if (gameState.maxDeckSize >= GAME_CONFIG.UPGRADED_DECK_SIZE) {
        btn.disabled = true;
        btn.textContent = 'Déjà acheté';
    }
    
    btn.addEventListener('click', buyDeckUpgrade);
}

/**
 * Achète l'amélioration du deck
 */
function buyDeckUpgrade() {
    if (gameState.maxDeckSize >= GAME_CONFIG.UPGRADED_DECK_SIZE) {
        alert('✅ Vous avez déjà cette amélioration!');
        return;
    }
    
    if (gameState.money >= GAME_CONFIG.DECK_UPGRADE_PRICE) {
        gameState.money -= GAME_CONFIG.DECK_UPGRADE_PRICE;
        gameState.maxDeckSize = GAME_CONFIG.UPGRADED_DECK_SIZE;
        saveGameState(gameState);
        updateMoney();
        
        alert(`✅ Amélioration achetée! Vous avez maintenant ${gameState.maxDeckSize} places dans votre deck!`);
        
        const btn = document.getElementById('buy-deck-upgrade');
        btn.disabled = true;
        btn.textContent = 'Déjà acheté';
    } else {
        alert(`❌ Pas assez d'argent! Il vous faut ${GAME_CONFIG.DECK_UPGRADE_PRICE}$`);
    }
}

/**
 * Met à jour l'affichage de l'argent
 */
function updateMoney() {
    document.getElementById('money').textContent = Math.floor(gameState.money);
}

// Initialisation
document.addEventListener('DOMContentLoaded', initUpgrades);
