document.addEventListener('DOMContentLoaded', function () {
    console.log('Inicializando Freestyle Training Lab...');
    
    initAudioSystem();
    loadBeats();
    selectRandomBeat();
    updateBattleRoundSelector();
    
    console.log('Sistema inicializado correctamente');
});

function showView(viewId) {
    const beatPlayer = document.getElementById('beat-player');
    if (beatPlayer) {
        const audioElements = beatPlayer.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
    
    const battleBeatPlayer = document.getElementById('battle-beat-player');
    if (battleBeatPlayer) {
        const audioElements = battleBeatPlayer.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.error(`Vista ${viewId} no encontrada`);
    }
    window.scrollTo(0, 0);
}

function showComingSoon(feature) {
    alert(`🚧 ${feature} estará disponible próximamente!\n\nPor ahora puedes usar el Entrenamiento Libre para mejorar tus skills.`);
}

function updateTrainingInfo() {
    const modeInfo = getModeInfo(trainingConfig.mode);
    document.getElementById('training-mode-display').textContent = modeInfo.name;

    if (trainingConfig.duration === 'infinite') {
        document.getElementById('training-duration').textContent = '∞';
    } else {
        const minutes = Math.floor(trainingConfig.duration / 60);
        const seconds = trainingConfig.duration % 60;
        document.getElementById('training-duration').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (selectedBeat === 'random') {
        document.getElementById('current-beat-name').textContent = 'Aleatorio';
    } else if (selectedBeat) {
        const beat = beats.find(b => b.id === selectedBeat);
        if (beat) {
            document.getElementById('current-beat-name').textContent = beat.title;
        }
    }
}

function validateConfig() {
    const duration = document.getElementById('duration-mode').value;
    const mode = document.getElementById('training-mode').value;
    
    if (!selectedBeat) {
        alert('⚠️ Por favor, selecciona un beat antes de comenzar el entrenamiento.');
        return false;
    }
    
    if (selectedBeat === 'random' && selectedCategories.size === 0) {
        alert('⚠️ Para usar beat aleatorio, selecciona al menos una categoría de beats.');
        return false;
    }
    
    return true;
}

function showLoadingMessage(message) {
    const currentWordElement = document.getElementById('current-word');
    if (currentWordElement) {
        currentWordElement.textContent = message;
    }
}

let activeNotifications = [];

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const baseTop = 20;
    const notificationHeight = 80;
    const gap = 10;
    const topPosition = baseTop + (activeNotifications.length * (notificationHeight + gap));
    
    notification.style.cssText = `
        position: fixed;
        top: ${topPosition}px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-family: 'Russo One', sans-serif;
        font-size: 0.9rem;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        max-width: 300px;
        min-height: 50px;
        display: flex;
        align-items: center;
        transition: top 0.3s ease;
    `;
    
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(45deg, #4ade80, #22c55e)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(45deg, #ef4444, #dc2626)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(45deg, #f59e0b, #d97706)';
            break;
        default:
            notification.style.background = 'linear-gradient(45deg, #3b82f6, #2563eb)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    activeNotifications.push(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
                const index = activeNotifications.indexOf(notification);
                if (index > -1) {
                    activeNotifications.splice(index, 1);
                    repositionNotifications();
                }
            }
        }, 300);
    }, duration);
}

function repositionNotifications() {
    const baseTop = 20;
    const notificationHeight = 80;
    const gap = 10;
    
    activeNotifications.forEach((notification, index) => {
        const newTop = baseTop + (index * (notificationHeight + gap));
        notification.style.top = `${newTop}px`;
    });
}

const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

function confirmExit() {
    if (trainingStarted) {
        return confirm('¿Estás seguro de que quieres salir del entrenamiento? Se perderá el progreso actual.');
    }
    return true;
}

function handleError(error, context = '') {
    console.error(`Error en ${context}:`, error);
    showNotification(`Error: ${error.message || 'Algo salió mal'}`, 'error');
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getCurrentConfig() {
    return {
        duration: document.getElementById('duration-mode').value,
        mode: document.getElementById('training-mode').value,
        beat: selectedBeat,
        categories: Array.from(selectedCategories)
    };
}

function saveConfig() {
    try {
        const config = getCurrentConfig();
        localStorage.setItem('freestyleConfig', JSON.stringify(config));
        showNotification('Configuración guardada', 'success', 2000);
    } catch (error) {
        console.warn('No se pudo guardar la configuración:', error);
    }
}

function loadConfig() {
    try {
        const savedConfig = localStorage.getItem('freestyleConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            
            if (config.duration) document.getElementById('duration-mode').value = config.duration;
            if (config.mode) document.getElementById('training-mode').value = config.mode;
            if (config.beat && config.beat !== 'random') {
                selectBeat(config.beat);
            } else {
                selectRandomBeat();
            }
            if (config.categories && Array.isArray(config.categories)) {
                selectedCategories = new Set(config.categories);
                updateCategoryButtons();
            }
            
            showNotification('Configuración cargada', 'info', 2000);
        }
    } catch (error) {
        console.warn('No se pudo cargar la configuración:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadConfig();
});

function debugInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('Training Started:', typeof trainingStarted !== 'undefined' ? trainingStarted : 'undefined');
    console.log('Battle Started:', typeof battleStarted !== 'undefined' ? battleStarted : 'undefined');
    console.log('Timer Active:', typeof timerActive !== 'undefined' ? timerActive : 'undefined');
    console.log('Words Active:', typeof wordsActive !== 'undefined' ? wordsActive : 'undefined');
    console.log('Beat Active:', typeof beatActive !== 'undefined' ? beatActive : 'undefined');
    console.log('Selected Categories:', Array.from(selectedCategories));
    console.log('Current Beat Index:', currentBeatIndex);
    console.log('Audio Player:', audioPlayer);
    console.log('Training Config:', typeof trainingConfig !== 'undefined' ? trainingConfig : 'undefined');
    console.log('Battle State:', typeof battleState !== 'undefined' ? battleState : 'undefined');
    console.log('================');
}

console.log('UI.js cargado correctamente ✅');