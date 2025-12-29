// Logique du mini-jeu de combat

let timer = 30;
let timerInterval = null;
let selectedPoint = null;
let connections = [];
let gameActive = true;
let game1Score = 0;

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
    
    if (!canvas || !container) return;
    
    // Ajuster la taille du canvas
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // Effacer le canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mélanger l'ordre des points à droite
    shuffleRightPoints();
    
    // Événements sur les points
    const points = document.querySelectorAll('.point');
    points.forEach(point => {
        point.addEventListener('click', handlePointClick);
    });
    
    // Démarrer le timer
    startTimer();
    
    // Redessiner au resize
    window.addEventListener('resize', () => {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        drawConnections();
    });
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
 * Démarre le timer
 */
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timer--;
        updateTimerDisplay();
        
        if (timer <= 0) {
            endGame(false);
        }
    }, 1000);
}

/**
 * Met à jour l'affichage du timer
 */
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = timer;
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
            
            // Ajouter 5 points
            game1Score += 5;
            document.getElementById('score').textContent = game1Score;
            
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
        endGame(true);
    }
}

/**
 * Termine le jeu
 */
function endGame(won) {
    gameActive = false;
    clearInterval(timerInterval);
    
    const resultMessage = document.getElementById('result-message');
    
    if (won) {
        resultMessage.className = 'result-message success';
        resultMessage.textContent = `🎉 Victoire ! Vous avez connecté tous les câbles en ${30 - timer} secondes !`;
        
        // Lancer le mini-jeu 2 après 2 secondes
        setTimeout(() => {
            startShootingGame();
        }, 2000);
    } else {
        resultMessage.className = 'result-message failure';
        resultMessage.textContent = '⏱️ Temps écoulé ! Vous avez perdu...';
        
        setTimeout(() => {
            resultMessage.innerHTML += '<br><button onclick="location.reload()" style="margin-top: 15px; padding: 15px 40px; background: white; color: #1a4d2e; border: none; border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer;">Rejouer</button>';
        }, 1000);
    }
}

// ===== MINI-JEU 2 : TIR =====

let shootingScore = 0;
let shootingActive = false;
let fallingObjects = [];
let animationId = null;

/**
 * Démarre le mini-jeu de tir
 */
function startShootingGame() {
    // Cacher le premier jeu
    document.querySelector('.battle-container').style.display = 'none';
    document.querySelector('.timer-display').style.display = 'none';
    document.querySelector('.score-display').style.display = 'none';
    
    // Créer l'interface du jeu de tir
    const shootingContainer = document.createElement('div');
    shootingContainer.id = 'shooting-game';
    shootingContainer.innerHTML = `
        <div class="shooting-container">
            <div class="shooting-header">
                <div class="shooting-timer">⏱️ <span id="shooting-timer">10</span>s</div>
                <div class="shooting-score">Score Total: <span id="shooting-score">${game1Score}</span></div>
                <div class="shooting-target">Tirez le plus de points possible !</div>
            </div>
            <canvas id="shooting-canvas"></canvas>
            <div class="shooting-gun">🔫</div>
            <div id="shooting-result" class="shooting-result"></div>
        </div>
    `;
    document.body.appendChild(shootingContainer);
    
    // Initialiser le canvas
    const canvas = document.getElementById('shooting-canvas');
    canvas.width = window.innerWidth - 100;
    canvas.height = window.innerHeight - 300;
    
    shootingScore = game1Score; // Commencer avec le score du jeu 1
    shootingActive = true;
    fallingObjects = [];
    
    // Démarrer le timer de 10 secondes
    let shootingTimer = 10;
    const shootingTimerInterval = setInterval(() => {
        shootingTimer--;
        document.getElementById('shooting-timer').textContent = shootingTimer;
        
        if (shootingTimer <= 0) {
            clearInterval(shootingTimerInterval);
            endShootingGame(true); // Toujours gagner après les 10 secondes
        }
    }, 1000);
    
    // Démarrer le spawn d'objets
    spawnObjects();
    
    // Démarrer l'animation
    animate();
    
    // Gérer les clics
    canvas.addEventListener('click', handleShoot);
}

/**
 * Fait apparaître des objets qui tombent
 */
function spawnObjects() {
    if (!shootingActive) return;
    
    // Créer un nouvel objet (70% croix, 30% rond)
    const isCross = Math.random() < 0.7;
    const obj = {
        x: Math.random() * (document.getElementById('shooting-canvas').width - 50),
        y: -50,
        type: isCross ? 'cross' : 'circle',
        speed: 4 + Math.random() * 4,
        size: 40
    };
    
    fallingObjects.push(obj);
    
    // Spawner un autre objet après un délai aléatoire
    setTimeout(spawnObjects, 300 + Math.random() * 500);
}

