let originalBattleHandlers = {};

function initTournamentBattleIntegration() {
    backupOriginalBattleHandlers();
    overrideBattleHandlers();
}

function backupOriginalBattleHandlers() {
    originalBattleHandlers.finishBattle = window.finishBattle;
    originalBattleHandlers.exitBattle = window.exitBattle;
    originalBattleHandlers.newBattle = window.newBattle;
    originalBattleHandlers.rematch = window.rematch;
    originalBattleHandlers.backToMainMenu = window.backToMainMenu;
}

function overrideBattleHandlers() {
    window.finishBattle = function() {
        if (tournamentStarted && currentTournamentMatch) {
            handleTournamentBattleFinish();
        } else {
            originalBattleHandlers.finishBattle();
        }
    };
    
    window.exitBattle = function() {
        if (tournamentStarted && currentTournamentMatch) {
            handleTournamentBattleExit();
        } else {
            originalBattleHandlers.exitBattle();
        }
    };
    
    window.newBattle = function() {
        if (tournamentStarted) {
            newTournament();
        } else {
            originalBattleHandlers.newBattle();
        }
    };
    
    window.rematch = function() {
        if (tournamentStarted && currentTournamentMatch) {
            handleTournamentRematch();
        } else {
            originalBattleHandlers.rematch();
        }
    };
    
    window.backToMainMenu = function() {
        if (tournamentStarted) {
            backToMainMenuFromTournament();
        } else {
            originalBattleHandlers.backToMainMenu();
        }
    };
}

function restoreOriginalBattleHandlers() {
    if (originalBattleHandlers.finishBattle) {
        window.finishBattle = originalBattleHandlers.finishBattle;
    }
    if (originalBattleHandlers.exitBattle) {
        window.exitBattle = originalBattleHandlers.exitBattle;
    }
    if (originalBattleHandlers.newBattle) {
        window.newBattle = originalBattleHandlers.newBattle;
    }
    if (originalBattleHandlers.rematch) {
        window.rematch = originalBattleHandlers.rematch;
    }
    if (originalBattleHandlers.backToMainMenu) {
        window.backToMainMenu = originalBattleHandlers.backToMainMenu;
    }
}

function handleTournamentBattleFinish() {
    let winner = '';
    if (battleState.mc1.wins > battleState.mc2.wins) {
        winner = 'mc1';
    } else if (battleState.mc2.wins > battleState.mc1.wins) {
        winner = 'mc2';
    } else {
        winner = 'tie';
    }
    
    const battleResults = [...battleState.roundResults];
    
    if (winner === 'tie') {
        showNotification('Empate detectado, configurando réplica...', 'warning');
        setupReplay();
        return;
    }
    
    updateTournamentBattleResultsDisplay(winner, battleResults);
    finishTournamentMatch(winner, battleResults);
}

function updateTournamentBattleResultsDisplay(winner, battleResults) {
    const winnerAka = winner === 'mc1' ? battleState.mc1.aka : battleState.mc2.aka;
    
    document.getElementById('results-winner').textContent = winnerAka;
    document.getElementById('results-mc1-name').textContent = battleState.mc1.aka;
    document.getElementById('results-mc2-name').textContent = battleState.mc2.aka;
    document.getElementById('results-mc1-score').textContent = battleState.mc1.wins;
    document.getElementById('results-mc2-score').textContent = battleState.mc2.wins;
    document.getElementById('results-total-rounds').textContent = battleState.totalRounds;
    
    const actionsContainer = document.querySelector('.results-actions');
    if (actionsContainer) {
        actionsContainer.innerHTML = `
            <button class="control-btn next-btn" onclick="continueTournament()">
                ⚔️ CONTINUAR TORNEO
            </button>
            <button class="control-btn stop-btn" onclick="exitTournamentFromBattle()">
                🏠 SALIR DEL TORNEO
            </button>
        `;
    }
    
    const subtitle = document.querySelector('.winner-subtitle');
    if (subtitle) {
        subtitle.textContent = `¡AVANZA EN EL TORNEO! (${getPhaseDisplayName(tournamentState.currentPhase)})`;
    }
}

function continueTournament() {
    let winner = '';
    if (battleState.mc1.wins > battleState.mc2.wins) {
        winner = 'mc1';
    } else {
        winner = 'mc2';
    }
    
    const battleResults = [...battleState.roundResults];
    finishTournamentMatch(winner, battleResults);
}

function exitTournamentFromBattle() {
    if (confirm('¿Salir del torneo? Se perderá todo el progreso.')) {
        resetTournament();
        restoreOriginalBattleHandlers();
        showView('main-menu');
        showNotification('Has salido del torneo', 'info');
    }
}

function handleTournamentBattleExit() {
    if (!confirmBattleExit()) return;
    
    try {
        stopBattleEverything();
        resetBattleState();
        showView('tournament-bracket');
        setupTournamentBracket();
        showNotification('Has vuelto al bracket del torneo', 'info');
    } catch (error) {
        handleError(error, 'handleTournamentBattleExit');
    }
}

function handleTournamentRematch() {
    if (!currentTournamentMatch) return;
    
    if (confirm('¿Repetir esta batalla del torneo?')) {
        resetBattleState();
        
        const config = tournamentState.phaseConfigs[tournamentState.currentPhase];
        
        if (!config || !config.roundTimes || config.roundTimes.length === 0) {
            showNotification('Error: Configuración de torneo no válida', 'error');
            return;
        }
        
        const battleConfig = {
            mc1Aka: currentTournamentMatch.mc1.aka,
            mc2Aka: currentTournamentMatch.mc2.aka,
            rounds: config.rounds,
            roundTimes: [...config.roundTimes],
            roundModes: [...config.roundModes],
            roundFormats: [...config.roundFormats],
            roundCompasses: [...config.roundCompasses],
            categories: Array.from(tournamentState.categories),
            whoStarts: 'random'
        };
        
        setBattleConfig(battleConfig);
        showView('battle-screen');
        setupBattleScreen();
        showNotification('Batalla reiniciada', 'success');
    }
}

function isTournamentBattle() {
    return tournamentStarted && currentTournamentMatch !== null;
}

function getTournamentMatchInfo() {
    if (!currentTournamentMatch) return null;
    
    return {
        phase: tournamentState.currentPhase,
        phaseDisplay: getPhaseDisplayName(tournamentState.currentPhase),
        matchNumber: tournamentState.currentMatchIndex + 1,
        totalMatches: tournamentState.currentMatchups.length,
        mc1: currentTournamentMatch.mc1,
        mc2: currentTournamentMatch.mc2
    };
}

document.addEventListener('DOMContentLoaded', function() {
    initTournamentBattleIntegration();
});

console.log('Tournament-battle.js cargado correctamente ✅');
