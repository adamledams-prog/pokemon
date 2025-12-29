// Logique principale du jeu

import { GAME_CONFIG, CARDS_DATABASE, RARITY_STYLES } from './config.js';
import { loadGameState, saveGameState } from './storage.js';

// État du jeu
let gameState = null;
let selectedCardsForBattle = [];

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
    
    // Migration : Mettre à jour Super Mario de 50$/s à 30$/s
    let needsSave = false;
    gameState.deck.forEach(card => {
        if (card.name === "Super Mario" && card.income === 50) {
            card.income = 30;
            needsSave = true;
        }
    });
    
    if (needsSave) {
        saveGameState(gameState);
        console.log('✅ Migration: Super Mario mis à jour vers 30$/s');
    }
    
    renderDeck();
    updateMoney();
    startIncomeGeneration();
    startCardRotation();
    checkQuests();
    
    // Événement pour le bouton Place
    document.getElementById('place-btn').addEventListener('click', () => {
        window.location.href = 'pages/upgrades.html';
    });
    
    // Événement pour le bouton Attaquer
    document.getElementById('attack-btn').addEventListener('click', () => {
        if (selectedCardsForBattle.length === 4) {
            // Sauvegarder les cartes sélectionnées pour le combat
            const selectedCards = selectedCardsForBattle.map(index => gameState.deck[index]);
            localStorage.setItem('battleCards', JSON.stringify(selectedCards));
            window.location.href = 'pages/battle.html';
        } else {
            alert('⚠️ Sélectionnez 4 cartes pour attaquer !');
        }
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
 * Les cartes Secret sont exclues (quêtes uniquement)
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
        const isSelected = selectedCardsForBattle.includes(index);
        return `
        <div class="deck-card ${isSelected ? 'selected-for-battle' : ''}" style="background: linear-gradient(135deg, ${bgColor}, ${darkerColor});">
            <div class="deck-card-name">${card.name}</div>
            <div class="card-rarity">${rarityStyle.emoji} ${card.rarity}</div>
            <div class="deck-card-income">+${card.income}$/s</div>
            <button class="select-battle-btn" onclick="window.toggleCardSelection(${index})">
                ${isSelected ? '✔️ Sélectionné' : '⚔️ Sélectionner'}
            </button>
            <button class="sell-btn" onclick="window.sellCard(${index})">Vendre (${GAME_CONFIG.SELL_PRICE}$)</button>
        </div>
    `;
    }).join('');
    
    updateAttackButton();
}

/**
 * Sélectionne ou désélectionne une carte pour le combat
 */
export function toggleCardSelection(index) {
    const cardIndex = selectedCardsForBattle.indexOf(index);
    
    if (cardIndex > -1) {
        // Désélectionner
        selectedCardsForBattle.splice(cardIndex, 1);
    } else {
        // Sélectionner si moins de 4 cartes
        if (selectedCardsForBattle.length < 4) {
            selectedCardsForBattle.push(index);
        }
    }
    
    renderDeck();
}

/**
 * Met à jour l'état du bouton Attaquer
 */
