// ============================================================================
// TRAINING CONFIG - Configuración, validación y persistencia
// ============================================================================

function validateTrainingConfig() {
    const duration = document.getElementById('duration-mode').value;
    const mode = document.getElementById('training-mode').value;
    
    if (!selectedBeat) {
        alert('⚠️ Por favor, selecciona un beat antes de comenzar el entrenamiento.');
        return false;
    }
    
    if (selectedBeat === 'random' && selectedCategories.size === 0) {
        alert('⚠️ Para usar beat aleatorio, selecciona al menos una categoría de beats.');
        return false;
    }
    
    return true;
}

function getCurrentTrainingConfig() {
    return {
        duration: document.getElementById('duration-mode').value,
        mode: document.getElementById('training-mode').value,
        beat: selectedBeat,
        categories: Array.from(selectedCategories)
    };
}

function updateTrainingInfo() {
    const modeInfo = getModeInfo(trainingConfig.mode);
    document.getElementById('training-mode-display').textContent = modeInfo.name;

    if (trainingConfig.duration === 'infinite') {
        document.getElementById('training-duration').textContent = '∞';
    } else {
        const minutes = Math.floor(trainingConfig.duration / 60);
        const seconds = trainingConfig.duration % 60;
        document.getElementById('training-duration').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (selectedBeat === 'random') {
        document.getElementById('current-beat-name').textContent = 'Aleatorio';
    } else if (selectedBeat) {
        const beat = beats.find(b => b.id === selectedBeat);
        if (beat) {
            document.getElementById('current-beat-name').textContent = beat.title;
        }
    }
}

function saveTrainingConfig() {
    try {
        const config = getCurrentTrainingConfig();
        localStorage.setItem('freestyleTrainingConfig', JSON.stringify(config));
        showNotification('Configuración de entrenamiento guardada', 'success', 2000);
    } catch (error) {
        console.warn('No se pudo guardar la configuración de entrenamiento:', error);
    }
}

function loadTrainingConfig() {
    try {
        const savedConfig = localStorage.getItem('freestyleTrainingConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            
            if (config.duration) document.getElementById('duration-mode').value = config.duration;
            if (config.mode) document.getElementById('training-mode').value = config.mode;
            if (config.beat && config.beat !== 'random') {
                selectBeat(config.beat);
            } else {
                selectRandomBeat();
            }
            if (config.categories && Array.isArray(config.categories)) {
                selectedCategories = new Set(config.categories);
                updateCategoryButtons();
            }
            
            showNotification('Configuración de entrenamiento cargada', 'info', 2000);
        }
    } catch (error) {
        console.warn('No se pudo cargar la configuración de entrenamiento:', error);
    }
}

function resetTrainingConfig() {
    document.getElementById('duration-mode').value = '60';
    document.getElementById('training-mode').value = 'easy';
    selectedCategories.clear();
    updateCategoryButtons();
    selectRandomBeat();
    showNotification('Configuración de entrenamiento reiniciada', 'info', 2000);
}

function exportTrainingConfig() {
    try {
        const config = getCurrentTrainingConfig();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadElement = document.createElement('a');
        downloadElement.setAttribute("href", dataStr);
        downloadElement.setAttribute("download", "freestyle-training-config.json");
        document.body.appendChild(downloadElement);
        downloadElement.click();
        document.body.removeChild(downloadElement);
        showNotification('Configuración exportada', 'success', 2000);
    } catch (error) {
        handleError(error, 'exportTrainingConfig');
    }
}

function importTrainingConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            if (config.duration) document.getElementById('duration-mode').value = config.duration;
            if (config.mode) document.getElementById('training-mode').value = config.mode;
            if (config.categories && Array.isArray(config.categories)) {
                selectedCategories = new Set(config.categories);
                updateCategoryButtons();
                loadBeats();
            }
            if (config.beat && config.beat !== 'random') {
                selectBeat(config.beat);
            } else {
                selectRandomBeat();
            }
            
            showNotification('Configuración importada correctamente', 'success', 2000);
        } catch (error) {
            showNotification('Error importando configuración', 'error');
        }
    };
    reader.readAsText(file);
}

// Auto-guardar configuración cuando cambia
document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración al inicio
    loadTrainingConfig();
    
    // Auto-guardar cuando cambian los controles
    const autoSaveElements = [
        'duration-mode',
        'training-mode'
    ];
    
    autoSaveElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveTrainingConfig);
        }
    });
});

console.log('Training-config.js cargado correctamente ✅');