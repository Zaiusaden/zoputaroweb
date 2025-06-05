function getCurrentRoundFormat() {
    return battleState.roundFormats[battleState.currentRound - 1];
}

function setupContinuousFormat(roundTimePerMC) {
    const halfTimeVirtual = roundTimePerMC * 1000;
    const halfTimeReal = halfTimeVirtual / battleSpeedFactor;
    
    battleTurnChangeTimeout = setTimeout(() => {
        if (battleStarted && turnStarted) {
            battleState.currentTurn = battleState.currentTurn === 1 ? 2 : 1;
            updateTurnIndicators();
            
            const newMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
            showNotification(`Turno de ${newMC}`, 'info', 1500);
        }
    }, halfTimeReal);
}

function setupCompassFormat(roundTime, compassesPerTurn) {
    const compassDurationMs = compassesPerTurn * 10 * 1000;
    const totalDuration = roundTime * 2 * 1000;
    const numChanges = Math.floor(totalDuration / compassDurationMs);
    
    battleCompassTimeouts = [];
    
    for (let i = 1; i < numChanges; i++) {
        const changeTimeVirtual = i * compassDurationMs;
        const changeTimeReal = changeTimeVirtual / battleSpeedFactor;
        
        const timeout = setTimeout(() => {
            if (battleStarted && turnStarted) {
                battleState.currentTurn = battleState.currentTurn === 1 ? 2 : 1;
                updateTurnIndicators();
                
                const newMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
                showNotification(`Turno de ${newMC}`, 'info', 1000);
            }
        }, changeTimeReal);
        
        battleCompassTimeouts.push(timeout);
    }
}

function setupCompassFormatFromTime(roundTime, compassesPerTurn, startDelay) {
    const compassDurationMs = compassesPerTurn * 10 * 1000;
    const totalDuration = roundTime * 2 * 1000;
    const remainingDuration = totalDuration - (startDelay * battleSpeedFactor);
    const numChanges = Math.floor(remainingDuration / compassDurationMs);
    
    battleCompassTimeouts = [];
    
    if (startDelay > 0) {
        const timeout = setTimeout(() => {
            if (battleStarted && turnStarted) {
                battleState.currentTurn = battleState.currentTurn === 1 ? 2 : 1;
                updateTurnIndicators();
                
                const newMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
                showNotification(`Turno de ${newMC}`, 'info', 1000);
                
                setupCompassFormat(roundTime, compassesPerTurn);
            }
        }, startDelay);
        
        battleCompassTimeouts.push(timeout);
    }
}

function nextTurn() {
    const currentFormat = getCurrentRoundFormat();
    
    if (currentFormat === 'continuous' || currentFormat === 'compass') {
        finishRound();
        return;
    }
    
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
    if (currentMode !== 'thematic' && currentMode !== 'classic') {
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

console.log('Battle-formats.js cargado correctamente ✅');