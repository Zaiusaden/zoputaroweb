let turnFinished = false;

function updateBattleInfo() {
    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    const modeInfo = getModeInfo(currentMode);
    document.getElementById('battle-mode-display').textContent = modeInfo.name;

    const currentRoundTime = battleState.roundTimes[battleState.currentRound - 1];
    const currentFormat = battleState.roundFormats[battleState.currentRound - 1];
    
    let timeDisplay;
    if (currentFormat === 'continuous') {
        const totalMinutes = Math.floor(currentRoundTime * 2 / 60);
        const totalSeconds = (currentRoundTime * 2) % 60;
        timeDisplay = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')} total`;
    } else if (currentFormat === 'compass') {
        const currentCompasses = battleState.roundCompasses[battleState.currentRound - 1];
        const totalMinutes = Math.floor(currentRoundTime * 2 / 60);
        const totalSeconds = (currentRoundTime * 2) % 60;
        timeDisplay = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')} total - ${currentCompasses} compás${currentCompasses > 1 ? 'es' : ''}`;
    } else {
        const minutes = Math.floor(currentRoundTime / 60);
        const seconds = currentRoundTime % 60;
        timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')} c/u`;
    }
    
    document.getElementById('battle-duration').textContent = timeDisplay;

    document.getElementById('battle-round-info').textContent =
        `${battleState.currentRound}/${battleState.totalRounds}`;

    document.getElementById('battle-mc1-name').textContent = battleState.mc1.aka;
    document.getElementById('battle-mc2-name').textContent = battleState.mc2.aka;

    document.getElementById('battle-mc1-score').textContent = `(${battleState.mc1.wins})`;
    document.getElementById('battle-mc2-score').textContent = `(${battleState.mc2.wins})`;

    updateBattleCurrentBeat();
}

function updateBattleCurrentBeat() {
    const currentBeat = beats[currentBeatIndex];
    if (currentBeat) {
        document.getElementById('battle-current-beat-name').textContent = currentBeat.title;
    }
}

function updateTurnIndicators() {
    const mc1Container = document.getElementById('battle-mc1-container');
    const mc2Container = document.getElementById('battle-mc2-container');

    if (battleState.currentTurn === 1) {
        mc1Container.classList.add('active-turn');
        mc2Container.classList.remove('active-turn');
    } else {
        mc1Container.classList.remove('active-turn');
        mc2Container.classList.add('active-turn');
    }
}

function showBattleLoadingMessage(message) {
    document.getElementById('battle-word').textContent = message;
}

function startBattleTimer() {
    try {
        battleTimerActive = true;
        turnFinished = false;
        updateBattleTimerDisplay();

        battleTimerInterval = setInterval(() => {
            if (battleTimerActive && battleStarted && turnStarted && !battleIsPaused) {
                const remaining = getBattleRemainingTime();
                const remainingSeconds = Math.ceil(remaining / 1000);

                updateBattleTimerDisplay();

                if (!battleNotified30sec && remainingSeconds <= 30 && remaining > 0) {
                    battleNotified30sec = true;
                    showNotification('¡30 segundos restantes!', 'warning', 2000);
                } else if (!battleNotified10sec && remainingSeconds <= 10 && remaining > 0) {
                    battleNotified10sec = true;
                    showNotification('¡10 segundos!', 'warning', 2000);
                }

                if (remaining <= 0 && !turnFinished) {
                    turnFinished = true;
                    finishTurn();
                }
            }
        }, 50);

    } catch (error) {
        handleError(error, 'startBattleTimer');
    }
}

function updateBattleTimerDisplay() {
    const remaining = getBattleRemainingTime();
    const seconds = Math.ceil(remaining / 1000);
    const timeString = formatTime(seconds);
    document.getElementById('battle-timer').textContent = timeString;

    const timerElement = document.getElementById('battle-timer');
    if (seconds <= 10) {
        timerElement.style.color = '#ef4444';
    } else if (seconds <= 30) {
        timerElement.style.color = '#f59e0b';
    } else {
        timerElement.style.color = '#ffd700';
    }
}

function finishTurn() {
    if (turnFinished && battleTimerActive) {
        const currentFormat = getCurrentRoundFormat();
        
        if (currentFormat === 'continuous' || currentFormat === 'compass') {
            showBattleLoadingMessage('¡TIEMPO TERMINADO!');
            showNotification('¡Tiempo terminado para ambos MCs!', 'warning');
        } else {
            const currentMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
            showBattleLoadingMessage('¡TIEMPO!');
            showNotification(`¡Tiempo terminado para ${currentMC}!`, 'warning');
        }

        if (audioPlayer) {
            audioPlayer.pause();
        }

        setTimeout(() => {
            nextTurn();
        }, 1500);
    }
}

