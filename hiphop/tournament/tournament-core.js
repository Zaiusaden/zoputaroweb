let tournamentState = {
    participants: [],
    currentPhase: 'octavos',
    phases: ['octavos', 'cuartos', 'semifinal', 'final'],
    phaseConfigs: {
        octavos: { rounds: 1, roundTimes: [60], roundModes: ['classic'], roundFormats: ['pause'], roundCompasses: [1] },
        cuartos: { rounds: 1, roundTimes: [60], roundModes: ['classic'], roundFormats: ['pause'], roundCompasses: [1] },
        semifinal: { rounds: 1, roundTimes: [60], roundModes: ['classic'], roundFormats: ['pause'], roundCompasses: [1] },
        final: { rounds: 1, roundTimes: [60], roundModes: ['classic'], roundFormats: ['pause'], roundCompasses: [1] }
    },
    currentMatchups: [],
    currentMatchIndex: 0,
    phaseResults: {},
    tournamentResults: [],
    categories: new Set(),
    isActive: false,
    ranking: [],
    byeParticipants: [],
    phaseByeHistory: {}
};

let tournamentStarted = false;
let currentTournamentMatch = null;
let tournamentUsedBeats = [];

function getRequiredPhases(participantCount) {
    if (participantCount <= 1) return [];
    if (participantCount <= 2) return ['final'];
    if (participantCount <= 4) return ['semifinal', 'final'];
    if (participantCount <= 8) return ['cuartos', 'semifinal', 'final'];
    return ['octavos', 'cuartos', 'semifinal', 'final'];
}

function initTournament() {
    if (tournamentState.participants.length === 0) {
        tournamentState.currentMatchups = [];
        tournamentState.currentMatchIndex = 0;
        tournamentState.phaseResults = {};
        tournamentState.tournamentResults = [];
        tournamentState.isActive = false;
        tournamentState.ranking = [];
        tournamentState.byeParticipants = [];
        tournamentState.phaseByeHistory = {};
        
        if (tournamentState.categories.size === 0) {
            tournamentState.categories = new Set(['boom-bap']);
        }
    }
    
    tournamentStarted = false;
    currentTournamentMatch = null;
    tournamentUsedBeats = [];
    
    if (selectedCategories.size === 0) {
        selectedCategories = new Set(['boom-bap']);
        updateCategoryButtons();
        updateBattleCategoryButtons();
        loadBeats();
    }
}

function updateTournamentPhases() {
    const requiredPhases = getRequiredPhases(tournamentState.participants.length);
    tournamentState.phases = requiredPhases;
    tournamentState.currentPhase = requiredPhases[0] || 'final';
}

function addParticipant(aka) {
    if (!aka || aka.trim().length === 0) return false;
    if (tournamentState.participants.length >= 8) return false;
    if (tournamentState.participants.some(p => p.aka === aka.trim())) return false;
    
    tournamentState.participants.push({
        aka: aka.trim(),
        id: `participant_${Date.now()}_${Math.random()}`,
        wins: 0,
        losses: 0,
        battlesWon: 0,
        battlesLost: 0,
        eliminated: false,
        position: null
    });
    
    updateTournamentPhases();
    return true;
}

function removeParticipant(participantId) {
    tournamentState.participants = tournamentState.participants.filter(p => p.id !== participantId);
    updateTournamentPhases();
}

function startTournament() {
    if (tournamentState.participants.length < 2) return false;
    if (selectedCategories.size === 0) return false;
    
    tournamentState.categories = new Set(selectedCategories);
    tournamentState.isActive = true;
    tournamentStarted = true;
    tournamentUsedBeats = [];
    
    initializeRanking();
    generatePhaseMatchups();
    
    return true;
}

function initializeRanking() {
    tournamentState.ranking = [...tournamentState.participants].map(p => ({ ...p }));
    shuffleArray(tournamentState.ranking);
}

function generatePhaseMatchups() {
    const activeParticipants = tournamentState.ranking.filter(p => !p.eliminated);
    const matchups = [];
    tournamentState.byeParticipants = [];
    
    if (activeParticipants.length % 2 === 1) {
        const byeParticipant = activeParticipants.pop();
        tournamentState.byeParticipants.push(byeParticipant);
    }
    
    for (let i = 0; i < activeParticipants.length; i += 2) {
        matchups.push({
            mc1: activeParticipants[i],
            mc2: activeParticipants[i + 1],
            result: null,
            battleResults: []
        });
    }
    
    tournamentState.currentMatchups = matchups;
    tournamentState.currentMatchIndex = 0;
    
    if (!tournamentState.phaseResults[tournamentState.currentPhase]) {
        tournamentState.phaseResults[tournamentState.currentPhase] = [];
    }
    
    if (tournamentState.byeParticipants.length > 0) {
        tournamentState.phaseByeHistory[tournamentState.currentPhase] = [...tournamentState.byeParticipants];
    }
}

function getCurrentMatch() {
    return tournamentState.currentMatchups[tournamentState.currentMatchIndex];
}

