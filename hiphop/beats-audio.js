let audioPlayer = null;
let currentBeatFile = null;
let audioEventCallback = null;
let audioTimeoutId = null;

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
}

function isLocalFile() {
    return window.location.protocol === 'file:';
}

function getBestAudioFile(beat) {
    if (isLocalFile()) {
        return beat.fileOgg || beat.file;
    }
    
    if (isMobileDevice()) {
        return beat.file;
    } else {
        return beat.fileOgg || beat.file;
    }
}

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

function startBeatWithCallback(callback) {
    if (!audioPlayer || !currentBeatFile) {
        console.error('Sistema de audio no inicializado correctamente');
        if (callback) callback(new Error('Sistema de audio no inicializado'));
        return;
    }
    
    if (audioTimeoutId) {
        clearTimeout(audioTimeoutId);
        audioTimeoutId = null;
    }
    
    audioEventCallback = callback;
    
    const isTrainingActive = typeof trainingStarted !== 'undefined' && trainingStarted;
    const isBattleActive = typeof battleStarted !== 'undefined' && battleStarted;
    
    if (isTrainingActive) {
        beatActive = true;
    } else if (isBattleActive) {
        battleBeatActive = true;
    }
    
    function onAudioPlaying() {
        audioPlayer.removeEventListener('playing', onAudioPlaying);
        audioPlayer.removeEventListener('timeupdate', onFirstTimeUpdate);
        
        if (audioTimeoutId) {
            clearTimeout(audioTimeoutId);
            audioTimeoutId = null;
        }
        
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
        
        if (audioEventCallback) {
            audioEventCallback(null);
            audioEventCallback = null;
        }
    }
    
    function onFirstTimeUpdate() {
        if (audioPlayer.currentTime > 0) {
            onAudioPlaying();
        }
    }
    
    audioPlayer.addEventListener('playing', onAudioPlaying);
    audioPlayer.addEventListener('timeupdate', onFirstTimeUpdate);
    
    audioTimeoutId = setTimeout(() => {
        audioPlayer.removeEventListener('playing', onAudioPlaying);
        audioPlayer.removeEventListener('timeupdate', onFirstTimeUpdate);
        
        if (audioEventCallback) {
            audioEventCallback(null);
            audioEventCallback = null;
        }
    }, 5000);
    
    audioPlayer.src = currentBeatFile;
    audioPlayer.play().catch(error => {
        console.error('Error iniciando beat:', error);
        
        audioPlayer.removeEventListener('playing', onAudioPlaying);
        audioPlayer.removeEventListener('timeupdate', onFirstTimeUpdate);
        
        if (audioTimeoutId) {
            clearTimeout(audioTimeoutId);
            audioTimeoutId = null;
        }
        
        handleBeatError();
        
        if (audioEventCallback) {
            audioEventCallback(error);
            audioEventCallback = null;
        }
    });
}

function startBeat() {
    return new Promise((resolve, reject) => {
        startBeatWithCallback((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
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
    
    if (audioTimeoutId) {
        clearTimeout(audioTimeoutId);
        audioTimeoutId = null;
    }
    
    audioEventCallback = null;
}

console.log('Beats-audio.js cargado correctamente ✅');
