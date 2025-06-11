function setupTournamentBracket() {
    updateTournamentBracketHeader();
    updateTournamentCurrentMatch();
    updateTournamentMatchupsList();
}

function updateTournamentBracketHeader() {
    const phaseElement = document.getElementById('tournament-current-phase');
    const matchElement = document.getElementById('tournament-current-match-number');
    const totalElement = document.getElementById('tournament-total-matches');
    
    if (phaseElement) {
        phaseElement.textContent = getPhaseDisplayName(tournamentState.currentPhase);
    }
    
    if (matchElement) {
        matchElement.textContent = tournamentState.currentMatchIndex + 1;
    }
    
    if (totalElement) {
        totalElement.textContent = tournamentState.currentMatchups.length;
    }
}

function updateTournamentCurrentMatch() {
    const currentMatch = getCurrentMatch();
    if (!currentMatch) return;
    
    const container = document.getElementById('tournament-current-match');
    if (!container) return;
    
    container.innerHTML = `
        <div class="tournament-match-card current-match">
            <div class="tournament-match-header">
                <span class="match-title">Enfrentamiento Actual</span>
                <span class="match-phase">${getPhaseDisplayName(tournamentState.currentPhase)}</span>
            </div>
            <div class="tournament-match-participants">
                <div class="tournament-participant">
                    <span class="participant-name">${currentMatch.mc1.aka}</span>
                    <span class="participant-stats">${currentMatch.mc1.battlesWon}W - ${currentMatch.mc1.battlesLost}L</span>
                </div>
                <div class="tournament-vs">VS</div>
                <div class="tournament-participant">
                    <span class="participant-name">${currentMatch.mc2.aka}</span>
                    <span class="participant-stats">${currentMatch.mc2.battlesWon}W - ${currentMatch.mc2.battlesLost}L</span>
                </div>
            </div>
            <div class="tournament-match-config">
                <div class="config-summary">
                    ${getTournamentMatchConfigSummary()}
                </div>
            </div>
            <button class="start-tournament-match-btn" onclick="startTournamentMatch()">
                COMENZAR BATALLA
            </button>
        </div>
    `;
}

function getTournamentMatchConfigSummary() {
    const config = tournamentState.phaseConfigs[tournamentState.currentPhase];
    
    if (!config || !config.roundTimes || config.roundTimes.length === 0) {
        return 'Configuración no válida';
    }
    
    const roundCount = config.rounds;
    const timePerRound = config.roundTimes[0];
    const mode = config.roundModes[0];
    const format = config.roundFormats[0];
    
    const minutes = Math.floor(timePerRound / 60);
    const seconds = timePerRound % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const modeInfo = getModeInfo(mode);
    
    let formatStr = '';
    switch(format) {
        case 'pause': formatStr = 'Con Pausa'; break;
        case 'continuous': formatStr = 'Continuo'; break;
        case 'compass': formatStr = `${config.roundCompasses[0]} Compás${config.roundCompasses[0] > 1 ? 'es' : ''}`; break;
    }
    
    return `${roundCount} ronda${roundCount > 1 ? 's' : ''} • ${timeStr} c/u • ${modeInfo.name} • ${formatStr}`;
}

