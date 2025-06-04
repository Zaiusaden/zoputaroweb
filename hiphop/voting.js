function showVotingScreen() {
    showView('voting-screen');
    updateVotingInfo();
    resetVotingButtons();
}

function updateVotingInfo() {
    document.getElementById('voting-round').textContent = battleState.currentRound;
    document.getElementById('voting-total-rounds').textContent = battleState.totalRounds;
    document.getElementById('voting-mc1-name').textContent = battleState.mc1.aka;
    document.getElementById('voting-mc2-name').textContent = battleState.mc2.aka;
    document.getElementById('voting-mc1-score').textContent = battleState.mc1.wins;
    document.getElementById('voting-mc2-score').textContent = battleState.mc2.wins;
    
    const roundTime = battleState.roundTimes[battleState.currentRound - 1];
    const minutes = Math.floor(roundTime / 60);
    const seconds = roundTime % 60;
    document.getElementById('voting-round-time').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const currentMode = battleState.roundModes[battleState.currentRound - 1];
    const modeInfo = getModeInfo(currentMode);
    document.getElementById('voting-mode').textContent = modeInfo.name;
}

function resetVotingButtons() {
    const buttons = document.querySelectorAll('.voting-option');
    buttons.forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    
    document.getElementById('voting-continue-btn').disabled = true;
}

function selectWinner(winner) {
    const buttons = document.querySelectorAll('.voting-option');
    buttons.forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const selectedButton = document.getElementById(`voting-${winner}`);
    selectedButton.classList.add('selected');
    
    document.getElementById('voting-continue-btn').disabled = false;
    
    const winnerName = winner === 'mc1' ? battleState.mc1.aka : 
                     winner === 'mc2' ? battleState.mc2.aka : 'EMPATE';
    
    showNotification(`Has seleccionado: ${winnerName}`, 'info', 2000);
}

function continueAfterVoting() {
    const selectedButton = document.querySelector('.voting-option.selected');
    if (!selectedButton) {
        showNotification('Por favor, selecciona un ganador', 'warning');
        return;
    }
    
    const winner = selectedButton.id.replace('voting-', '');
    nextRound(winner);
}

function showBattleResults(winner) {
    showView('battle-results');
    updateBattleResultsInfo(winner);
}

function updateBattleResultsInfo(winner) {
    document.getElementById('results-winner').textContent = winner;
    document.getElementById('results-mc1-name').textContent = battleState.mc1.aka;
    document.getElementById('results-mc2-name').textContent = battleState.mc2.aka;
    document.getElementById('results-mc1-score').textContent = battleState.mc1.wins;
    document.getElementById('results-mc2-score').textContent = battleState.mc2.wins;
    document.getElementById('results-total-rounds').textContent = battleState.totalRounds;
    
    const resultsContainer = document.getElementById('results-rounds-detail');
    resultsContainer.innerHTML = '';
    
    battleState.roundResults.forEach((result, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'round-result';
        
        const winnerName = result.winner === 'mc1' ? battleState.mc1.aka : 
                          result.winner === 'mc2' ? battleState.mc2.aka : 'EMPATE';
        
        resultDiv.innerHTML = `
            <span class="round-number">Ronda ${result.round}:</span>
            <span class="round-winner">${winnerName}</span>
        `;
        
        resultsContainer.appendChild(resultDiv);
    });
    
    if (winner !== 'EMPATE') {
        showNotification(`🏆 ¡${winner} es el ganador!`, 'success', 4000);
    } else {
        showNotification('🤝 ¡Batalla terminada en empate!', 'info', 4000);
    }
}

function newBattle() {
    if (confirm('¿Iniciar una nueva batalla? Se perderán los resultados actuales.')) {
        resetBattleState();
        showView('battle-config');
        initBattleConfig();
        showNotification('Nueva batalla lista para configurar', 'info');
    }
}

function rematch() {
    if (confirm('¿Revancha con la misma configuración?')) {
        battleState.mc1.wins = 0;
        battleState.mc2.wins = 0;
        battleState.currentRound = 1;
        battleState.roundResults = [];
        
        battleState.currentTurn = battleState.whoStarts === 'mc1' ? 1 : 2;
        if (battleState.whoStarts === 'random') {
            battleState.currentTurn = Math.random() < 0.5 ? 1 : 2;
        }
        
        showView('battle-screen');
        setupBattleScreen();
        showNotification('¡Revancha configurada!', 'success');
    }
}

function backToMainMenu() {
    if (confirm('¿Volver al menú principal? Se perderán los resultados actuales.')) {
        resetBattleState();
        initBattleConfig();
        showView('main-menu');
        showNotification('Has vuelto al menú principal', 'info');
    }
}

console.log('Voting.js cargado correctamente ✅');