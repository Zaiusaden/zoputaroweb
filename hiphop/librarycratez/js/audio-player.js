class AudioPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.watermarkAudio = new Audio();
        this.currentBeat = null;
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isPreviewMode = true;
        this.watermarkInterval = null;
        
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.modeBtn = document.getElementById('modeBtn');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        this.progressFill = document.getElementById('progressFill');
        this.progressSlider = document.getElementById('progressSlider');
        this.volumeSlider = document.getElementById('volumeSlider');
        
        this.setupEvents();
        this.setVolume();
        this.updateModeButton();
    }

    setupEvents() {
        this.playBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.modeBtn.addEventListener('click', () => this.handleModeClick());
        this.progressSlider.addEventListener('input', () => this.seek());
        this.volumeSlider.addEventListener('input', () => this.setVolume());

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });

        this.audio.addEventListener('timeupdate', () => {
            if (this.audio.duration) {
                const maxTime = this.isPreviewMode && this.currentBeat ? 
                    this.currentBeat.previewDuration : this.audio.duration;
                
                if (this.isPreviewMode && this.audio.currentTime >= this.currentBeat.previewDuration) {
                    this.audio.pause();
                    this.audio.currentTime = 0;
                    this.isPlaying = false;
                    this.updatePlayButtons();
                    this.onUpdate();
                    return;
                }
                
                const progress = (this.audio.currentTime / maxTime) * 100;
                this.progressFill.style.width = `${progress}%`;
                this.progressSlider.value = progress;
                this.currentTime.textContent = Formatters.formatTime(this.audio.currentTime);
            }
        });

        this.audio.addEventListener('ended', () => {
            this.nextTrack();
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButtons();
            if (!this.isPreviewMode) {
                this.startWatermark();
            }
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButtons();
            this.stopWatermark();
        });

        this.watermarkAudio.volume = 0.3;
    }

    loadWatermark() {
        if (this.currentBeat && beatmakersData[this.currentBeat.beatmaker]) {
            const producer = beatmakersData[this.currentBeat.beatmaker];
            this.watermarkAudio.src = producer.watermarkUrl;
        }
    }

    canToggleMode() {
        if (!this.currentBeat || !this.currentBeat.availableModes) {
            return true;
        }
        return this.currentBeat.availableModes.length > 1;
    }

    getAvailableModes() {
        if (!this.currentBeat || !this.currentBeat.availableModes) {
            return ['preview', 'full'];
        }
        return this.currentBeat.availableModes;
    }

    setInitialMode() {
        const availableModes = this.getAvailableModes();
        if (availableModes.includes('preview')) {
            this.isPreviewMode = true;
        } else if (availableModes.includes('full')) {
            this.isPreviewMode = false;
        }
    }

    handleModeClick() {
        if (!this.canToggleMode()) {
            this.showModeMessage();
            return;
        }
        this.toggleMode();
    }

    showModeMessage() {
        const availableModes = this.getAvailableModes();
        const currentLang = window.cratezApp?.currentLang || 'es';
        
        let message;
        if (availableModes.includes('preview') && !availableModes.includes('full')) {
            message = currentLang === 'es' ? 'Solo disponible en preview' : 'Only available in preview';
        } else if (availableModes.includes('full') && !availableModes.includes('preview')) {
            message = currentLang === 'es' ? 'Solo disponible versión completa' : 'Only full version available';
        }

        const notification = document.createElement('div');
        notification.className = 'mode-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    toggleMode() {
        if (!this.canToggleMode()) return;
        
        this.isPreviewMode = !this.isPreviewMode;
        this.audio.currentTime = 0;
        this.updateModeButton();
        this.updateDuration();
        this.updateProgressBar();
        
        if (this.isPlaying) {
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButtons();
                this.onUpdate();
            }).catch(console.error);
        }
    }

    updateModeButton() {
        if (this.modeBtn) {
            const availableModes = this.getAvailableModes();
            
            if (availableModes.length === 1) {
                if (availableModes[0] === 'preview') {
                    this.modeBtn.textContent = translations[window.cratezApp?.currentLang || 'es']['player.preview'];
                    this.modeBtn.classList.add('preview-mode');
                    this.modeBtn.classList.remove('protected-mode');
                    this.isPreviewMode = true;
                } else {
                    this.modeBtn.textContent = translations[window.cratezApp?.currentLang || 'es']['player.fullProtected'];
                    this.modeBtn.classList.add('protected-mode');
                    this.modeBtn.classList.remove('preview-mode');
                    this.isPreviewMode = false;
                }
                this.modeBtn.style.opacity = '0.6';
                this.modeBtn.style.cursor = 'default';
            } else {
                this.modeBtn.textContent = this.isPreviewMode ? 
                    translations[window.cratezApp?.currentLang || 'es']['player.preview'] :
                    translations[window.cratezApp?.currentLang || 'es']['player.fullProtected'];
                
                this.modeBtn.classList.toggle('preview-mode', this.isPreviewMode);
                this.modeBtn.classList.toggle('protected-mode', !this.isPreviewMode);
                this.modeBtn.style.opacity = '1';
                this.modeBtn.style.cursor = 'pointer';
            }
        }
    }

    updateDuration() {
        if (this.currentBeat && this.audio.duration) {
            this.totalTime.textContent = this.isPreviewMode ? 
                Formatters.formatTime(this.currentBeat.previewDuration) : 
                Formatters.formatTime(this.audio.duration);
        }
    }

    updateProgressBar() {
        if (this.currentBeat && this.audio.duration) {
            const maxTime = this.isPreviewMode ? 
                this.currentBeat.previewDuration : this.audio.duration;
            const progress = (this.audio.currentTime / maxTime) * 100;
            this.progressFill.style.width = `${Math.min(progress, 100)}%`;
            this.progressSlider.value = Math.min(progress, 100);
        }
    }

    startWatermark() {
        this.stopWatermark();
        this.watermarkInterval = setInterval(() => {
            if (this.isPlaying && !this.isPreviewMode) {
                this.watermarkAudio.currentTime = 0;
                this.watermarkAudio.play().catch(console.error);
            }
        }, 12000);
    }

    stopWatermark() {
        if (this.watermarkInterval) {
            clearInterval(this.watermarkInterval);
            this.watermarkInterval = null;
        }
    }

    playBeat(beat, index, filteredBeats, onUpdate) {
        if (this.currentBeat && this.currentBeat.id === beat.id) {
            this.togglePlayPause();
            return;
        }

        this.currentBeat = beat;
        this.currentIndex = index;
        this.filteredBeats = filteredBeats;
        this.onUpdate = onUpdate;
        this.audio.src = beat.audioUrl;
        this.loadWatermark();
        this.setInitialMode();
        this.updatePlayerInfo();
        this.updateModeButton();
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButtons();
            this.onUpdate();
        }).catch(console.error);
    }

    togglePlayPause() {
        if (!this.currentBeat) return;

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play().then(() => {
                this.isPlaying = true;
            }).catch(console.error);
        }
        
        this.updatePlayButtons();
        this.onUpdate();
    }

    previousTrack() {
        if (this.filteredBeats.length === 0) return;
        const newIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.filteredBeats.length - 1;
        this.playBeat(this.filteredBeats[newIndex], newIndex, this.filteredBeats, this.onUpdate);
    }

    nextTrack() {
        if (this.filteredBeats.length === 0) return;
        const newIndex = this.currentIndex < this.filteredBeats.length - 1 ? this.currentIndex + 1 : 0;
        this.playBeat(this.filteredBeats[newIndex], newIndex, this.filteredBeats, this.onUpdate);
    }

    seek() {
        const maxTime = this.isPreviewMode && this.currentBeat ? 
            this.currentBeat.previewDuration : this.audio.duration;
        const seekTime = (this.progressSlider.value / 100) * maxTime;
        this.audio.currentTime = seekTime;
    }

    setVolume() {
        this.audio.volume = this.volumeSlider.value / 100;
    }

    updatePlayerInfo() {
        if (!this.currentBeat) return;
        this.trackTitle.textContent = this.currentBeat.title;
        this.trackArtist.textContent = this.currentBeat.beatmaker;
        this.updateDuration();
    }

    updatePlayButtons() {
        this.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }
}
