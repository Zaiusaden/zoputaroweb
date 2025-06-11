let trainingStarted = false;
let timerActive = false;
let wordsActive = false;
let beatActive = false;

let timerInterval = null;
let wordTimeout = null;

let startTime = 0;
let pausedDuration = 0;
let lastPauseTime = 0;
let isPaused = false;

let totalDurationMs = 0;
let wordIntervalMs = 0;
let lastWordIndex = -1;

let savedWordTimeUntilNext = 0;
let wordPauseTime = 0;

let notified30sec = false;
let notified10sec = false;

let trainingConfig = {};
let timerMode = 'bmp';
let speedFactor = 1;

let trainingStats = {
    wordsShown: 0,
    timeElapsed: 0,
    beatsUsed: []
};

function startTraining() {
    if (!validateTrainingConfig()) {
        return;
    }

    trainingConfig = getCurrentTrainingConfig();

    try {
        showView('training-screen');
        
        document.getElementById('stop-battle-btn').textContent = '⏹️ PARAR ENTRENAMIENTO';

        updateTrainingInfo();
        setupInitialBeat();
        setupTheme();

        resetTrainingState();

        updateTrainingButtonStates(true, false);

        showNotification('Configuración lista. Presiona el botón principal para comenzar', 'success');

    } catch (error) {
        handleError(error, 'startTraining');
    }
}

function beginTraining() {
    if (trainingStarted) return;

    try {
        const mainButton = document.getElementById('main-start-button');
        mainButton.style.pointerEvents = 'none';
        mainButton.style.opacity = '0.7';

        speedFactor = calculateTrainingBPMSpeedFactor();

        let countdown = 4;
        const messages = ["TIEMPO!", "1", "2", "3", "Y SE LO DAMOS EN..."];

        showTrainingLoadingMessage(messages[4]);

        setTimeout(() => {
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    showTrainingLoadingMessage(messages[countdown]);
                } else {
                    clearInterval(countdownInterval);

                    trainingStarted = true;

                    if (trainingConfig.duration !== 'infinite') {
                        totalDurationMs = parseInt(trainingConfig.duration) * 1000;
                    }

                    if (trainingConfig.mode !== 'thematic' && trainingConfig.mode !== 'classic') {
                        wordIntervalMs = getModeInterval(trainingConfig.mode);
                        lastWordIndex = -1;
                        savedWordTimeUntilNext = 0;
                    }

                    startBeatWithCallback((error) => {
                        if (error) {
                            console.error('Error iniciando beat:', error);
                            resetTrainingState();
                            showNotification('Error iniciando audio', 'error');
                            return;
                        }

                        resetTrainingTimingValues();
                        resetTrainingNotificationFlags();
                        
                        startTrainingTimer();
                        startTrainingWords();

                        updateTrainingButtonStates(true, true);

                        const modeText = timerMode === 'bmp' ? 'Tiempo BPM' : 'Tiempo Real';
                        showNotification(`¡Entrenamiento iniciado! (${modeText})`, 'success', 2000);
                    });
                }
            }, 1000);
        }, 1000);

    } catch (error) {
        handleError(error, 'beginTraining');
        resetTrainingState();
    }
}

function immediateStopForBeatChange() {
    if (!trainingStarted) return;

    saveCurrentWordState();

    timerActive = false;
    wordsActive = false;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (wordTimeout) {
        clearTimeout(wordTimeout);
        wordTimeout = null;
    }

    if (trainingConfig.duration === 'infinite') {
        document.getElementById('timer').textContent = '∞';
    } else {
        const totalSeconds = parseInt(trainingConfig.duration);
        const timeString = formatTime(totalSeconds);
        document.getElementById('timer').textContent = timeString;
        
        const timerElement = document.getElementById('timer');
        if (totalSeconds <= 10) {
            timerElement.style.color = '#ef4444';
        } else if (totalSeconds <= 30) {
            timerElement.style.color = '#f59e0b';
        } else {
            timerElement.style.color = '#ffd700';
        }
    }

    document.getElementById('current-word').textContent = 'PREPARANDO...';
}

function stopTraining() {
    try {
        stopAllTraining();

        showTrainingLoadingMessage('COMENZAR ENTRENAMIENTO');
        document.getElementById('beat-info').textContent = 'Entrenamiento detenido';
        document.getElementById('timer').textContent = '00:00';

        updateTrainingButtonStates(true, false);

        const mainButton = document.getElementById('main-start-button');
        mainButton.style.pointerEvents = 'auto';
        mainButton.style.opacity = '1';
        mainButton.onclick = beginTraining;

        showNotification('Entrenamiento detenido', 'warning');

    } catch (error) {
        handleError(error, 'stopTraining');
    }
}

