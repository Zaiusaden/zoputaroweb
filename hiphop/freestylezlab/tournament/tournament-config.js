function initTournamentConfig() {
    initTournament();
    updateTournamentParticipantsList();
    updateTournamentPhaseConfigs();
    updateTournamentCategoryButtons();
}

function addTournamentParticipant() {
    const input = document.getElementById('tournament-participant-input');
    const aka = input.value.trim();
    
    if (!aka) {
        showNotification('Introduce un AKA válido', 'warning');
        return;
    }
    
    if (tournamentState.participants.length >= 8) {
        showNotification('Máximo 8 participantes', 'warning');
        return;
    }
    
    if (tournamentState.participants.some(p => p.aka === aka)) {
        showNotification('Este AKA ya existe', 'warning');
        return;
    }
    
    if (addParticipant(aka)) {
        input.value = '';
        updateTournamentParticipantsList();
        updateTournamentPhaseConfigs();
        showNotification(`${aka} añadido al torneo`, 'success', 1500);
    }
}

function removeTournamentParticipant(participantId) {
    const participant = tournamentState.participants.find(p => p.id === participantId);
    if (participant) {
        removeParticipant(participantId);
        updateTournamentParticipantsList();
        updateTournamentPhaseConfigs();
        showNotification(`${participant.aka} eliminado del torneo`, 'info', 1500);
    }
}

function updateTournamentParticipantsList() {
    const container = document.getElementById('tournament-participants-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    tournamentState.participants.forEach(participant => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'tournament-participant-item';
        participantDiv.innerHTML = `
            <span class="participant-aka">${participant.aka}</span>
            <button class="remove-participant-btn" onclick="removeTournamentParticipant('${participant.id}')">❌</button>
        `;
        container.appendChild(participantDiv);
    });
    
    const countElement = document.getElementById('tournament-participants-count');
    if (countElement) {
        countElement.textContent = `${tournamentState.participants.length}/8 participantes`;
    }
    
    updateTournamentStartButton();
}

function isValidParticipantCount(count) {
    const validNumbers = [2, 3, 4, 6, 7, 8];
    return validNumbers.includes(count);
}

function updateTournamentStartButton() {
    const startButton = document.getElementById('tournament-start-btn');
    if (!startButton) return;
    
    const participantCount = tournamentState.participants.length;
    const canStart = participantCount >= 2 && selectedCategories.size > 0 && isValidParticipantCount(participantCount);
    
    startButton.disabled = !canStart;
    
    if (participantCount === 0) {
        startButton.textContent = 'AÑADE PARTICIPANTES PARA EMPEZAR';
    } else if (participantCount === 1) {
        startButton.textContent = 'SE NECESITA MÍNIMO 2 PARTICIPANTES';
    } else if (participantCount === 5) {
        startButton.textContent = '5 PARTICIPANTES NO COMPATIBLE - USA 4 O 6';
    } else if (!isValidParticipantCount(participantCount)) {
        startButton.textContent = `${participantCount} PARTICIPANTES NO VÁLIDO`;
    } else if (selectedCategories.size === 0) {
        startButton.textContent = 'SELECCIONA AL MENOS UNA CATEGORÍA';
    } else {
        startButton.textContent = `COMENZAR TORNEO (${participantCount} PARTICIPANTES)`;
    }
}

function toggleTournamentCategory(category) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
    } else {
        selectedCategories.add(category);
    }
    
    updateTournamentCategoryButtons();
    updateTournamentStartButton();
    loadBeats();
}

