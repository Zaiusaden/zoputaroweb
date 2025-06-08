function toggleTimerMode() {
    if (trainingStarted) return;
    
    timerMode = timerMode === 'real' ? 'bmp' : 'real';
    
    const btn = document.getElementById('timer-mode-btn');
    const text = document.getElementById('timer-mode-text');
    const description = document.getElementById('timer-mode-description');
    
    if (timerMode === 'bmp') {
        text.textContent = 'TIEMPO BMP';
        btn.classList.add('bmp-mode');
        description.textContent = 'Sincronizado al BPM del beat (RECOMENDADO)';
    } else {
        text.textContent = 'TIEMPO REAL';
        btn.classList.remove('bmp-mode');
        description.textContent = 'Cronómetro estándar (menos preciso musicalmente)';
    }
}

function startTrainingTimer() {
    if (trainingConfig.duration === 'infinite') {
        document.getElementById('timer').textContent = '∞';
        return;
    }

    try {
        timerActive = true;
        updateTrainingTimerDisplay();

        timerInterval = setInterval(() => {
            if (timerActive && trainingStarted && !isPaused) {
                const remaining = getTrainingRemainingTime();
                const remainingSeconds = Math.ceil(remaining / 1000);
                
                updateTrainingTimerDisplay();
                
                if (!notified30sec && remainingSeconds <= 30 && remaining > 0) {
                    notified30sec = true;
                    showNotification('¡30 segundos restantes!', 'warning', 2000);
                } else if (!notified10sec && remainingSeconds <= 10 && remaining > 0) {
                    notified10sec = true;
                    showNotification('¡10 segundos!', 'warning', 2000);
                }
                
                if (remaining <= 0) {
                    finishTraining();
                }
            }
        }, 50);
        
    } catch (error) {
        handleError(error, 'startTrainingTimer');
    }
}

function updateTrainingTimerDisplay() {
    if (trainingConfig.duration === 'infinite') {
        document.getElementById('timer').textContent = '∞';
        return;
    }

    const remaining = getTrainingRemainingTime();
    const seconds = Math.ceil(remaining / 1000);
    const timeString = formatTime(seconds);
    document.getElementById('timer').textContent = timeString;
    
    const timerElement = document.getElementById('timer');
    if (seconds <= 10) {
        timerElement.style.color = '#ef4444';
    } else if (seconds <= 30) {
        timerElement.style.color = '#f59e0b';
    } else {
        timerElement.style.color = '#ffd700';
    }
}

function finishTraining() {
    showTrainingLoadingMessage('¡TIEMPO TERMINADO!');
    showNotification('¡Tiempo terminado! Buen trabajo', 'success');
    stopTraining();
}

function pauseTrainingEverything() {
    isPaused = true;
    lastPauseTime = Date.now();
    wordPauseTime = Date.now();
    
    if (wordTimeout) {
        const elapsed = getTrainingElapsedTime();
        const nextWordVirtualTime = (lastWordIndex + 1) * wordIntervalMs;
        const virtualTimeUntilNext = nextWordVirtualTime - elapsed;
        savedWordTimeUntilNext = virtualTimeUntilNext / speedFactor;
        
        clearTimeout(wordTimeout);
        wordTimeout = null;
    }
    
    timerActive = false;
    wordsActive = false;
    beatActive = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    audioPlayer.pause();
    
    document.getElementById('pause-beat-btn').innerHTML = '▶️ REANUDAR ENTRENAMIENTO';
    document.getElementById('beat-info').textContent = 'Entrenamiento pausado';
}

function resumeTrainingEverything() {
    if (isPaused && lastPauseTime > 0) {
        pausedDuration += Date.now() - lastPauseTime;
        isPaused = false;
        lastPauseTime = 0;
    }

    audioPlayer.play().then(() => {
        beatActive = true;
        timerActive = true;
        wordsActive = true;
        
        if (trainingConfig.duration !== 'infinite') {
            startTrainingTimer();
        }
        
        if (trainingConfig.mode !== 'thematic' && trainingConfig.mode !== 'classic') {
            if (savedWordTimeUntilNext > 0) {
                wordTimeout = setTimeout(() => {
                    if (wordsActive && trainingStarted && !isPaused) {
                        scheduleTrainingNextWord();
                    }
                }, savedWordTimeUntilNext);
                savedWordTimeUntilNext = 0;
            } else {
                scheduleTrainingNextWord();
            }
        }
        
        document.getElementById('pause-beat-btn').innerHTML = '⏸️ PAUSAR ENTRENAMIENTO';
        document.getElementById('beat-info').textContent = `Reproduciendo: ${beats[currentBeatIndex].title}`;
    }).catch(error => {
        console.error('Error reproduciendo beat:', error);
        handleBeatError();
    });
}

console.log('Training-timer.js cargado correctamente ✅');
