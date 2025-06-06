let selectedBeat = null;
let currentBeatIndex = 0;
let beatHistory = [];
let blacklistedBeats = new Set();

function selectRandomBeat() {
    document.querySelectorAll('.beat-option').forEach(el => {
        el.classList.remove('selected');
    });

    document.getElementById('beat-random').classList.add('selected');
    selectedBeat = 'random';

    document.getElementById('beat-player').innerHTML = `
        <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 10px; text-align: center;">
            <strong>🎲 Beat Aleatorio Activado</strong>
            <div style="font-size: 0.9rem; color: #ff6b35; margin-top: 5px;">
                Se seleccionará automáticamente de los beats disponibles
            </div>
        </div>
    `;
}

function selectBattleRandomBeat() {
    selectedBeat = 'random';

    document.getElementById('battle-beat-player').innerHTML = `
        <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 10px; text-align: center;">
            <strong>🎲 Beat Aleatorio Activado</strong>
            <div style="font-size: 0.9rem; color: #ff6b35; margin-top: 5px;">
                Se seleccionará automáticamente de los beats disponibles
            </div>
        </div>
    `;
}

function getFilteredBeats() {
    if (selectedCategories.size === 0) {
        return [];
    }
    
    return beats.filter(beat => 
        selectedCategories.has(beat.category) && 
        !blacklistedBeats.has(beat.id)
    );
}

function activateAllVisibleBeats() {
    const allBeats = beats.filter(beat => selectedCategories.has(beat.category));
    let activatedCount = 0;
    
    allBeats.forEach(beat => {
        if (blacklistedBeats.has(beat.id)) {
            blacklistedBeats.delete(beat.id);
            activatedCount++;
        }
    });
    
    saveBeatBlacklist();
    loadBeats();
    updateCategoryButtons();
    updateBattleCategoryButtons();
    updateTournamentCategoryButtons();
    
    if (activatedCount > 0) {
        showNotification(`${activatedCount} beats activados`, 'success', 1500);
    } else {
        showNotification('Todos los beats ya estaban activos', 'info', 1500);
    }
}

function deactivateAllVisibleBeats() {
    const allBeats = beats.filter(beat => selectedCategories.has(beat.category));
    let deactivatedCount = 0;
    
    allBeats.forEach(beat => {
        if (!blacklistedBeats.has(beat.id)) {
            blacklistedBeats.add(beat.id);
            deactivatedCount++;
        }
    });
    
    saveBeatBlacklist();
    loadBeats();
    updateCategoryButtons();
    updateBattleCategoryButtons();
    updateTournamentCategoryButtons();
    
    if (deactivatedCount > 0) {
        showNotification(`${deactivatedCount} beats desactivados`, 'info', 1500);
    } else {
        showNotification('Todos los beats ya estaban desactivados', 'info', 1500);
    }
}

function toggleBeatBlacklist(beatId) {
    if (blacklistedBeats.has(beatId)) {
        blacklistedBeats.delete(beatId);
    } else {
        blacklistedBeats.add(beatId);
    }
    
    saveBeatBlacklist();
    loadBeats();
    updateCategoryButtons();
    updateBattleCategoryButtons();
    updateTournamentCategoryButtons();
    
    const action = blacklistedBeats.has(beatId) ? 'desactivado' : 'activado';
    const beat = beats.find(b => b.id === beatId);
    showNotification(`${beat.title} ${action}`, 'info', 1500);
}

function saveBeatBlacklist() {
    try {
        localStorage.setItem('beatBlacklist', JSON.stringify(Array.from(blacklistedBeats)));
    } catch (error) {
        console.warn('No se pudo guardar la blacklist:', error);
    }
}

function loadBeatBlacklist() {
    try {
        const saved = localStorage.getItem('beatBlacklist');
        if (saved) {
            blacklistedBeats = new Set(JSON.parse(saved));
        }
    } catch (error) {
        console.warn('No se pudo cargar la blacklist:', error);
        blacklistedBeats = new Set();
    }
}