function startBattleWords() {
    try {
        const currentMode = battleState.roundModes[battleState.currentRound - 1];
        if (currentMode === 'thematic') {
            const wordElement = document.getElementById('battle-word');
            const themeElement = document.getElementById('theme-text');
            const currentTheme = themeElement ? themeElement.textContent : 'TEMA ACTUAL';
            wordElement.textContent = `TEMÁTICA: ${currentTheme.toUpperCase()}`;
            return;
        }

        if (currentMode === 'rules') {
            const wordElement = document.getElementById('battle-word');
            const ruleElement = document.getElementById('rule-text');
            const currentRule = ruleElement ? ruleElement.textContent : 'REGLA ACTUAL';
            wordElement.textContent = `REGLA: ${currentRule.toUpperCase()}`;
            return;
        }

        if (currentMode === 'classic') {
            const wordElement = document.getElementById('battle-word');
            wordElement.textContent = 'FREESTYLE LIBRE';
            return;
        }

        battleWordsActive = true;
        scheduleBattleNextWord();

    } catch (error) {
        handleError(error, 'startBattleWords');
    }
}

function scheduleBattleNextWord() {
    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    if (!battleWordsActive || !battleStarted || !turnStarted || currentMode === 'thematic' || currentMode === 'classic' || currentMode === 'rules') return;

    const elapsed = getBattleElapsedTime();
    const expectedWordIndex = Math.floor(elapsed / battleWordIntervalMs);

    if (expectedWordIndex > battleLastWordIndex) {
        showBattleNewWord();
        battleLastWordIndex = expectedWordIndex;
    }

    const nextWordVirtualTime = (battleLastWordIndex + 1) * battleWordIntervalMs;
    const virtualTimeUntilNext = nextWordVirtualTime - elapsed;
    const realTimeUntilNext = virtualTimeUntilNext / battleSpeedFactor;

    if (realTimeUntilNext > 0) {
        battleWordTimeout = setTimeout(() => {
            if (battleWordsActive && battleStarted && turnStarted && !battleIsPaused) {
                scheduleBattleNextWord();
            }
        }, realTimeUntilNext);
    }
}

function showBattleNewWord() {
    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    if (!battleWordsActive || !battleStarted || !turnStarted || currentMode === 'thematic' || currentMode === 'classic' || currentMode === 'rules') return;

    try {
        const word = getRandomWord(currentMode);

        if (word) {
            const wordElement = document.getElementById('battle-word');
            wordElement.textContent = word.toUpperCase();

            wordElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                wordElement.style.transform = 'scale(1)';
            }, 200);
        }

    } catch (error) {
        handleError(error, 'showBattleNewWord');
    }
}

function toggleBattleBeat() {
    if (!battleStarted || !audioPlayer) return;

    if (battleBeatActive) {
        pauseBattleEverything();
    } else {
        resumeBattleEverything();
    }
}

function pauseBattleEverything() {
    battleIsPaused = true;
    battleLastPauseTime = Date.now();
    battleWordPauseTime = Date.now();

    if (battleWordTimeout) {
        const elapsed = getBattleElapsedTime();
        const nextWordVirtualTime = (battleLastWordIndex + 1) * battleWordIntervalMs;
        const virtualTimeUntilNext = nextWordVirtualTime - elapsed;
        battleSavedWordTimeUntilNext = virtualTimeUntilNext / battleSpeedFactor;

        clearTimeout(battleWordTimeout);
        battleWordTimeout = null;
    }

    if (battleTurnChangeTimeout) {
        clearTimeout(battleTurnChangeTimeout);
        battleTurnChangeTimeout = null;
    }

    if (battleCompassTimeouts && battleCompassTimeouts.length > 0) {
        battleCompassTimeouts.forEach(timeout => clearTimeout(timeout));
        battleCompassTimeouts = [];
    }

    battleTimerActive = false;
    battleWordsActive = false;
    battleBeatActive = false;

    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
        battleTimerInterval = null;
    }

    audioPlayer.pause();

    document.getElementById('battle-pause-btn').innerHTML = '▶️ REANUDAR';
    document.getElementById('battle-beat-info').textContent = 'Batalla pausada';
}

