class CratezUnderground {
    constructor() {
        this.currentView = 'home';
        this.navigationHistory = [];
        this.filteredBeats = [...beatsData];
        this.currentPalette = AppConfig.defaultPalette;
        this.currentLang = AppConfig.defaultLanguage;
        
        this.audioPlayer = new AudioPlayer();
        window.cratezApp = this;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.populateFilters();
        this.renderProducersList();
        this.renderAllViews();
        this.updateLanguage();
        this.applyInitialPalette();
    }

    applyInitialPalette() {
        document.documentElement.setAttribute('data-palette', this.currentPalette);
    }

    initializeElements() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.views = document.querySelectorAll('.view');
        this.backBtn = document.getElementById('backBtn');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.breadcrumbContent = document.getElementById('breadcrumbContent');

        this.genreFilter = document.getElementById('genreFilter');
        this.bpmMin = document.getElementById('bpmMin');
        this.bpmMax = document.getElementById('bpmMax');
        this.producerFilter = document.getElementById('producerFilter');
        this.clearFilters = document.getElementById('clearFilters');
        
        this.mobileGenreFilter = document.getElementById('mobileGenreFilter');
        this.mobileBpmMin = document.getElementById('mobileBpmMin');
        this.mobileBpmMax = document.getElementById('mobileBpmMax');
        this.mobileProducerFilter = document.getElementById('mobileProducerFilter');
        this.mobileClearFilters = document.getElementById('mobileClearFilters');
        this.mobileApplyFilters = document.getElementById('mobileApplyFilters');
        this.mobileFiltersBtn = document.getElementById('mobileFiltersBtn');
        this.mobileFiltersModal = document.getElementById('mobileFiltersModal');
        this.mobileFiltersClose = document.getElementById('mobileFiltersClose');
        
        this.homeBeatsGrid = document.getElementById('homeBeatsGrid');
        this.producersGrid = document.getElementById('producersGrid');
        this.producerDetail = document.getElementById('producerDetail');
        this.producersList = document.getElementById('producersList');
        
