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
    
    battleStarted = false;
    battleTimerActive = false;
    battleWordsActive = false;
    turnStarted = false;
    battleUsedBeats = [];
    battleCompassTimeouts = [];
    
    updateBattleCategoryButtons();
    loadBeats();
    selectBattleRandomBeat();
    updateBattleRoundSelector();
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
    battleState.currentRound = 1;
    battleState.totalRounds = parseInt(config.rounds);
    battleState.roundTimes = config.roundTimes;
    battleState.roundModes = config.roundModes;
    battleState.roundFormats = config.roundFormats;
    battleState.roundCompasses = config.roundCompasses || [];
    battleState.categories = new Set(config.categories);
    battleState.whoStarts = config.whoStarts;
    battleState.votingMode = parseInt(config.rounds) % 2 === 0 ? 'per_round' : 'final';
    battleState.isReplayMode = false;
    battleState.roundResultsForFinalVoting = [];
    battleState.turnsInCurrentRound = 0;
    battleState.roundResults = [];
    
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
    
    const availableBeats = getFilteredBeats();
    if (availableBeats.length === 0) {
        alert('⚠️ No hay beats disponibles con las categorías seleccionadas. Por favor, activa algunos beats o selecciona más categorías.');
        return false;
    }
    
    const roundTimes = [];
    const roundModes = [];
    const roundFormats = [];
    const roundCompasses = [];
    for (let i = 1; i <= parseInt(rounds); i++) {
        const time = document.getElementById(`battle-round-${i}-time`).value;
        const mode = document.getElementById(`battle-round-${i}-mode`).value;
        const format = document.getElementById(`battle-round-${i}-format`).value;
        
        if (!time) {
            alert(`⚠️ Por favor, selecciona el tiempo para la ronda ${i}.`);
            return false;
        }
        if (!mode) {
            alert(`⚠️ Por favor, selecciona el modo para la ronda ${i}.`);
            return false;
        }
        if (!format) {
            alert(`⚠️ Por favor, selecciona el formato para la ronda ${i}.`);
            return false;
        }
        
        roundTimes.push(parseInt(time));
        roundModes.push(mode);
        roundFormats.push(format);
        
        if (format === 'compass') {
            const compass = document.getElementById(`battle-round-${i}-compass`).value;
            if (!compass) {
                alert(`⚠️ Por favor, selecciona los compases por turno para la ronda ${i}.`);
                return false;
            }
            roundCompasses.push(parseInt(compass));
        } else {
            roundCompasses.push(1);
        }
    }
    
    console.log('Battle config validation passed');
    return { mc1Aka, mc2Aka, rounds, roundTimes, roundModes, roundFormats, roundCompasses };
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
    
    battleUsedBeats = [currentBeatIndex];
    
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

function updateBattleRoundSelector() {
    const roundsSelect = document.getElementById('battle-rounds');
    const roundTimesContainer = document.getElementById('battle-round-times');
    const votingTypeSpan = document.getElementById('battle-voting-type');

    const rounds = parseInt(roundsSelect.value);
    roundTimesContainer.innerHTML = '';

    let votingText = '';
    if (rounds === 1) votingText = 'Votación al final';
    else if (rounds === 2) votingText = 'Votación por ronda';
    else if (rounds === 3) votingText = 'Votación al final';
    else if (rounds === 4) votingText = 'Votación por ronda';
    else if (rounds === 5) votingText = 'Votación al final';
    
    if (votingTypeSpan) {
        votingTypeSpan.textContent = votingText;
    }

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

console.log('Battle-config.js cargado correctamente ✅');
