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
                <div class="shooting-target">Objectif: 100 points</div>
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
            endShootingGame(shootingScore >= 100);
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
            
            // Vérifier la victoire
            if (shootingScore >= 100) {
                endShootingGame(true);
            }
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
    
    const resultDiv = document.getElementById('shooting-result');
    
    if (won) {
        resultDiv.className = 'shooting-result success';
        resultDiv.innerHTML = `
            <h2>🎉 VICTOIRE TOTALE !</h2>
            <p>Vous avez terminé les 2 mini-jeux !</p>
            <button onclick="location.href='../index.html'" style="margin-top: 20px; padding: 15px 40px; background: white; color: #1a4d2e; border: none; border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer;">Retour au jeu</button>
        `;
    }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', initBattle);
