let battleState = {
    mc1: { aka: '', wins: 0 },
    mc2: { aka: '', wins: 0 },
    currentTurn: 1,
    currentRound: 1,
    totalRounds: 1,
    roundTimes: [],
    roundModes: [],
    roundFormats: [],
    roundCompasses: [],
    categories: new Set(),
    whoStarts: 'mc1',
    roundResults: [],
    turnsInCurrentRound: 0,
    votingMode: 'per_round',
    isReplayMode: false,
    roundResultsForFinalVoting: []
};

let battleStarted = false;
let battleTimerActive = false;
let battleWordsActive = false;
let battleBeatActive = false;

let battleTimerInterval = null;
let battleWordTimeout = null;
let battleTurnChangeTimeout = null;
let battleCompassTimeouts = [];

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

let battleTimerMode = 'bmp';
let battleSpeedFactor = 1;

let turnStarted = false;
let battleUsedBeats = [];

function resetBattleState() {
    console.log('Resetting battle state...');
    
    stopBattleEverything();
    
    battleStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    turnStarted = false;
    battleSpeedFactor = 1;

    battleState.currentRound = 1;
    battleState.turnsInCurrentRound = 0;
    battleState.mc1.wins = 0;
    battleState.mc2.wins = 0;
    battleState.roundResults = [];

    resetBattleTimingValues();
    resetBattleNotificationFlags();
    
    battleWordIntervalMs = 0;
    battleLastWordIndex = -1;
    battleSavedWordTimeUntilNext = 0;
    battleWordPauseTime = 0;

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

function resetBattleTurnState() {
    console.log('Resetting battle turn state...');
    
    stopBattleEverything();
    
    battleStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    turnStarted = false;
    battleSpeedFactor = 1;

    battleState.turnsInCurrentRound = 0;

    resetBattleTimingValues();
    resetBattleNotificationFlags();
    
    battleWordIntervalMs = 0;
    battleLastWordIndex = -1;
    battleSavedWordTimeUntilNext = 0;
    battleWordPauseTime = 0;

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
    console.log('Battle turn state reset complete, battleStarted:', battleStarted);
}

function exitBattle() {
    if (!confirmBattleExit()) return;
    
    try {
        stopBattleEverything();
        resetBattleState();
        initBattleConfig();
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
    
    if (battleTurnChangeTimeout) {
        clearTimeout(battleTurnChangeTimeout);
        battleTurnChangeTimeout = null;
    }
    
    if (battleCompassTimeouts && battleCompassTimeouts.length > 0) {
        battleCompassTimeouts.forEach(timeout => clearTimeout(timeout));
        battleCompassTimeouts = [];
    }
    
    if (audioPlayer) {
        audioPlayer.pause();
    }
}

function setupReplay() {
    battleState.isReplayMode = true;
    battleState.currentRound = 1;
    battleState.totalRounds = 1;
    battleState.roundTimes = [60];
    battleState.roundModes = ['classic'];
    battleState.roundFormats = ['pause'];
    battleState.roundCompasses = [1];
    battleState.turnsInCurrentRound = 0;
    battleState.votingMode = 'per_round';
    
    battleState.currentTurn = Math.random() < 0.5 ? 1 : 2;
    
    selectNewBattleBeatAutomatic();
    
    showView('battle-screen');
    updateBattleInfo();
    updateTurnIndicators();
    resetBattleState();
    updateBattleButtonStates(true, false);
    setupTheme();
    
    const mainButton = document.getElementById('battle-start-button');
    mainButton.style.pointerEvents = 'auto';
    mainButton.style.opacity = '1';
    
    showNotification('¡RÉPLICA! - 1 minuto cada MC en modo classic', 'warning', 3000);
}

console.log('Battle-core.js cargado correctamente ✅');
