let battleState = {
    mc1: { aka: '', wins: 0 },
    mc2: { aka: '', wins: 0 },
    currentTurn: 1,
    currentRound: 1,
    totalRounds: 1,
    roundTimes: [],
    roundModes: [],
    categories: new Set(),
    whoStarts: 'mc1',
    roundResults: [],
    turnsInCurrentRound: 0
};

let battleStarted = false;
let battleTimerActive = false;
let battleWordsActive = false;
let battleBeatActive = false;

let battleTimerInterval = null;
let battleWordTimeout = null;

let battleStartTime = 0;
let battlePausedDuration = 0;
let battleLastPauseTime = 0;
let battleIsPaused = false;

let battleTotalDurationMs = 0;
let battleWordIntervalMs = 0;
let battleLastWordIndex = -1;

let battleSavedWordTimeUntilNext = 0;
let battleWordPauseTime = 0;

let battleNotified30sec = false;
let battleNotified10sec = false;

let battleTimerMode = 'real';
let battleSpeedFactor = 1;

let turnStarted = false;

function initBattleConfig() {
    console.log('Initializing battle config...');
    battleState = {
        mc1: { aka: '', wins: 0 },
        mc2: { aka: '', wins: 0 },
        currentTurn: 1,
        currentRound: 1,
        totalRounds: 1,
        roundTimes: [],
        roundModes: [],
        categories: new Set(),
        whoStarts: 'mc1',
        roundResults: [],
        turnsInCurrentRound: 0
    };
    
    battleStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    turnStarted = false;
    
    updateBattleCategoryButtons();
    loadBeats();
    selectBattleRandomBeat();
    console.log('Battle config initialized, selectedCategories size:', selectedCategories.size);
}

function toggleBattleTimerMode() {
    if (battleStarted) return;
    
    battleTimerMode = battleTimerMode === 'real' ? 'bmp' : 'real';
    
    const btn = document.getElementById('battle-timer-mode-btn');
    const text = document.getElementById('battle-timer-mode-text');
    
    if (battleTimerMode === 'bmp') {
        text.textContent = 'TIEMPO BPM';
        btn.classList.add('bmp-mode');
    } else {
        text.textContent = 'TIEMPO REAL';
        btn.classList.remove('bmp-mode');
    }
}

function setBattleConfig(config) {
    battleState.mc1.aka = config.mc1Aka;
    battleState.mc2.aka = config.mc2Aka;
    battleState.totalRounds = parseInt(config.rounds);
    battleState.roundTimes = config.roundTimes;
    battleState.roundModes = config.roundModes;
    battleState.categories = new Set(config.categories);
    battleState.whoStarts = config.whoStarts;
    
    selectedCategories = new Set(config.categories);
    selectedBeat = 'random';
}

function validateBattleConfig() {
    console.log('Validating battle config...');
    const mc1Aka = document.getElementById('battle-mc1-aka').value.trim();
    const mc2Aka = document.getElementById('battle-mc2-aka').value.trim();
    const rounds = document.getElementById('battle-rounds').value;
    
    console.log('MC1 AKA:', mc1Aka);
    console.log('MC2 AKA:', mc2Aka);
    console.log('Selected categories size:', selectedCategories.size);
    console.log('Selected categories:', Array.from(selectedCategories));
    
    if (!mc1Aka || !mc2Aka) {
        alert('⚠️ Por favor, introduce los AKA de ambos MCs.');
        return false;
    }
    
    if (mc1Aka === mc2Aka) {
        alert('⚠️ Los AKA deben ser diferentes.');
        return false;
    }
    
    if (selectedCategories.size === 0) {
        alert('⚠️ Por favor, selecciona al menos una categoría de beats.');
        return false;
    }
    
    const roundTimes = [];
    const roundModes = [];
    for (let i = 1; i <= parseInt(rounds); i++) {
        const time = document.getElementById(`battle-round-${i}-time`).value;
        const mode = document.getElementById(`battle-round-${i}-mode`).value;
        if (!time) {
            alert(`⚠️ Por favor, selecciona el tiempo para la ronda ${i}.`);
            return false;
        }
        if (!mode) {
            alert(`⚠️ Por favor, selecciona el modo para la ronda ${i}.`);
            return false;
        }
        roundTimes.push(parseInt(time));
        roundModes.push(mode);
    }
    
    console.log('Battle config validation passed');
    return { mc1Aka, mc2Aka, rounds, roundTimes, roundModes };
}

