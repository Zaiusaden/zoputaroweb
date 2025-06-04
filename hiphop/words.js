const words = {
    easy: [
        'casa', 'fuego', 'agua', 'tierra', 'viento', 'sol', 'luna', 'estrella', 'mar', 'montaña',
        'ciudad', 'calle', 'barrio', 'gente', 'amigo', 'familia', 'amor', 'corazón', 'vida', 'tiempo',
        'día', 'noche', 'luz', 'sombra', 'color', 'música', 'ritmo', 'palabra', 'voz', 'sonido',
        'flow', 'beat', 'micro', 'rima', 'verso', 'base', 'hood', 'crew', 'style', 'real',
        'coche', 'perro', 'gato', 'mesa', 'silla', 'puerta', 'ventana', 'teléfono', 'libro', 'papel',
        'lápiz', 'mano', 'pie', 'cabeza', 'ojo', 'boca', 'nariz', 'oreja', 'pelo', 'diente',
        'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'grande', 'pequeño', 'alto', 'bajo',
        'nuevo', 'viejo', 'bueno', 'malo', 'rápido', 'lento', 'fuerte', 'débil', 'caliente', 'frío'
    ],

    hard: [
        'libertad', 'justicia', 'respeto', 'verdad', 'mentira', 'traición', 'lealtad', 'venganza', 'perdón', 'esperanza',
        'miedo', 'valor', 'fuerza', 'debilidad', 'poder', 'humildad', 'orgullo', 'envidia', 'celos', 'pasión',
        'destino', 'suerte', 'fortuna', 'miseria', 'riqueza', 'pobreza', 'éxito', 'fracaso', 'victoria', 'derrota',
        'batalla', 'guerra', 'paz', 'conflicto', 'problema', 'solución', 'camino', 'meta', 'objetivo', 'sueño',
        'freestyle', 'competencia', 'talento', 'técnica', 'creatividad', 'improvisación', 'underground', 'cultura',
        'adolescencia', 'juventud', 'madurez', 'vejez', 'experiencia', 'sabiduría', 'ignorancia', 'conocimiento',
        'educación', 'trabajo', 'profesión', 'dinero', 'economía', 'política', 'sociedad', 'comunidad',
        'religión', 'filosofía', 'ciencia', 'tecnología', 'internet', 'comunicación', 'mensaje', 'información',
        'naturaleza', 'medio ambiente', 'contaminación', 'reciclaje', 'sostenibilidad', 'futuro', 'presente', 'pasado',
        'historia', 'tradición', 'costumbre', 'innovación', 'cambio', 'evolución', 'progreso', 'desarrollo'
    ],

    insane: [
        'personalidad', 'consecuencia', 'responsabilidad', 'oportunidad', 'circunstancia', 'perspectiva', 'transparencia',
        'competitividad', 'originalidad', 'creatividad', 'productividad', 'credibilidad', 'disponibilidad', 'versatilidad',
        'inteligencia', 'independencia', 'experiencia', 'resistencia', 'persistencia', 'coherencia', 'paciencia',
        'tolerancia', 'importancia', 'relevancia', 'influencia', 'diferencia', 'preferencia', 'referencia',
        'comunicación', 'información', 'educación', 'organización', 'administración', 'colaboración', 'coordinación',
        'motivación', 'inspiración', 'aspiración', 'admiración', 'concentración', 'dedicación', 'preparación',
        'transformación', 'innovación', 'revolución', 'evolución', 'solución', 'conclusión', 'decisión',
        'precisión', 'visión', 'misión', 'pasión', 'acción', 'reacción', 'satisfacción', 'atracción',
        'tecnología', 'psicología', 'filosofía', 'sociología', 'metodología', 'ideología', 'democracia',
        'burocracia', 'aristocracia', 'diplomacia', 'economía', 'autonomía', 'ceremonia', 'armonía'
    ]
};

const themes = [
    'La Calle', 'Superación Personal', 'Hip Hop Culture', 'Amor y Desamor', 'Sueños y Metas',
    'Lucha y Resistencia', 'Barrio y Crew', 'Dinero y Poder', 'Libertad', 'Justicia Social',
    'Familia', 'Traición', 'Lealtad', 'Venganza', 'Perdón', 'Esperanza', 'Miedo y Valor',
    'Vida Nocturna', 'Underground', 'Competencia', 'Respeto', 'Honor', 'Sacrificio',
    'Nostalgia', 'Futuro', 'Presente', 'Pasado', 'Realidad', 'Fantasía', 'Éxito y Fracaso',
    'Amistad Verdadera', 'Enemigos', 'Crítica Social', 'Política', 'Educación', 'Trabajo',
    'Desigualdad', 'Racismo', 'Discriminación', 'Igualdad', 'Diversidad', 'Inmigración',
    'Tecnología', 'Redes Sociales', 'Comunicación', 'Soledad', 'Depresión', 'Ansiedad',
    'Motivación', 'Inspiración', 'Creatividad', 'Arte', 'Música', 'Danza', 'Poesía',
    'Literatura', 'Cine', 'Teatro', 'Pintura', 'Escultura', 'Fotografía', 'Moda',
    'Deportes', 'Competición', 'Entrenamiento', 'Disciplina', 'Equipo', 'Liderazgo',
    'Naturaleza', 'Medio Ambiente', 'Animales', 'Plantas', 'Clima', 'Estaciones',
    'Viajes', 'Aventura', 'Exploración', 'Descubrimiento', 'Cultura', 'Tradiciones'
];

function getRandomWord(mode, theme = '') {
    if (mode === 'thematic') {
        return null;
    }
    
    let wordList = [...(words[mode] || words.easy)];
    
    wordList = [...new Set(wordList)];
    
    return wordList[Math.floor(Math.random() * wordList.length)];
}

function getRandomTheme() {
    return themes[Math.floor(Math.random() * themes.length)];
}

function setupTheme() {
    const isTraining = typeof trainingConfig !== 'undefined' && trainingConfig.mode;
    const isBattle = typeof battleState !== 'undefined' && battleState.mode;
    
    let mode = '';
    let themeBtn = null;
    
    if (isTraining) {
        mode = trainingConfig.mode;
        themeBtn = document.getElementById('change-theme-btn');
    } else if (isBattle) {
        mode = battleState.mode;
        themeBtn = document.getElementById('battle-change-theme-btn');
    }
    
    const themeText = document.getElementById('theme-text');
    
    if (mode === 'thematic') {
        const randomTheme = getRandomTheme();
        if (themeText) themeText.textContent = randomTheme;
        if (themeBtn) themeBtn.classList.remove('hidden');
    } else {
        if (themeBtn) themeBtn.classList.add('hidden');
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

function getModeInterval(mode) {
    const intervals = {
        'easy': 10000,
        'hard': 5000,
        'insane': 4000,
        'thematic': 0
    };
    
    return intervals[mode] || intervals.easy;
}

function getModeInfo(mode) {
    const info = {
        'easy': {
            name: 'EASY',
            description: 'Palabra cada 10 segundos',
            color: '#4ade80'
        },
        'hard': {
            name: 'HARD MODE',
            description: 'Palabra cada 5 segundos',
            color: '#ff6b35'
        },
        'insane': {
            name: 'INSANE MODE',
            description: 'Palabra cada 4 segundos',
            color: '#ef4444'
        },
        'thematic': {
            name: 'TEMÁTICO',
            description: 'Temáticas aleatorias',
            color: '#8a2be2'
        }
    };
    
    return info[mode] || info.easy;
}

console.log('Words.js cargado correctamente ✅');