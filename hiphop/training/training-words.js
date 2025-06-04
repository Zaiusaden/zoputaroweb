function startTrainingWords() {
    try {
        if (trainingConfig.mode === 'thematic') {
            const wordElement = document.getElementById('current-word');
            const themeElement = document.getElementById('theme-text');
            const currentTheme = themeElement ? themeElement.textContent : 'TEMA ACTUAL';
            wordElement.textContent = `TEMÁTICA: ${currentTheme.toUpperCase()}`;
            return;
        }
        
        if (trainingConfig.mode === 'rules') {
            const wordElement = document.getElementById('current-word');
            const ruleElement = document.getElementById('rule-text');
            const currentRule = ruleElement ? ruleElement.textContent : 'REGLA ACTUAL';
            wordElement.textContent = `REGLA: ${currentRule.toUpperCase()}`;
            return;
        }
        
        if (trainingConfig.mode === 'classic') {
            const wordElement = document.getElementById('current-word');
            wordElement.textContent = 'FREESTYLE LIBRE';
            return;
        }
        
        wordsActive = true;
        scheduleTrainingNextWord();
        
    } catch (error) {
        handleError(error, 'startTrainingWords');
    }
}

function scheduleTrainingNextWord() {
    if (!wordsActive || !trainingStarted || trainingConfig.mode === 'thematic' || trainingConfig.mode === 'classic' || trainingConfig.mode === 'rules') return;

    const elapsed = getTrainingElapsedTime();
    const expectedWordIndex = Math.floor(elapsed / wordIntervalMs);
    
    if (expectedWordIndex > lastWordIndex) {
        showTrainingNewWord();
        lastWordIndex = expectedWordIndex;
    }
    
    const nextWordVirtualTime = (lastWordIndex + 1) * wordIntervalMs;
    const virtualTimeUntilNext = nextWordVirtualTime - elapsed;
    const realTimeUntilNext = virtualTimeUntilNext / speedFactor;
    
    if (realTimeUntilNext > 0) {
        wordTimeout = setTimeout(() => {
            if (wordsActive && trainingStarted && !isPaused) {
                scheduleTrainingNextWord();
            }
        }, realTimeUntilNext);
    }
}

function showTrainingNewWord() {
    if (!wordsActive || !trainingStarted || trainingConfig.mode === 'thematic' || trainingConfig.mode === 'classic' || trainingConfig.mode === 'rules') return;

    try {
        const word = getRandomWord(trainingConfig.mode);
        
        if (word) {
            const wordElement = document.getElementById('current-word');
            wordElement.textContent = word.toUpperCase();
            
            wordElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                wordElement.style.transform = 'scale(1)';
            }, 200);
        }
        
        updateTrainingStats();
        
    } catch (error) {
        handleError(error, 'showTrainingNewWord');
    }
}

function changeTheme() {
    const isTraining = typeof trainingConfig !== 'undefined' && trainingConfig.mode === 'thematic' && typeof trainingStarted !== 'undefined' && trainingStarted;
    
    if (isTraining) {
        const themeText = document.getElementById('theme-text');
        const currentWord = document.getElementById('current-word');
        const newTheme = getRandomTheme();
        
        if (themeText) themeText.textContent = newTheme;
        if (currentWord) currentWord.textContent = `TEMÁTICA: ${newTheme.toUpperCase()}`;
        
        if (currentWord) {
            currentWord.style.transform = 'scale(1.1)';
            currentWord.style.color = '#ffd700';
            setTimeout(() => {
                currentWord.style.transform = 'scale(1)';
                currentWord.style.color = '#ffd700';
            }, 300);
        }
    }
}

function changeRule() {
    const isTraining = typeof trainingConfig !== 'undefined' && trainingConfig.mode === 'rules' && typeof trainingStarted !== 'undefined' && trainingStarted;
    
    if (isTraining) {
        const ruleText = document.getElementById('rule-text');
        const currentWord = document.getElementById('current-word');
        const newRule = getRandomRule();
        
        if (ruleText) ruleText.textContent = newRule;
        if (currentWord) currentWord.textContent = `REGLA: ${newRule.toUpperCase()}`;
        
        if (currentWord) {
            currentWord.style.transform = 'scale(1.1)';
            setTimeout(() => {
                currentWord.style.transform = 'scale(1)';
            }, 300);
        }
    }
}

console.log('Training-words.js cargado correctamente ✅');