function exitTraining() {
    if (!confirmTrainingExit()) return;

    try {
        stopAllTraining();
        resetTrainingState();
        showView('freestyle-config');
        showNotification('Has salido del entrenamiento', 'info');
    } catch (error) {
        handleError(error, 'exitTraining');
    }
}

function stopAllTraining() {
    trainingStarted = false;
    timerActive = false;
    wordsActive = false;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (wordTimeout) {
        clearTimeout(wordTimeout);
        wordTimeout = null;
    }

    stopBeat();
}

function resetTrainingState() {
    trainingStarted = false;
    timerActive = false;
    wordsActive = false;
    beatActive = false;
    speedFactor = 1;

    resetTrainingTimingValues();
    resetTrainingNotificationFlags();
    totalDurationMs = 0;
    wordIntervalMs = 0;
    lastWordIndex = -1;
    savedWordTimeUntilNext = 0;
    wordPauseTime = 0;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (wordTimeout) {
        clearTimeout(wordTimeout);
        wordTimeout = null;
    }

    document.getElementById('timer').textContent = '00:00';
    document.getElementById('current-word').textContent = 'COMENZAR ENTRENAMIENTO';
    document.getElementById('beat-info').textContent = 'Presiona el botón principal para activar';

    document.getElementById('pause-beat-btn').innerHTML = '▶️ PLAY ENTRENAMIENTO';

    const mainButton = document.getElementById('main-start-button');
    mainButton.style.pointerEvents = 'auto';
    mainButton.style.opacity = '1';
    mainButton.onclick = beginTraining;

    updateTrainingButtonStates(false, false);
}

function resetTrainingTimingValues() {
    startTime = Date.now();
    pausedDuration = 0;
    lastPauseTime = 0;
    isPaused = false;
}

function resetTrainingNotificationFlags() {
    notified30sec = false;
    notified10sec = false;
}

function getTrainingElapsedTime() {
    const now = Date.now();
    let realElapsed = now - startTime - pausedDuration;

    if (isPaused && lastPauseTime > 0) {
        realElapsed = lastPauseTime - startTime - pausedDuration;
    }

    const virtualElapsed = realElapsed * speedFactor;
    return Math.max(0, virtualElapsed);
}

function getTrainingRemainingTime() {
    if (trainingConfig.duration === 'infinite') return Infinity;

    const elapsed = getTrainingElapsedTime();
    return Math.max(0, totalDurationMs - elapsed);
}

function calculateTrainingBPMSpeedFactor() {
    if (timerMode === 'real' || trainingConfig.duration === 'infinite') {
        return 1;
    }

    const currentBeat = beats[currentBeatIndex];
    if (!currentBeat || !currentBeat.bpm) {
        return 1;
    }

    const visualMinutes = parseInt(trainingConfig.duration) / 60;
    const compassesPerMinute = 24;
    const totalCompasses = visualMinutes * compassesPerMinute;

    const realDurationSeconds = totalCompasses * (240 / currentBeat.bpm);
    const visualDurationSeconds = parseInt(trainingConfig.duration);

    return visualDurationSeconds / realDurationSeconds;
}

function showTrainingLoadingMessage(message) {
    const currentWordElement = document.getElementById('current-word');
    if (currentWordElement) {
        currentWordElement.textContent = message;
    }
}

function updateTrainingStats() {
    if (trainingStarted) {
        trainingStats.wordsShown++;
        trainingStats.timeElapsed = getTrainingElapsedTime() / 1000;

        const currentBeat = beats[currentBeatIndex];
        if (currentBeat && !trainingStats.beatsUsed.includes(currentBeat.title)) {
            trainingStats.beatsUsed.push(currentBeat.title);
        }
    }
}

function confirmTrainingExit() {
    if (trainingStarted) {
        return confirm('¿Estás seguro de que quieres salir del entrenamiento? Se perderá el progreso actual.');
    }
    return true;
}

function softReset() {
    if (!trainingStarted) return;

    speedFactor = calculateTrainingBPMSpeedFactor();

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (wordTimeout) {
        clearTimeout(wordTimeout);
        wordTimeout = null;
    }

    resetTrainingTimingValues();
    resetTrainingNotificationFlags();

    if (trainingConfig.duration !== 'infinite') {
        totalDurationMs = parseInt(trainingConfig.duration) * 1000;
        updateTrainingTimerDisplay();
        startTrainingTimer();
    }

    setTimeout(() => {
        restoreWordState();
    }, 200);

    if (trainingConfig.mode !== 'thematic' && trainingConfig.mode !== 'classic' && trainingConfig.mode !== 'rules') {
        wordIntervalMs = getModeInterval(trainingConfig.mode);
        lastWordIndex = -1;
        savedWordTimeUntilNext = 0;
        setTimeout(() => {
            startTrainingWords();
        }, 300);
    }
}

console.log('Training-core.js cargado correctamente ✅');