function updateAttackButton() {
    const attackBtn = document.getElementById('attack-btn');
    const selectedCount = document.getElementById('selected-count');
    
    selectedCount.textContent = selectedCardsForBattle.length;
    
    if (selectedCardsForBattle.length === 4) {
        attackBtn.disabled = false;
        attackBtn.style.opacity = '1';
        attackBtn.style.cursor = 'pointer';
    } else {
        attackBtn.disabled = true;
        attackBtn.style.opacity = '0.5';
        attackBtn.style.cursor = 'not-allowed';
    }
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
    
    // Quête 3 : Avoir 4000$, 4 légendaires et 2 Mega
    if (!quest3.completed) {
        const legendaryCount = gameState.deck.filter(card => card.rarity === "Légendaire").length;
        const megaCount = gameState.deck.filter(card => card.rarity === "Mega").length;
        const hasMoney = gameState.money >= 4000;
        
        if (hasMoney && legendaryCount >= 4 && megaCount >= 2) {
            quest3.completed = true;
            saveGameState(gameState);
        }
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
            description: "Avoir 4000$ + 4 Légendaires + 2 Mega dans le deck",
            reward: "⚫ Super Mario (Secret: +30$/s)",
            check: () => {
                const legendaryCount = gameState.deck.filter(card => card.rarity === "Légendaire").length;
                const megaCount = gameState.deck.filter(card => card.rarity === "Mega").length;
                return gameState.money >= 4000 && legendaryCount >= 4 && megaCount >= 2;
            }
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
        // Quête 1 : +200$ et retirer Celebi
        gameState.money += 200;
        
        // Retirer Celebi du deck
        const celebiIndex = gameState.deck.findIndex(card => card.name === "Celebi");
        if (celebiIndex !== -1) {
            gameState.deck.splice(celebiIndex, 1);
        }
        
        alert('🎉 Vous avez gagné 200$ ! Celebi a quitté votre deck.');
        
        // Déverrouiller quête 2
        gameState.quests[1].unlocked = true;
    } else if (questIndex === 1) {
        // Quête 2 : +2 places de deck et retirer Mega Dracaufeu
        gameState.maxDeckSize += 2;
        
        // Retirer Mega Dracaufeu du deck
        const megaDracaufeuIndex = gameState.deck.findIndex(card => card.name === "Mega Dracaufeu");
        if (megaDracaufeuIndex !== -1) {
            gameState.deck.splice(megaDracaufeuIndex, 1);
        }
        
        alert(`🎉 Vous avez maintenant ${gameState.maxDeckSize} places dans votre deck ! Mega Dracaufeu a quitté votre deck.`);
        
        // Déverrouiller quête 3
        gameState.quests[2].unlocked = true;
    } else if (questIndex === 2) {
        // Quête 3 : Super Mario (Secret)
        const superMario = CARDS_DATABASE.find(card => card.name === "Super Mario");
        if (superMario) {
            gameState.deck.push({
                ...superMario,
                purchaseId: Date.now() + Math.random()
            });
            alert('🎉 Vous avez débloqué Super Mario ! Carte Secret : +30$/s');
        }
    }
    
    saveGameState(gameState);
    updateMoney();
    renderDeck();
    renderQuests();
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initGame);

// ===== LOGIQUE DU MINI-JEU DE COMBAT =====

let battleTimer = 30;
let battleTimerInterval = null;
let selectedPoint = null;
let connections = [];
let gameActive = true;

const colorMap = {
    'orange': '#ff9a3c',
    'red': '#ff6b6b',
    'green': '#51cf66'
};

/**
 * Initialise le jeu de combat
 */
function initBattle() {
    const canvas = document.getElementById('game-canvas');
    const container = document.querySelector('.cable-game');
    
    // Réinitialiser l'état
    battleTimer = 30;
    gameActive = true;
    selectedPoint = null;
    connections = [];
    
    // Ajuster la taille du canvas
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // Effacer le canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Nettoyer les classes des points
    document.querySelectorAll('.point').forEach(point => {
        point.classList.remove('selected', 'connected');
    });
    
    // Mélanger l'ordre des points à droite
    shuffleRightPoints();
    
    // Nettoyer le message de résultat
    document.getElementById('result-message-battle').textContent = '';
    document.getElementById('result-message-battle').className = 'result-message-battle';
    
    // Événements sur les points
    const points = document.querySelectorAll('.point');
    points.forEach(point => {
        point.replaceWith(point.cloneNode(true));
    });
    
    document.querySelectorAll('.point').forEach(point => {
        point.addEventListener('click', handlePointClick);
    });
    
    // Démarrer le timer
    startBattleTimer();
}

/**
 * Mélange l'ordre des points à droite
 */
function shuffleRightPoints() {
    const rightContainer = document.getElementById('right-points');
    const points = Array.from(rightContainer.children);
    
    for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        rightContainer.appendChild(points[j]);
    }
}

/**
 * Démarre le timer de combat
 */
function startBattleTimer() {
    updateBattleTimerDisplay();
    
    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
    }
    
    battleTimerInterval = setInterval(() => {
        battleTimer--;
        updateBattleTimerDisplay();
        
        if (battleTimer <= 0) {
            endBattle(false);
        }
    }, 1000);
}

