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

                    const currentMode = battleState.roundModes[battleState.currentRound - 1];
                    if (currentMode !== 'thematic' && currentMode !== 'classic') {
                        battleWordIntervalMs = getModeInterval(currentMode);
                        battleLastWordIndex = -1;
                        battleSavedWordTimeUntilNext = 0;
                    }

                    startBeatWithCallback((error) => {
                        if (error) {
                            console.error('Error iniciando beat:', error);
                            resetBattleState();
                            showNotification('Error iniciando audio', 'error');
                            return;
                        }

                        resetBattleTimingValues();
                        resetBattleNotificationFlags();
                        
                        startBattleTimer();
                        startBattleWords();

                        updateBattleButtonStates(true, true);

                        const currentMC = battleState.currentTurn === 1 ? battleState.mc1.aka : battleState.mc2.aka;
                        let formatText = '';
                        if (currentFormat === 'continuous') {
                            formatText = ' - Formato Continuo';
                        } else if (currentFormat === 'compass') {
                            const compassesPerTurn = battleState.roundCompasses[battleState.currentRound - 1];
                            formatText = ` - ${compassesPerTurn} compás${compassesPerTurn > 1 ? 'es' : ''} por turno`;
                        }

                        let battleTypeText = battleState.isReplayMode ? '¡RÉPLICA!' : '¡Batalla iniciada!';
                        showNotification(`${battleTypeText} Turno de ${currentMC}${formatText}`, 'success', 2000);
                        console.log('Battle started successfully');
                    });
                }
            }, 1000);
        }, 1000);

    } catch (error) {
        console.error('Error in beginBattle:', error);
        showNotification('Error iniciando batalla: ' + error.message, 'error');
    }
}

function finishRound() {
    stopBattleTurn();

    if (battleState.votingMode === 'per_round') {
        showVotingScreen();
    } else {
        if (battleState.currentRound >= battleState.totalRounds) {
            showFinalVotingScreen();
        } else {
            nextRoundWithoutVoting();
        }
    }
}

function nextRoundWithoutVoting() {
    battleState.currentRound++;
    battleState.turnsInCurrentRound = 0;
    battleState.currentTurn = battleState.whoStarts === 'mc1' ? 1 : 2;

    if (battleState.whoStarts === 'random') {
        battleState.currentTurn = Math.random() < 0.5 ? 1 : 2;
    }

    if (!battleState.isReplayMode) {
        selectNewBattleBeatAutomatic();
    }

    updateBattleInfo();
    updateTurnIndicators();
    resetBattleTurnState();
    updateBattleButtonStates(true, false);
    setupTheme();

    const mainButton = document.getElementById('battle-start-button');
    mainButton.style.pointerEvents = 'auto';
    mainButton.style.opacity = '1';

    showNotification(`Ronda ${battleState.currentRound} - ¡Preparados!`, 'info', 2000);
}

function nextRound(winner) {
    if (battleState.isReplayMode) {
        handleReplayResult(winner);
        return;
    }

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
        if (battleState.votingMode === 'per_round' && battleState.mc1.wins === battleState.mc2.wins) {
            setupReplay();
            return;
        }
        finishBattle();
        return;
    }

    battleState.currentRound++;
    battleState.turnsInCurrentRound = 0;
    battleState.currentTurn = battleState.whoStarts === 'mc1' ? 1 : 2;

    if (battleState.whoStarts === 'random') {
        battleState.currentTurn = Math.random() < 0.5 ? 1 : 2;
    }

    selectNewBattleBeatAutomatic();

    showView('battle-screen');
    updateBattleInfo();
    updateTurnIndicators();
    resetBattleTurnState();
    updateBattleButtonStates(true, false);
    setupTheme();

    const mainButton = document.getElementById('battle-start-button');
    mainButton.style.pointerEvents = 'auto';
    mainButton.style.opacity = '1';

    showNotification(`Ronda ${battleState.currentRound} - ¡Preparados!`, 'info', 2000);
}

function handleReplayResult(winner) {
    battleState.roundResults.push({
        round: 'RÉPLICA',
        winner: winner,
        mc1Turn: battleState.currentTurn === 1,
        mc2Turn: battleState.currentTurn === 2
    });

    if (winner === 'mc1') {
        battleState.mc1.wins++;
    } else if (winner === 'mc2') {
        battleState.mc2.wins++;
    }

    if (winner === 'tie') {
        setupReplay();
        return;
    }

    finishBattle();
}

function handleFinalVotingResult(winner) {
    if (winner === 'tie') {
        setupReplay();
        return;
    }

    battleState.roundResults.push({
        round: 'FINAL',
        winner: winner,
        totalRounds: battleState.totalRounds
    });

    if (winner === 'mc1') {
        battleState.mc1.wins = 1;
        battleState.mc2.wins = 0;
    } else if (winner === 'mc2') {
        battleState.mc1.wins = 0;
        battleState.mc2.wins = 1;
    }

    finishBattle();
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

console.log('Battle-rounds.js cargado correctamente ✅');