function selectBeat(beatId) {
    document.querySelectorAll('#freestyle-config .beat-option').forEach(el => {
        el.classList.remove('selected');
    });

    document.getElementById(`beat-${beatId}`).classList.add('selected');

    const beat = beats.find(b => b.id === beatId);
    if (beat) {
        currentBeatFile = beat.file;
        selectedBeat = beatId;
        
        document.getElementById('beat-player').innerHTML = `
            <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 10px; text-align: center;">
                <strong>🎵 ${beat.title} seleccionado</strong>
                <div style="font-size: 0.9rem; color: #ff6b35; margin-top: 5px;">${beat.type} - ${beat.bpm} BPM</div>
                <audio controls style="margin-top: 10px; width: 100%; max-width: 300px;">
                    <source src="${beat.file}" type="audio/ogg">
                    Tu navegador no soporta la reproducción de audio.
                </audio>
            </div>
        `;
    }
}

function setupInitialBeat() {
    if (!audioPlayer) {
        initAudioSystem();
    }
    
    beatHistory = [];
    
    if (selectedBeat === 'random') {
        const filteredBeats = getFilteredBeats();
        currentBeatIndex = beats.indexOf(filteredBeats[Math.floor(Math.random() * filteredBeats.length)]);
    } else if (selectedBeat) {
        currentBeatIndex = beats.findIndex(b => b.id === selectedBeat);
        if (currentBeatIndex === -1) currentBeatIndex = 0;
    } else {
        currentBeatIndex = 0;
    }
    
    const currentBeat = beats[currentBeatIndex];
    if (currentBeat) {
        currentBeatFile = currentBeat.file;
        
        const currentBeatElements = [
            document.getElementById('current-beat-name'),
            document.getElementById('battle-current-beat-name')
        ];
        
        currentBeatElements.forEach(el => {
            if (el) el.textContent = currentBeat.title;
        });
        
        if (audioPlayer) {
            audioPlayer.src = currentBeatFile;
            audioPlayer.load();
        }
    }
    
    updatePreviousBeatButtonState();
}

function selectNewBattleBeatAutomatic() {
    if (!audioPlayer) {
        initAudioSystem();
    }
    
    const filteredBeats = getFilteredBeats();
    if (filteredBeats.length === 0) return;
    
    const isTournamentMode = typeof tournamentStarted !== 'undefined' && tournamentStarted;
    let availableBeats;
    let usedBeatsArray;
    let newBeatIndex;
    
    if (isTournamentMode) {
        availableBeats = filteredBeats.filter((beat, index) => {
            const globalIndex = beats.indexOf(beat);
            return !tournamentUsedBeats.includes(globalIndex);
        });
        usedBeatsArray = tournamentUsedBeats;
    } else {
        availableBeats = filteredBeats.filter((beat, index) => {
            const globalIndex = beats.indexOf(beat);
            return !battleUsedBeats.includes(globalIndex);
        });
        usedBeatsArray = battleUsedBeats;
    }
    
    if (availableBeats.length > 0) {
        const randomBeat = availableBeats[Math.floor(Math.random() * availableBeats.length)];
        newBeatIndex = beats.indexOf(randomBeat);
    } else {
        if (isTournamentMode) {
            tournamentUsedBeats = [];
        } else {
            battleUsedBeats = [];
        }
        const randomBeat = filteredBeats[Math.floor(Math.random() * filteredBeats.length)];
        newBeatIndex = beats.indexOf(randomBeat);
    }
    
    if (isTournamentMode) {
        tournamentUsedBeats.push(newBeatIndex);
    } else {
        battleUsedBeats.push(newBeatIndex);
    }
    
    currentBeatIndex = newBeatIndex;
    const newBeat = beats[currentBeatIndex];
    currentBeatFile = newBeat.file;
    
    const currentBeatElements = [
        document.getElementById('current-beat-name'),
        document.getElementById('battle-current-beat-name')
    ];
    
    currentBeatElements.forEach(el => {
        if (el) el.textContent = newBeat.title;
    });
    
    if (audioPlayer) {
        audioPlayer.src = currentBeatFile;
        audioPlayer.load();
    }
    
    const beatInfoElements = [
        document.getElementById('beat-info'),
        document.getElementById('battle-beat-info')
    ];
    
    beatInfoElements.forEach(el => {
        if (el) el.textContent = `Nueva ronda: ${newBeat.title}`;
    });
    
    showNotification(`Nuevo beat: ${newBeat.title}`, 'info', 2000);
}

function updatePreviousBeatButtonState() {
    const previousBtns = [
        document.getElementById('previous-beat-btn'),
        document.getElementById('battle-previous-beat-btn')
    ];
    
    const isTrainingActive = typeof trainingStarted !== 'undefined' && trainingStarted;
    const isBattleActive = typeof battleStarted !== 'undefined' && battleStarted;
    
    previousBtns.forEach(btn => {
        if (btn) {
            btn.disabled = beatHistory.length === 0 || (!isTrainingActive && !isBattleActive);
        }
    });
}

