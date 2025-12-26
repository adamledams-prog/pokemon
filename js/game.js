// Logique principale du jeu

import { GAME_CONFIG, CARDS_DATABASE, RARITY_STYLES } from './config.js';
import { loadGameState, saveGameState } from './storage.js';

// État du jeu
let gameState = null;

/**
 * Fonction pour assombrir ou éclaircir une couleur hex
 */
function shadeColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
        (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
        .toString(16).slice(1);
}

/**
 * Initialise le jeu
 */
export function initGame() {
    gameState = loadGameState();
    
    renderDeck();
    updateMoney();
    startIncomeGeneration();
    startCardRotation();
    checkQuests();
    
    // Événement pour le bouton Place
    document.getElementById('place-btn').addEventListener('click', () => {
        window.location.href = 'pages/upgrades.html';
    });
    
    // Événement pour le bouton Quêtes
    document.getElementById('quest-btn').addEventListener('click', () => {
        document.getElementById('quest-panel').style.display = 'flex';
        renderQuests();
    });
    
    // Fermeture du panneau de quêtes
    document.getElementById('quest-close').addEventListener('click', () => {
        document.getElementById('quest-panel').style.display = 'none';
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
 * Affiche une nouvelle carte aléatoire avec probabilités
 * 61% Épique, 25% Mythique, 10% Légendaire, 4% Mega
 */
function showNewCard() {
    const random = Math.random();
    let selectedCards;
    
    if (random < 0.61) {
        // 61% de chance : Épique
        selectedCards = CARDS_DATABASE.filter(card => card.rarity === "Épique");
    } else if (random < 0.86) {
        // 25% de chance : Mythique (0.61 à 0.86)
        selectedCards = CARDS_DATABASE.filter(card => card.rarity === "Mythique");
    } else if (random < 0.96) {
        // 10% de chance : Légendaire (0.86 à 0.96)
        selectedCards = CARDS_DATABASE.filter(card => card.rarity === "Légendaire");
    } else {
        // 4% de chance : Mega (0.96 à 1.0)
        selectedCards = CARDS_DATABASE.filter(card => card.rarity === "Mega");
    }
    
    const randomCard = selectedCards[Math.floor(Math.random() * selectedCards.length)];
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
    const rarityStyle = RARITY_STYLES[card.rarity] || RARITY_STYLES["Épique"];
    
    const cardDiv = document.createElement('div');
    cardDiv.className = `shop-card ${canBuy ? 'clickable' : 'disabled'}`;
    cardDiv.style.background = `linear-gradient(135deg, ${rarityStyle.color}, ${shadeColor(rarityStyle.color, -20)})`;
    cardDiv.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-rarity">${rarityStyle.emoji} ${card.rarity}</div>
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
    checkQuests();
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
    
    deckContainer.innerHTML = gameState.deck.map((card, index) => {
        const rarityStyle = RARITY_STYLES[card.rarity] || RARITY_STYLES["Épique"];
        const bgColor = rarityStyle.color;
        const darkerColor = shadeColor(bgColor, -20);
        return `
        <div class="deck-card" style="background: linear-gradient(135deg, ${bgColor}, ${darkerColor});">
            <div class="deck-card-name">${card.name}</div>
            <div class="card-rarity">${rarityStyle.emoji} ${card.rarity}</div>
            <div class="deck-card-income">+${card.income}$/s</div>
            <button class="sell-btn" onclick="window.sellCard(${index})">Vendre (${GAME_CONFIG.SELL_PRICE}$)</button>
        </div>
    `;
    }).join('');
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
        checkQuests();
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

/**
 * Vérifie la complétion des quêtes
 */
function checkQuests() {
    const quest1 = gameState.quests[0];
    const quest2 = gameState.quests[1];
    const quest3 = gameState.quests[2];
    
    // Quête 1 : Avoir Celebi
    if (!quest1.completed && gameState.deck.some(card => card.name === "Celebi")) {
        quest1.completed = true;
        saveGameState(gameState);
    }
    
    // Quête 2 : Avoir Mega Dracaufeu
    if (!quest2.completed && gameState.deck.some(card => card.name === "Mega Dracaufeu")) {
        quest2.completed = true;
        saveGameState(gameState);
    }
    
    // Déverrouillage de la quête 2 si la quête 1 est réclamée
    if (quest1.claimed && !quest2.unlocked) {
        quest2.unlocked = true;
        saveGameState(gameState);
    }
    
    // Déverrouillage de la quête 3 si la quête 2 est réclamée
    if (quest2.claimed && !quest3.unlocked) {
        quest3.unlocked = true;
        saveGameState(gameState);
    }
}

/**
 * Affiche les quêtes
 */
function renderQuests() {
    const questsContainer = document.getElementById('quests-list');
    
    const questsData = [
        {
            id: 1,
            title: "🌿 Quête Facile",
            description: "Obtenez Celebi dans votre deck",
            reward: "💰 200$",
            check: () => gameState.deck.some(card => card.name === "Celebi")
        },
        {
            id: 2,
            title: "🔥 Quête Mega",
            description: "Obtenez Mega Dracaufeu dans votre deck",
            reward: "📦 +2 places de deck (4→6 ou 6→8)",
            check: () => gameState.deck.some(card => card.name === "Mega Dracaufeu")
        },
        {
            id: 3,
            title: "⭐ Quête Ultime",
            description: "À venir...",
            reward: "🎁 Surprise",
            check: () => false
        }
    ];
    
    questsContainer.innerHTML = questsData.map((quest, index) => {
        const questState = gameState.quests[index];
        const isCompleted = questState.completed;
        const isClaimed = questState.claimed;
        const isUnlocked = questState.unlocked;
        
        let statusClass = '';
        let statusText = '';
        let claimButton = '';
        
        if (!isUnlocked) {
            statusClass = 'locked';
            statusText = '🔒 Verrouillée';
        } else if (isClaimed) {
            statusClass = 'completed';
            statusText = '✅ Complétée et réclamée';
        } else if (isCompleted) {
            statusText = '🎉 Complétée ! Cliquez pour réclamer';
            claimButton = `<button class="claim-btn" onclick="window.claimQuest(${index})">Réclamer la récompense</button>`;
        } else {
            statusText = '⏳ En cours...';
        }
        
        return `
            <div class="quest-card ${statusClass}">
                <div class="quest-title">${quest.title}</div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-reward">Récompense : ${quest.reward}</div>
                <div class="quest-status">${statusText}</div>
                ${claimButton}
            </div>
        `;
    }).join('');
}

/**
 * Réclamer une récompense de quête
 */
function claimQuest(questIndex) {
    const questState = gameState.quests[questIndex];
    
    if (!questState.completed || questState.claimed) {
        return;
    }
    
    questState.claimed = true;
    
    // Récompenses
    if (questIndex === 0) {
        // Quête 1 : +200$
        gameState.money += 200;
        alert('🎉 Vous avez gagné 200$ !');
        
        // Déverrouiller quête 2
        gameState.quests[1].unlocked = true;
    } else if (questIndex === 1) {
        // Quête 2 : +2 places de deck
        gameState.maxDeckSize += 2;
        alert(`🎉 Vous avez maintenant ${gameState.maxDeckSize} places dans votre deck !`);
        
        // Déverrouiller quête 3
        gameState.quests[2].unlocked = true;
    }
    
    saveGameState(gameState);
    updateMoney();
    renderDeck();
    renderQuests();
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initGame);

// Exposer sellCard globalement pour les boutons HTML
window.sellCard = sellCard;
window.claimQuest = claimQuest;
