let selectedCategories = new Set();
let trainingBeatGridExpanded = true;
let battleBeatGridExpanded = true;
let tournamentBeatGridExpanded = true;

function getBeatCountByCategory(category) {
    return beats.filter(beat => beat.category === category && !blacklistedBeats.has(beat.id)).length;
}

function loadBeats() {
    const beatGrid = document.getElementById('beat-grid');
    if (beatGrid) {
        loadBeatsInGrid(beatGrid, 'beat-');
    }
    
    const battleBeatGrid = document.getElementById('battle-beat-grid');
    if (battleBeatGrid) {
        loadBeatsInGrid(battleBeatGrid, 'battle-beat-');
    }
    
    const tournamentBeatGrid = document.getElementById('tournament-beat-grid');
    if (tournamentBeatGrid) {
        loadBeatsInGrid(tournamentBeatGrid, 'tournament-beat-');
    }
}

function loadBeatsInGrid(gridElement, prefix) {
    gridElement.innerHTML = '';
    const allBeats = beats.filter(beat => selectedCategories.has(beat.category));

    allBeats.forEach(beat => {
        const beatElement = document.createElement('div');
        const isBlacklisted = blacklistedBeats.has(beat.id);
        beatElement.className = `beat-option ${isBlacklisted ? 'blacklisted' : ''}`;
        
        beatElement.innerHTML = `
            <div class="beat-blacklist-toggle" onclick="event.stopPropagation(); toggleBeatBlacklist('${beat.id}')">
                ${isBlacklisted ? '👁️‍🗨️' : '👁️'}
            </div>
            <div style="font-weight: 600; color: #ffd700; margin-bottom: 5px;">${beat.title}</div>
            <div style="font-size: 0.8rem; color: #ff6b35; text-transform: uppercase;">${beat.type} - ${beat.tempo}</div>
            <div style="font-size: 0.7rem; color: #ffffff; margin-top: 3px;">${beat.bpm} BPM</div>
        `;

        if (prefix === 'beat-' && !isBlacklisted) {
            beatElement.onclick = () => selectBeat(beat.id);
        }

        beatElement.id = `${prefix}${beat.id}`;
        gridElement.appendChild(beatElement);
    });
}

function toggleBeatGrid(gridType) {
    let isExpanded, containerId, gridId, toggleBtnId;
    
    if (gridType === 'training') {
        isExpanded = trainingBeatGridExpanded;
        containerId = 'training-beat-grid-container';
        gridId = 'beat-grid';
        toggleBtnId = 'training-beat-grid-toggle';
    } else if (gridType === 'battle') {
        isExpanded = battleBeatGridExpanded;
        containerId = 'battle-beat-grid-container';
        gridId = 'battle-beat-grid';
        toggleBtnId = 'battle-beat-grid-toggle';
    } else if (gridType === 'tournament') {
        isExpanded = tournamentBeatGridExpanded;
        containerId = 'tournament-beat-grid-container';
        gridId = 'tournament-beat-grid';
        toggleBtnId = 'tournament-beat-grid-toggle';
    }
    
    const container = document.getElementById(containerId);
    const grid = document.getElementById(gridId);
    const toggleBtn = document.getElementById(toggleBtnId);
    
    if (!container || !grid || !toggleBtn) return;
    
    if (gridType === 'training') {
        trainingBeatGridExpanded = !trainingBeatGridExpanded;
        isExpanded = trainingBeatGridExpanded;
    } else if (gridType === 'battle') {
        battleBeatGridExpanded = !battleBeatGridExpanded;
        isExpanded = battleBeatGridExpanded;
    } else if (gridType === 'tournament') {
        tournamentBeatGridExpanded = !tournamentBeatGridExpanded;
        isExpanded = tournamentBeatGridExpanded;
    }
    
    if (isExpanded) {
        grid.style.display = 'grid';
        toggleBtn.textContent = '🔽 Ocultar Beats';
    } else {
        grid.style.display = 'none';
        toggleBtn.textContent = '🔼 Mostrar Beats';
    }
}

function toggleCategory(category) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
    } else {
        selectedCategories.add(category);
    }
    
    updateCategoryButtons();
    loadBeats();
}

function toggleBattleCategory(category) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
    } else {
        selectedCategories.add(category);
    }
    
    updateBattleCategoryButtons();
    loadBeats();
}

function updateCategoryButtons() {
    const categories = ['boom-bap', 'trap-drill', 'reggae-dancehall'];
    
    categories.forEach(category => {
        const button = document.getElementById(`category-${category}`);
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

function updateBattleCategoryButtons() {
    const categories = ['boom-bap', 'trap-drill', 'reggae-dancehall'];
    
    categories.forEach(category => {
        const button = document.getElementById(`battle-category-${category}`);
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

function updateStartButton() {
    const startButton = document.querySelector('.start-training-btn');
    if (startButton) {
        startButton.disabled = false;
    }
}

console.log('Beats-ui.js cargado correctamente ✅');