function startBattle() {
    console.log('startBattle called');
    const config = validateBattleConfig();
    if (!config) {
        console.log('Config validation failed');
        return;
    }
    
    const fullConfig = {
        ...config,
        categories: Array.from(selectedCategories),
        whoStarts: document.getElementById('battle-who-starts').value
    };
    
    console.log('Full config:', fullConfig);
    setBattleConfig(fullConfig);
    console.log('Showing battle screen...');
    showView('battle-screen');
    setupBattleScreen();
}

function setupBattleScreen() {
    updateBattleInfo();
    setupInitialBeat();
    setupTheme();
    resetBattleState();
    updateBattleButtonStates(true, false);
    
    battleState.currentTurn = battleState.whoStarts === 'random' ? 
        (Math.random() < 0.5 ? 1 : 2) : 
        (battleState.whoStarts === 'mc1' ? 1 : 2);
    
    updateTurnIndicators();
    
    const mainButton = document.getElementById('battle-start-button');
    if (mainButton) {
        mainButton.onclick = beginBattle;
        mainButton.style.pointerEvents = 'auto';
        mainButton.style.opacity = '1';
        console.log('Battle button configured correctly');
    } else {
        console.error('Battle start button not found');
    }
    
    showNotification('Batalla configurada. Presiona el botón principal para comenzar', 'success');
}

function beginBattle() {
    console.log('beginBattle called, battleStarted:', battleStarted);
    
    if (battleStarted) {
        console.log('Battle already started, returning');
        return;
    }

    try {
        const mainButton = document.getElementById('battle-start-button');
        if (!mainButton) {
            console.error('Main button not found');
            return;
        }
        
        console.log('Starting battle countdown...');
        mainButton.style.pointerEvents = 'none';
        mainButton.style.opacity = '0.7';
        
        battleSpeedFactor = calculateBattleBPMSpeedFactor();
        
        let countdown = 4;
        const messages = ["TIEMPO!", "1", "2", "3", "Y SE LO DAMOS EN..."];

        showBattleLoadingMessage(messages[4]);

        setTimeout(() => {
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    showBattleLoadingMessage(messages[countdown]);
                    console.log('Countdown:', messages[countdown]);
                } else {
                    clearInterval(countdownInterval);
                    
                    console.log('Starting battle...');
                    battleStarted = true;
                    turnStarted = true;
                    battleState.turnsInCurrentRound = 0;
                    resetBattleTimingValues();
                    resetBattleNotificationFlags();
                    
                    battleTotalDurationMs = battleState.roundTimes[battleState.currentRound - 1] * 1000;
                    
                    const currentMode = battleState.roundModes[battleState.currentRound - 1];
                    if (currentMode !== 'thematic') {
                        battleWordIntervalMs = getModeInterval(currentMode);
                        battleLastWordIndex = -1;
                        battleSavedWordTimeUntilNext = 0;
                    }
                    
                    startBattleTimer();
                    startBattleWords();
                    startBeat();
                    
                    updateBattleButtonStates(true, true);
                    
                    const currentMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
                    showNotification(`¡Batalla iniciada! Turno de ${currentMC}`, 'success', 2000);
                    console.log('Battle started successfully');
                }
            }, 1000);
        }, 1000);
        
    } catch (error) {
        console.error('Error in beginBattle:', error);
        showNotification('Error iniciando batalla: ' + error.message, 'error');
    }
}