function resumeBattleEverything() {
    if (battleIsPaused && battleLastPauseTime > 0) {
        battlePausedDuration += Date.now() - battleLastPauseTime;
        battleIsPaused = false;
        battleLastPauseTime = 0;
    }

    audioPlayer.play().then(() => {
        battleBeatActive = true;
        battleTimerActive = true;
        battleWordsActive = true;

        startBattleTimer();

        const currentFormat = getCurrentRoundFormat();
        if (currentFormat === 'continuous') {
            const elapsed = getBattleElapsedTime();
            const roundTime = battleState.roundTimes[battleState.currentRound - 1];
            const halfTimeVirtual = roundTime * 1000;
            
            if (elapsed < halfTimeVirtual) {
                const remainingVirtualToSwitch = halfTimeVirtual - elapsed;
                const remainingRealToSwitch = remainingVirtualToSwitch / battleSpeedFactor;
                
                battleTurnChangeTimeout = setTimeout(() => {
                    if (battleStarted && turnStarted) {
                        battleState.currentTurn = battleState.currentTurn === 1 ? 2 : 1;
                        updateTurnIndicators();
                        
                        const newMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
                        showNotification(`Turno de ${newMC}`, 'info', 1500);
                    }
                }, remainingRealToSwitch);
            }
        } else if (currentFormat === 'compass') {
            const elapsed = getBattleElapsedTime();
            const roundTime = battleState.roundTimes[battleState.currentRound - 1];
            const compassesPerTurn = battleState.roundCompasses[battleState.currentRound - 1];
            const compassDurationMs = compassesPerTurn * 10 * 1000;
            const totalDuration = roundTime * 2 * 1000;
            
            const nextChangeVirtual = Math.ceil(elapsed / compassDurationMs) * compassDurationMs;
            
            if (nextChangeVirtual < totalDuration) {
                const remainingVirtualToNextChange = nextChangeVirtual - elapsed;
                const remainingRealToNextChange = remainingVirtualToNextChange / battleSpeedFactor;
                
                setupCompassFormatFromTime(roundTime, compassesPerTurn, remainingRealToNextChange);
            }
        }

        const currentMode = battleState.roundModes[battleState.currentRound - 1];
        if (currentMode !== 'thematic' && currentMode !== 'classic' && currentMode !== 'rules') {
            if (battleSavedWordTimeUntilNext > 0) {
                battleWordTimeout = setTimeout(() => {
                    if (battleWordsActive && battleStarted && turnStarted && !battleIsPaused) {
                        scheduleBattleNextWord();
                    }
                }, battleSavedWordTimeUntilNext);
                battleSavedWordTimeUntilNext = 0;
            } else {
                scheduleBattleNextWord();
            }
        }

        document.getElementById('battle-pause-btn').innerHTML = '⏸️ PAUSAR';
        document.getElementById('battle-beat-info').textContent = `Reproduciendo: ${beats[currentBeatIndex].title}`;
    }).catch(error => {
        console.error('Error reproduciendo beat:', error);
        handleBeatError();
    });
}

function updateBattleButtonStates(battle = false, started = false) {
    const pauseBtn = document.getElementById('battle-pause-btn');
    const previousBtn = document.getElementById('battle-previous-beat-btn');
    const nextBeatBtn = document.getElementById('battle-next-beat-btn');
    const stopBtn = document.getElementById('battle-stop-btn');
    const themeBtn = document.getElementById('battle-change-theme-btn');
    const ruleBtn = document.getElementById('battle-change-rule-btn');

    if (battle && started && turnStarted) {
        pauseBtn.disabled = false;
        previousBtn.disabled = true;
        nextBeatBtn.disabled = true;
        stopBtn.disabled = false;
        themeBtn.disabled = true;
        ruleBtn.disabled = true;
    } else if (battle && started && !turnStarted) {
        pauseBtn.disabled = true;
        previousBtn.disabled = false;
        nextBeatBtn.disabled = false;
        stopBtn.disabled = false;
        
        const currentMode = battleState.roundModes[battleState.currentRound - 1];
        if (currentMode === 'thematic') {
            themeBtn.disabled = false;
            ruleBtn.disabled = true;
        } else if (currentMode === 'rules') {
            themeBtn.disabled = true;
            ruleBtn.disabled = false;
        } else {
            themeBtn.disabled = true;
            ruleBtn.disabled = true;
        }
        
        updateBattlePreviousBeatButtonState();
    } else if (battle && !started) {
        pauseBtn.disabled = true;
        nextBeatBtn.disabled = true;
        stopBtn.disabled = true;
        themeBtn.disabled = true;
        ruleBtn.disabled = true;

        if (previousBtn) previousBtn.disabled = true;
    } else {
        pauseBtn.disabled = true;
        nextBeatBtn.disabled = true;
        stopBtn.disabled = true;
        themeBtn.disabled = true;
        ruleBtn.disabled = true;

        if (previousBtn) previousBtn.disabled = true;
    }
}

