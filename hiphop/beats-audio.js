let audioPlayer = null;
let currentBeatFile = null;

function initAudioSystem() {
    audioPlayer = document.getElementById('training-audio-player');
    if (!audioPlayer) {
        console.error('Audio player no encontrado');
        return false;
    }
    
    const isLocalFile = window.location.protocol === 'file:';
    
    audioPlayer.loop = true;
    audioPlayer.volume = 0.7;
    audioPlayer.preload = isLocalFile ? 'metadata' : 'auto';
    
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
    
    audioPlayer.addEventListener('loadeddata', () => {
        console.log('Datos del beat cargados');
    });
    
    audioPlayer.addEventListener('canplaythrough', () => {
        console.log('Beat completamente cargado');
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

function preloadBeat(beatFile) {
    return new Promise((resolve, reject) => {
        if (!audioPlayer) {
            reject(new Error('Audio player no inicializado'));
            return;
        }
        
        if (audioPlayer.src.endsWith(beatFile)) {
            resolve();
            return;
        }
        
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isLocalFile) {
            audioPlayer.src = beatFile;
            audioPlayer.load();
            resolve();
        } else {
            const onCanPlayThrough = () => {
                audioPlayer.removeEventListener('canplaythrough', onCanPlayThrough);
                audioPlayer.removeEventListener('error', onError);
                resolve();
            };
            
            const onError = (error) => {
                audioPlayer.removeEventListener('canplaythrough', onCanPlayThrough);
                audioPlayer.removeEventListener('error', onError);
                reject(error);
            };
            
            audioPlayer.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
            audioPlayer.addEventListener('error', onError, { once: true });
            
            audioPlayer.src = beatFile;
            audioPlayer.load();
        }
    });
}

function waitForAudioToStart() {
    return new Promise((resolve) => {
        if (!audioPlayer) {
            resolve();
            return;
        }
        
        const checkAudioTime = () => {
            if (audioPlayer.currentTime > 0 && !audioPlayer.paused) {
                audioPlayer.removeEventListener('timeupdate', checkAudioTime);
                resolve();
            }
        };
        
        audioPlayer.addEventListener('timeupdate', checkAudioTime);
        
        setTimeout(() => {
            audioPlayer.removeEventListener('timeupdate', checkAudioTime);
            resolve();
        }, 2000);
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
    
    return preloadBeat(currentBeatFile)
        .then(() => {
            return audioPlayer.play();
        })
        .then(() => {
            return waitForAudioToStart();
        })
        .then(() => {
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
        })
        .catch(error => {
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
