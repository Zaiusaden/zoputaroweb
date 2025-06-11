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

function getAudioFilesToTry(beat) {
    const files = [];
    
    if (isLocalFile()) {
        if (beat.fileOgg) files.push(beat.fileOgg);
        if (beat.file) files.push(beat.file);
    } else if (isMobileDevice()) {
        if (beat.file) files.push(beat.file);
        if (beat.fileOgg) files.push(beat.fileOgg);
    } else {
        if (beat.fileOgg) files.push(beat.fileOgg);
        if (beat.file) files.push(beat.file);
    }
    
    return files;
}

function getBestAudioFile(beat) {
    const files = getAudioFilesToTry(beat);
    return files[0] || beat.file;
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

function tryLoadAudioFile(fileUrl, callback, timeout = 8000) {
    if (audioTimeoutId) {
        clearTimeout(audioTimeoutId);
        audioTimeoutId = null;
    }
    
    let hasResolved = false;
    
    function resolve(error) {
        if (hasResolved) return;
        hasResolved = true;
        
        audioPlayer.removeEventListener('playing', onAudioPlaying);
        audioPlayer.removeEventListener('timeupdate', onFirstTimeUpdate);
        audioPlayer.removeEventListener('error', onAudioError);
        
        if (audioTimeoutId) {
            clearTimeout(audioTimeoutId);
            audioTimeoutId = null;
        }
        
        callback(error);
    }
    
    function onAudioPlaying() {
        resolve(null);
    }
    
    function onFirstTimeUpdate() {
        if (audioPlayer.currentTime > 0) {
            resolve(null);
        }
    }
    
    function onAudioError(e) {
        resolve(new Error(`Audio load failed: ${e.type}`));
    }
    
    audioPlayer.addEventListener('playing', onAudioPlaying);
    audioPlayer.addEventListener('timeupdate', onFirstTimeUpdate);
    audioPlayer.addEventListener('error', onAudioError);
    
    audioTimeoutId = setTimeout(() => {
        resolve(new Error('Audio load timeout'));
    }, timeout);
    
    audioPlayer.src = fileUrl;
    audioPlayer.load();
    
    audioPlayer.play().catch(error => {
        resolve(error);
    });
}

function startBeatWithCallback(callback) {
    if (!audioPlayer) {
        console.error('Sistema de audio no inicializado correctamente');
        if (callback) callback(new Error('Sistema de audio no inicializado'));
        return;
    }
    
    const currentBeat = beats[currentBeatIndex];
    if (!currentBeat) {
        console.error('Beat actual no encontrado');
        if (callback) callback(new Error('Beat no encontrado'));
        return;
    }
    
    const filesToTry = getAudioFilesToTry(currentBeat);
    if (filesToTry.length === 0) {
        console.error('No hay archivos de audio disponibles');
        if (callback) callback(new Error('No hay archivos de audio'));
        return;
    }
    
    audioEventCallback = callback;
    
    const isTrainingActive = typeof trainingStarted !== 'undefined' && trainingStarted;
    const isBattleActive = typeof battleStarted !== 'undefined' && battleStarted;
    
    if (isTrainingActive) {
        beatActive = true;
    } else if (isBattleActive) {
        battleBeatActive = true;
    }
    
    let currentFileIndex = 0;
    
    function tryNextFile() {
        if (currentFileIndex >= filesToTry.length) {
            handleBeatError();
            if (audioEventCallback) {
                audioEventCallback(new Error('Todos los formatos de audio fallaron'));
                audioEventCallback = null;
            }
            return;
        }
        
        const fileUrl = filesToTry[currentFileIndex];
        currentBeatFile = fileUrl;
        
        tryLoadAudioFile(fileUrl, (error) => {
            if (!error) {
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
                    if (el) el.textContent = `Reproduciendo: ${currentBeat.title}`;
                });
                
                if (audioEventCallback) {
                    audioEventCallback(null);
                    audioEventCallback = null;
                }
            } else {
                currentFileIndex++;
                setTimeout(tryNextFile, 100);
            }
        });
    }
    
    tryNextFile();
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
