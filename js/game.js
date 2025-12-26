// Logique principale du jeu

import { GAME_CONFIG, CARDS_DATABASE } from './config.js';
import { loadGameState, saveGameState } from './storage.js';

// État du jeu
let gameState = null;

/**
 * Initialise le jeu
 */
export function initGame() {
    gameState = loadGameState();
    
    renderDeck();
    updateMoney();
    startIncomeGeneration();
    startCardRotation();
    
    // Événement pour le bouton Place
    document.getElementById('place-btn').addEventListener('click', () => {
        window.open('pages/upgrades.html', '_blank');
    });
}

/**
 * Démarre la rotation des cartes
 */
function startCardRotation() {
    showNewCard();
    
    setInterval(() => {
        gameState.cardVisible = false;
        renderShop();
        
        setTimeout(() => {
            showNewCard();
        }, GAME_CONFIG.CARD_HIDDEN_TIME);
    }, GAME_CONFIG.CARD_VISIBLE_TIME + GAME_CONFIG.CARD_HIDDEN_TIME);
}

/**
 * Affiche une nouvelle carte aléatoire
 */
function showNewCard() {
    const randomCard = CARDS_DATABASE[Math.floor(Math.random() * CARDS_DATABASE.length)];
    gameState.currentCard = randomCard;
    gameState.cardVisible = true;
    renderShop();
}

/**
 * Affiche la carte dans la boutique
 */
function renderShop() {
    const shopContainer = document.getElementById('shop-cards');
    
    if (!gameState.cardVisible || !gameState.currentCard) {
        shopContainer.innerHTML = '<div class="empty-deck" style="padding: 40px; color: rgba(255,255,255,0.5);">En attente...</div>';
        return;
    }
    
    const card = gameState.currentCard;
    const canBuy = gameState.money >= card.price && gameState.deck.length < gameState.maxDeckSize;
    
    const cardDiv = document.createElement('div');
    cardDiv.className = `shop-card ${canBuy ? 'clickable' : 'disabled'}`;
    cardDiv.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-rarity">✨ ${card.rarity}</div>
        <div class="card-info">💵 Revenu: +${card.income}$/s</div>
        <div class="card-price">Prix: ${card.price}$</div>
        ${!canBuy && gameState.deck.length >= gameState.maxDeckSize ? '<div style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">Deck plein!</div>' : ''}
        ${!canBuy && gameState.money < card.price ? '<div style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">Pas assez d\'argent</div>' : ''}
    `;
    
    if (canBuy) {
        cardDiv.addEventListener('click', buyCard);
    }
    
    shopContainer.innerHTML = '';
    shopContainer.appendChild(cardDiv);
}

/**
 * Achète la carte actuellement affichée
 */
function buyCard() {
    const card = gameState.currentCard;
    
    if (!gameState.cardVisible || !card || gameState.money < card.price || gameState.deck.length >= gameState.maxDeckSize) {
        return;
    }
    
    gameState.money -= card.price;
    gameState.deck.push({
        ...card,
        purchaseId: Date.now() + Math.random()
    });
    
    updateMoney();
    renderDeck();
    renderShop();
    saveGameState(gameState);
}

/**
 * Affiche les cartes du deck
 */
function renderDeck() {
    const deckContainer = document.getElementById('deck');
    document.getElementById('deck-count').textContent = `${gameState.deck.length}/${gameState.maxDeckSize}`;
    
    if (gameState.deck.length === 0) {
        deckContainer.innerHTML = '<div class="empty-deck">Aucune carte achetée</div>';
        return;
    }
    
    deckContainer.innerHTML = gameState.deck.map((card, index) => `
        <div class="deck-card">
            <div class="deck-card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity}</div>
            <div class="deck-card-income">+${card.income}$/s</div>
            <button class="sell-btn" onclick="window.sellCard(${index})">Vendre (${GAME_CONFIG.SELL_PRICE}$)</button>
        </div>
    `).join('');
}

/**
 * Vend une carte du deck
 */
export function sellCard(index) {
    if (index >= 0 && index < gameState.deck.length) {
        gameState.deck.splice(index, 1);
        gameState.money += GAME_CONFIG.SELL_PRICE;
        updateMoney();
        renderDeck();
        saveGameState(gameState);
    }
}

/**
 * Met à jour l'affichage de l'argent
 */
function updateMoney() {
    document.getElementById('money').textContent = Math.floor(gameState.money);
    renderShop();
}

/**
 * Démarre la génération automatique de revenus
 */
function startIncomeGeneration() {
    setInterval(() => {
        if (gameState.deck.length > 0) {
            const totalIncome = gameState.deck.reduce((sum, card) => sum + card.income, 0);
            gameState.money += totalIncome;
            updateMoney();
            
            // Sauvegarde périodique
            if (Math.random() < 0.2) {
                saveGameState(gameState);
            }
        }
    }, GAME_CONFIG.INCOME_INTERVAL);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initGame);

// Exposer sellCard globalement pour les boutons HTML
window.sellCard = sellCard;
