let audioPlayer = null;
let currentBeatFile = null;

function initAudioSystem() {
    audioPlayer = document.getElementById('training-audio-player');
    if (!audioPlayer) {
        console.error('Audio player no encontrado');
        return false;
    }
    
    audioPlayer.loop = true;
    audioPlayer.volume = 0.7;
    
    audioPlayer.addEventListener('canplay', () => {
        console.log('Beat cargado y listo para reproducir');
    });
    
    audioPlayer.addEventListener('error', (e) => {
        console.error('Error cargando el beat:', e);
        handleBeatError();
    });
    
    audioPlayer.addEventListener('loadstart', () => {
        console.log('Iniciando carga del beat...');
    });
    
    return true;
}

function handleBeatError() {
    const beatInfoElements = [
        document.getElementById('beat-info'),
        document.getElementById('battle-beat-info')
    ];
    
    const currentBeatElements = [
        document.getElementById('current-beat-name'),
        document.getElementById('battle-current-beat-name')
    ];
    
    beatInfoElements.forEach(el => {
        if (el) el.textContent = 'Error: Beat no disponible';
    });
    
    currentBeatElements.forEach(el => {
        if (el) el.textContent = 'Sin Beat';
    });
}

function startBeat() {
    if (!audioPlayer || !currentBeatFile) {
        console.error('Sistema de audio no inicializado correctamente');
        return Promise.reject(new Error('Sistema de audio no inicializado'));
    }
    
    const isTrainingActive = typeof trainingStarted !== 'undefined' && trainingStarted;
    const isBattleActive = typeof battleStarted !== 'undefined' && battleStarted;
    
    if (isTrainingActive) {
        beatActive = true;
    } else if (isBattleActive) {
        battleBeatActive = true;
    }
    
    audioPlayer.src = currentBeatFile;
    
    return audioPlayer.play().then(() => {
        const pauseBtns = [
            document.getElementById('pause-beat-btn'),
            document.getElementById('battle-pause-btn')
        ];
        
        const beatInfoElements = [
            document.getElementById('beat-info'),
            document.getElementById('battle-beat-info')
        ];
        
        pauseBtns.forEach(btn => {
            if (btn && isTrainingActive) {
                btn.innerHTML = '⏸️ PAUSAR ENTRENAMIENTO';
            } else if (btn && isBattleActive) {
                btn.innerHTML = '⏸️ PAUSAR';
            }
        });
        
        beatInfoElements.forEach(el => {
            if (el) el.textContent = `Reproduciendo: ${beats[currentBeatIndex].title}`;
        });
    }).catch(error => {
        console.error('Error iniciando beat:', error);
        handleBeatError();
        throw error;
    });
}

function stopBeat() {
    if (audioPlayer) {
        const isTrainingActive = typeof trainingStarted !== 'undefined' && trainingStarted;
        const isBattleActive = typeof battleStarted !== 'undefined' && battleStarted;
        
        if (isTrainingActive) {
            beatActive = false;
        } else if (isBattleActive) {
            battleBeatActive = false;
        }
        
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        const pauseBtns = [
            document.getElementById('pause-beat-btn'),
            document.getElementById('battle-pause-btn')
        ];
        
        pauseBtns.forEach(btn => {
            if (btn && isTrainingActive) {
                btn.innerHTML = '▶️ PLAY ENTRENAMIENTO';
            } else if (btn && isBattleActive) {
                btn.innerHTML = '▶️ REANUDAR';
            }
        });
    }
}

console.log('Beats-audio.js cargado correctamente ✅');