function hasNextMatch() {
    return tournamentState.currentMatchIndex < tournamentState.currentMatchups.length - 1;
}

function advanceToNextMatch() {
    if (hasNextMatch()) {
        tournamentState.currentMatchIndex++;
        return true;
    }
    return false;
}

function finishCurrentMatch(winner, battleResults) {
    const currentMatch = getCurrentMatch();
    if (!currentMatch) return;
    
    currentMatch.result = winner;
    currentMatch.battleResults = battleResults;
    
    tournamentState.phaseResults[tournamentState.currentPhase].push({
        ...currentMatch,
        phase: tournamentState.currentPhase
    });
    
    updateParticipantStats(currentMatch.mc1.id, currentMatch.mc2.id, winner, battleResults);
}

function updateParticipantStats(mc1Id, mc2Id, winner, battleResults) {
    const mc1 = tournamentState.ranking.find(p => p.id === mc1Id);
    const mc2 = tournamentState.ranking.find(p => p.id === mc2Id);
    
    if (winner === 'mc1') {
        mc1.battlesWon++;
        mc2.battlesLost++;
    } else if (winner === 'mc2') {
        mc2.battlesWon++;
        mc1.battlesLost++;
    }
    
    battleResults.forEach(result => {
        if (result.winner === 'mc1') {
            mc1.wins++;
        } else if (result.winner === 'mc2') {
            mc2.wins++;
        }
    });
}

function isPhaseComplete() {
    return tournamentState.currentMatchIndex >= tournamentState.currentMatchups.length - 1 && 
           getCurrentMatch() && getCurrentMatch().result;
}

function advanceToNextPhase() {
    const winners = tournamentState.currentMatchups
        .filter(match => match.result)
        .map(match => {
            if (match.result === 'mc1') return match.mc1;
            if (match.result === 'mc2') return match.mc2;
            return null;
        })
        .filter(winner => winner !== null);
    
    const allAdvancingParticipants = [...winners, ...tournamentState.byeParticipants];
    
    tournamentState.ranking.forEach(p => {
        if (!allAdvancingParticipants.find(w => w.id === p.id)) {
            p.eliminated = true;
        }
    });
    
    const currentPhaseIndex = tournamentState.phases.indexOf(tournamentState.currentPhase);
    if (currentPhaseIndex < tournamentState.phases.length - 1) {
        tournamentState.currentPhase = tournamentState.phases[currentPhaseIndex + 1];
        generatePhaseMatchups();
        return true;
    }
    
    return false;
}

function isTournamentComplete() {
    return tournamentState.currentPhase === 'final' && isPhaseComplete();
}

function getTournamentWinner() {
    if (!isTournamentComplete()) return null;
    
    if (tournamentState.byeParticipants.length > 0) {
        return tournamentState.byeParticipants[0];
    }
    
    const finalMatch = tournamentState.phaseResults.final[0];
    if (!finalMatch) return null;
    
    if (finalMatch.result === 'mc1') return finalMatch.mc1;
    if (finalMatch.result === 'mc2') return finalMatch.mc2;
    return null;
}

function getTournamentStats() {
    const allParticipants = [...tournamentState.ranking];
    const winner = getTournamentWinner();
    
    allParticipants.sort((a, b) => {
        if (a.id === winner?.id) return -1;
        if (b.id === winner?.id) return 1;
        if (a.eliminated && !b.eliminated) return 1;
        if (!a.eliminated && b.eliminated) return -1;
        return b.battlesWon - a.battlesWon;
    });
    
    return {
        winner: winner,
        ranking: allParticipants,
        totalBattles: Object.values(tournamentState.phaseResults).flat().length,
        phases: tournamentState.phases.map(phase => ({
            name: phase,
            matches: tournamentState.phaseResults[phase] || [],
            byes: tournamentState.phaseByeHistory[phase] || []
        }))
    };
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getPhaseDisplayName(phase) {
    const names = {
        'octavos': 'Octavos de Final',
        'cuartos': 'Cuartos de Final', 
        'semifinal': 'Semifinal',
        'final': 'Final'
    };
    return names[phase] || phase;
}

function resetTournament() {
    tournamentStarted = false;
    currentTournamentMatch = null;
    tournamentUsedBeats = [];
    initTournament();
}

function getTournamentAvailableBeats() {
    const filteredBeats = getFilteredBeats();
    if (filteredBeats.length === 0) return [];
    
    const availableBeats = filteredBeats.filter((beat, index) => {
        const globalIndex = beats.indexOf(beat);
        return !tournamentUsedBeats.includes(globalIndex);
    });
    
    return availableBeats;
}

function addTournamentUsedBeat(beatIndex) {
    if (!tournamentUsedBeats.includes(beatIndex)) {
        tournamentUsedBeats.push(beatIndex);
    }
}

function resetTournamentUsedBeats() {
    tournamentUsedBeats = [];
}

console.log('Tournament-core.js cargado correctamente ✅');