/**
 * Animation des objets qui tombent
 */
function animate() {
    if (!shootingActive) return;
    
    const canvas = document.getElementById('shooting-canvas');
    const ctx = canvas.getContext('2d');
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mettre à jour et dessiner chaque objet
    fallingObjects = fallingObjects.filter(obj => {
        obj.y += obj.speed;
        
        // Supprimer si hors écran
        if (obj.y > canvas.height) {
            return false;
        }
        
        // Dessiner l'objet
        ctx.save();
        ctx.translate(obj.x + obj.size / 2, obj.y + obj.size / 2);
        
        if (obj.type === 'cross') {
            // Dessiner une croix (cible)
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-15, -15);
            ctx.lineTo(15, 15);
            ctx.moveTo(15, -15);
            ctx.lineTo(-15, 15);
            ctx.stroke();
        } else {
            // Dessiner un rond (éviter)
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        return true;
    });
    
    animationId = requestAnimationFrame(animate);
}

/**
 * Gère les tirs
 */
function handleShoot(event) {
    if (!shootingActive) return;
    
    const canvas = document.getElementById('shooting-canvas');
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Vérifier si on a touché un objet
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        const distance = Math.sqrt(
            Math.pow(clickX - (obj.x + obj.size / 2), 2) +
            Math.pow(clickY - (obj.y + obj.size / 2), 2)
        );
        
        if (distance < obj.size / 2 + 10) {
            // Touché !
            if (obj.type === 'cross') {
                shootingScore += 10;
                showHitEffect(clickX, clickY, '+10', '#2ecc71');
            } else {
                shootingScore -= 10;
                showHitEffect(clickX, clickY, '-10', '#e74c3c');
            }
            
            fallingObjects.splice(i, 1);
            updateShootingScore();
            break;
        }
    }
}

/**
 * Affiche un effet de hit
 */
