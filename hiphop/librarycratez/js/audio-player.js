class AudioPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.watermarkAudio = new Audio();
        this.currentBeat = null;
        this.currentIndex = -1;
        this.isPlaying = false;
        this.watermarkInterval = null;
        this.fadeInterval = null;
        this.watermarkTimeoutStart = null;
        this.watermarkTimeoutDuration = null;
        this.pausedTime = null;
        this.watermarkPausedTime = null;
        this.fadeOutStarted = false;
        
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
        this.progressSlider.addEventListener('input', () => this.seek());
        this.volumeSlider.addEventListener('input', () => this.setVolume());

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });

        this.audio.addEventListener('timeupdate', () => {
            if (this.audio.duration) {
                const fadeOutStart = this.currentBeat.previewDuration - 3;
                
                if (this.audio.currentTime >= fadeOutStart && !this.fadeOutStarted) {
                    this.fadeOutStarted = true;
                    this.fadeOut(() => {
                        this.audio.pause();
                        this.audio.currentTime = 0;
                        this.isPlaying = false;
                        this.fadeOutStarted = false;
                        this.updatePlayButtons();
                        this.onUpdate();
                    });
                    return;
                }
                
                const progress = (this.audio.currentTime / this.currentBeat.previewDuration) * 100;
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
            if (this.audio.currentTime === 0) {
                this.audio.volume = 0;
                this.fadeIn();
                this.startWatermark();
            }
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButtons();
            this.pauseWatermark();
            this.stopFade();
        });

        this.watermarkAudio.volume = 0.5;
    }

    fadeIn() {
        this.stopFade();
        this.audio.volume = 0;
        let targetVolume = this.volumeSlider.value / 100;
        let currentVolume = 0;
        const fadeStep = targetVolume / 60;
        
        this.fadeInterval = setInterval(() => {
            currentVolume += fadeStep;
            if (currentVolume >= targetVolume) {
                this.audio.volume = targetVolume;
                this.stopFade();
            } else {
                this.audio.volume = currentVolume;
            }
        }, 50);
    }

    fadeOut(callback) {
        this.stopFade();
        let currentVolume = this.audio.volume;
        const fadeStep = currentVolume / 60;
        
        this.fadeInterval = setInterval(() => {
            currentVolume -= fadeStep;
            if (currentVolume <= 0) {
                this.audio.volume = 0;
                this.stopFade();
                if (callback) callback();
            } else {
                this.audio.volume = currentVolume;
            }
        }, 50);
    }

    stopFade() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    loadWatermark() {
        if (this.currentBeat && beatmakersData[this.currentBeat.beatmaker]) {
            const producer = beatmakersData[this.currentBeat.beatmaker];
            this.watermarkAudio.src = producer.watermarkUrl;
        }
    }

    updateModeButton() {
        if (this.modeBtn) {
            this.modeBtn.textContent = translations[window.cratezApp?.currentLang || 'es']['player.preview'];
            this.modeBtn.classList.add('preview-mode');
            this.modeBtn.classList.remove('protected-mode');
            this.modeBtn.style.opacity = '0.6';
            this.modeBtn.style.cursor = 'default';
        }
    }

    updateDuration() {
        if (this.currentBeat && this.audio.duration) {
            this.totalTime.textContent = Formatters.formatTime(this.currentBeat.previewDuration);
        }
    }

    updateProgressBar() {
        if (this.currentBeat && this.audio.duration) {
            const maxTime = this.currentBeat.previewDuration;
            const progress = (this.audio.currentTime / maxTime) * 100;
            this.progressFill.style.width = `${Math.min(progress, 100)}%`;
            this.progressSlider.value = Math.min(progress, 100);
        }
    }

    startWatermark() {
        this.stopWatermark();
        
        const playWatermark = () => {
            if (this.isPlaying) {
                const timeRemaining = this.currentBeat.previewDuration - this.audio.currentTime;
                if (timeRemaining > 5) {
                    this.watermarkAudio.currentTime = 0;
                    this.watermarkAudio.play().catch(console.error);
                }
            }
            
            if (this.isPlaying) {
                const timeRemaining = this.currentBeat.previewDuration - this.audio.currentTime;
                const randomInterval = Math.random() * (10000 - 8000) + 8000;
                
                if (timeRemaining > 5 + (randomInterval / 1000)) {
                    this.watermarkTimeoutStart = Date.now();
                    this.watermarkTimeoutDuration = randomInterval;
                    this.watermarkInterval = setTimeout(playWatermark, randomInterval);
                }
            }
        };
        
        const initialDelay = Math.random() * (10000 - 8000) + 8000;
        const timeRemaining = this.currentBeat.previewDuration;
        
        if (timeRemaining > 5 + (initialDelay / 1000)) {
            this.watermarkTimeoutStart = Date.now();
            this.watermarkTimeoutDuration = initialDelay;
            this.watermarkInterval = setTimeout(playWatermark, initialDelay);
        }
    }

    pauseWatermark() {
        if (this.watermarkAudio && !this.watermarkAudio.paused) {
            this.watermarkPausedTime = this.watermarkAudio.currentTime;
            this.watermarkAudio.pause();
        }
        
        if (this.watermarkInterval) {
            const elapsed = Date.now() - this.watermarkTimeoutStart;
            const remaining = this.watermarkTimeoutDuration - elapsed;
            this.pausedTime = Math.max(0, remaining);
            clearTimeout(this.watermarkInterval);
            this.watermarkInterval = null;
        }
    }

    resumeWatermark() {
        if (this.watermarkPausedTime !== null && this.watermarkPausedTime > 0) {
            this.watermarkAudio.currentTime = this.watermarkPausedTime;
            this.watermarkAudio.play().catch(console.error);
            this.watermarkPausedTime = null;
        }
        
        if (this.pausedTime !== null && this.pausedTime > 0) {
            const playWatermark = () => {
                if (this.isPlaying) {
                    const timeRemaining = this.currentBeat.previewDuration - this.audio.currentTime;
                    if (timeRemaining > 5) {
                        this.watermarkAudio.currentTime = 0;
                        this.watermarkAudio.play().catch(console.error);
                    }
                }
                
                if (this.isPlaying) {
                    const timeRemaining = this.currentBeat.previewDuration - this.audio.currentTime;
                    const randomInterval = Math.random() * (10000 - 8000) + 8000;
                    
                    if (timeRemaining > 5 + (randomInterval / 1000)) {
                        this.watermarkTimeoutStart = Date.now();
                        this.watermarkTimeoutDuration = randomInterval;
                        this.watermarkInterval = setTimeout(playWatermark, randomInterval);
                    }
                }
            };
            
            this.watermarkTimeoutStart = Date.now();
            this.watermarkTimeoutDuration = this.pausedTime;
            this.watermarkInterval = setTimeout(playWatermark, this.pausedTime);
            this.pausedTime = null;
        } else if (this.watermarkPausedTime === null) {
            this.startWatermark();
        }
    }

    stopWatermark() {
        if (this.watermarkInterval) {
            clearTimeout(this.watermarkInterval);
            this.watermarkInterval = null;
        }
        if (this.watermarkAudio && !this.watermarkAudio.paused) {
            this.watermarkAudio.pause();
        }
        this.pausedTime = null;
        this.watermarkPausedTime = null;
        this.watermarkTimeoutStart = null;
        this.watermarkTimeoutDuration = null;
    }

    playBeat(beat, index, filteredBeats, onUpdate) {
        if (this.currentBeat && this.currentBeat.id === beat.id) {
            this.togglePlayPause();
            return;
        }

        this.stopWatermark();
        this.stopFade();
        this.fadeOutStarted = false;

        this.currentBeat = beat;
        this.currentIndex = index;
        this.filteredBeats = filteredBeats;
        this.onUpdate = onUpdate;
        this.audio.src = beat.audioUrl;
        this.loadWatermark();
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
            this.updatePlayButtons();
            this.onUpdate();
        } else {
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButtons();
                this.resumeWatermark();
                this.onUpdate();
            }).catch(console.error);
        }
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
        const maxTime = this.currentBeat ? 
            this.currentBeat.previewDuration : this.audio.duration;
        const seekTime = (this.progressSlider.value / 100) * maxTime;
        this.audio.currentTime = seekTime;
        this.fadeOutStarted = false;
    }

    setVolume() {
        if (!this.fadeInterval) {
            this.audio.volume = this.volumeSlider.value / 100;
        }
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