function updateTournamentMatchupsList() {
    const container = document.getElementById('tournament-all-matchups');
    if (!container) return;
    
    container.innerHTML = '';
    
    tournamentState.currentMatchups.forEach((match, index) => {
        const matchDiv = document.createElement('div');
        matchDiv.className = `tournament-match-item ${index === tournamentState.currentMatchIndex ? 'current' : ''} ${match.result ? 'completed' : 'pending'}`;
        
        let resultDisplay = '';
        if (match.result) {
            const winner = match.result === 'mc1' ? match.mc1.aka : match.mc2.aka;
            resultDisplay = `<div class="match-result completed">Ganador: ${winner}</div>`;
        } else if (index < tournamentState.currentMatchIndex) {
            resultDisplay = `<div class="match-result pending">Pendiente</div>`;
        } else if (index === tournamentState.currentMatchIndex) {
            resultDisplay = `<div class="match-result current">En curso</div>`;
        } else {
            resultDisplay = `<div class="match-result upcoming">Próximo</div>`;
        }
        
        matchDiv.innerHTML = `
            <div class="match-participants">
                <span class="participant-name">${match.mc1.aka}</span>
                <span class="vs-text">VS</span>
                <span class="participant-name">${match.mc2.aka}</span>
            </div>
            ${resultDisplay}
        `;
        
        container.appendChild(matchDiv);
    });
    
    if (tournamentState.byeParticipants && tournamentState.byeParticipants.length > 0) {
        tournamentState.byeParticipants.forEach(participant => {
            const byeDiv = document.createElement('div');
            byeDiv.className = 'tournament-match-item completed';
            
            byeDiv.innerHTML = `
                <div class="match-participants">
                    <span class="participant-name">${participant.aka}</span>
                    <span class="vs-text">-</span>
                    <span class="participant-name" style="opacity: 0.6;">BYE</span>
                </div>
                <div class="match-result completed">Pase directo</div>
            `;
            
            container.appendChild(byeDiv);
        });
    }
}