function nextTurn() {
    if (!battleStarted || !turnStarted) return;
    
    stopBattleTurn();
    
    battleState.turnsInCurrentRound++;
    
    if (battleState.turnsInCurrentRound >= 2) {
        setTimeout(() => {
            finishRound();
        }, 2000);
    } else {
        battleState.currentTurn = battleState.currentTurn === 1 ? 2 : 1;
        updateTurnIndicators();
        
        setTimeout(() => {
            setupNextTurnButton();
        }, 2000);
    }
}

function setupNextTurnButton() {
    const mainButton = document.getElementById('battle-start-button');
    if (mainButton) {
        mainButton.style.pointerEvents = 'auto';
        mainButton.style.opacity = '1';
        mainButton.onclick = beginNextTurn;
        
        const currentMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
        showBattleLoadingMessage(`TURNO DE ${currentMC.toUpperCase()}`);
        
        updateBattleButtonStates(true, false);
        showNotification(`Listo para el turno de ${currentMC}`, 'info', 3000);
    }
}

function beginNextTurn() {
    const mainButton = document.getElementById('battle-start-button');
    if (!mainButton) return;
    
    mainButton.style.pointerEvents = 'none';
    mainButton.style.opacity = '0.7';
    
    let countdown = 4;
    const messages = ["TIEMPO!", "1", "2", "3", "Y SE LO DAMOS EN..."];

    showBattleLoadingMessage(messages[4]);

    setTimeout(() => {
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                showBattleLoadingMessage(messages[countdown]);
            } else {
                clearInterval(countdownInterval);
                startNewTurn();
            }
        }, 1000);
    }, 1000);
}

function startNewTurn() {
    turnStarted = true;
    resetBattleTimingValues();
    resetBattleNotificationFlags();
    
    battleTotalDurationMs = battleState.roundTimes[battleState.currentRound - 1] * 1000;
    
    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    if (currentMode !== 'thematic') {
        battleLastWordIndex = -1;
        battleSavedWordTimeUntilNext = 0;
    }
    
    startBattleTimer();
    startBattleWords();
    
    if (!battleBeatActive) {
        startBeat();
    }
    
    const currentMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
    showNotification(`Turno de ${currentMC}`, 'success', 1500);
}

function stopBattleTurn() {
    turnStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    battleBeatActive = false;
    
    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
        battleTimerInterval = null;
    }
    
    if (battleWordTimeout) {
        clearTimeout(battleWordTimeout);
        battleWordTimeout = null;
    }
    
    if (audioPlayer) {
        audioPlayer.pause();
    }
}

function finishRound() {
    stopBattleTurn();
    showVotingScreen();
}

function nextRound(winner) {
    battleState.roundResults.push({
        round: battleState.currentRound,
        winner: winner,
        mc1Turn: battleState.currentTurn === 1,
        mc2Turn: battleState.currentTurn === 2
    });
    
    if (winner === 'mc1') {
        battleState.mc1.wins++;
    } else if (winner === 'mc2') {
        battleState.mc2.wins++;
    }
    
    if (battleState.currentRound >= battleState.totalRounds) {
        finishBattle();
        return;
    }
    
    battleState.currentRound++;
    battleState.turnsInCurrentRound = 0;
    battleState.currentTurn = battleState.whoStarts === 'mc1' ? 1 : 2;
    
    if (battleState.whoStarts === 'random') {
        battleState.currentTurn = Math.random() < 0.5 ? 1 : 2;
    }
    
    showView('battle-screen');
    updateBattleInfo();
    updateTurnIndicators();
    resetBattleState();
    updateBattleButtonStates(true, false);
    
    const mainButton = document.getElementById('battle-start-button');
    mainButton.style.pointerEvents = 'auto';
    mainButton.style.opacity = '1';
    
    showNotification(`Ronda ${battleState.currentRound} - ¡Preparados!`, 'info', 2000);
}

