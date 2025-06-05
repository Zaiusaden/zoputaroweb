function toggleBeat() {
    if (!trainingStarted || !audioPlayer) return;

    if (beatActive) {
        pauseTrainingEverything();
    } else {
        resumeTrainingEverything();
    }
}

function updateTrainingButtonStates(training = false, started = false) {
    const pauseBtn = document.getElementById('pause-beat-btn');
    const previousBtn = document.getElementById('previous-beat-btn');
    const nextBtn = document.getElementById('next-beat-btn');
    const stopBtn = document.getElementById('stop-battle-btn');
    const themeBtn = document.getElementById('change-theme-btn');
    const ruleBtn = document.getElementById('change-rule-btn');
    const timerModeBtn = document.getElementById('timer-mode-btn');
    
    if (training && started) {
        pauseBtn.disabled = false;
        nextBtn.disabled = false;
        stopBtn.disabled = false;
        timerModeBtn.disabled = true;
        
        if (trainingConfig.mode === 'thematic') {
            themeBtn.disabled = false;
            ruleBtn.disabled = true;
        } else if (trainingConfig.mode === 'rules') {
            themeBtn.disabled = true;
            ruleBtn.disabled = false;
        } else {
            themeBtn.disabled = true;
            ruleBtn.disabled = true;
        }
    } else if (training && !started) {
        pauseBtn.disabled = true;
        nextBtn.disabled = true;
        stopBtn.disabled = true;
        themeBtn.disabled = true;
        ruleBtn.disabled = true;
        timerModeBtn.disabled = false;
    } else {
        pauseBtn.disabled = true;
        nextBtn.disabled = true;
        stopBtn.disabled = true;
        themeBtn.disabled = true;
        ruleBtn.disabled = true;
        timerModeBtn.disabled = false;
    }
    
    updatePreviousBeatButtonState();
}

function handleTrainingBeatPlayback() {
    if (!audioPlayer || !currentBeatFile) {
        console.warn('Sistema de audio no inicializado');
        return false;
    }
    
    return new Promise((resolve, reject) => {
        const playPromise = audioPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    beatActive = true;
                    resolve();
                })
                .catch(error => {
                    console.error('Error reproduciendo audio:', error);
                    beatActive = false;
                    reject(error);
                });
        }
    });
}

document.addEventListener('keydown', function(event) {
    if (!trainingStarted) return;
    
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            toggleBeat();
            break;
        case 'ArrowRight':
            event.preventDefault();
            nextBeat();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            previousBeat();
            break;
        case 'KeyT':
            event.preventDefault();
            if (trainingConfig.mode === 'thematic') {
                changeTheme();
            }
            break;
        case 'KeyR':
            event.preventDefault();
            if (trainingConfig.mode === 'rules') {
                changeRule();
            }
            break;
        case 'Escape':
            event.preventDefault();
            if (confirm('¿Parar entrenamiento?')) {
                stopTraining();
            }
            break;
    }
});

function showTrainingKeyboardShortcuts() {
    const shortcuts = `
🎹 ATAJOS DE TECLADO (durante entrenamiento):
    
ESPACIO - Play/Pause entrenamiento
→ - Siguiente beat (aleatorio)
← - Beat anterior
T - Cambiar temática (solo en modo temática)
R - Cambiar regla (solo en modo rules)
ESC - Parar entrenamiento

¡Usa estos atajos para mayor control!
    `;
    alert(shortcuts);
}

document.addEventListener('DOMContentLoaded', function() {
    const helpButton = document.createElement('button');
    helpButton.innerHTML = '❓';
    helpButton.title = 'Atajos de teclado';
    helpButton.onclick = showTrainingKeyboardShortcuts;
    helpButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255, 215, 0, 0.2);
        border: 2px solid #ffd700;
        color: #ffd700;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 100;
        transition: all 0.3s ease;
    `;
    
    helpButton.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 215, 0, 0.3)';
        this.style.transform = 'scale(1.1)';
    });
    
    helpButton.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 215, 0, 0.2)';
        this.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(helpButton);
});

console.log('Training-controls.js cargado correctamente ✅');