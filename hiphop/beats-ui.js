let selectedCategories = new Set();

function getBeatCountByCategory(category) {
    return beats.filter(beat => beat.category === category).length;
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
}

function loadBeatsInGrid(gridElement, prefix) {
    gridElement.innerHTML = '';
    const filteredBeats = getFilteredBeats();

    filteredBeats.forEach(beat => {
        const beatElement = document.createElement('div');
        beatElement.className = 'beat-option';
        
        if (prefix === 'beat-') {
            beatElement.onclick = () => selectBeat(beat.id);
        } else {
            beatElement.onclick = () => selectBattleBeat(beat.id);
        }

        beatElement.innerHTML = `
            <div style="font-weight: 600; color: #ffd700; margin-bottom: 5px;">${beat.title}</div>
            <div style="font-size: 0.8rem; color: #ff6b35; text-transform: uppercase;">${beat.type} - ${beat.tempo}</div>
            <div style="font-size: 0.7rem; color: #8a2be2; margin-top: 3px;">${beat.bpm} BPM</div>
        `;

        beatElement.id = `${prefix}${beat.id}`;
        gridElement.appendChild(beatElement);
    });
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