/**
 * Met à jour l'affichage du timer de combat
 */
function updateBattleTimerDisplay() {
    const timerElement = document.getElementById('timer-battle');
    timerElement.textContent = battleTimer;
}

/**
 * Gère le clic sur un point
 */
function handlePointClick(event) {
    if (!gameActive) return;
    
    const point = event.target;
    
    if (point.classList.contains('connected')) return;
    
    if (!selectedPoint) {
        selectedPoint = point;
        point.classList.add('selected');
    } else {
        if (selectedPoint === point) {
            selectedPoint.classList.remove('selected');
            selectedPoint = null;
            return;
        }
        
        const color1 = selectedPoint.dataset.color;
        const color2 = point.dataset.color;
        const side1 = selectedPoint.dataset.side;
        const side2 = point.dataset.side;
        
        if (color1 === color2 && side1 !== side2) {
            createConnection(selectedPoint, point);
            selectedPoint.classList.remove('selected');
            selectedPoint.classList.add('connected');
            point.classList.add('connected');
            selectedPoint = null;
            
            checkWinCondition();
        } else {
            selectedPoint.classList.remove('selected');
            selectedPoint = null;
            
            point.style.transform = 'scale(0.8)';
            setTimeout(() => {
                point.style.transform = '';
            }, 200);
        }
    }
}

/**
 * Crée une connexion entre deux points
 */
function createConnection(point1, point2) {
    const color = point1.dataset.color;
    connections.push({ point1, point2, color });
    drawConnections();
}

/**
 * Dessine toutes les connexions sur le canvas
 */
function drawConnections() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    connections.forEach(conn => {
        const rect1 = conn.point1.getBoundingClientRect();
        const rect2 = conn.point2.getBoundingClientRect();
        const containerRect = canvas.getBoundingClientRect();
        
        const x1 = rect1.left + rect1.width / 2 - containerRect.left;
        const y1 = rect1.top + rect1.height / 2 - containerRect.top;
        const x2 = rect2.left + rect2.width / 2 - containerRect.left;
        const y2 = rect2.top + rect2.height / 2 - containerRect.top;
        
        // Configurer l'ombre avant de dessiner
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        
        const controlX = (x1 + x2) / 2;
        ctx.quadraticCurveTo(controlX, y1, controlX, (y1 + y2) / 2);
        ctx.quadraticCurveTo(controlX, y2, x2, y2);
        
        ctx.strokeStyle = colorMap[conn.color];
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    });
}

/**
 * Vérifie si toutes les connexions sont faites
 */
function checkWinCondition() {
    const totalPoints = document.querySelectorAll('.point.connected').length;
    const maxPoints = document.querySelectorAll('.point').length;
    
    if (totalPoints === maxPoints) {
        endBattle(true);
    }
}

/**
 * Termine le jeu de combat
 */
function endBattle(won) {
    gameActive = false;
    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
    }
    
    const resultMessage = document.getElementById('result-message-battle');
    
    if (won) {
        resultMessage.className = 'result-message-battle success';
        resultMessage.textContent = `🎉 Victoire ! Vous avez connecté tous les câbles en ${30 - battleTimer} secondes !`;
    } else {
        resultMessage.className = 'result-message-battle failure';
        resultMessage.textContent = '⏱️ Temps écoulé ! Vous avez perdu...';
    }
    
    setTimeout(() => {
        resultMessage.innerHTML += '<br><button onclick="location.reload()" style="margin-top: 15px; padding: 15px 40px; background: #1a4d2e; color: white; border: none; border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer;">Rejouer</button>';
    }, 1000);
}

/**
 * Réinitialise le combat
 */
function resetBattle() {
    gameActive = false;
    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
    }
    battleTimer = 30;
    selectedPoint = null;
    connections = [];
    
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Nettoyer les classes des points
    document.querySelectorAll('.point').forEach(point => {
        point.classList.remove('selected', 'connected');
    });
}

// Exposer sellCard et autres fonctions globalement pour les boutons HTML
window.sellCard = sellCard;
window.claimQuest = claimQuest;
window.toggleCardSelection = toggleCardSelection;