function showHitEffect(x, y, text, color) {
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.textContent = text;
    effect.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        color: ${color};
        font-size: 2em;
        font-weight: bold;
        pointer-events: none;
        z-index: 1000;
        animation: hitFloat 1s ease-out forwards;
    `;
    document.getElementById('shooting-game').appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

/**
 * Met à jour l'affichage du score
 */
function updateShootingScore() {
    document.getElementById('shooting-score').textContent = shootingScore;
}

/**
 * Termine le mini-jeu de tir
 */
function endShootingGame(won) {
    shootingActive = false;
    cancelAnimationFrame(animationId);
    
    // Toujours afficher les récompenses
    // Récupérer les 4 cartes sélectionnées
    const battleCards = JSON.parse(localStorage.getItem('battleCards') || '[]');
    
    // Générer 2 cartes aléatoires
    const randomCards = [];
    for (let i = 0; i < 2; i++) {
        randomCards.push(generateRandomRewardCard());
    }
    
    // Combiner toutes les cartes
    const allRewardCards = [...battleCards, ...randomCards];
    
    // Sauvegarder toutes les 6 cartes pour les récupérer plus tard
    localStorage.setItem('allRewardCards', JSON.stringify(allRewardCards));
    
    // Afficher les 6 cartes
    displayRewardCards(allRewardCards);
}

/**
 * Génère une carte aléatoire selon les probabilités
 */
function generateRandomRewardCard() {
    const random = Math.random();
    let rarity;
    
    if (random < 0.05) {
        // 5% Secret
        rarity = 'Secret';
    } else if (random < 0.20) {
        // 15% Mega (0.05 à 0.20)
        rarity = 'Mega';
    } else if (random < 0.60) {
        // 40% Mythique (0.20 à 0.60)
        rarity = 'Mythique';
    } else {
        // 40% Légendaire (0.60 à 1.0)
        rarity = 'Légendaire';
    }
    
    // Liste simplifiée des cartes disponibles
    const cardsDatabase = [
        { name: "Arceus", rarity: "Légendaire", income: 7 },
        { name: "Mew", rarity: "Légendaire", income: 7 },
        { name: "Celebi", rarity: "Légendaire", income: 7 },
        { name: "Mewtwo", rarity: "Mythique", income: 5 },
        { name: "Lugia", rarity: "Mythique", income: 5 },
        { name: "Ho-Oh", rarity: "Mythique", income: 5 },
        { name: "Rayquaza", rarity: "Mythique", income: 5 },
        { name: "Mega Dracaufeu", rarity: "Mega", income: 15 },
        { name: "Mega Mewtwo", rarity: "Mega", income: 15 },
        { name: "Mega Rayquaza", rarity: "Mega", income: 15 },
        { name: "Super Mario", rarity: "Secret", income: 30 }
    ];
    
    const availableCards = cardsDatabase.filter(card => card.rarity === rarity);
    return availableCards[Math.floor(Math.random() * availableCards.length)];
}

/**
 * Affiche les cartes de récompense
 */
function displayRewardCards(cards) {
    const shootingGame = document.getElementById('shooting-game');
    
    // Récupérer l'état du jeu
    const gameState = JSON.parse(localStorage.getItem('idleCardGame'));
    
    // Calculer le revenu des 6 cartes affichées
    const displayedCardsIncome = cards.reduce((sum, card) => sum + (card.income || 0), 0);
    
    // Calculer le total (score des épreuves + revenu des 6 cartes)
    const totalScore = shootingScore + displayedCardsIncome;
    
    shootingGame.innerHTML = `
        <div class="reward-container">
            <div class="money-display">💰 ${displayedCardsIncome}$/s</div>
            <div class="score-display-top">🎯 Score: ${shootingScore}</div>
            <div class="total-display">🏆 Total: ${totalScore}</div>
            <h1>🎉 Victoire ! Vos Récompenses</h1>
            <p class="reward-subtitle">Vos 4 cartes + 2 cartes bonus !</p>
            <div class="reward-cards">
                ${cards.map((card, index) => {
                    const colors = {
                        'Légendaire': '#f1c40f',
                        'Mega': '#3498db',
                        'Secret': '#1a1a1a',
                        'Épique': '#9b59b6',
                        'Mythique': '#e74c3c'
                    };
                    const bgColor = colors[card.rarity] || '#9b59b6';
                    const isBonus = index >= 4;
                    const delay = index * 0.2;
                    return `
                        <div class="reward-card ${isBonus ? 'bonus-card' : 'chosen-card'}" style="background: linear-gradient(135deg, ${bgColor}, ${adjustColor(bgColor, -20)}); animation-delay: ${delay}s;">
                            ${isBonus ? '<div class="bonus-badge">🎁 BONUS</div>' : '<div class="chosen-badge">⭐ CHOISI</div>'}
                            <div class="reward-card-name">${card.name}</div>
                            <div class="reward-card-rarity">${card.rarity}</div>
                            <div class="reward-card-income">+${card.income}$/s</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="wheel-section">
                <div class="wheel-container">
                    <canvas id="wheel-canvas" width="300" height="300"></canvas>
                    <button id="spin-wheel-btn" class="spin-btn" onclick="spinWheel(${totalScore})">TOURNER LA ROUE</button>
                </div>
                <div id="wheel-result" class="wheel-result"></div>
            </div>
            <button onclick="applyRewardsAndReturn()" class="return-btn">Retour au jeu</button>
        </div>
    `;
    
    // Dessiner la roue
    drawWheel();
}

/**
 * Applique les récompenses et retourne au jeu
 */
window.applyRewardsAndReturn = function() {
    // Récupérer l'état du jeu
    const gameState = JSON.parse(localStorage.getItem('idleCardGame'));
    
    // Récupérer toutes les cartes de récompense
    const allRewardCards = JSON.parse(localStorage.getItem('allRewardCards') || '[]');
    const bonusCards = allRewardCards.slice(4, 6); // Les 2 dernières cartes sont les bonus
    
    // Récupérer la carte de la roue si elle existe
    const wheelCard = JSON.parse(localStorage.getItem('wheelCard') || 'null');
    
    // Récupérer les indices des cartes sélectionnées
    const selectedIndices = JSON.parse(localStorage.getItem('selectedCardsForBattle') || '[]');
    
    // Supprimer 2 des 4 cartes sélectionnées (les 2 premières)
    const indicesToRemove = selectedIndices.slice(0, 2).sort((a, b) => b - a); // Trier en ordre décroissant
    indicesToRemove.forEach(index => {
        gameState.deck.splice(index, 1);
    });
    
    // Ajouter les 2 cartes bonus au deck
    gameState.deck.push(...bonusCards);
    
    // Ajouter la carte de la roue si elle existe et supprimer une carte aléatoire
    if (wheelCard) {
        // Supprimer une carte aléatoire du deck (qui n'était pas dans les cartes sélectionnées)
        if (gameState.deck.length > 0) {
            const randomIndex = Math.floor(Math.random() * gameState.deck.length);
            gameState.deck.splice(randomIndex, 1);
        }
        
        // Ajouter la carte de la roue
        gameState.deck.push(wheelCard);
    }
    
    // Sauvegarder l'état
    localStorage.setItem('idleCardGame', JSON.stringify(gameState));
    
    // Nettoyer les données de bataille
    localStorage.removeItem('battleCards');
    localStorage.removeItem('selectedCardsForBattle');
    localStorage.removeItem('allRewardCards');
    localStorage.removeItem('wheelCard');
    
    // Rediriger
    location.href = '../index.html';
};

/**
 * Ajuste la couleur
 */
function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
}

/**
 * Dessine la roue
 */
function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;
    
    const colors = ['#f1c40f', '#3498db', '#1a1a1a', '#e74c3c'];
    const labels = ['Légendaire', 'Mega', 'Secret', 'Mythique'];
    const sections = 4;
    const anglePerSection = (Math.PI * 2) / sections;
    
    for (let i = 0; i < sections; i++) {
        ctx.beginPath();
        ctx.fillStyle = colors[i];
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, i * anglePerSection, (i + 1) * anglePerSection);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        
        // Texte
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(i * anglePerSection + anglePerSection / 2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(labels[i], radius / 2 - 20, 5);
        ctx.restore();
    }
    
    // Centre
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fill();
}

let wheelSpinning = false;
let wheelRotation = 0;

/**
 * Tourne la roue
 */
window.spinWheel = function(totalScore) {
    if (wheelSpinning) return;
    
    wheelSpinning = true;
    const button = document.getElementById('spin-wheel-btn');
    button.disabled = true;
    button.textContent = 'TOURNAGE...';
    
    // Déterminer la rareté selon le score
    let targetRarity;
    if (totalScore < 120) {
        targetRarity = 'Légendaire';
    } else if (totalScore <= 170) {
        targetRarity = 'Mega';
    } else {
        targetRarity = 'Secret';
    }
    
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    
    // Animation de rotation
    let spins = 0;
    const totalSpins = 5 + Math.random() * 3; // 5-8 tours
    const spinSpeed = 20;
    
    const rarityAngles = {
        'Légendaire': 0,
        'Mega': Math.PI / 2,
        'Secret': Math.PI,
        'Mythique': Math.PI * 1.5
    };
    
    const targetAngle = rarityAngles[targetRarity] + (Math.random() * 0.3 - 0.15);
    
    function animate() {
        if (spins < totalSpins) {
            wheelRotation += spinSpeed * (1 - spins / totalSpins);
            spins += 0.02;
            
            // Redessiner
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(wheelRotation * Math.PI / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            drawWheel();
            ctx.restore();
            
            requestAnimationFrame(animate);
        } else {
            // Arrêter sur la bonne section
            wheelRotation = (targetAngle * 180 / Math.PI) % 360;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(wheelRotation * Math.PI / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            drawWheel();
            ctx.restore();
            
            // Afficher le résultat et ajouter la carte
            setTimeout(() => {
                showWheelResult(targetRarity);
            }, 500);
        }
    }
    
    animate();
};

/**
 * Affiche le résultat de la roue et ajoute la carte au deck
 */
function showWheelResult(rarity) {
    const resultDiv = document.getElementById('wheel-result');
    
    // Générer une carte de cette rareté
    const cardsDatabase = [
        { name: "Arceus", rarity: "Légendaire", income: 7 },
        { name: "Mew", rarity: "Légendaire", income: 7 },
        { name: "Celebi", rarity: "Légendaire", income: 7 },
        { name: "Mega Dracaufeu", rarity: "Mega", income: 15 },
        { name: "Mega Mewtwo", rarity: "Mega", income: 15 },
        { name: "Mega Rayquaza", rarity: "Mega", income: 15 },
        { name: "Super Mario", rarity: "Secret", income: 30 }
    ];
    
    const availableCards = cardsDatabase.filter(card => card.rarity === rarity);
    const wonCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    
    const colors = {
        'Légendaire': '#f1c40f',
        'Mega': '#3498db',
        'Secret': '#1a1a1a'
    };
    
    resultDiv.innerHTML = `
        <div class="wheel-win-card" style="background: linear-gradient(135deg, ${colors[rarity]}, ${adjustColor(colors[rarity], -20)});">
            <h3>🎉 Vous avez gagné !</h3>
            <div class="wheel-card-name">${wonCard.name}</div>
            <div class="wheel-card-rarity">${wonCard.rarity}</div>
            <div class="wheel-card-income">+${wonCard.income}$/s</div>
        </div>
    `;
    
    // Ajouter la carte au localStorage pour l'ajouter au deck
    const wheelCard = JSON.parse(localStorage.getItem('wheelCard') || 'null');
    localStorage.setItem('wheelCard', JSON.stringify(wonCard));
    
    wheelSpinning = false;
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', initBattle);