        this.paletteBtn = document.getElementById('paletteBtn');
        this.langBtn = document.getElementById('langBtn');
    }

    initializeEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.navigateToView(section);
                }
            });
        });
        
        this.backBtn.addEventListener('click', () => this.goBack());
        
        this.genreFilter.addEventListener('change', () => this.applyFilters());
        this.bpmMin.addEventListener('input', () => this.applyFilters());
        this.bpmMax.addEventListener('input', () => this.applyFilters());
        this.producerFilter.addEventListener('change', () => this.applyFilters());
        this.clearFilters.addEventListener('click', () => this.clearAllFilters());
        
        this.mobileFiltersBtn.addEventListener('click', () => this.openMobileFilters());
        this.mobileFiltersClose.addEventListener('click', () => this.closeMobileFilters());
        this.mobileFiltersModal.addEventListener('click', (e) => {
            if (e.target === this.mobileFiltersModal) {
                this.closeMobileFilters();
            }
        });
        this.mobileApplyFilters.addEventListener('click', () => this.applyMobileFilters());
        this.mobileClearFilters.addEventListener('click', () => this.clearMobileFilters());
        
        this.paletteBtn.addEventListener('click', () => this.changePalette());
        this.langBtn.addEventListener('click', () => this.toggleLanguage());
    }

    openMobileFilters() {
        this.syncFiltersToMobile();
        this.mobileFiltersModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileFilters() {
        this.mobileFiltersModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    syncFiltersToMobile() {
        this.mobileGenreFilter.value = this.genreFilter.value;
        this.mobileProducerFilter.value = this.producerFilter.value;
        this.mobileBpmMin.value = this.bpmMin.value;
        this.mobileBpmMax.value = this.bpmMax.value;
    }

    syncFiltersFromMobile() {
        this.genreFilter.value = this.mobileGenreFilter.value;
        this.producerFilter.value = this.mobileProducerFilter.value;
        this.bpmMin.value = this.mobileBpmMin.value;
        this.bpmMax.value = this.mobileBpmMax.value;
    }

    applyMobileFilters() {
        this.syncFiltersFromMobile();
        this.applyFilters();
        this.closeMobileFilters();
    }

    clearMobileFilters() {
        this.mobileGenreFilter.value = '';
        this.mobileProducerFilter.value = '';
        this.mobileBpmMin.value = '';
        this.mobileBpmMax.value = '';
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'es' ? 'en' : 'es';
        this.langBtn.textContent = this.currentLang.toUpperCase();
        this.updateLanguage();
        this.updateBreadcrumb();
        this.renderAllViews();
        this.audioPlayer.updateModeButton();
    }

    updateLanguage() {
        DOMHelpers.updateLanguageElements(this.currentLang);
    }

    updateBreadcrumb() {
        if (this.currentView === 'producerDetail' && this.breadcrumbContent.dataset.producer) {
            const producerName = this.breadcrumbContent.dataset.producer;
            this.breadcrumbContent.innerHTML = `<span data-lang="nav.producers">${translations[this.currentLang]['nav.producers']}</span> > ${producerName}`;
        }
    }

    navigateToView(viewName, producerName = '') {
        if (viewName !== this.currentView && producerName) {
            this.navigationHistory.push({
                view: this.currentView,
                producer: this.breadcrumbContent.dataset.producer || ''
            });
        }
        
        this.navItems.forEach(item => item.classList.remove('active'));
        this.views.forEach(view => view.classList.remove('active'));
        
        const targetNav = document.querySelector(`[data-section="${viewName}"]`);
        if (targetNav) targetNav.classList.add('active');
        
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) targetView.classList.add('active');
        
        this.currentView = viewName;
        
        if (producerName) {
            this.breadcrumbContent.dataset.producer = producerName;
            this.breadcrumbContent.innerHTML = `<span data-lang="nav.producers">${translations[this.currentLang]['nav.producers']}</span> > ${producerName}`;
            this.breadcrumb.style.display = 'flex';
        } else {
            this.breadcrumb.style.display = 'none';
            this.breadcrumbContent.dataset.producer = '';
        }
    }

    goBack() {
        if (this.navigationHistory.length > 0) {
            const previous = this.navigationHistory.pop();
            this.navigateToView(previous.view, previous.producer);
            
            if (this.navigationHistory.length === 0) {
                this.breadcrumb.style.display = 'none';
            }
        }
    }

    changePalette() {
        const currentIndex = AppConfig.palettes.indexOf(this.currentPalette);
        const nextIndex = (currentIndex + 1) % AppConfig.palettes.length;
        this.currentPalette = AppConfig.palettes[nextIndex];
        
        if (this.currentPalette === 'default') {
            document.documentElement.removeAttribute('data-palette');
        } else {
            document.documentElement.setAttribute('data-palette', this.currentPalette);
        }
    }

    populateFilters() {
        const producers = [...new Set(beatsData.map(beat => beat.beatmaker))];
        DOMHelpers.populateFilterOptions(this.producerFilter, producers);
        DOMHelpers.populateFilterOptions(this.mobileProducerFilter, producers);
    }

    renderProducersList() {
        this.producersList.innerHTML = Object.values(beatmakersData).map(producer => `
            <div class="producer-item" data-producer="${producer.name}">
                ${DOMHelpers.renderAvatar(producer, 'producer-avatar')}
                <div class="producer-info">
                    <div class="producer-name">${producer.name}</div>
                </div>
            </div>
        `).join('');
        
        this.producersList.querySelectorAll('.producer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const producer = e.currentTarget.dataset.producer;
                this.showProducerDetail(producer);
            });
        });
    }

    renderAllViews() {
        this.renderBeatsGrid(this.homeBeatsGrid, this.filteredBeats);
        this.renderProducersGrid();
    }

    renderBeatsGrid(container, beats) {
        const playText = translations[this.currentLang]['beat.play'];
        const pauseText = translations[this.currentLang]['beat.pause'];
        const availableText = translations[this.currentLang]['beat.available'];
        const soldText = translations[this.currentLang]['beat.sold'];
        const priceText = translations[this.currentLang]['beat.price'];
        
        container.innerHTML = beats.map(beat => `
            <div class="beat-card" data-beat-id="${beat.id}">
                <div class="beat-header">
                    <div class="beat-title">${beat.title}</div>
                    <div class="beat-status ${beat.status}">${beat.status === 'disponible' ? availableText : soldText}</div>
                    <div class="beat-price">${priceText}: ${beat.price}€</div>
                </div>
                <div class="beat-info">
                    <div class="beat-producer" data-producer="${beat.beatmaker}">${beat.beatmaker}</div>
                    <div class="beat-details">
                        <span class="beat-genre">${beat.genre}</span>
                        <span>${beat.bpm} BPM</span>
                        <span>${beat.duration}</span>
                    </div>
                </div>
                <button class="beat-play ${this.audioPlayer.currentBeat?.id === beat.id && this.audioPlayer.isPlaying ? 'playing' : ''}" data-beat-id="${beat.id}">
                    ${this.audioPlayer.currentBeat?.id === beat.id && this.audioPlayer.isPlaying ? '⏸ ' + pauseText : '▶ ' + playText}
                </button>
            </div>
        `).join('');
        
        container.querySelectorAll('.beat-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beatId = parseInt(e.target.dataset.beatId);
                const beat = beats.find(b => b.id === beatId);
                const index = beats.indexOf(beat);
                this.audioPlayer.playBeat(beat, index, beats, () => this.renderAllViews());
            });
        });
        
        container.querySelectorAll('.beat-producer').forEach(producer => {
            producer.addEventListener('click', (e) => {
                const producerName = e.target.dataset.producer;
                this.showProducerDetail(producerName);
            });
        });
    }

    renderProducersGrid() {
        const enterStudioText = translations[this.currentLang]['producer.enterStudio'];
        
        this.producersGrid.innerHTML = Object.values(beatmakersData).map(producer => `
            <div class="producer-card" data-producer="${producer.name}">
                <div class="producer-header">
                    ${DOMHelpers.renderAvatar(producer, 'producer-avatar-large')}
                    <div class="producer-meta">
                        <h3>${producer.name}</h3>
                    </div>
                </div>
                <div class="producer-description">${producer.description[this.currentLang]}</div>
                <button class="enter-studio" data-producer="${producer.name}">${enterStudioText}</button>
            </div>
        `).join('');
        
        this.producersGrid.querySelectorAll('.enter-studio').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const producer = e.target.dataset.producer;
                this.showProducerDetail(producer);
            });
        });
    }

    showProducerDetail(producerName) {
        const producer = beatmakersData[producerName];
        const producerBeats = beatsData.filter(beat => beat.beatmaker === producerName);
        const beatsBy = translations[this.currentLang]['producer.beatsBy'];
        const contactText = translations[this.currentLang]['producer.contact'];
        const playText = translations[this.currentLang]['beat.play'];
        const pauseText = translations[this.currentLang]['beat.pause'];
        const availableText = translations[this.currentLang]['beat.available'];
        const soldText = translations[this.currentLang]['beat.sold'];
        const priceText = translations[this.currentLang]['beat.price'];
        
        this.producerDetail.innerHTML = `
            <div class="producer-detail-header">
                ${DOMHelpers.renderAvatar(producer, 'producer-avatar-xl')}
                <div class="producer-detail-info">
                    <h2>${producer.name}</h2>
                    <div class="producer-detail-description">${producer.description[this.currentLang]}</div>
                </div>
            </div>
            
            <div class="producer-links">
                <a href="https://instagram.com/${producer.instagram.replace('@', '')}" target="_blank" class="social-link">
                    📷 Instagram
                </a>
                <a href="https://open.spotify.com/search/${encodeURIComponent(producer.spotify)}" target="_blank" class="social-link">
                    🎵 Spotify
                </a>
                <div class="contact-info">
                    📧 ${producer.email}
                </div>
            </div>
            
            <div class="producer-beats-section">
                <h3><span data-lang="producer.beatsBy">${beatsBy}</span> ${producer.name}</h3>
                <div class="producer-beats-grid">
                    ${producerBeats.map(beat => `
                        <div class="producer-beat-card">
                            <div class="producer-beat-header">
                                <div class="producer-beat-title">${beat.title}</div>
                                <div class="beat-status ${beat.status}">${beat.status === 'disponible' ? availableText : soldText}</div>
                                <div class="beat-price">${priceText}: ${beat.price}€</div>
                            </div>
                            <div class="producer-beat-details">
                                <span>${beat.genre}</span>
                                <span>${beat.bpm} BPM</span>
                                <span>${beat.duration}</span>
                            </div>
                            <button class="producer-beat-play" data-beat-id="${beat.id}">
                                ${this.audioPlayer.currentBeat?.id === beat.id && this.audioPlayer.isPlaying ? '⏸ ' + pauseText : '▶ ' + playText}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.producerDetail.querySelectorAll('.producer-beat-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beatId = parseInt(e.target.dataset.beatId);
                const beat = beatsData.find(b => b.id === beatId);
                this.audioPlayer.playBeat(beat, beatsData.indexOf(beat), beatsData, () => this.renderAllViews());
            });
        });
        
        this.navigateToView('producerDetail', producer.name);
        this.updateLanguage();
    }

    applyFilters() {
        const genre = this.genreFilter.value;
        const bpmMinValue = parseInt(this.bpmMin.value) || 0;
        const bpmMaxValue = parseInt(this.bpmMax.value) || 999;
        const producer = this.producerFilter.value;
        
        this.filteredBeats = beatsData.filter(beat => {
            const matchesGenre = !genre || beat.genre === genre;
            const matchesProducer = !producer || beat.beatmaker === producer;
            const matchesBpm = beat.bpm >= bpmMinValue && beat.bpm <= bpmMaxValue;
            
            return matchesGenre && matchesProducer && matchesBpm;
        });
        
        this.renderBeatsGrid(this.homeBeatsGrid, this.filteredBeats);
    }

    clearAllFilters() {
        this.genreFilter.value = '';
        this.bpmMin.value = '';
        this.bpmMax.value = '';
        this.producerFilter.value = '';
        this.filteredBeats = [...beatsData];
        this.renderBeatsGrid(this.homeBeatsGrid, this.filteredBeats);
    }
}
