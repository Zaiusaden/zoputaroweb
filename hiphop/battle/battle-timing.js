function calculateBattleBPMSpeedFactor() {
    if (battleTimerMode === 'real') {
        return 1;
    }
    
    const currentBeat = beats[currentBeatIndex];
    if (!currentBeat || !currentBeat.bpm) {
        return 1;
    }
    
    const currentFormat = getCurrentRoundFormat();
    const roundTime = battleState.roundTimes[battleState.currentRound - 1];
    let totalTime;
    
    if (currentFormat === 'continuous') {
        totalTime = roundTime * 2;
    } else {
        totalTime = roundTime;
    }
    
    const visualMinutes = totalTime / 60;
    const compassesPerMinute = 24;
    const totalCompasses = visualMinutes * compassesPerMinute;
    
    const realDurationSeconds = totalCompasses * (240 / currentBeat.bpm);
    const visualDurationSeconds = totalTime;
    
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
    if (!battleStartTime || battleStartTime === 0) {
        return 0;
    }
    
    const now = Date.now();
    let realElapsed = now - battleStartTime - battlePausedDuration;
    
    if (battleIsPaused && battleLastPauseTime > 0) {
        realElapsed = battleLastPauseTime - battleStartTime - battlePausedDuration;
    }
    
    const virtualElapsed = realElapsed * (battleSpeedFactor || 1);
    return Math.max(0, virtualElapsed);
}

function getBattleRemainingTime() {
    if (!battleTotalDurationMs || battleTotalDurationMs === 0) {
        return 0;
    }
    
    const elapsed = getBattleElapsedTime();
    return Math.max(0, battleTotalDurationMs - elapsed);
}

console.log('Battle-timing.js cargado correctamente ✅');