function updateBattlePreviousBeatButtonState() {
    const previousBtn = document.getElementById('battle-previous-beat-btn');
    if (previousBtn) {
        previousBtn.disabled = beatHistory.length === 0 || !battleStarted || turnStarted;
    }
}

function stopBattle() {
    try {
        stopBattleEverything();

        showBattleLoadingMessage('COMENZAR BATALLA');
        document.getElementById('battle-beat-info').textContent = 'Batalla detenida';
        document.getElementById('battle-timer').textContent = '00:00';

        updateBattleButtonStates(true, false);

        const mainButton = document.getElementById('battle-start-button');
        mainButton.style.pointerEvents = 'auto';
        mainButton.style.opacity = '1';
        mainButton.onclick = beginBattle;

        showNotification('Batalla detenida', 'warning');

    } catch (error) {
        handleError(error, 'stopBattle');
    }
}

function stopBattleEverything() {
    battleStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    turnStarted = false;
    turnFinished = false;

    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
        battleTimerInterval = null;
    }

    if (battleWordTimeout) {
        clearTimeout(battleWordTimeout);
        battleWordTimeout = null;
    }

    if (battleTurnChangeTimeout) {
        clearTimeout(battleTurnChangeTimeout);
        battleTurnChangeTimeout = null;
    }

    if (battleCompassTimeouts && battleCompassTimeouts.length > 0) {
        battleCompassTimeouts.forEach(timeout => clearTimeout(timeout));
        battleCompassTimeouts = [];
    }

    stopBeat();
}

function confirmBattleExit() {
    if (battleStarted) {
        return confirm('¿Estás seguro de que quieres salir de la batalla? Se perderá el progreso actual.');
    }
    return true;
}

function toggleCompassSelector(selectElement, roundNumber) {
    const compassSelector = document.getElementById(`battle-round-${roundNumber}-compass-selector`);
    if (selectElement.value === 'compass') {
        compassSelector.style.display = 'block';
    } else {
        compassSelector.style.display = 'none';
    }
}

function updateBattleRoundSelector() {
    const roundsSelect = document.getElementById('battle-rounds');
    const roundTimesContainer = document.getElementById('battle-round-times');

    const rounds = parseInt(roundsSelect.value);
    roundTimesContainer.innerHTML = '';

    for (let i = 1; i <= rounds; i++) {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round-config-selector';
        roundDiv.innerHTML = `
            <label>Ronda ${i}</label>
            <div class="round-selectors">
                <select id="battle-round-${i}-time" required>
                    <option value="60" selected>1 minuto por MC</option>
                    <option value="100">1 minuto 40 seg por MC</option>
                    <option value="120">2 minutos por MC</option>
                </select>
                <select id="battle-round-${i}-mode" required>
                    <option value="classic" selected>CLASSIC - Freestyle libre</option>
                    <option value="easy">EASY - Palabra cada 10 seg</option>
                    <option value="hard">HARD MODE - Palabra cada 5 seg</option>
                    <option value="insane">INSANE MODE - Palabra cada 4 seg</option>
                    <option value="thematic">TEMÁTICA - Modo temático</option>
                    <option value="rules">RULES - Reglas de batalla</option>
                </select>
                <select id="battle-round-${i}-format" required onchange="toggleCompassSelector(this, ${i})">
                    <option value="pause" selected>🛑 Con Pausa - Turnos separados</option>
                    <option value="continuous">▶️ Continuo - Sin parar el beat</option>
                    <option value="compass">🎵 Por Compases - Alternancia rápida</option>
                </select>
            </div>
            <div id="battle-round-${i}-compass-selector" class="compass-selector" style="display: none;">
                <label>Compases por turno</label>
                <select id="battle-round-${i}-compass">
                    <option value="1" selected>1 compás (10 seg)</option>
                    <option value="2">2 compases (20 seg)</option>
                </select>
            </div>
        `;
        roundTimesContainer.appendChild(roundDiv);
    }
}