function nextBeat() {
    const isTrainingActive = typeof trainingStarted !== 'undefined' && trainingStarted;
    const isBattleActive = typeof battleStarted !== 'undefined' && battleStarted && typeof turnStarted !== 'undefined' && turnStarted;
    
    if (!isTrainingActive && !isBattleActive) return;

    beatHistory.push(currentBeatIndex);
    
    if (beatHistory.length > 5) {
        beatHistory = beatHistory.slice(-5);
    }
    
    let newBeatIndex;
    const filteredBeats = getFilteredBeats();
    
    if (filteredBeats.length === 0) return;
    
    do {
        const randomFilteredBeat = filteredBeats[Math.floor(Math.random() * filteredBeats.length)];
        newBeatIndex = beats.indexOf(randomFilteredBeat);
    } while (newBeatIndex === currentBeatIndex && filteredBeats.length > 1);
    
    currentBeatIndex = newBeatIndex;
    const newBeat = beats[currentBeatIndex];
    
    currentBeatFile = newBeat.file;
    
    const currentBeatElements = [
        document.getElementById('current-beat-name'),
        document.getElementById('battle-current-beat-name')
    ];
    
    currentBeatElements.forEach(el => {
        if (el) el.textContent = newBeat.title;
    });
    
    const beatInfoElements = [
        document.getElementById('beat-info'),
        document.getElementById('battle-beat-info')
    ];
    
    const isPlaying = (isTrainingActive && typeof beatActive !== 'undefined' && beatActive) || 
                     (isBattleActive && typeof battleBeatActive !== 'undefined' && battleBeatActive);
    
    if (isPlaying && audioPlayer) {
        audioPlayer.src = currentBeatFile;
        audioPlayer.play().then(() => {
            beatInfoElements.forEach(el => {
                if (el) el.textContent = `Reproduciendo: ${newBeat.title}`;
            });
        }).catch(error => {
            console.error('Error cambiando beat:', error);
            handleBeatError();
        });
    } else {
        beatInfoElements.forEach(el => {
            if (el) el.textContent = `Beat cambiado a: ${newBeat.title}`;
        });
    }
    
    updatePreviousBeatButtonState();
    
    if (isTrainingActive && typeof softReset === 'function') {
        softReset();
    } else if (isBattleActive && typeof battleSoftReset === 'function') {
        battleSoftReset();
    }
}

function previousBeat() {
    const isTrainingActive = typeof trainingStarted !== 'undefined' && trainingStarted;
    const isBattleActive = typeof battleStarted !== 'undefined' && battleStarted;
    
    if ((!isTrainingActive && !isBattleActive) || beatHistory.length === 0) return;

    const previousBeatIndex = beatHistory.pop();
    
    currentBeatIndex = previousBeatIndex;
    const previousBeatObj = beats[currentBeatIndex];
    
    currentBeatFile = previousBeatObj.file;
    
    const currentBeatElements = [
        document.getElementById('current-beat-name'),
        document.getElementById('battle-current-beat-name')
    ];
    
    currentBeatElements.forEach(el => {
        if (el) el.textContent = previousBeatObj.title;
    });
    
    const beatInfoElements = [
        document.getElementById('beat-info'),
        document.getElementById('battle-beat-info')
    ];
    
    const isPlaying = (isTrainingActive && typeof beatActive !== 'undefined' && beatActive) || 
                     (isBattleActive && typeof battleBeatActive !== 'undefined' && battleBeatActive);
    
    if (isPlaying && audioPlayer) {
        audioPlayer.src = currentBeatFile;
        audioPlayer.play().then(() => {
            beatInfoElements.forEach(el => {
                if (el) el.textContent = `Reproduciendo: ${previousBeatObj.title}`;
            });
        }).catch(error => {
            console.error('Error cambiando a beat anterior:', error);
            handleBeatError();
        });
    } else {
        beatInfoElements.forEach(el => {
            if (el) el.textContent = `Beat cambiado a: ${previousBeatObj.title}`;
        });
    }
    
    updatePreviousBeatButtonState();
    
    if (isTrainingActive && typeof softReset === 'function') {
        softReset();
    } else if (isBattleActive && typeof battleSoftReset === 'function') {
        battleSoftReset();
    }
}

console.log('Beats-selection.js cargado correctamente ✅');