function updateTournamentCategoryButtons() {
    const categories = ['boom-bap', 'trap-drill', 'reggae-dancehall'];
    
    categories.forEach(category => {
        const button = document.getElementById(`tournament-category-${category}`);
        if (button) {
            const count = getBeatCountByCategory(category);
            let categoryName = '';
            switch(category) {
                case 'boom-bap':
                    categoryName = '🥁 Boom Bap';
                    break;
                case 'trap-drill':
                    categoryName = '🔥 Trap/Drill';
                    break;
                case 'reggae-dancehall':
                    categoryName = '🌴 Reggae/Dancehall';
                    break;
            }
            
            button.innerHTML = `${categoryName}<br><span style="font-size: 0.8rem; opacity: 0.8;">${count} beats</span>`;
            
            if (selectedCategories.has(category)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });
}

function updateTournamentPhaseConfig(phase) {
    const rounds = document.getElementById(`tournament-${phase}-rounds`).value;
    tournamentState.phaseConfigs[phase].rounds = parseInt(rounds);
    
    updateTournamentPhaseRoundSelectors(phase);
}

function updateTournamentPhaseRoundSelectors(phase) {
    const container = document.getElementById(`tournament-${phase}-round-configs`);
    if (!container) return;
    
    const rounds = tournamentState.phaseConfigs[phase].rounds;
    container.innerHTML = '';
    
    if (!tournamentState.phaseConfigs[phase].roundTimes || tournamentState.phaseConfigs[phase].roundTimes.length !== rounds) {
        tournamentState.phaseConfigs[phase].roundTimes = new Array(rounds).fill(60);
        tournamentState.phaseConfigs[phase].roundModes = new Array(rounds).fill('classic');
        tournamentState.phaseConfigs[phase].roundFormats = new Array(rounds).fill('pause');
        tournamentState.phaseConfigs[phase].roundCompasses = new Array(rounds).fill(1);
    }
    
    for (let i = 1; i <= rounds; i++) {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'tournament-round-config';
        
        roundDiv.innerHTML = `
            <label>Ronda ${i}</label>
            <div class="tournament-round-selectors">
                <select id="tournament-${phase}-round-${i}-time" onchange="saveTournamentPhaseRoundConfig('${phase}', ${i})">
                    
                    <option value="60" selected>1 minuto por MC</option>
                    <option value="100">1 minuto 40 seg por MC</option>
                    <option value="120">2 minutos por MC</option>
                </select>
                <select id="tournament-${phase}-round-${i}-mode" onchange="saveTournamentPhaseRoundConfig('${phase}', ${i})">
                    <option value="classic" selected>CLASSIC - Freestyle libre</option>
                    <option value="easy">EASY - Palabra cada 10 seg</option>
                    <option value="hard">HARD MODE - Palabra cada 5 seg</option>
                    <option value="insane">INSANE MODE - Palabra cada 4 seg</option>
                    <option value="thematic">TEMÁTICA - Modo temático</option>
                    <option value="rules">RULES - Reglas de batalla</option>
                </select>
                <select id="tournament-${phase}-round-${i}-format" onchange="toggleTournamentCompassSelector('${phase}', ${i}); saveTournamentPhaseRoundConfig('${phase}', ${i})">
                    <option value="pause" selected>🛑 Con Pausa - Turnos separados</option>
                    <option value="continuous">▶️ Continuo - Sin parar el beat</option>
                    <option value="compass">🎵 Por Compases - Alternancia rápida</option>
                </select>
            </div>
            <div id="tournament-${phase}-round-${i}-compass-selector" class="compass-selector" style="display: none;">
                <label>Compases por turno</label>
                <select id="tournament-${phase}-round-${i}-compass" onchange="saveTournamentPhaseRoundConfig('${phase}', ${i})">
                    <option value="1" selected>1 compás (10 seg)</option>
                    <option value="2">2 compases (20 seg)</option>
                </select>
            </div>
        `;
        container.appendChild(roundDiv);
        
        const timeSelect = document.getElementById(`tournament-${phase}-round-${i}-time`);
        const modeSelect = document.getElementById(`tournament-${phase}-round-${i}-mode`);
        const formatSelect = document.getElementById(`tournament-${phase}-round-${i}-format`);
        const compassSelect = document.getElementById(`tournament-${phase}-round-${i}-compass`);
        
        if (tournamentState.phaseConfigs[phase].roundTimes[i - 1] !== undefined) {
            timeSelect.value = tournamentState.phaseConfigs[phase].roundTimes[i - 1];
        }
        if (tournamentState.phaseConfigs[phase].roundModes[i - 1] !== undefined) {
            modeSelect.value = tournamentState.phaseConfigs[phase].roundModes[i - 1];
        }
        if (tournamentState.phaseConfigs[phase].roundFormats[i - 1] !== undefined) {
            formatSelect.value = tournamentState.phaseConfigs[phase].roundFormats[i - 1];
        }
        if (tournamentState.phaseConfigs[phase].roundCompasses[i - 1] !== undefined && compassSelect) {
            compassSelect.value = tournamentState.phaseConfigs[phase].roundCompasses[i - 1];
        }
        
        if (formatSelect.value === 'compass') {
            const compassSelector = document.getElementById(`tournament-${phase}-round-${i}-compass-selector`);
            if (compassSelector) {
                compassSelector.style.display = 'block';
            }
        }
        
        if (tournamentState.phaseConfigs[phase].roundTimes[i - 1] === undefined) {
            saveTournamentPhaseRoundConfig(phase, i);
        }
    }
}

function updateTournamentPhaseConfigs() {
    const container = document.getElementById('tournament-phases-configs');
    if (!container) return;
    
    container.innerHTML = '';
    
    tournamentState.phases.forEach(phase => {
        const phaseDiv = document.createElement('div');
        phaseDiv.className = 'tournament-phase-config';
        
        const phaseTitle = getPhaseDisplayName(phase);
        let phaseIcon = '';
        switch(phase) {
            case 'octavos': phaseIcon = '🔥'; break;
            case 'cuartos': phaseIcon = '⚡'; break;
            case 'semifinal': phaseIcon = '🌟'; break;
            case 'final': phaseIcon = '👑'; break;
        }
        
        phaseDiv.innerHTML = `
            <div class="tournament-phase-header">
                <h4>${phaseIcon} ${phaseTitle}</h4>
            </div>
            <label>Número de rondas por batalla</label>
            <select id="tournament-${phase}-rounds" onchange="updateTournamentPhaseConfig('${phase}')">
                <option value="1" selected>1 ronda</option>
                <option value="2">2 rondas</option>
                <option value="3">3 rondas</option>
            </select>
            <div id="tournament-${phase}-round-configs"></div>
        `;
        
        container.appendChild(phaseDiv);
        
        const roundsSelect = document.getElementById(`tournament-${phase}-rounds`);
        if (tournamentState.phaseConfigs[phase].rounds) {
            roundsSelect.value = tournamentState.phaseConfigs[phase].rounds;
        }
        
        updateTournamentPhaseRoundSelectors(phase);
    });
}

function saveTournamentPhaseRoundConfig(phase, roundIndex) {
    const timeElement = document.getElementById(`tournament-${phase}-round-${roundIndex}-time`);
    const modeElement = document.getElementById(`tournament-${phase}-round-${roundIndex}-mode`);
    const formatElement = document.getElementById(`tournament-${phase}-round-${roundIndex}-format`);
    const compassElement = document.getElementById(`tournament-${phase}-round-${roundIndex}-compass`);
    
    if (!timeElement || !modeElement || !formatElement) return;
    
    const time = parseInt(timeElement.value);
    const mode = modeElement.value;
    const format = formatElement.value;
    const compass = compassElement ? parseInt(compassElement.value) : 1;
    
    if (!tournamentState.phaseConfigs[phase].roundTimes) tournamentState.phaseConfigs[phase].roundTimes = [];
    if (!tournamentState.phaseConfigs[phase].roundModes) tournamentState.phaseConfigs[phase].roundModes = [];
    if (!tournamentState.phaseConfigs[phase].roundFormats) tournamentState.phaseConfigs[phase].roundFormats = [];
    if (!tournamentState.phaseConfigs[phase].roundCompasses) tournamentState.phaseConfigs[phase].roundCompasses = [];
    
    tournamentState.phaseConfigs[phase].roundTimes[roundIndex - 1] = time;
    tournamentState.phaseConfigs[phase].roundModes[roundIndex - 1] = mode;
    tournamentState.phaseConfigs[phase].roundFormats[roundIndex - 1] = format;
    tournamentState.phaseConfigs[phase].roundCompasses[roundIndex - 1] = compass;
}

function toggleTournamentCompassSelector(phase, roundIndex) {
    const formatElement = document.getElementById(`tournament-${phase}-round-${roundIndex}-format`);
    const compassSelector = document.getElementById(`tournament-${phase}-round-${roundIndex}-compass-selector`);
    
    if (formatElement && compassSelector) {
        if (formatElement.value === 'compass') {
            compassSelector.style.display = 'block';
        } else {
            compassSelector.style.display = 'none';
        }
    }
}

function validateTournamentConfig() {
    const participantCount = tournamentState.participants.length;
    
    if (participantCount < 2) {
        showNotification('Mínimo 2 participantes para comenzar', 'warning');
        return false;
    }
    
    if (!isValidParticipantCount(participantCount)) {
        if (participantCount === 5) {
            showNotification('5 participantes no es compatible con eliminación directa. Usa 4 o 6 participantes.', 'warning');
        } else {
            showNotification(`${participantCount} participantes no es válido. Números permitidos: 2, 3, 4, 6, 7, 8`, 'warning');
        }
        return false;
    }
    
    if (selectedCategories.size === 0) {
        showNotification('Selecciona al menos una categoría de beats', 'warning');
        return false;
    }
    
    const availableBeats = getFilteredBeats();
    if (availableBeats.length === 0) {
        showNotification('No hay beats disponibles con las categorías seleccionadas', 'warning');
        return false;
    }
    
    tournamentState.phases.forEach(phase => {
        const config = tournamentState.phaseConfigs[phase];
        if (!config.roundTimes || config.roundTimes.length === 0 || config.roundTimes.some(time => !time || isNaN(time))) {
            showNotification(`Configuración incompleta para ${getPhaseDisplayName(phase)}`, 'warning');
            return false;
        }
    });
    
    return true;
}

function startTournamentFromConfig() {
    if (!validateTournamentConfig()) return;
    
    if (startTournament()) {
        showView('tournament-bracket');
        setupTournamentBracket();
        showNotification(`¡Torneo iniciado con ${tournamentState.participants.length} participantes!`, 'success');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const participantInput = document.getElementById('tournament-participant-input');
    if (participantInput) {
        participantInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTournamentParticipant();
            }
        });
    }
});

console.log('Tournament-config.js cargado correctamente ✅');