function battleSoftReset() {
    if (!battleStarted || !turnStarted) return;

    battleSpeedFactor = calculateBattleBPMSpeedFactor();

    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
        battleTimerInterval = null;
    }
    if (battleWordTimeout) {
        clearTimeout(battleWordTimeout);
        battleWordTimeout = null;
    }
    if (battleTurnChangeTimeout) {
        clearTimeout(battleTurnChangeTimeout);
        battleTurnChangeTimeout = null;
    }
    if (battleCompassTimeouts && battleCompassTimeouts.length > 0) {
        battleCompassTimeouts.forEach(timeout => clearTimeout(timeout));
        battleCompassTimeouts = [];
    }

    resetBattleTimingValues();
    resetBattleNotificationFlags();

    const currentFormat = getCurrentRoundFormat();
    const roundTime = battleState.roundTimes[battleState.currentRound - 1];
    
    if (currentFormat === 'continuous') {
        battleTotalDurationMs = roundTime * 2 * 1000;
        setupContinuousFormat(roundTime);
    } else if (currentFormat === 'compass') {
        const compassesPerTurn = battleState.roundCompasses[battleState.currentRound - 1];
        battleTotalDurationMs = roundTime * 2 * 1000;
        setupCompassFormat(roundTime, compassesPerTurn);
    } else {
        battleTotalDurationMs = roundTime * 1000;
    }
    
    updateBattleTimerDisplay();
    startBattleTimer();

    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    if (currentMode !== 'thematic' && currentMode !== 'classic' && currentMode !== 'rules') {
        battleWordIntervalMs = getModeInterval(currentMode);
        battleLastWordIndex = -1;
        battleSavedWordTimeUntilNext = 0;
        startBattleWords();
    }
}

function battleChangeTheme() {
    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    if (currentMode === 'thematic' && battleStarted && !turnStarted) {
        const themeText = document.getElementById('theme-text');
        const currentWord = document.getElementById('battle-word');
        const newTheme = getRandomTheme();

        themeText.textContent = newTheme;
        currentWord.textContent = `TEMÁTICA: ${newTheme.toUpperCase()}`;

        currentWord.style.transform = 'scale(1.1)';
        currentWord.style.color = '#ffd700';
        setTimeout(() => {
            currentWord.style.transform = 'scale(1)';
            currentWord.style.color = '#ffd700';
        }, 300);
    }
}

function battleChangeRule() {
    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    if (currentMode === 'rules' && battleStarted && !turnStarted) {
        const ruleText = document.getElementById('rule-text');
        const currentWord = document.getElementById('battle-word');
        const newRule = getRandomRule();

        ruleText.textContent = newRule;
        currentWord.textContent = `REGLA: ${newRule.toUpperCase()}`;

        currentWord.style.transform = 'scale(1.1)';
        setTimeout(() => {
            currentWord.style.transform = 'scale(1)';
        }, 300);
    }
}

function toggleBattleTimerMode() {
    if (battleStarted) return;
    
    battleTimerMode = battleTimerMode === 'real' ? 'bmp' : 'real';
    
    const btn = document.getElementById('battle-timer-mode-btn');
    const text = document.getElementById('battle-timer-mode-text');
    const description = document.getElementById('battle-timer-mode-description');
    
    if (battleTimerMode === 'bmp') {
        text.textContent = 'TIEMPO BPM';
        btn.classList.add('bmp-mode');
        description.textContent = 'Sincronizado al BPM del beat (RECOMENDADO)';
    } else {
        text.textContent = 'TIEMPO REAL';
        btn.classList.remove('bmp-mode');
        description.textContent = 'Cronómetro estándar (menos preciso musicalmente)';
    }
}

document.addEventListener('keydown', function (event) {
    if (!battleStarted) return;

    switch(event.code) {
        case 'Space':
            event.preventDefault();
            if (!turnStarted) {
                toggleBattleBeat();
            }
            break;
        case 'ArrowRight':
            event.preventDefault();
            if (!turnStarted) {
                nextBeat();
            }
            break;
        case 'ArrowLeft':
            event.preventDefault();
            if (!turnStarted) {
                previousBeat();
            }
            break;
        case 'KeyT':
            event.preventDefault();
            const currentMode = battleState.roundModes[battleState.currentRound - 1];
            if (currentMode === 'thematic' && !turnStarted) {
                battleChangeTheme();
            }
            break;
        case 'KeyR':
            event.preventDefault();
            const currentModeR = battleState.roundModes[battleState.currentRound - 1];
            if (currentModeR === 'rules' && !turnStarted) {
                battleChangeRule();
            }
            break;
        case 'Escape':
            event.preventDefault();
            if (confirm('¿Parar batalla?')) {
                stopBattle();
            }
            break;
    }
});

console.log('Battle-ui.js cargado correctamente ✅');