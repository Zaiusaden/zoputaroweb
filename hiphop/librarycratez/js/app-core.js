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
        this.downloadDocBtn = document.getElementById('downloadDocBtn');
        this.copyEmailBtn = document.getElementById('copyEmailBtn');
    }

    initializeEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section && section !== 'mobileFiltersBtn') {
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
        
        if (this.downloadDocBtn) {
            this.downloadDocBtn.addEventListener('click', () => this.downloadDocument());
        }
        
        if (this.copyEmailBtn) {
            this.copyEmailBtn.addEventListener('click', () => this.copyEmail());
        }
    }

    downloadDocument() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("CRATEZ LIBRARY", 20, 20);
        doc.text("Requisitos para Productores", 20, 30);
        
        doc.setDrawColor(0, 153, 255);
        doc.line(20, 35, 190, 35);
        
        let yPos = 50;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACION DEL PRODUCTOR", 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        const producerInfo = [
            "1. NOMBRE DEL PRODUCTOR",
            "   Ejemplo: 'Zaiusaden'",
            "",
            "2. DESCRIPCIÓN BIOGRÁFICA",
            "   • Español: Breve descripción en español (1-2 lineas)",
            "   • Ingles: Breve descripción en inglés (1-2 lineas)",
            "",
            "3. CONTACTO",
            "   • Email: Dirección de contacto profesional",
            "   • Instagram: Usuario completo (ejemplo: @zaiusaden)",
            "   • Spotify: Nombre de artista en Spotify",
            "",
            "4. AVATAR/LOGO",
            "   • Archivo: Imagen cuadrada, 200x200 - 512x512 px",
            "   • Ejemplo: zaiusaden-avatar.png",
            "",
            "5. MARCA DE AGUA (WATERMARK)",
            "   • Archivo: Audio en formato MP3",
            "   • Duración: 3 a 5 segundos máximo",
            "   • Contenido: Nombre o tag personal del productor",
            "   • Calidad minima: 128 kbps",
            "   • Ejemplo: zaiusaden-watermark.mp3",
            "   • Si no tienes marca de agua se pondrá una genérica de la página."
        ];
        
        producerInfo.forEach(line => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 6;
        });
        
        yPos += 10;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACION DE CADA BEAT", 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        const beatInfo = [
            "1. TÍTULO DEL BEAT",
            "   Ejemplos: 'Cosmic Dreams', 'Starlight Meditation'",
            "",
            "2. GÉNERO MUSICAL",
            "   Ejemplos: trap, boom-bap, drill, lo-fi, rap",
            "",
            "3. BPM (Beats Per Minute)",
            "   Ejemplos: 88, 79, 95",
            "",
            "4. DURACIÓN TOTAL",
            "   Formato MM:SS - Ejemplos: '0:30', '0:35', '0:45'",
            "",
            "5. ESTADO DE DISPONIBILIDAD",
            "   • disponible = Beat listo para venta",
            "   • vendido = Beat ya vendido (solo preview)",
            "",
            "6. PRECIO DEL BEAT (STANDAR)",
            "   Ejemplo: 30€",
            "",
            "7. ARCHIVO DE AUDIO COMPLETO",
            "   • Formato MP3",
            "   • Nombre: [productor]-[titulo].mp3",
            "   • Ejemplo: zaiusaden-cosmicdream.mp3",
            "",
            "8. DURACIÓN DEL BEAT",
            "   • Máximo 45 segundos",
            "",
            "9. DURACIÓN QUE QUIERES QUE SALGA EN EL PREVIEW",
            "   Ejemplos: 30, 35, 40, 45 segundos"
        ];
        
        beatInfo.forEach(line => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 6;
        });
        
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PRECIOS", 20, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Los primeros 5 beats son totalmente GRATUITOS.", 20, yPos);
        yPos += 10;
        doc.text("A partir del 6º beat:", 20, yPos);
        yPos += 10;
        doc.text("• 1 beat adicional → 3€", 20, yPos);
        yPos += 8;
        doc.text("• Pack de 5 beats → 12€ (ahorras 3€)", 20, yPos);
        yPos += 15;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("CONTACTO", 20, yPos);
        yPos += 15;
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Envia tus beats a: zoputaro@hotmail.com", 20, yPos);
        
        doc.save('CRATEZ_LIBRARY_REQUISITOS.pdf');
    }

    copyEmail() {
        const email = 'zoputaro@hotmail.com';
        navigator.clipboard.writeText(email).then(() => {
            const originalText = this.copyEmailBtn.textContent;
            this.copyEmailBtn.textContent = translations[this.currentLang]['info.contact.copied'];
            this.copyEmailBtn.style.background = 'var(--accent-color)';
            
            setTimeout(() => {
                this.copyEmailBtn.textContent = originalText;
                this.copyEmailBtn.style.background = '';
            }, 2000);
        }).catch(() => {
            console.log('No se pudo copiar el email');
        });
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

        window.scrollTo(0, 0);

        this.updateProducerFilterVisibility();
        this.audioPlayer.updatePlayerInfo();
        this.updatePlayButtons();
    }

    updateProducerFilterVisibility() {
        if (this.currentView === 'producerDetail') {
            this.producerFilter.style.display = 'none';
            const mobileProducerGroup = this.mobileProducerFilter.closest('.mobile-filter-group');
            if (mobileProducerGroup) mobileProducerGroup.style.display = 'none';
        } else {
            this.producerFilter.style.display = 'block';
            const mobileProducerGroup = this.mobileProducerFilter.closest('.mobile-filter-group');
            if (mobileProducerGroup) mobileProducerGroup.style.display = 'block';
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

    updatePlayButtons() {
        const playText = translations[this.currentLang]['beat.play'];
        const pauseText = translations[this.currentLang]['beat.pause'];
        
        document.querySelectorAll('.beat-card').forEach(card => {
            const beatId = parseInt(card.dataset.beatId);
            const isCurrentBeat = this.audioPlayer.currentBeat?.id === beatId;
            const isPlaying = isCurrentBeat && this.audioPlayer.isPlaying;
            card.classList.toggle('playing', isPlaying);
        });
        
        document.querySelectorAll('.producer-beat-card').forEach(card => {
            const beatBtn = card.querySelector('.producer-beat-play');
            if (beatBtn) {
                const beatId = parseInt(beatBtn.dataset.beatId);
                const isCurrentBeat = this.audioPlayer.currentBeat?.id === beatId;
                const isPlaying = isCurrentBeat && this.audioPlayer.isPlaying;
                card.classList.toggle('playing', isPlaying);
            }
        });
        
        document.querySelectorAll('.beat-play, .producer-beat-play').forEach(btn => {
            const beatId = parseInt(btn.dataset.beatId);
            const isCurrentBeat = this.audioPlayer.currentBeat?.id === beatId;
            const isPlaying = isCurrentBeat && this.audioPlayer.isPlaying;
            
            btn.textContent = isPlaying ? '⏸ ' + pauseText : '▶ ' + playText;
            btn.classList.toggle('playing', isPlaying);
        });
    }

    getFilteredBeats(beats) {
        const genre = this.genreFilter.value;
        const bpmMinValue = parseInt(this.bpmMin.value) || 0;
        const bpmMaxValue = parseInt(this.bpmMax.value) || 999;
        const producer = this.currentView === 'producerDetail' ? '' : this.producerFilter.value;
        
        return beats.filter(beat => {
            const matchesGenre = !genre || beat.genres.includes(genre);
            const matchesProducer = !producer || beat.beatmaker === producer;
            const matchesBpm = beat.bpm >= bpmMinValue && beat.bpm <= bpmMaxValue;
            
            return matchesGenre && matchesProducer && matchesBpm;
        });
    }

    renderBeatsGrid(container, beats) {
        const playText = translations[this.currentLang]['beat.play'];
        const pauseText = translations[this.currentLang]['beat.pause'];
        const availableText = translations[this.currentLang]['beat.available'];
        const soldText = translations[this.currentLang]['beat.sold'];
        const priceText = translations[this.currentLang]['beat.price'];
        
        container.innerHTML = beats.map(beat => {
            const isCurrentBeat = this.audioPlayer.currentBeat?.id === beat.id;
            const isPlaying = isCurrentBeat && this.audioPlayer.isPlaying;
            
            return `
                <div class="beat-card ${isPlaying ? 'playing' : ''}" data-beat-id="${beat.id}">
                    <div class="beat-header">
                        <div class="beat-title">${beat.title}</div>
                        <div class="beat-status ${beat.status}">${beat.status === 'disponible' ? availableText : soldText}</div>
                        <div class="beat-price">${priceText}: ${beat.price}€</div>
                    </div>
                    <div class="beat-info">
                        <div class="beat-producer" data-producer="${beat.beatmaker}">${beat.beatmaker}</div>
                        <div class="beat-details">
                            <div class="beat-genres">${beat.genres.map(genre => `<span class="beat-genre">${genre}</span>`).join('')}</div>
                            <div class="beat-meta">
                                <span class="beat-bpm">${beat.bpm} BPM</span>
                                <span class="beat-duration">${beat.duration}</span>
                            </div>
                        </div>
                    </div>
                    <button class="beat-play ${isPlaying ? 'playing' : ''}" data-beat-id="${beat.id}">
                        ${isPlaying ? '⏸ ' + pauseText : '▶ ' + playText}
                    </button>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.beat-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beatId = parseInt(e.target.dataset.beatId);
                const beat = beats.find(b => b.id === beatId);
                const index = beats.indexOf(beat);
                this.audioPlayer.playBeat(beat, index, beats, () => this.updatePlayButtons());
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
        const allProducerBeats = beatsData.filter(beat => beat.beatmaker === producerName);
        const producerBeats = this.getFilteredBeats(allProducerBeats);
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
                    ${producerBeats.map(beat => {
                        const isCurrentBeat = this.audioPlayer.currentBeat?.id === beat.id;
                        const isPlaying = isCurrentBeat && this.audioPlayer.isPlaying;
                        
                        return `
                            <div class="producer-beat-card ${isPlaying ? 'playing' : ''}">
                                <div class="producer-beat-header">
                                    <div class="producer-beat-title">${beat.title}</div>
                                    <div class="beat-status ${beat.status}">${beat.status === 'disponible' ? availableText : soldText}</div>
                                    <div class="beat-price">${priceText}: ${beat.price}€</div>
                                </div>
                                <div class="producer-beat-details">
                                    <div class="beat-genres">${beat.genres.map(genre => `<span class="beat-genre">${genre}</span>`).join('')}</div>
                                    <div class="beat-meta">
                                        <span class="beat-bpm">${beat.bpm} BPM</span>
                                        <span class="beat-duration">${beat.duration}</span>
                                    </div>
                                </div>
                                <button class="producer-beat-play ${isPlaying ? 'playing' : ''}" data-beat-id="${beat.id}">
                                    ${isPlaying ? '⏸ ' + pauseText : '▶ ' + playText}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        this.producerDetail.querySelectorAll('.producer-beat-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beatId = parseInt(e.target.dataset.beatId);
                const beat = producerBeats.find(b => b.id === beatId);
                const index = producerBeats.indexOf(beat);
                this.audioPlayer.playBeat(beat, index, producerBeats, () => this.updatePlayButtons());
            });
        });
        
        this.navigateToView('producerDetail', producer.name);
        this.updateLanguage();
    }

    applyFilters() {
        this.filteredBeats = this.getFilteredBeats(beatsData);
        
        if (this.currentView === 'home') {
            this.renderBeatsGrid(this.homeBeatsGrid, this.filteredBeats);
        } else if (this.currentView === 'producerDetail') {
            const producerName = this.breadcrumbContent.dataset.producer;
            if (producerName) {
                this.showProducerDetail(producerName);
            }
        }
    }

    clearAllFilters() {
        this.genreFilter.value = '';
        this.bpmMin.value = '';
        this.bpmMax.value = '';
        this.producerFilter.value = '';
        this.filteredBeats = [...beatsData];
        
        if (this.currentView === 'home') {
            this.renderBeatsGrid(this.homeBeatsGrid, this.filteredBeats);
        } else if (this.currentView === 'producerDetail') {
            const producerName = this.breadcrumbContent.dataset.producer;
            if (producerName) {
                this.showProducerDetail(producerName);
            }
        }
    }
}