function startTournamentMatch() {
    const currentMatch = getCurrentMatch();
    if (!currentMatch) {
        showNotification('No hay enfrentamiento actual', 'error');
        return;
    }
    
    currentTournamentMatch = currentMatch;
    
    const config = tournamentState.phaseConfigs[tournamentState.currentPhase];
    
    if (!config || !config.roundTimes || config.roundTimes.length === 0) {
        showNotification('Error: Configuración de fase incompleta', 'error');
        return;
    }
    
    if (config.roundTimes.some(time => !time || isNaN(time))) {
        showNotification('Error: Tiempo de ronda no válido', 'error');
        return;
    }
    
    if (config.roundModes.some(mode => !mode)) {
        showNotification('Error: Modo de ronda no válido', 'error');
        return;
    }
    
    if (config.roundFormats.some(format => !format)) {
        showNotification('Error: Formato de ronda no válido', 'error');
        return;
    }
    
    const battleConfig = {
        mc1Aka: currentMatch.mc1.aka,
        mc2Aka: currentMatch.mc2.aka,
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
    
    showNotification(`¡Batalla iniciada: ${currentMatch.mc1.aka} vs ${currentMatch.mc2.aka}!`, 'success');
}

function finishTournamentMatch(winner, battleResults) {
    if (!currentTournamentMatch) return;
    
    finishCurrentMatch(winner, battleResults);
    currentTournamentMatch = null;
    
    showView('tournament-bracket');
    
    if (isPhaseComplete()) {
        handleTournamentPhaseComplete();
    } else if (advanceToNextMatch()) {
        setupTournamentBracket();
        showNotification('Siguiente enfrentamiento listo', 'info');
    }
}

function handleTournamentPhaseComplete() {
    const currentPhase = tournamentState.currentPhase;
    
    showTournamentPhaseResults(currentPhase);
    
    if (isTournamentComplete()) {
        showTournamentResults();
    } else {
        if (advanceToNextPhase()) {
            setupTournamentBracket();
            showNotification(`¡${getPhaseDisplayName(tournamentState.currentPhase)} iniciada!`, 'success');
        }
    }
}

function showTournamentPhaseResults(phase) {
    const phaseResults = tournamentState.phaseResults[phase] || [];
    const winners = phaseResults.map(match => {
        if (match.result === 'mc1') return match.mc1.aka;
        if (match.result === 'mc2') return match.mc2.aka;
        return 'Empate';
    });
    
    let message = `¡${getPhaseDisplayName(phase)} completada!\n\n`;
    
    if (winners.length > 0) {
        message += `Ganadores: ${winners.join(', ')}`;
    }
    
    if (tournamentState.byeParticipants && tournamentState.byeParticipants.length > 0) {
        const byeNames = tournamentState.byeParticipants.map(p => p.aka);
        if (winners.length > 0) {
            message += `\nPase directo: ${byeNames.join(', ')}`;
        } else {
            message += `Pase directo: ${byeNames.join(', ')}`;
        }
    }
    
    showNotification(message, 'success', 4000);
}

function showTournamentResults() {
    showView('tournament-results');
    updateTournamentResultsDisplay();
}

function updateTournamentResultsDisplay() {
    const stats = getTournamentStats();
    
    const winnerElement = document.getElementById('tournament-winner');
    const rankingElement = document.getElementById('tournament-final-ranking');
    const phasesElement = document.getElementById('tournament-phases-summary');
    
    if (winnerElement && stats.winner) {
        winnerElement.innerHTML = `
            <div class="tournament-champion">
                <div class="champion-title">🏆 CAMPEÓN DEL TORNEO</div>
                <div class="champion-name">${stats.winner.aka}</div>
                <div class="champion-stats">${stats.winner.battlesWon} batallas ganadas</div>
            </div>
        `;
    }
    
    if (rankingElement) {
        rankingElement.innerHTML = '<h3>🏅 Clasificación Final</h3>';
        stats.ranking.forEach((participant, index) => {
            const position = index + 1;
            let positionIcon = '';
            if (position === 1) positionIcon = '🥇';
            else if (position === 2) positionIcon = '🥈';
            else if (position === 3) positionIcon = '🥉';
            else positionIcon = `${position}º`;
            
            const participantDiv = document.createElement('div');
            participantDiv.className = 'tournament-ranking-item';
            participantDiv.innerHTML = `
                <span class="ranking-position">${positionIcon}</span>
                <span class="ranking-name">${participant.aka}</span>
                <span class="ranking-stats">${participant.battlesWon}W - ${participant.battlesLost}L</span>
            `;
            rankingElement.appendChild(participantDiv);
        });
    }
    
    if (phasesElement) {
        phasesElement.innerHTML = '<h3>📊 Resumen por Fases</h3>';
        stats.phases.forEach(phase => {
            if (phase.matches.length > 0 || phase.byes.length > 0) {
                const phaseDiv = document.createElement('div');
                phaseDiv.className = 'tournament-phase-summary';
                
                let phaseContent = `<h4>${getPhaseDisplayName(phase.name)}</h4><div class="phase-matches">`;
                
                phase.matches.forEach(match => {
                    const winner = match.result === 'mc1' ? match.mc1.aka : match.mc2.aka;
                    phaseContent += `<div class="phase-match">${match.mc1.aka} vs ${match.mc2.aka} → ${winner}</div>`;
                });
                
                phase.byes.forEach(participant => {
                    phaseContent += `<div class="phase-match">${participant.aka} → Pase directo (BYE)</div>`;
                });
                
                phaseContent += '</div>';
                phaseDiv.innerHTML = phaseContent;
                phasesElement.appendChild(phaseDiv);
            }
        });
    }
}

function newTournament() {
    if (confirm('¿Iniciar un nuevo torneo? Se perderán los resultados actuales.')) {
        resetTournament();
        showView('tournament-config');
        initTournamentConfig();
        showNotification('Nuevo torneo listo para configurar', 'info');
    }
}

function backToMainMenuFromTournament() {
    if (confirm('¿Volver al menú principal? Se perderán los resultados actuales.')) {
        resetTournament();
        showView('main-menu');
        showNotification('Has vuelto al menú principal', 'info');
    }
}

function exitTournamentBracket() {
    if (tournamentStarted && !isTournamentComplete()) {
        if (!confirm('¿Salir del torneo? Se perderá el progreso actual.')) {
            return;
        }
    }
    
    resetTournament();
    showView('tournament-config');
    initTournamentConfig();
    showNotification('Has vuelto a la configuración del torneo', 'info');
}

console.log('Tournament-ui.js cargado correctamente ✅');