function finishBattle() {
    let winner = '';
    if (battleState.mc1.wins > battleState.mc2.wins) {
        winner = battleState.mc1.aka;
    } else if (battleState.mc2.wins > battleState.mc1.wins) {
        winner = battleState.mc2.aka;
    } else {
        winner = 'EMPATE';
    }
    
    showBattleResults(winner);
}

function resetBattleState() {
    console.log('Resetting battle state...');
    battleStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    turnStarted = false;
    battleSpeedFactor = 1;

    resetBattleTimingValues();
    resetBattleNotificationFlags();
    
    battleTotalDurationMs = 0;
    battleWordIntervalMs = 0;
    battleLastWordIndex = -1;
    battleSavedWordTimeUntilNext = 0;
    battleWordPauseTime = 0;

    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
        battleTimerInterval = null;
    }
    if (battleWordTimeout) {
        clearTimeout(battleWordTimeout);
        battleWordTimeout = null;
    }

    document.getElementById('battle-timer').textContent = '00:00';
    document.getElementById('battle-word').textContent = 'COMENZAR BATALLA';
    
    const mainButton = document.getElementById('battle-start-button');
    if (mainButton) {
        mainButton.style.pointerEvents = 'auto';
        mainButton.style.opacity = '1';
        mainButton.onclick = beginBattle;
        console.log('Battle button reset and configured');
    } else {
        console.error('Battle button not found during reset');
    }
    
    updateBattleButtonStates(false, false);
    console.log('Battle state reset complete, battleStarted:', battleStarted);
}

function calculateBattleBPMSpeedFactor() {
    if (battleTimerMode === 'real') {
        return 1;
    }
    
    const currentBeat = beats[currentBeatIndex];
    if (!currentBeat || !currentBeat.bpm) {
        return 1;
    }
    
    const visualMinutes = battleState.roundTimes[battleState.currentRound - 1] / 60;
    const compassesPerMinute = 24;
    const totalCompasses = visualMinutes * compassesPerMinute;
    
    const realDurationSeconds = totalCompasses * (240 / currentBeat.bpm);
    const visualDurationSeconds = battleState.roundTimes[battleState.currentRound - 1];
    
    return visualDurationSeconds / realDurationSeconds;
}

function resetBattleTimingValues() {
    battleStartTime = Date.now();
    battlePausedDuration = 0;
    battleLastPauseTime = 0;
    battleIsPaused = false;
}

function resetBattleNotificationFlags() {
    battleNotified30sec = false;
    battleNotified10sec = false;
}

function getBattleElapsedTime() {
    const now = Date.now();
    let realElapsed = now - battleStartTime - battlePausedDuration;
    
    if (battleIsPaused && battleLastPauseTime > 0) {
        realElapsed = battleLastPauseTime - battleStartTime - battlePausedDuration;
    }
    
    const virtualElapsed = realElapsed * battleSpeedFactor;
    return Math.max(0, virtualElapsed);
}

function getBattleRemainingTime() {
    const elapsed = getBattleElapsedTime();
    return Math.max(0, battleTotalDurationMs - elapsed);
}

function exitBattle() {
    if (!confirmBattleExit()) return;
    
    try {
        stopBattleEverything();
        resetBattleState();
        showView('battle-config');
        showNotification('Has vuelto a la configuración', 'info');
    } catch (error) {
        handleError(error, 'exitBattle');
    }
}

function confirmBattleExit() {
    if (battleStarted) {
        return confirm('¿Estás seguro de que quieres salir de la batalla? Se perderá el progreso actual.');
    }
    return true;
}

function stopBattleEverything() {
    battleStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    turnStarted = false;
    
    if (battleTimerInterval) {
        clearInterval(battleTimerInterval);
        battleTimerInterval = null;
    }
    
    if (battleWordTimeout) {
        clearTimeout(battleWordTimeout);
        battleWordTimeout = null;
    }
    
    stopBeat();
}

console.log('Battle.js cargado correctamente ✅');