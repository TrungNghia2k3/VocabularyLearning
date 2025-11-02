// Vocabulary Learning App JavaScript
class VocabularyApp {
    constructor() {
        this.vocabulary = [];
        this.currentIndex = 0;
        this.learnedWords = new Set();
        this.currentMode = '';
        this.quizScore = 0;
        this.quizTotal = 0;
        this.quizCurrentQuestion = 0;
        this.currentQuizData = [];
        this.isFlashcardFlipped = false;
        
        // Speech Synthesis setup
        this.speechSynth = window.speechSynthesis;
        this.currentVoice = null;
        this.availableVoices = {};
        this.selectedAccent = 'en-GB'; // Default to British English
        this.isInitialized = false;
        
        // Search debounce timer
        this.searchDebounceTimer = null;
        
        // Practice mode current word index
        this.currentPracticeIndex = 0;
        this.recentPracticeWords = new Set(); // Track recent words to avoid repetition
        
        // Synonym & Antonym Quiz mode
        this.synAntQuizScore = 0;
        this.synAntQuizTotal = 0;
        this.synAntQuizCurrentQuestion = 0;
        this.currentSynAntQuizData = [];
        
        // Today's Words mode (last 10 words)
        this.todayWordsIndex = 0;
        this.todayWordsKnown = 0;
        this.todayWordsUnknown = 0;
        this.todayWordsList = [];
        
        // Today's Words Practice Mode
        this.todayWordsPracticeQuestions = [];
        this.todayWordsPracticeIndex = 0;
        this.todayWordsPracticeScore = 0;
        this.todayWordsPracticeCorrect = 0;
        this.todayWordsPracticeWrong = 0;
        
        // Today's Words Writing Mode
        this.todayWordsWritingIndex = 0;
        this.todayWordsWritingList = [];
        this.todayWordsWritingAnswers = [];
        this.todayWordsWritingCorrect = 0;
        this.todayWordsWritingWrong = 0;
        this.todayWordsWritingHintUsed = false;
        
        // Special Practice Modes Data
        this.prepositions = [];
        this.phrasalVerbs = [];
        this.idioms = [];
        this.collocations = [];
        
        // Filtered data for search
        this.filteredPhrasalVerbs = [];
        this.filteredIdioms = [];
        this.filteredCollocations = [];
        
        // Phrasal Verbs Practice Mode
        this.phrasalVerbsQuizScore = 0;
        this.phrasalVerbsQuizTotal = 0;
        this.phrasalVerbsCurrentQuestion = 0;
        this.currentPhrasalVerbsQuizData = [];
        this.phrasalVerbsPracticeMode = false;
        
        // Idioms Practice Mode
        this.idiomsQuizScore = 0;
        this.idiomsQuizTotal = 0;
        this.idiomsCurrentQuestion = 0;
        this.currentIdiomsQuizData = [];
        this.idiomsPracticeMode = false;
        
        // Collocations Practice Mode
        this.collocationsQuizScore = 0;
        this.collocationsQuizTotal = 0;
        this.collocationsCurrentQuestion = 0;
        this.currentCollocationsQuizData = [];
        this.collocationsPracticeMode = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadVocabulary();
            this.initializeSpeech();
            this.setupEventListeners();
            this.updateStatistics();
            this.loadProgress();
        } catch (error) {
            console.error('Lỗi khởi tạo ứng dụng:', error);
            this.showError('Không thể tải dữ liệu từ vựng. Vui lòng kiểm tra file vocabulary.json');
        }
    }

    initializeSpeech() {
        // Check if speech synthesis is supported
        if (!this.speechSynth) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Wait for voices to be loaded
        const loadVoices = () => {
            const voices = this.speechSynth.getVoices();
            
            // Organize voices by accent
            this.availableVoices = {
                'en-US': [], // American
                'en-GB': [], // British 
            };

            voices.forEach(voice => {
                if (voice.lang.startsWith('en-US')) {
                    this.availableVoices['en-US'].push(voice);
                } else if (voice.lang.startsWith('en-GB')) {
                    this.availableVoices['en-GB'].push(voice);
                }
            });

            // Set default voice
            this.updateVoiceFromAccent();
            this.isInitialized = true;
            
            console.log('Speech initialized with available voices:', this.availableVoices);
            console.log('Current voice:', this.currentVoice?.name);
        };

        if (this.speechSynth.getVoices().length > 0) {
            loadVoices();
        } else {
            this.speechSynth.addEventListener('voiceschanged', loadVoices);
        }
    }

    updateVoiceFromAccent() {
        const accentVoices = this.availableVoices[this.selectedAccent] || [];
        
        // Priority order for voice selection
        const voicePriorities = ['Google', 'Microsoft', 'Apple', 'eSpeak'];
        
        this.currentVoice = null;
        
        // Try to find voice by priority
        for (const priority of voicePriorities) {
            this.currentVoice = accentVoices.find(voice => 
                voice.name.includes(priority)
            );
            if (this.currentVoice) break;
        }
        
        // Fallback to first available voice for the accent
        if (!this.currentVoice && accentVoices.length > 0) {
            this.currentVoice = accentVoices[0];
        }
        
        // Ultimate fallback to any English voice
        if (!this.currentVoice) {
            const allVoices = this.speechSynth.getVoices();
            this.currentVoice = allVoices.find(voice => voice.lang.startsWith('en-')) || allVoices[0];
        }
        
        console.log(`Updated voice for ${this.selectedAccent}:`, this.currentVoice?.name);
    }

    changeAccent(accent) {
        this.selectedAccent = accent;
        this.updateVoiceFromAccent();
        
        // Save preference
        localStorage.setItem('preferredAccent', accent);
        
        // Update phonetic display if in flashcard mode
        if (this.currentMode === 'flashcard') {
            const phoneticElement = document.getElementById('phoneticText');
            if (phoneticElement && this.vocabulary[this.currentIndex]) {
                phoneticElement.textContent = this.getPhonetic(this.vocabulary[this.currentIndex].word);
            }
        }
        
        // Update phonetic display in browse mode
        if (this.currentMode === 'browse') {
            this.displayVocabularyList();
        }
        
        // Show feedback
        const accentNames = {
            'en-US': 'Tiếng Anh Mỹ 🇺🇸',
            'en-GB': 'Tiếng Anh Anh 🇬🇧'
        };
        
        this.showInfo(`Đã chuyển sang ${accentNames[accent]}`);
    }

    // Speech Methods
    pronounceWord(word = null) {
        if (!this.isInitialized || !this.speechSynth) {
            this.showWarning('Tính năng phát âm không khả dụng');
            return;
        }

        const textToSpeak = word || this.vocabulary[this.currentIndex]?.word;
        if (!textToSpeak) return;

        // Stop any current speech
        this.speechSynth.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.voice = this.currentVoice;
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.9;

        // Visual feedback
        const pronounceBtn = document.getElementById('pronounceBtn');
        if (pronounceBtn) {
            pronounceBtn.classList.add('speaking');
            utterance.onend = () => {
                pronounceBtn.classList.remove('speaking');
            };
        }

        this.speechSynth.speak(utterance);
    }

    pronounceExample() {
        if (!this.isInitialized || !this.speechSynth) {
            this.showWarning('Tính năng phát âm không khả dụng');
            return;
        }

        const example = this.vocabulary[this.currentIndex]?.example;
        if (!example) return;

        this.speechSynth.cancel();

        const utterance = new SpeechSynthesisUtterance(example);
        utterance.voice = this.currentVoice;
        utterance.rate = 0.7;
        utterance.pitch = 1;
        utterance.volume = 0.9;

        this.speechSynth.speak(utterance);
    }

    pronounceQuizWord() {
        if (!this.currentQuizData || this.quizCurrentQuestion >= this.currentQuizData.length) return;
        
        const currentWord = this.currentQuizData[this.quizCurrentQuestion].word.word;
        this.pronounceWord(currentWord);
    }

    pronouncePracticeWord() {
        const word = this.vocabulary[this.currentPracticeIndex]?.word;
        this.pronounceWord(word);
    }

    // Get phonetic transcription from vocabulary data
    getPhonetic(word) {
        // Find the word in vocabulary
        const vocabularyWord = this.vocabulary.find(w => w.word.toLowerCase() === word.toLowerCase());
        
        if (vocabularyWord && vocabularyWord.phonetic) {
            // Return phonetic for selected accent
            return vocabularyWord.phonetic[this.selectedAccent] || vocabularyWord.phonetic['en-US'] || `/${word}/`;
        }
        
        // Fallback for words not in vocabulary
        return `/${word}/`;
    }

    async loadVocabulary() {
        try {
            const response = await fetch('vocabulary.json');
            if (!response.ok) {
                throw new Error('Không thể tải file vocabulary.json');
            }
            const data = await response.json();
            this.vocabulary = data.words || [];
            console.log(`Đã tải ${this.vocabulary.length} từ vựng`);
        } catch (error) {
            console.error('Lỗi tải vocabulary:', error);
            // Sử dụng dữ liệu mẫu nếu không tải được file
            this.vocabulary = this.getSampleVocabulary();
        }
    }

    // Load special practice data
    async loadPrepositions() {
        try {
            const response = await fetch('prepositions.json');
            if (!response.ok) {
                throw new Error('Không thể tải file prepositions.json');
            }
            const data = await response.json();
            this.prepositions = data.prepositions || [];
            console.log(`Đã tải ${this.prepositions.length} giới từ`);
            this.displayPrepositions();
        } catch (error) {
            console.error('Lỗi tải prepositions:', error);
            this.prepositions = [];
            this.displayPrepositions();
        }
    }

    async loadPhrasalVerbs() {
        try {
            const response = await fetch('phrasal_verbs.json');
            if (!response.ok) {
                throw new Error('Không thể tải file phrasal_verbs.json');
            }
            const data = await response.json();
            this.phrasalVerbs = data.phrasalVerbs || [];
            this.filteredPhrasalVerbs = [...this.phrasalVerbs];
            
            console.log(`Đã tải ${this.phrasalVerbs.length} cụm động từ`);
            
            // Check for duplicates
            this.checkPhrasalVerbsDuplicates();
            
            this.showPhrasalVerbsBrowse();
        } catch (error) {
            console.error('Lỗi tải phrasal verbs:', error);
            this.phrasalVerbs = [];
            this.filteredPhrasalVerbs = [];
            this.displayPhrasalVerbs();
        }
    }

    async loadIdioms() {
        try {
            const response = await fetch('idioms.json');
            if (!response.ok) {
                throw new Error('Không thể tải file idioms.json');
            }
            const data = await response.json();
            this.idioms = data.idioms || [];
            this.filteredIdioms = [...this.idioms];
            
            console.log(`Đã tải ${this.idioms.length} thành ngữ`);
            
            // Check for duplicates
            this.checkIdiomsDuplicates();
            
            this.showIdiomsBrowse();
        } catch (error) {
            console.error('Lỗi tải idioms:', error);
            this.idioms = [];
            this.filteredIdioms = [];
            this.displayIdioms();
        }
    }

    async loadCollocations() {
        try {
            const response = await fetch('collocation.json');
            if (!response.ok) {
                throw new Error('Không thể tải file collocation.json');
            }
            const data = await response.json();
            this.collocations = data || [];
            this.filteredCollocations = [...this.collocations];
            
            console.log(`Đã tải ${this.collocations.length} từ với collocations`);
            
            this.showCollocationsBrowse();
        } catch (error) {
            console.error('Lỗi tải collocations:', error);
            this.collocations = [];
            this.filteredCollocations = [];
            this.displayCollocations();
        }
    }

    getSampleVocabulary() {
        return [
            {
                word: "hello",
                meaning: "xin chào",
                type: "interjection",
                example: "Hello, how are you?",
                level: "basic",
                synonyms: [
                    { word: "hi", meaning: "chào" },
                    { word: "greetings", meaning: "lời chào" },
                    { word: "salutations", meaning: "lời chào hỏi" }
                ],
                antonyms: [
                    { word: "goodbye", meaning: "tạm biệt" },
                    { word: "farewell", meaning: "lời chia tay" }
                ]
            },
            {
                word: "computer",
                meaning: "máy tính",
                type: "noun",
                example: "I use my computer every day.",
                level: "basic",
                synonyms: [
                    { word: "machine", meaning: "máy móc" },
                    { word: "device", meaning: "thiết bị" },
                    { word: "laptop", meaning: "máy tính xách tay" }
                ]
            },
            {
                word: "good",
                meaning: "tốt",
                type: "adjective", 
                example: "This is a good book.",
                level: "basic",
                synonyms: [
                    { word: "excellent", meaning: "xuất sắc" },
                    { word: "great", meaning: "tuyệt vời" },
                    { word: "wonderful", meaning: "tuyệt diệu" }
                ],
                antonyms: [
                    { word: "bad", meaning: "xấu" },
                    { word: "terrible", meaning: "tệ hại" },
                    { word: "awful", meaning: "kinh khủng" }
                ]
            },
            {
                word: "happy",
                meaning: "hạnh phúc",
                type: "adjective",
                example: "I am happy today.",
                level: "basic",
                synonyms: [
                    { word: "joyful", meaning: "vui vẻ" },
                    { word: "cheerful", meaning: "tươi cười" },
                    { word: "delighted", meaning: "vui mừng" }
                ],
                antonyms: [
                    { word: "sad", meaning: "buồn" },
                    { word: "unhappy", meaning: "không hạnh phúc" },
                    { word: "miserable", meaning: "khổ sở" }
                ]
            },
            {
                word: "big",
                meaning: "to, lớn",
                type: "adjective",
                example: "This is a big house.",
                level: "basic",
                synonyms: [
                    { word: "large", meaning: "rộng lớn" },
                    { word: "huge", meaning: "khổng lồ" },
                    { word: "enormous", meaning: "to lớn" }
                ],
                antonyms: [
                    { word: "small", meaning: "nhỏ" },
                    { word: "tiny", meaning: "tí hon" },
                    { word: "little", meaning: "bé" }
                ]
            }
        ];
    }

    setupEventListeners() {
        // Mode selection buttons
        document.getElementById('flashcardMode').addEventListener('click', () => this.switchMode('flashcard'));
        document.getElementById('quizMode').addEventListener('click', () => this.switchMode('quiz'));
        document.getElementById('synonymAntonymQuizMode').addEventListener('click', () => this.switchMode('synonymAntonymQuiz'));
        document.getElementById('browseMode').addEventListener('click', () => this.switchMode('browse'));
        document.getElementById('practiceMode').addEventListener('click', () => this.switchMode('practice'));
        document.getElementById('todayWordsMode').addEventListener('click', () => this.switchMode('todayWords'));

        // Special practice modes
        document.getElementById('prepositionsMode').addEventListener('click', () => this.switchMode('prepositions'));
        document.getElementById('phrasalVerbsMode').addEventListener('click', () => this.switchMode('phrasalVerbs'));
        document.getElementById('idiomsMode').addEventListener('click', () => this.switchMode('idioms'));
        document.getElementById('collocationsMode').addEventListener('click', () => this.switchMode('collocations'));

        // Flashcard controls
        document.getElementById('prevFlashcard').addEventListener('click', () => this.previousFlashcard());
        document.getElementById('nextFlashcard').addEventListener('click', () => this.nextFlashcard());
        document.getElementById('knownBtn').addEventListener('click', () => this.markAsKnown());
        document.getElementById('unknownBtn').addEventListener('click', () => this.markAsUnknown());

        // Quiz controls
        document.getElementById('submitAnswer').addEventListener('click', () => this.submitQuizAnswer());
        document.getElementById('nextQuestion').addEventListener('click', () => this.nextQuizQuestion());
        document.getElementById('retakeQuiz').addEventListener('click', () => this.startQuiz());
        document.getElementById('quizPronounceBtn').addEventListener('click', () => this.pronounceQuizWord());

        // Synonym & Antonym Quiz controls
        document.getElementById('startSynonymAntonymQuiz').addEventListener('click', () => this.startSynonymAntonymQuiz());
        document.getElementById('submitSynAntAnswer').addEventListener('click', () => this.submitSynAntAnswer());
        document.getElementById('nextSynAntQuestion').addEventListener('click', () => this.nextSynAntQuestion());
        document.getElementById('synAntQuizPronounceBtn').addEventListener('click', () => this.pronounceSynAntWord());

        // Search functionality - Real-time search with debounce
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.debouncedSearch(e.target.value);
        });

        // Clear search when escape is pressed
        document.getElementById('searchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                this.debouncedSearch('');
            }
        });

        // Practice mode
        document.getElementById('checkSpelling').addEventListener('click', () => this.checkSpelling());
        document.getElementById('nextPractice').addEventListener('click', () => this.nextPractice());
        document.getElementById('practicePronounceBtn').addEventListener('click', () => this.pronouncePracticeWord());
        document.getElementById('practiceInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.checkSpelling();
        });

        // Today's Words mode
        document.getElementById('todayWordsNumber').addEventListener('change', () => this.updateTodayWordsCount());
        document.getElementById('todayWordsRangeStart').addEventListener('change', () => this.updateTodayWordsCount());
        document.getElementById('todayWordsRangeEnd').addEventListener('change', () => this.updateTodayWordsCount());
        
        // Toggle between count and range mode
        document.getElementById('selectModeCount').addEventListener('change', () => this.toggleWordsSelectMode());
        document.getElementById('selectModeRange').addEventListener('change', () => this.toggleWordsSelectMode());
        
        document.getElementById('todayWordsLearnBtn').addEventListener('click', () => this.showTodayWordsLearnMode());
        document.getElementById('todayWordsPracticeBtn').addEventListener('click', () => this.showTodayWordsPracticeMode());
        document.getElementById('todayWordsWritingBtn').addEventListener('click', () => this.showTodayWordsWritingMode());
        document.getElementById('startTodayWords').addEventListener('click', () => this.startTodayWords());
        document.getElementById('nextTodayWord').addEventListener('click', () => this.nextTodayWord());
        document.getElementById('todayWordKnownBtn').addEventListener('click', () => this.markTodayWordAsKnown());
        document.getElementById('todayWordUnknownBtn').addEventListener('click', () => this.markTodayWordAsUnknown());
        document.getElementById('todayWordPronounceBtn').addEventListener('click', () => this.pronounceTodayWord());
        
        // Today's Words Practice Mode
        document.getElementById('todayWordsPracticeStartBtn').addEventListener('click', () => this.startTodayWordsPractice());
        document.getElementById('todayWordsPracticeNextBtn').addEventListener('click', () => this.nextTodayWordsPracticeQuestion());
        document.getElementById('todayWordsPracticeRestartBtn').addEventListener('click', () => this.restartTodayWordsPractice());

        // Today's Words Writing Mode
        document.getElementById('todayWordsWritingStartBtn').addEventListener('click', () => this.startTodayWordsWriting());
        document.getElementById('todayWordsWritingSubmitBtn').addEventListener('click', () => this.submitTodayWordsWriting());
        document.getElementById('todayWordsWritingSkipBtn').addEventListener('click', () => this.skipTodayWordsWriting());
        document.getElementById('todayWordsWritingNextBtn').addEventListener('click', () => this.nextTodayWordsWriting());
        document.getElementById('todayWordsWritingHintBtn').addEventListener('click', () => this.showTodayWordsWritingHint());
        document.getElementById('todayWordsWritingPronounceBtn').addEventListener('click', () => this.pronounceTodayWordsWriting());
        document.getElementById('todayWordsWritingReviewBtn').addEventListener('click', () => this.reviewTodayWordsWriting());
        document.getElementById('todayWordsWritingRestartBtn').addEventListener('click', () => this.restartTodayWordsWriting());
        document.getElementById('todayWordsWritingNewWordsBtn').addEventListener('click', () => this.newTodayWordsWriting());
        document.getElementById('todayWordsWritingInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitTodayWordsWriting();
        });
        // Today's Words Syn/Ant Quiz
        document.getElementById('todayWordsSynAntQuizBtn').addEventListener('click', () => this.showTodayWordsSynAntQuiz());
        document.getElementById('todayWordsSynAntStartBtn').addEventListener('click', () => this.startTodayWordsSynAntQuiz());

        // Phrasal Verbs Practice Mode
        document.getElementById('phrasalVerbsBrowseBtn').addEventListener('click', () => this.showPhrasalVerbsBrowse());
        document.getElementById('phrasalVerbsPracticeBtn').addEventListener('click', () => this.showPhrasalVerbsPractice());
        document.getElementById('phrasalVerbsStartBtn').addEventListener('click', () => this.startPhrasalVerbsQuiz());
        document.getElementById('phrasalVerbsNextBtn').addEventListener('click', () => this.nextPhrasalVerbsQuestion());
        document.getElementById('phrasalVerbsSearchInput').addEventListener('input', () => this.searchPhrasalVerbs());
        document.getElementById('phrasalVerbsClearSearch').addEventListener('click', () => this.clearPhrasalVerbsSearch());

        // Idioms Practice Mode
        document.getElementById('idiomsBrowseBtn').addEventListener('click', () => this.showIdiomsBrowse());
        document.getElementById('idiomsPracticeBtn').addEventListener('click', () => this.showIdiomsPractice());
        document.getElementById('idiomsStartBtn').addEventListener('click', () => this.startIdiomsQuiz());
        document.getElementById('idiomsNextBtn').addEventListener('click', () => this.nextIdiomsQuestion());
        document.getElementById('idiomsSearchInput').addEventListener('input', () => this.searchIdioms());
        document.getElementById('idiomsClearSearch').addEventListener('click', () => this.clearIdiomsSearch());

        // Collocations Practice Mode
        document.getElementById('collocationsBrowseBtn').addEventListener('click', () => this.showCollocationsBrowse());
        document.getElementById('collocationsPracticeBtn').addEventListener('click', () => this.showCollocationsPractice());
        document.getElementById('collocationsStartBtn').addEventListener('click', () => this.startCollocationsQuiz());
        document.getElementById('collocationsNextBtn').addEventListener('click', () => this.nextCollocationQuestion());
        document.getElementById('collocationsSearchInput').addEventListener('input', () => this.searchCollocations());
        document.getElementById('collocationsClearSearch').addEventListener('click', () => this.clearCollocationsSearch());

        // Accent selector
        document.getElementById('accentSelect').addEventListener('change', (e) => {
            this.changeAccent(e.target.value);
        });
    }

    switchMode(mode) {
        // Hide all areas
        document.getElementById('welcomeScreen').classList.add('d-none');
        document.getElementById('flashcardArea').classList.add('d-none');
        document.getElementById('quizArea').classList.add('d-none');
        document.getElementById('synonymAntonymQuizArea').classList.add('d-none');
        document.getElementById('browseArea').classList.add('d-none');
        document.getElementById('practiceArea').classList.add('d-none');
        document.getElementById('todayWordsArea').classList.add('d-none');
        document.getElementById('prepositionsArea').classList.add('d-none');
        document.getElementById('phrasalVerbsArea').classList.add('d-none');
        document.getElementById('idiomsArea').classList.add('d-none');
        document.getElementById('collocationsArea').classList.add('d-none');

        // Update button states
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            btn.classList.remove('active');
        });

        this.currentMode = mode;

        switch (mode) {
            case 'flashcard':
                document.getElementById('flashcardMode').classList.add('active');
                document.getElementById('flashcardArea').classList.remove('d-none');
                this.startFlashcard();
                break;
            case 'quiz':
                document.getElementById('quizMode').classList.add('active');
                document.getElementById('quizArea').classList.remove('d-none');
                this.startQuiz();
                break;
            case 'synonymAntonymQuiz':
                document.getElementById('synonymAntonymQuizMode').classList.add('active');
                document.getElementById('synonymAntonymQuizArea').classList.remove('d-none');
                // Show start button, don't auto-start
                document.getElementById('synAntQuizContent').style.display = 'none';
                break;
            case 'browse':
                document.getElementById('browseMode').classList.add('active');
                document.getElementById('browseArea').classList.remove('d-none');
                this.displayVocabularyList();
                break;
            case 'practice':
                document.getElementById('practiceMode').classList.add('active');
                document.getElementById('practiceArea').classList.remove('d-none');
                this.startPractice();
                break;
            case 'todayWords':
                document.getElementById('todayWordsMode').classList.add('active');
                document.getElementById('todayWordsArea').classList.remove('d-none');
                this.initTodayWords();
                break;
            case 'prepositions':
                document.getElementById('prepositionsMode').classList.add('active');
                document.getElementById('prepositionsArea').classList.remove('d-none');
                this.loadPrepositions();
                break;
            case 'phrasalVerbs':
                document.getElementById('phrasalVerbsMode').classList.add('active');
                document.getElementById('phrasalVerbsArea').classList.remove('d-none');
                this.loadPhrasalVerbs();
                break;
            case 'idioms':
                document.getElementById('idiomsMode').classList.add('active');
                document.getElementById('idiomsArea').classList.remove('d-none');
                this.loadIdioms();
                break;
            case 'collocations':
                document.getElementById('collocationsMode').classList.add('active');
                document.getElementById('collocationsArea').classList.remove('d-none');
                this.loadCollocations();
                break;
        }
    }

    // Flashcard Mode
    startFlashcard() {
        this.currentIndex = 0;
        this.showFlashcard();
    }

    showFlashcard() {
        if (this.vocabulary.length === 0) return;

        const word = this.vocabulary[this.currentIndex];
        const flashcard = document.getElementById('flashcard');
        const frontDiv = document.querySelector('.flashcard-front');
        const backDiv = document.querySelector('.flashcard-back');
        
        // Reset flip state completely
        this.isFlashcardFlipped = false;
        flashcard.classList.remove('flipped');
        
        // Ensure front is visible and back is hidden
        frontDiv.classList.remove('d-none');
        backDiv.classList.add('d-none');
        
        // Reset flashcard height
        flashcard.style.minHeight = '250px';
        
        // Update content
        document.getElementById('wordText').textContent = word.word;
        document.getElementById('wordType').textContent = word.type || '';
        document.getElementById('phoneticText').textContent = this.getPhonetic(word.word);
        document.getElementById('meaningText').textContent = word.meaning;
        document.getElementById('exampleText').textContent = word.example || '';
        
        // Update extended info on flashcard back with new structure
        const extendedInfoContainer = document.getElementById('flashcardExtendedInfo');
        let extendedHTML = '';
        
        // Show multiple definitions if available
        if (word.definitions && word.definitions.length > 0) {
            extendedHTML += '<div class="mb-3"><h6>Định nghĩa chi tiết:</h6>';
            word.definitions.forEach((def, index) => {
                extendedHTML += `
                    <div class="mb-2 p-2 border-start border-primary border-3 bg-light">
                        <small class="text-muted">[${def.partOfSpeech}]</small>
                        <p class="mb-1 text-muted"><strong>${def.definition}</strong></p>
                        <p class="mb-0 text-muted fst-italic">"${def.example}"</p>
                    </div>
                `;
            });
            extendedHTML += '</div>';
        }
        
        extendedHTML += `
            ${this.renderSynonymsAntonyms(word)}
            ${this.renderWordFamily(word)}
        `;
        
        extendedInfoContainer.innerHTML = extendedHTML;
        
        // Update progress
        document.getElementById('flashcardProgress').textContent = 
            `${this.currentIndex + 1} / ${this.vocabulary.length}`;

        // Show/hide navigation buttons
        document.getElementById('prevFlashcard').disabled = this.currentIndex === 0;
        document.getElementById('nextFlashcard').disabled = this.currentIndex === this.vocabulary.length - 1;
    }

    previousFlashcard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showFlashcard();
        }
    }

    nextFlashcard() {
        if (this.currentIndex < this.vocabulary.length - 1) {
            this.currentIndex++;
            this.showFlashcard();
        }
    }

    markAsKnown() {
        const word = this.vocabulary[this.currentIndex];
        this.learnedWords.add(word.word);
        this.updateStatistics();
        this.saveProgress();
        this.nextFlashcard();
        this.showSuccess('Đã đánh dấu là đã biết!');
    }

    markAsUnknown() {
        const word = this.vocabulary[this.currentIndex];
        this.learnedWords.delete(word.word);
        this.updateStatistics();
        this.saveProgress();
        this.nextFlashcard();
        this.showInfo('Đã đánh dấu cần học lại!');
    }

    // Quiz Mode
    startQuiz() {
        this.quizScore = 0;
        this.quizCurrentQuestion = 0;
        this.quizTotal = Math.min(10, this.vocabulary.length);
        this.currentQuizData = this.generateQuizQuestions();
        this.showQuizQuestion();
    }

    generateQuizQuestions() {
        const shuffled = [...this.vocabulary].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, this.quizTotal).map(word => {
            const options = this.generateQuizOptions(word);
            return {
                word: word,
                question: `Nghĩa của từ "${word.word}" là gì?`,
                options: options,
                correctAnswer: word.meaning
            };
        });
    }

    generateQuizOptions(correctWord) {
        const options = [correctWord.meaning];
        const otherWords = this.vocabulary.filter(w => w.word !== correctWord.word);
        
        while (options.length < 4 && otherWords.length > 0) {
            const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
            if (!options.includes(randomWord.meaning)) {
                options.push(randomWord.meaning);
            }
            otherWords.splice(otherWords.indexOf(randomWord), 1);
        }
        
        return options.sort(() => 0.5 - Math.random());
    }

    showQuizQuestion() {
        if (this.quizCurrentQuestion >= this.currentQuizData.length) {
            this.showQuizResult();
            return;
        }

        console.log('Showing question:', this.quizCurrentQuestion + 1); // Debug log
        
        const questionData = this.currentQuizData[this.quizCurrentQuestion];
        document.getElementById('quizQuestion').textContent = questionData.question;
        
        // Show pronunciation button
        const pronounceBtn = document.getElementById('quizPronounceBtn');
        pronounceBtn.style.display = 'inline-block';
        
        const optionsContainer = document.getElementById('quizOptions');
        optionsContainer.innerHTML = '';
        
        // Clear any previous styling
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.classList.remove('correct', 'incorrect');
        });
        
        questionData.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            optionDiv.innerHTML = `
                <input type="radio" name="quizAnswer" id="option${index}" value="${option}">
                <label for="option${index}">${option}</label>
            `;
            optionsContainer.appendChild(optionDiv);
        });

        // Update progress
        document.getElementById('quizProgress').textContent = 
            `${this.quizCurrentQuestion + 1} / ${this.quizTotal}`;
        document.getElementById('quizScore').textContent = `Điểm: ${this.quizScore}`;
        
        const progress = ((this.quizCurrentQuestion) / this.quizTotal) * 100;
        document.getElementById('quizProgressBar').style.width = `${progress}%`;
        document.getElementById('quizProgressText').textContent = `${Math.round(progress)}%`;

        // Reset buttons
        document.getElementById('submitAnswer').disabled = true;
        document.getElementById('submitAnswer').style.display = 'inline-block';
        document.getElementById('nextQuestion').style.display = 'none';

        // Add event listeners to radio buttons
        document.querySelectorAll('input[name="quizAnswer"]').forEach(radio => {
            radio.disabled = false; // Make sure radios are enabled
            radio.addEventListener('change', () => {
                document.getElementById('submitAnswer').disabled = false;
            });
        });
    }

    submitQuizAnswer() {
        const selectedAnswer = document.querySelector('input[name="quizAnswer"]:checked');
        if (!selectedAnswer) return;

        const questionData = this.currentQuizData[this.quizCurrentQuestion];
        const isCorrect = selectedAnswer.value === questionData.correctAnswer;
        
        if (isCorrect) {
            this.quizScore++;
            selectedAnswer.closest('.quiz-option').classList.add('correct');
        } else {
            selectedAnswer.closest('.quiz-option').classList.add('incorrect');
            // Highlight correct answer
            document.querySelectorAll('.quiz-option').forEach(option => {
                const label = option.querySelector('label');
                if (label.textContent === questionData.correctAnswer) {
                    option.classList.add('correct');
                }
            });
        }

        // Disable all options
        document.querySelectorAll('input[name="quizAnswer"]').forEach(radio => {
            radio.disabled = true;
        });

        document.getElementById('submitAnswer').style.display = 'none';
        document.getElementById('nextQuestion').style.display = 'inline-block';
        
        // Update score display
        document.getElementById('quizScore').textContent = `Điểm: ${this.quizScore}`;
    }

    nextQuizQuestion() {
        this.quizCurrentQuestion++;
        console.log('Moving to question:', this.quizCurrentQuestion + 1); // Debug log
        this.showQuizQuestion();
    }

    showQuizResult() {
        const percentage = (this.quizScore / this.quizTotal) * 100;
        document.getElementById('finalScore').textContent = 
            `Điểm của bạn: ${this.quizScore}/${this.quizTotal}`;
        document.getElementById('finalProgressBar').style.width = `${percentage}%`;
        
        let message = '';
        if (percentage >= 90) {
            message = 'Xuất sắc! Bạn đã nắm vững từ vựng!';
        } else if (percentage >= 70) {
            message = 'Tốt lắm! Tiếp tục cố gắng!';
        } else if (percentage >= 50) {
            message = 'Khá tốt! Hãy luyện tập thêm!';
        } else {
            message = 'Cần cố gắng hơn! Đừng bỏ cuộc!';
        }
        
        document.getElementById('scoreMessage').textContent = message;
        
        // Update high score
        const currentHighScore = parseInt(localStorage.getItem('highScore') || '0');
        if (this.quizScore > currentHighScore) {
            localStorage.setItem('highScore', this.quizScore.toString());
            this.updateStatistics();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('quizResultModal'));
        modal.show();
    }

    // Synonym & Antonym Quiz Mode
    startSynonymAntonymQuiz() {
        // Hide start button and show quiz content
        document.getElementById('synAntQuizContent').style.display = 'block';
        
        // Filter words that have synonyms or antonyms
        const wordsWithSynonymsAntonyms = this.vocabulary.filter(word => 
            (word.synonyms && word.synonyms.length > 0) || 
            (word.antonyms && word.antonyms.length > 0)
        );

        if (wordsWithSynonymsAntonyms.length < 3) {
            this.showError('Cần ít nhất 3 từ có synonyms hoặc antonyms để bắt đầu quiz!');
            return;
        }

        this.synAntQuizScore = 0;
        this.synAntQuizTotal = Math.min(10, wordsWithSynonymsAntonyms.length);
        this.synAntQuizCurrentQuestion = 0;
        this.currentSynAntQuizData = [];

        // Generate quiz questions
        for (let i = 0; i < this.synAntQuizTotal; i++) {
            const questionData = this.generateSynAntQuestion(wordsWithSynonymsAntonyms);
            if (questionData) {
                this.currentSynAntQuizData.push(questionData);
            }
        }

        if (this.currentSynAntQuizData.length === 0) {
            this.showError('Không thể tạo câu hỏi! Vui lòng thêm synonyms/antonyms vào từ vựng.');
            return;
        }

        this.showSynAntQuestion();
    }

    // Start Synonym/Antonym Quiz but only using Today's Words
    startTodayWordsSynAntQuiz() {
        // Ensure today's list exists
        const todayPool = this.todayWordsList && this.todayWordsList.length > 0 ? this.todayWordsList : null;
        if (!todayPool || todayPool.length === 0) {
            this.showError('Chưa có danh sách từ hôm nay. Vui lòng chọn và bắt đầu "Today\'s Words" trước.');
            return;
        }

        // Filter today's words which have synonyms or antonyms in the main vocabulary entries
        // todayPool may contain simple word strings or full objects depending on implementation
        const wordsWithSynonymsAntonyms = [];

        // Get quiz preferences from UI
        const quizNumber = parseInt(document.getElementById('todayWordsSynAntNumber').value) || 10;
        const quizType = document.querySelector('input[name="todayWordsSynAntType"]:checked').value;

        todayPool.forEach(tw => {
            // try to find matching entry in full vocabulary by word/verb/idiom
            const key = (typeof tw === 'string') ? tw : (tw.word || tw.verb || tw.idiom || '');
            const match = this.vocabulary.find(v => v.word === key || v.word === (tw.word) || v.verb === key || v.idiom === key);
            
            if (match) {
                let hasRequiredType = false;
                
                // Check based on quiz type selection
                if (quizType === 'both') {
                    hasRequiredType = (match.synonyms && match.synonyms.length > 0) || (match.antonyms && match.antonyms.length > 0);
                } else if (quizType === 'synonyms') {
                    hasRequiredType = (match.synonyms && match.synonyms.length > 0);
                } else if (quizType === 'antonyms') {
                    hasRequiredType = (match.antonyms && match.antonyms.length > 0);
                }
                
                if (hasRequiredType) {
                    wordsWithSynonymsAntonyms.push(match);
                }
            }
        });

        if (wordsWithSynonymsAntonyms.length < 3) {
            let errorMsg = 'Cần ít nhất 3 từ trong danh sách hôm nay có ';
            if (quizType === 'synonyms') errorMsg += 'từ đồng nghĩa';
            else if (quizType === 'antonyms') errorMsg += 'từ trái nghĩa';
            else errorMsg += 'từ đồng nghĩa hoặc trái nghĩa';
            errorMsg += ' để bắt đầu quiz!';
            this.showError(errorMsg);
            return;
        }

        // Prepare quiz state similar to global SynAnt quiz
        this.synAntQuizScore = 0;
        this.synAntQuizTotal = Math.min(quizNumber, wordsWithSynonymsAntonyms.length);
        this.synAntQuizCurrentQuestion = 0;
        this.currentSynAntQuizData = [];
        this.todayWordsSynAntQuizType = quizType; // Store quiz type for question generation

        for (let i = 0; i < this.synAntQuizTotal; i++) {
            const questionData = this.generateSynAntQuestion(wordsWithSynonymsAntonyms);
            if (questionData) this.currentSynAntQuizData.push(questionData);
        }

        if (this.currentSynAntQuizData.length === 0) {
            this.showError('Không thể tạo câu hỏi từ danh sách hôm nay. Vui lòng thêm synonyms/antonyms cho các từ.');
            return;
        }

        // Set a flag so we know this is a Today's Words limited quiz
        this.isTodayWordsSynAntQuiz = true;

        // Hide settings and show quiz content within Today's Words area
        document.getElementById('todayWordsSynAntSettings').style.display = 'none';
        document.getElementById('todayWordsSynAntQuizContent').style.display = 'block';

        this.showTodayWordsSynAntQuestion();
    }

    // Show Synonym/Antonym question within Today's Words area
    showTodayWordsSynAntQuestion() {
        const questionData = this.currentSynAntQuizData[this.synAntQuizCurrentQuestion];
        
        document.getElementById('todayWordsSynAntWordText').textContent = questionData.targetWord;
        document.getElementById('todayWordsSynAntDefinition').textContent = questionData.definition;
        document.getElementById('todayWordsSynAntQuestionType').textContent = questionData.questionType === 'synonym' ? 'Từ đồng nghĩa' : 'Từ trái nghĩa';
        
        // Display options
        const optionsContainer = document.getElementById('todayWordsSynAntOptions');
        optionsContainer.innerHTML = '';
        
        questionData.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <input type="radio" name="todayWordsSynAntOption" value="${index}" id="todayWordsSynAntOpt${index}">
                <label for="todayWordsSynAntOpt${index}">${option}</label>
            `;
            optionsContainer.appendChild(optionDiv);
        });
        
        // Update progress
        document.getElementById('todayWordsSynAntProgress').textContent = 
            `Câu hỏi ${this.synAntQuizCurrentQuestion + 1}/${this.synAntQuizTotal}`;
    }

    // Handle answer for Today's Words syn/ant quiz
    submitTodayWordsSynAntAnswer() {
        const selectedOption = document.querySelector('input[name="todayWordsSynAntOption"]:checked');
        
        if (!selectedOption) {
            this.showError('Vui lòng chọn một đáp án!');
            return;
        }
        
        const answer = parseInt(selectedOption.value);
        const questionData = this.currentSynAntQuizData[this.synAntQuizCurrentQuestion];
        
        if (answer === questionData.correctAnswer) {
            this.synAntQuizScore++;
            this.showSuccess('Chính xác!');
        } else {
            this.showError(`Sai rồi! Đáp án đúng là: ${questionData.options[questionData.correctAnswer]}`);
        }
        
        this.synAntQuizCurrentQuestion++;
        
        if (this.synAntQuizCurrentQuestion < this.synAntQuizTotal) {
            setTimeout(() => {
                this.showTodayWordsSynAntQuestion();
            }, 1500);
        } else {
            this.finishTodayWordsSynAntQuiz();
        }
    }

    // Finish Today's Words syn/ant quiz
    finishTodayWordsSynAntQuiz() {
        const percentage = ((this.synAntQuizScore / this.synAntQuizTotal) * 100).toFixed(1);
        
        setTimeout(() => {
            alert(`Quiz hoàn thành!\nĐiểm số: ${this.synAntQuizScore}/${this.synAntQuizTotal} (${percentage}%)`);
            
            // Reset quiz state
            this.isTodayWordsSynAntQuiz = false;
            this.todayWordsSynAntQuizType = null;
            
            // Return to settings view
            document.getElementById('todayWordsSynAntQuizContent').style.display = 'none';
            document.getElementById('todayWordsSynAntSettings').style.display = 'block';
        }, 1000);
    }

    generateSynAntQuestion(wordsWithSynonymsAntonyms) {
        // Random word with synonyms/antonyms
        const randomWord = wordsWithSynonymsAntonyms[Math.floor(Math.random() * wordsWithSynonymsAntonyms.length)];
        
        // Question types
        const questionTypes = [];
        
        // Check if this is Today's Words quiz with specific type filter
        const isFilteredQuiz = this.isTodayWordsSynAntQuiz && this.todayWordsSynAntQuizType;
        
        if (!isFilteredQuiz || this.todayWordsSynAntQuizType === 'both' || this.todayWordsSynAntQuizType === 'synonyms') {
            if (randomWord.synonyms && randomWord.synonyms.length > 0) {
                questionTypes.push('findSynonyms', 'synonymChoice', 'findOddOne');
            }
        }
        
        if (!isFilteredQuiz || this.todayWordsSynAntQuizType === 'both' || this.todayWordsSynAntQuizType === 'antonyms') {
            if (randomWord.antonyms && randomWord.antonyms.length > 0) {
                questionTypes.push('findAntonyms', 'antonymChoice', 'findOddOne');
            }
        }

        if (questionTypes.length === 0) return null;

        const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        
        return this.createSynAntQuestion(randomWord, questionType);
    }

    createSynAntQuestion(word, questionType) {
        switch (questionType) {
            case 'findSynonyms':
                return this.createFindSynonymsQuestion(word);
            case 'findAntonyms':
                return this.createFindAntonymsQuestion(word);
            case 'synonymChoice':
                return this.createSynonymChoiceQuestion(word);
            case 'antonymChoice':
                return this.createAntonymChoiceQuestion(word);
            case 'findOddOne':
                return this.createFindOddOneQuestion(word);
            default:
                return null;
        }
    }

    createFindSynonymsQuestion(word) {
        const correctAnswers = word.synonyms.slice(0, 3).map(syn => syn.word); // Take up to 3 synonyms, extract word property
        const wrongAnswers = this.getRandomWrongAnswers(word, correctAnswers, 4 - correctAnswers.length);
        
        const allOptions = [...correctAnswers, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
            type: 'findSynonyms',
            word: word,
            question: `Chọn TẤT CẢ từ đồng nghĩa với "${word.word}"`,
            options: allOptions,
            correctAnswers: correctAnswers,
            isMultipleChoice: true,
            hint: 'Có thể có nhiều đáp án đúng'
        };
    }

    createFindAntonymsQuestion(word) {
        const correctAnswers = word.antonyms.slice(0, 3).map(ant => ant.word); // Take up to 3 antonyms, extract word property
        const wrongAnswers = this.getRandomWrongAnswers(word, correctAnswers, 4 - correctAnswers.length);
        
        const allOptions = [...correctAnswers, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
            type: 'findAntonyms',
            word: word,
            question: `Chọn TẤT CẢ từ trái nghĩa với "${word.word}"`,
            options: allOptions,
            correctAnswers: correctAnswers,
            isMultipleChoice: true,
            hint: 'Có thể có nhiều đáp án đúng'
        };
    }

    createSynonymChoiceQuestion(word) {
        const correctAnswer = word.synonyms[Math.floor(Math.random() * word.synonyms.length)].word;
        const wrongAnswers = this.getRandomWrongAnswers(word, [correctAnswer], 3);
        
        const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
            type: 'synonymChoice',
            word: word,
            question: `Từ nào đồng nghĩa với "${word.word}"?`,
            options: allOptions,
            correctAnswers: [correctAnswer],
            isMultipleChoice: false
        };
    }

    createAntonymChoiceQuestion(word) {
        const correctAnswer = word.antonyms[Math.floor(Math.random() * word.antonyms.length)].word;
        const wrongAnswers = this.getRandomWrongAnswers(word, [correctAnswer], 3);
        
        const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
            type: 'antonymChoice',
            word: word,
            question: `Từ nào trái nghĩa với "${word.word}"?`,
            options: allOptions,
            correctAnswers: [correctAnswer],
            isMultipleChoice: false
        };
    }

    createFindOddOneQuestion(word) {
        // Mix synonyms and one antonym, or antonyms and one synonym
        let correctAnswers, wrongAnswers, question;
        
        if (word.synonyms && word.synonyms.length >= 2 && word.antonyms && word.antonyms.length >= 1) {
            if (Math.random() > 0.5) {
                // 3 synonyms + 1 antonym (find the antonym)
                correctAnswers = [word.antonyms[0].word];
                wrongAnswers = word.synonyms.slice(0, 3).map(syn => syn.word);
                question = `Từ nào KHÁC với các từ còn lại? (Gợi ý: các từ còn lại đồng nghĩa với "${word.word}")`;
            } else {
                // 3 antonyms + 1 synonym (find the synonym)
                correctAnswers = [word.synonyms[0].word];
                wrongAnswers = word.antonyms.slice(0, 3).map(ant => ant.word);
                question = `Từ nào KHÁC với các từ còn lại? (Gợi ý: các từ còn lại trái nghĩa với "${word.word}")`;
            }
        } else {
            // Fallback to synonym choice
            return this.createSynonymChoiceQuestion(word);
        }
        
        const allOptions = [...correctAnswers, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        return {
            type: 'findOddOne',
            word: word,
            question: question,
            options: allOptions,
            correctAnswers: correctAnswers,
            isMultipleChoice: false
        };
    }

    getRandomWrongAnswers(currentWord, correctAnswers, count) {
        const allWords = [];
        
        // Collect words from other vocabulary
        this.vocabulary.forEach(w => {
            if (w.word !== currentWord.word) {
                if (w.synonyms) allWords.push(...w.synonyms.map(syn => syn.word));
                if (w.antonyms) allWords.push(...w.antonyms.map(ant => ant.word));
                allWords.push(w.word);
            }
        });
        
        // Filter out correct answers
        const filteredWords = allWords.filter(w => 
            !correctAnswers.includes(w) && w !== currentWord.word
        );
        
        // Remove duplicates
        const uniqueWords = [...new Set(filteredWords)];
        
        // Shuffle and return requested count
        const shuffled = uniqueWords.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    showSynAntQuestion() {
        if (this.synAntQuizCurrentQuestion >= this.currentSynAntQuizData.length) {
            this.showSynAntQuizResult();
            return;
        }

        const questionData = this.currentSynAntQuizData[this.synAntQuizCurrentQuestion];
        
        // Update progress
        const progressPercentage = ((this.synAntQuizCurrentQuestion + 1) / this.currentSynAntQuizData.length) * 100;
        document.getElementById('synAntQuizProgress').textContent = 
            `Câu ${this.synAntQuizCurrentQuestion + 1} / ${this.currentSynAntQuizData.length}`;
        document.getElementById('synAntQuizProgressBar').style.width = `${progressPercentage}%`;
        document.getElementById('synAntQuizProgressText').textContent = `${Math.round(progressPercentage)}%`;
        
        document.getElementById('synAntQuizScore').textContent = 
            `Điểm: ${this.synAntQuizScore}`;

        // Update question type indicator
        let typeText = '';
        switch (questionData.type) {
            case 'findSynonyms':
                typeText = 'Tìm từ đồng nghĩa (Nhiều đáp án)';
                break;
            case 'findAntonyms':
                typeText = 'Tìm từ trái nghĩa (Nhiều đáp án)';
                break;
            case 'synonymChoice':
                typeText = 'Chọn từ đồng nghĩa';
                break;
            case 'antonymChoice':
                typeText = 'Chọn từ trái nghĩa';
                break;
            case 'findOddOne':
                typeText = 'Tìm từ khác biệt';
                break;
        }
        document.getElementById('synAntQuestionType').textContent = typeText;

        // Show word info
        document.getElementById('synAntQuizWord').textContent = questionData.word.word;
        document.getElementById('synAntQuizMeaning').textContent = questionData.word.meaning;
        
        // Show question
        document.getElementById('synAntQuizQuestion').textContent = questionData.question;
        
        // Show hint if exists
        const hintElement = document.getElementById('synAntQuizHint');
        if (questionData.hint) {
            hintElement.textContent = questionData.hint;
            hintElement.style.display = 'block';
        } else {
            hintElement.style.display = 'none';
        }

        // Create options
        const optionsContainer = document.getElementById('synAntQuizOptions');
        optionsContainer.innerHTML = '';
        
        questionData.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = questionData.isMultipleChoice ? 'form-check' : 'form-check';
            
            const input = document.createElement('input');
            input.className = 'form-check-input';
            input.type = questionData.isMultipleChoice ? 'checkbox' : 'radio';
            input.name = 'synAntQuizOption';
            input.id = `synAntOption${index}`;
            input.value = option;
            
            // Add event listener to enable/disable submit button
            input.addEventListener('change', () => {
                const hasSelection = document.querySelectorAll('input[name="synAntQuizOption"]:checked').length > 0;
                document.getElementById('submitSynAntAnswer').disabled = !hasSelection;
                
                // Update visual styling for selected options
                this.updateSynAntOptionStyling();
            });
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `synAntOption${index}`;
            label.textContent = option;
            
            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            optionsContainer.appendChild(optionDiv);
        });

        // Clear previous result and disable submit initially
        document.getElementById('synAntQuizResult').innerHTML = '';
        document.getElementById('nextSynAntQuestion').style.display = 'none';
        document.getElementById('submitSynAntAnswer').disabled = true;
    }

    submitSynAntAnswer() {
        const selectedOptions = [];
        const checkboxes = document.querySelectorAll('input[name="synAntQuizOption"]:checked');
        
        checkboxes.forEach(checkbox => {
            selectedOptions.push(checkbox.value);
        });

        if (selectedOptions.length === 0) {
            this.showError('Vui lòng chọn ít nhất một đáp án!');
            return;
        }

        const questionData = this.currentSynAntQuizData[this.synAntQuizCurrentQuestion];
        const isCorrect = this.checkSynAntAnswer(selectedOptions, questionData.correctAnswers);
        
        if (isCorrect) {
            this.synAntQuizScore++;
        }

        this.showSynAntAnswerResult(selectedOptions, questionData, isCorrect);
    }

    checkSynAntAnswer(selectedAnswers, correctAnswers) {
        // For multiple choice questions
        if (correctAnswers.length > 1) {
            // Check if all correct answers are selected and no wrong answers
            if (selectedAnswers.length !== correctAnswers.length) return false;
            
            return correctAnswers.every(answer => selectedAnswers.includes(answer)) &&
                   selectedAnswers.every(answer => correctAnswers.includes(answer));
        } 
        // For single choice questions
        else {
            return selectedAnswers.length === 1 && selectedAnswers[0] === correctAnswers[0];
        }
    }

    showSynAntAnswerResult(selectedAnswers, questionData, isCorrect) {
        const resultDiv = document.getElementById('synAntQuizResult');
        
        let resultHTML = `
            <div class="alert ${isCorrect ? 'alert-success' : 'alert-danger'} mt-3">
                <strong>${isCorrect ? 'Chính xác!' : 'Sai rồi!'}</strong><br>
                <strong>Bạn đã chọn:</strong> ${selectedAnswers.join(', ')}<br>
                <strong>Đáp án đúng:</strong> ${questionData.correctAnswers.join(', ')}<br>
        `;

        // Add explanation with new structure
        if (questionData.type === 'findSynonyms') {
            const synonymWords = questionData.word.synonyms.map(syn => `${syn.word} (${syn.meaning})`).join(', ');
            resultHTML += `<strong>Giải thích:</strong> Các từ đồng nghĩa với "${questionData.word.word}" là: ${synonymWords}`;
        } else if (questionData.type === 'findAntonyms') {
            const antonymWords = questionData.word.antonyms.map(ant => `${ant.word} (${ant.meaning})`).join(', ');
            resultHTML += `<strong>Giải thích:</strong> Các từ trái nghĩa với "${questionData.word.word}" là: ${antonymWords}`;
        } else if (questionData.type === 'synonymChoice') {
            const selectedSyn = questionData.word.synonyms.find(syn => syn.word === questionData.correctAnswers[0]);
            const meaning = selectedSyn ? selectedSyn.meaning : '';
            resultHTML += `<strong>Giải thích:</strong> "${questionData.correctAnswers[0]}" (${meaning}) có nghĩa tương tự "${questionData.word.word}"`;
        } else if (questionData.type === 'antonymChoice') {
            const selectedAnt = questionData.word.antonyms.find(ant => ant.word === questionData.correctAnswers[0]);
            const meaning = selectedAnt ? selectedAnt.meaning : '';
            resultHTML += `<strong>Giải thích:</strong> "${questionData.correctAnswers[0]}" (${meaning}) có nghĩa trái ngược với "${questionData.word.word}"`;
        }

        resultHTML += '</div>';
        resultDiv.innerHTML = resultHTML;

        // Show next button
        document.getElementById('nextSynAntQuestion').style.display = 'inline-block';
        
        // Update score display
        document.getElementById('synAntQuizScore').textContent = `Điểm: ${this.synAntQuizScore}`;
    }

    nextSynAntQuestion() {
        this.synAntQuizCurrentQuestion++;
        this.showSynAntQuestion();
    }

    showSynAntQuizResult() {
        const percentage = Math.round((this.synAntQuizScore / this.currentSynAntQuizData.length) * 100);
        let message = '';
        
        if (percentage >= 80) {
            message = 'Xuất sắc! Bạn đã thành thạo synonyms và antonyms!';
        } else if (percentage >= 60) {
            message = 'Tốt lắm! Hãy tiếp tục luyện tập!';
        } else {
            message = 'Cần cố gắng thêm! Hãy ôn lại synonyms và antonyms!';
        }

        // Update result modal
        document.getElementById('quizResultTitle').textContent = 'Kết quả Synonym & Antonym Quiz';
        document.getElementById('quizResultScore').textContent = `${this.synAntQuizScore}/${this.currentSynAntQuizData.length}`;
        document.getElementById('quizResultPercentage').textContent = `${percentage}%`;
        document.getElementById('quizResultMessage').textContent = message;

        // Reset Today's Words quiz flags if this was a Today's Words quiz
        if (this.isTodayWordsSynAntQuiz) {
            this.isTodayWordsSynAntQuiz = false;
            this.todayWordsSynAntQuizType = null;
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('quizResultModal'));
        modal.show();
    }

    pronounceSynAntWord() {
        const word = document.getElementById('synAntQuizWord').textContent;
        this.pronounceWord(word);
    }

    updateSynAntOptionStyling() {
        // Remove all selected classes first
        document.querySelectorAll('#synAntQuizOptions .form-check').forEach(formCheck => {
            formCheck.classList.remove('selected');
        });
        
        // Add selected class to checked options
        document.querySelectorAll('input[name="synAntQuizOption"]:checked').forEach(checkedInput => {
            const formCheck = checkedInput.closest('.form-check');
            if (formCheck) {
                formCheck.classList.add('selected');
            }
        });
    }

    // Today's Words Mode (Last 10 words)
    initTodayWords() {
        const isRangeMode = document.getElementById('selectModeRange').checked;
        let validNumber, startPos, endPos;
        
        if (isRangeMode) {
            // Range mode: get words from position start to end (from the end)
            startPos = parseInt(document.getElementById('todayWordsRangeStart').value) || 1;
            endPos = parseInt(document.getElementById('todayWordsRangeEnd').value) || 10;
            
            // Validate range
            if (startPos < 1) startPos = 1;
            if (endPos < startPos) endPos = startPos;
            if (endPos > this.vocabulary.length) endPos = this.vocabulary.length;
            if (startPos > this.vocabulary.length) startPos = this.vocabulary.length;
            
            // Update inputs with validated values
            document.getElementById('todayWordsRangeStart').value = startPos;
            document.getElementById('todayWordsRangeEnd').value = endPos;
            
            // Get words: from position -endPos to -startPos (from end)
            // If startPos=1, endPos=10: slice(-10, undefined) = last 10 words
            // If startPos=20, endPos=40: slice(-40, -19) = words 20-40 from end
            if (startPos === 1) {
                this.todayWordsList = this.vocabulary.slice(-endPos);
            } else {
                this.todayWordsList = this.vocabulary.slice(-endPos, -(startPos - 1));
            }
            
            validNumber = this.todayWordsList.length;
        } else {
            // Count mode: get specified number of words from the end
            const numberOfWords = parseInt(document.getElementById('todayWordsNumber').value) || 10;
            validNumber = Math.min(Math.max(numberOfWords, 1), this.vocabulary.length);
            
            // Update the input field with the actual number (in case it was adjusted)
            document.getElementById('todayWordsNumber').value = validNumber;
            
            // Get words from the end (newest) going backwards
            this.todayWordsList = this.vocabulary.slice(-validNumber);
        }
        
        if (this.todayWordsList.length === 0) {
            this.showError('Không có từ vựng nào để học!');
            return;
        }

        // Reset stats
        this.todayWordsIndex = 0;
        this.todayWordsKnown = 0;
        this.todayWordsUnknown = 0;

        // Update count display
        document.getElementById('todayWordsCount').textContent = `${this.todayWordsList.length} từ`;
        
        // Hide content initially
        document.getElementById('todayWordsContent').style.display = 'none';
    }
    
    toggleWordsSelectMode() {
        const isRangeMode = document.getElementById('selectModeRange').checked;
        
        if (isRangeMode) {
            document.getElementById('countModeSection').style.display = 'none';
            document.getElementById('rangeModeSection').style.display = 'block';
        } else {
            document.getElementById('countModeSection').style.display = 'block';
            document.getElementById('rangeModeSection').style.display = 'none';
        }
        
        // Re-initialize with new mode
        this.initTodayWords();
    }

    updateTodayWordsCount() {
        // Re-initialize with new number
        this.initTodayWords();
    }


    startTodayWords() {
        if (this.todayWordsList.length === 0) {
            this.showError('Không có từ vựng nào để học!');
            return;
        }

        // Show content and hide start button
        document.getElementById('todayWordsContent').style.display = 'block';
        
        // Reset to first word
        this.todayWordsIndex = 0;
        this.showTodayWord();
    }

    showTodayWord() {
        if (this.todayWordsIndex >= this.todayWordsList.length) {
            this.showTodayWordsComplete();
            return;
        }

        const word = this.todayWordsList[this.todayWordsIndex];
        
        // Update progress
        const progress = ((this.todayWordsIndex + 1) / this.todayWordsList.length) * 100;
        document.getElementById('todayWordsProgress').textContent = 
            `${this.todayWordsIndex + 1} / ${this.todayWordsList.length}`;
        document.getElementById('todayWordsProgressBar').style.width = `${progress}%`;
        document.getElementById('todayWordsPercentage').textContent = `${Math.round(progress)}%`;

        // Display word info
        document.getElementById('todayWord').textContent = word.word;
        document.getElementById('todayWordType').textContent = `[${word.type}]`;
        document.getElementById('todayWordMeaning').textContent = word.meaning;
        document.getElementById('todayWordExample').textContent = word.example;

        // Display phonetic
        const phonetic = word.phonetic && word.phonetic[this.selectedAccent] 
            ? word.phonetic[this.selectedAccent] 
            : `/${word.word}/`;
        document.getElementById('todayWordPhonetic').textContent = phonetic;

        // Display detailed definitions if available
        this.displayTodayWordDefinitions(word);

        // Handle synonyms, antonyms, word family
        this.displayTodayWordRelated(word);

        // Update stats
        document.getElementById('todayWordsKnown').textContent = this.todayWordsKnown;
        document.getElementById('todayWordsUnknown').textContent = this.todayWordsUnknown;
    }
    
    displayTodayWordDefinitions(word) {
        const definitionsContainer = document.getElementById('todayWordDefinitions');
        const definitionsList = document.getElementById('todayWordDefinitionsList');
        
        if (word.definitions && Array.isArray(word.definitions) && word.definitions.length > 0) {
            definitionsContainer.style.display = 'block';
            definitionsList.innerHTML = '';
            
            word.definitions.forEach((def, index) => {
                const defCard = document.createElement('div');
                defCard.className = 'card mb-2 border-start border-primary border-3';
                defCard.innerHTML = `
                    <div class="card-body p-3">
                        <div class="d-flex align-items-start gap-2">
                            <span class="badge bg-primary">${index + 1}</span>
                            <div class="flex-grow-1">
                                <span class="badge bg-info mb-1">${def.partOfSpeech || word.type}</span>
                                <p class="mb-2 fw-bold">${def.definition}</p>
                                ${def.example ? `
                                    <p class="mb-0 text-muted fst-italic">
                                        <i class="fas fa-quote-left"></i> ${def.example}
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
                definitionsList.appendChild(defCard);
            });
        } else {
            definitionsContainer.style.display = 'none';
        }
    }

    displayTodayWordRelated(word) {
        // Synonyms
        const synonymsContainer = document.getElementById('todayWordSynonyms');
        const synonymsList = document.getElementById('todayWordSynonymsList');
        if (word.synonyms && word.synonyms.length > 0) {
            synonymsContainer.style.display = 'block';
            synonymsList.innerHTML = word.synonyms.map(syn => 
                `<div class="synonym-item mb-1">
                    <span class="badge bg-success me-1">${syn.word}</span>
                    <small class="text-muted">(${syn.meaning})</small>
                </div>`
            ).join('');
        } else {
            synonymsContainer.style.display = 'none';
        }

        // Antonyms
        const antonymsContainer = document.getElementById('todayWordAntonyms');
        const antonymsList = document.getElementById('todayWordAntonymsList');
        if (word.antonyms && word.antonyms.length > 0) {
            antonymsContainer.style.display = 'block';
            antonymsList.innerHTML = word.antonyms.map(ant => 
                `<div class="antonym-item mb-1">
                    <span class="badge bg-danger me-1">${ant.word}</span>
                    <small class="text-muted">(${ant.meaning})</small>
                </div>`
            ).join('');
        } else {
            antonymsContainer.style.display = 'none';
        }

        // Word Family
        const familyContainer = document.getElementById('todayWordFamily');
        const familyList = document.getElementById('todayWordFamilyList');
        if (word.wordFamily && Object.keys(word.wordFamily).length > 0) {
            familyContainer.style.display = 'block';
            let familyHTML = '';
            Object.entries(word.wordFamily).forEach(([type, words]) => {
                if (words && words.length > 0) {
                    familyHTML += `<div class="word-family-type mb-2">
                        <small class="fw-bold text-muted">${this.getVietnameseWordType(type)}:</small>
                        <div class="mt-1">`;
                    familyHTML += words.map(w => 
                        `<div class="word-family-item mb-1">
                            <span class="badge bg-info me-1">${w.word}</span>
                            <small class="text-muted">(${w.meaning})</small>
                        </div>`
                    ).join('');
                    familyHTML += `</div></div>`;
                }
            });
            familyList.innerHTML = familyHTML;
        } else {
            familyContainer.style.display = 'none';
        }
    }

    markTodayWordAsKnown() {
        const word = this.todayWordsList[this.todayWordsIndex];
        this.learnedWords.add(word.word);
        this.todayWordsKnown++;
        this.updateStats();
        this.nextTodayWord();
    }

    markTodayWordAsUnknown() {
        this.todayWordsUnknown++;
        this.nextTodayWord();
    }

    nextTodayWord() {
        this.todayWordsIndex++;
        this.showTodayWord();
    }

    showTodayWordsComplete() {
        const totalWords = this.todayWordsList.length;
        const knownPercentage = Math.round((this.todayWordsKnown / totalWords) * 100);
        
        let message = '';
        if (knownPercentage >= 80) {
            message = 'Xuất sắc! Bạn đã nắm vững hầu hết từ mới!';
        } else if (knownPercentage >= 60) {
            message = 'Tốt lắm! Hãy tiếp tục ôn lại những từ chưa biết!';
        } else {
            message = 'Cần cố gắng thêm! Hãy ôn lại các từ mới này thường xuyên hơn!';
        }

        // Show completion alert
        const alertHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <h4 class="alert-heading">🎉 Hoàn thành học từ mới hôm nay!</h4>
                <p><strong>Kết quả:</strong></p>
                <ul>
                    <li>Đã biết: ${this.todayWordsKnown}/${totalWords} từ (${knownPercentage}%)</li>
                    <li>Chưa biết: ${this.todayWordsUnknown}/${totalWords} từ</li>
                </ul>
                <hr>
                <p class="mb-0">${message}</p>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.getElementById('todayWordsContent').innerHTML = alertHTML + 
            `<div class="text-center mt-3">
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Học lại từ đầu
                </button>
            </div>`;
    }

    pronounceTodayWord() {
        const word = document.getElementById('todayWord').textContent;
        this.pronounceWord(word);
    }

    // Today's Words Practice Mode Functions
    showTodayWordsLearnMode() {
        // Show learn content, hide other contents
        document.getElementById('todayWordsContent').style.display = 'block';
        document.getElementById('todayWordsPracticeContent').style.display = 'none';
        document.getElementById('todayWordsWritingContent').style.display = 'none';
        document.getElementById('todayWordsSynAntContent').style.display = 'none';
        
        // Update button states
        document.getElementById('todayWordsLearnBtn').classList.add('active');
        document.getElementById('todayWordsPracticeBtn').classList.remove('active');
        document.getElementById('todayWordsWritingBtn').classList.remove('active');
        document.getElementById('todayWordsSynAntQuizBtn').classList.remove('active');
    }

    showTodayWordsPracticeMode() {
        // Check if words are loaded
        if (this.todayWordsList.length === 0) {
            this.showError('Vui lòng chọn số lượng từ và bắt đầu học trước!');
            return;
        }

        // Show practice content, hide other contents
        document.getElementById('todayWordsContent').style.display = 'none';
        document.getElementById('todayWordsPracticeContent').style.display = 'block';
        document.getElementById('todayWordsWritingContent').style.display = 'none';
        document.getElementById('todayWordsSynAntContent').style.display = 'none';
        
        // Update button states
        document.getElementById('todayWordsLearnBtn').classList.remove('active');
        document.getElementById('todayWordsPracticeBtn').classList.add('active');
        document.getElementById('todayWordsWritingBtn').classList.remove('active');
        document.getElementById('todayWordsSynAntQuizBtn').classList.remove('active');
        
        // Reset practice state
        this.todayWordsPracticeIndex = 0;
        this.todayWordsPracticeScore = 0;
        this.todayWordsPracticeCorrect = 0;
        this.todayWordsPracticeWrong = 0;
        
        // Hide quiz card and summary initially
        document.getElementById('todayWordsPracticeQuizCard').style.display = 'block';
        document.getElementById('todayWordsPracticeSummary').classList.add('d-none');
        
        // Show start button
        document.getElementById('todayWordsPracticeStartBtn').style.display = 'block';
        document.getElementById('todayWordsPracticeNextBtn').classList.add('d-none');
        document.getElementById('todayWordsPracticeRestartBtn').classList.add('d-none');
        
        // Clear question area
        document.getElementById('todayWordsPracticeQuestion').innerHTML = 
            '<p class="text-muted">Click "Bắt đầu luyện tập" để bắt đầu!</p>';
        document.getElementById('todayWordsPracticeOptions').innerHTML = '';
        document.getElementById('todayWordsPracticeResult').classList.add('d-none');
        
        // Update counts
        document.getElementById('todayWordsPracticeTotalQ').textContent = this.todayWordsList.length;
        document.getElementById('todayWordsPracticeCurrentQ').textContent = '0';
        document.getElementById('todayWordsPracticeScore').textContent = '0';
    }

    startTodayWordsPractice() {
        // Generate questions from today's words
        this.todayWordsPracticeQuestions = this.generateTodayWordsPracticeQuestions();
        
        // Hide start button
        document.getElementById('todayWordsPracticeStartBtn').style.display = 'none';
        
        // Show first question
        this.showTodayWordsPracticeQuestion();
    }

    generateTodayWordsPracticeQuestions() {
        // Create quiz questions from today's words list
        return this.todayWordsList.map(word => {
            // Get 3 random wrong answers
            const wrongAnswers = this.vocabulary
                .filter(w => w.word !== word.word)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(w => w.meaning);
            
            // Combine with correct answer and shuffle
            const options = [...wrongAnswers, word.meaning].sort(() => Math.random() - 0.5);
            
            return {
                word: word.word,
                correctAnswer: word.meaning,
                options: options,
                example: word.example,
                phonetic: word.phonetic && word.phonetic[this.selectedAccent] 
                    ? word.phonetic[this.selectedAccent] 
                    : `/${word.word}/`
            };
        });
    }

    showTodayWordsPracticeQuestion() {
        if (this.todayWordsPracticeIndex >= this.todayWordsPracticeQuestions.length) {
            this.showTodayWordsPracticeComplete();
            return;
        }

        const question = this.todayWordsPracticeQuestions[this.todayWordsPracticeIndex];
        
        // Update progress
        const progress = ((this.todayWordsPracticeIndex + 1) / this.todayWordsPracticeQuestions.length) * 100;
        document.getElementById('todayWordsPracticeProgress').style.width = `${progress}%`;
        document.getElementById('todayWordsPracticeCurrentQ').textContent = this.todayWordsPracticeIndex + 1;
        document.getElementById('todayWordsPracticeScore').textContent = this.todayWordsPracticeScore;
        
        // Display question
        document.getElementById('todayWordsPracticeQuestion').innerHTML = `
            <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
                <h3 class="text-primary mb-0">${question.word}</h3>
                <button class="btn btn-outline-primary btn-sm" onclick="app.pronounceWord('${question.word}')">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            <p class="text-muted mb-0">${question.phonetic}</p>
            <p class="text-muted mt-2"><strong>Chọn nghĩa đúng:</strong></p>
        `;
        
        // Display options
        const optionsHTML = question.options.map((option, index) => `
            <button class="btn btn-outline-secondary text-start practice-option" 
                    data-answer="${option}" 
                    onclick="app.checkTodayWordsPracticeAnswer('${option.replace(/'/g, "\\'")}')">
                ${String.fromCharCode(65 + index)}. ${option}
            </button>
        `).join('');
        
        document.getElementById('todayWordsPracticeOptions').innerHTML = optionsHTML;
        
        // Hide result and next button
        document.getElementById('todayWordsPracticeResult').classList.add('d-none');
        document.getElementById('todayWordsPracticeNextBtn').classList.add('d-none');
    }

    checkTodayWordsPracticeAnswer(selectedAnswer) {
        const question = this.todayWordsPracticeQuestions[this.todayWordsPracticeIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;
        
        // Disable all option buttons
        const optionButtons = document.querySelectorAll('.practice-option');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            const answer = btn.getAttribute('data-answer');
            
            if (answer === question.correctAnswer) {
                btn.classList.remove('btn-outline-secondary');
                btn.classList.add('btn-success');
            } else if (answer === selectedAnswer && !isCorrect) {
                btn.classList.remove('btn-outline-secondary');
                btn.classList.add('btn-danger');
            }
        });
        
        // Update score
        if (isCorrect) {
            this.todayWordsPracticeScore += 10;
            this.todayWordsPracticeCorrect++;
        } else {
            this.todayWordsPracticeWrong++;
        }
        
        // Show result
        const resultHTML = isCorrect 
            ? `<div class="alert alert-success">
                   <i class="fas fa-check-circle"></i> <strong>Chính xác!</strong>
                   <p class="mb-0 mt-2"><em>Ví dụ: ${question.example}</em></p>
               </div>`
            : `<div class="alert alert-danger">
                   <i class="fas fa-times-circle"></i> <strong>Sai rồi!</strong> 
                   <p class="mb-0">Đáp án đúng: <strong>${question.correctAnswer}</strong></p>
                   <p class="mb-0 mt-2"><em>Ví dụ: ${question.example}</em></p>
               </div>`;
        
        document.getElementById('todayWordsPracticeResult').innerHTML = resultHTML;
        document.getElementById('todayWordsPracticeResult').classList.remove('d-none');
        
        // Show next button
        document.getElementById('todayWordsPracticeNextBtn').classList.remove('d-none');
        
        // Update score display
        document.getElementById('todayWordsPracticeScore').textContent = this.todayWordsPracticeScore;
    }

    nextTodayWordsPracticeQuestion() {
        this.todayWordsPracticeIndex++;
        this.showTodayWordsPracticeQuestion();
    }

    showTodayWordsPracticeComplete() {
        // Hide quiz card
        document.getElementById('todayWordsPracticeQuizCard').style.display = 'none';
        
        // Show summary
        document.getElementById('todayWordsPracticeSummary').classList.remove('d-none');
        document.getElementById('todayWordsPracticeFinalScore').textContent = this.todayWordsPracticeScore;
        document.getElementById('todayWordsPracticeCorrect').textContent = this.todayWordsPracticeCorrect;
        document.getElementById('todayWordsPracticeWrong').textContent = this.todayWordsPracticeWrong;
        
        // Show restart button
        document.getElementById('todayWordsPracticeRestartBtn').classList.remove('d-none');
        
        // Generate message
        const percentage = (this.todayWordsPracticeCorrect / this.todayWordsPracticeQuestions.length) * 100;
        let message = '';
        if (percentage === 100) {
            message = '🎉 Hoàn hảo! Bạn đã trả lời đúng tất cả!';
        } else if (percentage >= 80) {
            message = '👏 Xuất sắc! Bạn nắm vững các từ vựng mới!';
        } else if (percentage >= 60) {
            message = '👍 Tốt lắm! Hãy tiếp tục luyện tập!';
        } else {
            message = '💪 Cần cố gắng thêm! Hãy ôn lại các từ và làm lại nhé!';
        }
        
        document.getElementById('todayWordsPracticeMessage').textContent = message;
    }

    restartTodayWordsPractice() {
        // Reset and start again
        this.todayWordsPracticeIndex = 0;
        this.todayWordsPracticeScore = 0;
        this.todayWordsPracticeCorrect = 0;
        this.todayWordsPracticeWrong = 0;
        
        // Hide summary, show quiz card
        document.getElementById('todayWordsPracticeSummary').classList.add('d-none');
        document.getElementById('todayWordsPracticeQuizCard').style.display = 'block';
        document.getElementById('todayWordsPracticeRestartBtn').classList.add('d-none');
        
        // Generate new questions and start
        this.todayWordsPracticeQuestions = this.generateTodayWordsPracticeQuestions();
        this.showTodayWordsPracticeQuestion();
    }

    // Today's Words Writing Mode
    showTodayWordsWritingMode() {
        // Check if words are loaded
        if (this.todayWordsList.length === 0) {
            this.showError('Vui lòng chọn số lượng từ và bắt đầu học trước!');
            return;
        }

        // Show writing content, hide other contents
        document.getElementById('todayWordsContent').style.display = 'none';
        document.getElementById('todayWordsPracticeContent').style.display = 'none';
        document.getElementById('todayWordsWritingContent').style.display = 'block';
        document.getElementById('todayWordsSynAntContent').style.display = 'none';
        
        // Update button states
        document.getElementById('todayWordsLearnBtn').classList.remove('active');
        document.getElementById('todayWordsPracticeBtn').classList.remove('active');
        document.getElementById('todayWordsWritingBtn').classList.add('active');
        document.getElementById('todayWordsSynAntQuizBtn').classList.remove('active');
        
        // Reset writing state
        this.todayWordsWritingIndex = 0;
        this.todayWordsWritingList = [...this.todayWordsList];
        this.todayWordsWritingAnswers = [];
        this.todayWordsWritingCorrect = 0;
        this.todayWordsWritingWrong = 0;
        this.todayWordsWritingHintUsed = false;
        
        // Show start section, hide exercise and summary
        document.getElementById('todayWordsWritingStart').style.display = 'block';
        document.getElementById('todayWordsWritingExercise').style.display = 'none';
        document.getElementById('todayWordsWritingSummary').style.display = 'none';
    }

    // Today's Words Syn/Ant Quiz Mode
    showTodayWordsSynAntQuiz() {
        // Check if words are loaded
        if (this.todayWordsList.length === 0) {
            this.showError('Vui lòng chọn số lượng từ và bắt đầu học trước!');
            return;
        }

        // Show syn/ant content, hide other contents
        document.getElementById('todayWordsContent').style.display = 'none';
        document.getElementById('todayWordsPracticeContent').style.display = 'none';
        document.getElementById('todayWordsWritingContent').style.display = 'none';
        document.getElementById('todayWordsSynAntContent').style.display = 'block';
        
        // Reset quiz UI to settings view
        document.getElementById('todayWordsSynAntSettings').style.display = 'block';
        document.getElementById('todayWordsSynAntQuizContent').style.display = 'none';
        
        // Update button states
        document.getElementById('todayWordsLearnBtn').classList.remove('active');
        document.getElementById('todayWordsPracticeBtn').classList.remove('active');
        document.getElementById('todayWordsWritingBtn').classList.remove('active');
        document.getElementById('todayWordsSynAntQuizBtn').classList.add('active');
    }

    startTodayWordsWriting() {
        // Hide start section, show exercise
        document.getElementById('todayWordsWritingStart').style.display = 'none';
        document.getElementById('todayWordsWritingExercise').style.display = 'block';
        
        // Show first word
        this.showTodayWordsWritingWord();
    }

    showTodayWordsWritingWord() {
        if (this.todayWordsWritingIndex >= this.todayWordsWritingList.length) {
            this.showTodayWordsWritingSummary();
            return;
        }

        const word = this.todayWordsWritingList[this.todayWordsWritingIndex];
        
        // Update progress
        const progress = ((this.todayWordsWritingIndex + 1) / this.todayWordsWritingList.length) * 100;
        document.getElementById('todayWordsWritingProgress').textContent = 
            `${this.todayWordsWritingIndex + 1} / ${this.todayWordsWritingList.length}`;
        document.getElementById('todayWordsWritingProgressBar').style.width = `${progress}%`;
        document.getElementById('todayWordsWritingPercentage').textContent = `${Math.round(progress)}%`;

        // Display question (Vietnamese meaning)
        document.getElementById('todayWordsWritingMeaning').textContent = word.meaning;
        document.getElementById('todayWordsWritingType').textContent = `[${word.type}]`;
        document.getElementById('todayWordsWritingExample').textContent = word.example;

        // Reset UI
        document.getElementById('todayWordsWritingInput').value = '';
        document.getElementById('todayWordsWritingInput').disabled = false;
        document.getElementById('todayWordsWritingFeedback').style.display = 'none';
        document.getElementById('todayWordsWritingCorrect').style.display = 'none';
        document.getElementById('todayWordsWritingWrong').style.display = 'none';
        document.getElementById('todayWordsWritingDetails').style.display = 'none';
        document.getElementById('todayWordsWritingExampleSection').style.display = 'none';
        
        // Button states
        document.getElementById('todayWordsWritingSubmitBtn').style.display = 'inline-block';
        document.getElementById('todayWordsWritingNextBtn').style.display = 'none';
        document.getElementById('todayWordsWritingPronounceBtn').style.display = 'none';
        
        // Reset hint
        this.todayWordsWritingHintUsed = false;
        
        // Focus on input
        document.getElementById('todayWordsWritingInput').focus();
    }

    submitTodayWordsWriting() {
        const input = document.getElementById('todayWordsWritingInput');
        const userAnswer = input.value.trim().toLowerCase();
        
        if (userAnswer === '') {
            this.showError('Vui lòng nhập từ tiếng Anh!');
            return;
        }

        const word = this.todayWordsWritingList[this.todayWordsWritingIndex];
        const correctAnswer = word.word.toLowerCase();
        const isCorrect = userAnswer === correctAnswer;

        // Show feedback
        document.getElementById('todayWordsWritingFeedback').style.display = 'block';
        
        if (isCorrect) {
            // Correct answer
            document.getElementById('todayWordsWritingCorrect').style.display = 'block';
            document.getElementById('todayWordsWritingWrong').style.display = 'none';
            document.getElementById('todayWordsWritingCorrectWord').textContent = word.word;
            this.todayWordsWritingCorrect++;
        } else {
            // Wrong answer
            document.getElementById('todayWordsWritingCorrect').style.display = 'none';
            document.getElementById('todayWordsWritingWrong').style.display = 'block';
            document.getElementById('todayWordsWritingUserAnswer').textContent = input.value;
            document.getElementById('todayWordsWritingCorrectAnswer').textContent = word.word;
            this.todayWordsWritingWrong++;
        }

        // Save answer
        this.todayWordsWritingAnswers.push({
            word: word.word,
            meaning: word.meaning,
            userAnswer: input.value,
            correctAnswer: word.word,
            isCorrect: isCorrect,
            hintUsed: this.todayWordsWritingHintUsed
        });

        // Show word details
        this.showTodayWordsWritingDetails(word);
        
        // Update buttons
        document.getElementById('todayWordsWritingSubmitBtn').style.display = 'none';
        document.getElementById('todayWordsWritingNextBtn').style.display = 'inline-block';
        document.getElementById('todayWordsWritingPronounceBtn').style.display = 'inline-block';
        
        // Disable input
        input.disabled = true;
    }

    showTodayWordsWritingDetails(word) {
        // Display phonetic
        const phonetic = word.phonetic && word.phonetic[this.selectedAccent] 
            ? word.phonetic[this.selectedAccent] 
            : `/${word.word}/`;
        document.getElementById('todayWordsWritingPhonetic').textContent = phonetic;

        // Update detail fields
        document.getElementById('todayWordsWritingDetailWord').textContent = word.word;
        document.getElementById('todayWordsWritingDetailType').textContent = word.type;
        document.getElementById('todayWordsWritingDetailExample').textContent = word.example;

        // Show details section
        document.getElementById('todayWordsWritingDetails').style.display = 'block';
    }

    showTodayWordsWritingHint() {
        if (this.todayWordsWritingHintUsed) {
            return; // Hint already used
        }

        const word = this.todayWordsWritingList[this.todayWordsWritingIndex];
        
        // Show example sentence as hint
        document.getElementById('todayWordsWritingExampleSection').style.display = 'block';
        this.todayWordsWritingHintUsed = true;
        
        // Disable hint button
        document.getElementById('todayWordsWritingHintBtn').disabled = true;
        document.getElementById('todayWordsWritingHintBtn').innerHTML = '<i class="fas fa-check"></i> Đã dùng';
    }

    skipTodayWordsWriting() {
        const word = this.todayWordsWritingList[this.todayWordsWritingIndex];
        
        // Save as skipped
        this.todayWordsWritingAnswers.push({
            word: word.word,
            meaning: word.meaning,
            userAnswer: '(Bỏ qua)',
            correctAnswer: word.word,
            isCorrect: false,
            hintUsed: this.todayWordsWritingHintUsed,
            skipped: true
        });

        this.todayWordsWritingWrong++;
        
        // Move to next word
        this.nextTodayWordsWriting();
    }

    nextTodayWordsWriting() {
        // Reset hint button
        document.getElementById('todayWordsWritingHintBtn').disabled = false;
        document.getElementById('todayWordsWritingHintBtn').innerHTML = '<i class="fas fa-lightbulb"></i> Gợi ý';
        
        // Move to next word
        this.todayWordsWritingIndex++;
        this.showTodayWordsWritingWord();
    }

    pronounceTodayWordsWriting() {
        const word = this.todayWordsWritingList[this.todayWordsWritingIndex];
        this.pronounceWord(word.word);
    }

    showTodayWordsWritingSummary() {
        // Hide exercise, show summary
        document.getElementById('todayWordsWritingExercise').style.display = 'none';
        document.getElementById('todayWordsWritingSummary').style.display = 'block';
        
        // Calculate stats
        const totalWords = this.todayWordsWritingList.length;
        const accuracy = totalWords > 0 ? Math.round((this.todayWordsWritingCorrect / totalWords) * 100) : 0;
        
        // Update summary display
        document.getElementById('todayWordsWritingTotalWords').textContent = totalWords;
        document.getElementById('todayWordsWritingCorrectCount').textContent = this.todayWordsWritingCorrect;
        document.getElementById('todayWordsWritingWrongCount').textContent = this.todayWordsWritingWrong;
        document.getElementById('todayWordsWritingAccuracy').textContent = `${accuracy}%`;
        
        // Set result message based on accuracy
        const messageElement = document.getElementById('todayWordsWritingResultMessage');
        if (accuracy >= 90) {
            messageElement.textContent = '🏆 Xuất sắc! Bạn thật tuyệt vời!';
            messageElement.className = 'text-success';
        } else if (accuracy >= 70) {
            messageElement.textContent = '👍 Tốt lắm! Hãy tiếp tục cố gắng!';
            messageElement.className = 'text-primary';
        } else if (accuracy >= 50) {
            messageElement.textContent = '📚 Khá ổn! Cần luyện tập thêm nữa!';
            messageElement.className = 'text-warning';
        } else {
            messageElement.textContent = '💪 Đừng bỏ cuộc! Hãy luyện tập nhiều hơn!';
            messageElement.className = 'text-danger';
        }
    }

    reviewTodayWordsWriting() {
        // Create detailed review modal
        let reviewContent = '<div class="modal fade" id="writingReviewModal" tabindex="-1">';
        reviewContent += '<div class="modal-dialog modal-lg modal-dialog-scrollable">';
        reviewContent += '<div class="modal-content">';
        reviewContent += '<div class="modal-header">';
        reviewContent += '<h5 class="modal-title"><i class="fas fa-chart-line"></i> Kết quả chi tiết</h5>';
        reviewContent += '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>';
        reviewContent += '</div>';
        reviewContent += '<div class="modal-body">';
        
        this.todayWordsWritingAnswers.forEach((answer, index) => {
            const cardClass = answer.isCorrect ? 'border-success' : 'border-danger';
            const iconClass = answer.isCorrect ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger';
            const resultText = answer.skipped ? 'Đã bỏ qua' : (answer.isCorrect ? 'Chính xác' : 'Sai');
            
            reviewContent += `
                <div class="card mb-3 ${cardClass}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            ${index + 1}. ${answer.word} - <em>${answer.meaning}</em>
                        </h6>
                        <span class="badge ${answer.isCorrect ? 'bg-success' : 'bg-danger'}">
                            <i class="${iconClass}"></i> ${resultText}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Bạn viết:</strong> <code>${answer.userAnswer}</code></p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Đáp án:</strong> <code>${answer.correctAnswer}</code></p>
                            </div>
                        </div>
                        ${answer.hintUsed ? '<small class="text-muted"><i class="fas fa-lightbulb"></i> Đã sử dụng gợi ý</small>' : ''}
                    </div>
                </div>
            `;
        });
        
        reviewContent += '</div>';
        reviewContent += '<div class="modal-footer">';
        reviewContent += '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>';
        reviewContent += '</div>';
        reviewContent += '</div></div></div>';
        
        // Remove existing modal if any
        const existingModal = document.getElementById('writingReviewModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', reviewContent);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('writingReviewModal'));
        modal.show();
    }

    restartTodayWordsWriting() {
        // Reset state
        this.todayWordsWritingIndex = 0;
        this.todayWordsWritingAnswers = [];
        this.todayWordsWritingCorrect = 0;
        this.todayWordsWritingWrong = 0;
        this.todayWordsWritingHintUsed = false;
        
        // Show exercise, hide summary
        document.getElementById('todayWordsWritingSummary').style.display = 'none';
        document.getElementById('todayWordsWritingExercise').style.display = 'block';
        
        // Start with first word
        this.showTodayWordsWritingWord();
    }

    newTodayWordsWriting() {
        // Go back to main today's words mode
        this.showTodayWordsLearnMode();
    }

    // Browse Mode
    displayVocabularyList(filteredWords = null) {
        const wordsToShow = filteredWords || this.vocabulary;
        const container = document.getElementById('vocabularyList');
        container.innerHTML = '';

        if (wordsToShow.length === 0) {
            const searchTerm = document.getElementById('searchInput').value.trim();
            if (searchTerm) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-info text-center">
                            <h5><i class="fas fa-search"></i> Không tìm thấy kết quả</h5>
                            <p>Không tìm thấy từ vựng nào cho từ khóa: <strong>"${searchTerm}"</strong></p>
                            <small class="text-muted">Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả.</small>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="col-12"><p class="text-center text-muted">Không có từ vựng nào để hiển thị.</p></div>';
            }
            return;
        }

        // Tìm từ trùng lặp
        const duplicateWords = this.findDuplicateWords(wordsToShow);
        
        // Hiển thị thông báo nếu có từ trùng lặp
        this.showDuplicateAlert(duplicateWords);

        // Sắp xếp từ vựng theo thứ tự alphabet (A-Z)
        const sortedWords = [...wordsToShow].sort((a, b) => 
            a.word.toLowerCase().localeCompare(b.word.toLowerCase())
        );

        sortedWords.forEach(word => {
            const isLearned = this.learnedWords.has(word.word);
            const isDuplicate = duplicateWords.has(word.word.toLowerCase());
            const cardDiv = document.createElement('div');
            cardDiv.className = 'col-md-6 col-lg-4 vocab-item';
            
            // Create definitions HTML
            let definitionsHTML = '';
            if (word.definitions && word.definitions.length > 0) {
                definitionsHTML = `
                    <div class="definitions-container mb-2">
                        <small class="text-muted fw-bold">Định nghĩa:</small>
                        ${word.definitions.map((def, index) => `
                            <div class="definition-item small mt-1">
                                <span class="badge bg-secondary me-1">${def.partOfSpeech}</span>
                                <span>${def.definition}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            cardDiv.innerHTML = `
                <div class="card vocab-card h-100 ${isDuplicate ? 'border-warning' : ''}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex align-items-center">
                                <h6 class="vocab-word me-2">${word.word}</h6>
                                ${isDuplicate ? '<i class="fas fa-exclamation-triangle text-warning me-2" title="Từ trùng lặp - cần kiểm tra!"></i>' : ''}
                                <button class="btn btn-outline-secondary btn-sm pronunciation-btn-list" 
                                        onclick="app.pronounceWord('${word.word}')" title="Phát âm">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            </div>
                            <span class="vocab-type">${word.type || 'N/A'}</span>
                        </div>
                        <p class="vocab-meaning"><strong>${word.meaning}</strong></p>
                        <p class="text-muted small">${this.getPhonetic(word.word)}</p>
                        ${word.example ? `<p class="vocab-example fst-italic">"${word.example}"</p>` : ''}
                        
                        ${definitionsHTML}
                        
                        ${this.renderSynonymsAntonyms(word)}
                        ${this.renderWordFamily(word)}
                        
                        <div class="mt-2">
                            <button class="btn btn-sm ${isLearned ? 'btn-success' : 'btn-outline-primary'}" 
                                    onclick="app.toggleWordStatus('${word.word}')">
                                <i class="fas ${isLearned ? 'fa-check' : 'fa-plus'}"></i>
                                ${isLearned ? 'Đã học' : 'Chưa học'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(cardDiv);
        });
    }

    // Render synonyms và antonyms
    renderSynonymsAntonyms(word) {
        let html = '';
        
        if (word.synonyms && word.synonyms.length > 0) {
            html += `
                <div class="synonyms-section mt-2">
                    <small class="text-success fw-bold">
                        <i class="fas fa-plus-circle me-1"></i>Từ đồng nghĩa:
                    </small>
                    <div class="synonyms-tags">
                        ${word.synonyms.map(synonym => 
                            `<div class="synonym-item d-inline-block me-2 mb-1">
                                <span class="badge bg-success-soft text-success">${synonym.word}</span>
                                <small class="text-muted ms-1">(${synonym.meaning})</small>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        if (word.antonyms && word.antonyms.length > 0) {
            html += `
                <div class="antonyms-section mt-2">
                    <small class="text-danger fw-bold">
                        <i class="fas fa-minus-circle me-1"></i>Từ trái nghĩa:
                    </small>
                    <div class="antonyms-tags">
                        ${word.antonyms.map(antonym => 
                            `<div class="antonym-item d-inline-block me-2 mb-1">
                                <span class="badge bg-danger-soft text-danger">${antonym.word}</span>
                                <small class="text-muted ms-1">(${antonym.meaning})</small>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    // Render word family
    renderWordFamily(word) {
        if (!word.wordFamily || Object.keys(word.wordFamily).length === 0) {
            return '';
        }
        
        let html = `
            <div class="word-family-section mt-2">
                <small class="text-primary fw-bold">
                    <i class="fas fa-sitemap me-1"></i>Nhóm từ gia đình:
                </small>
                <div class="word-family-content mt-1">
        `;
        
        Object.entries(word.wordFamily).forEach(([type, words]) => {
            if (words && words.length > 0) {
                html += `
                    <div class="word-type-group mb-2">
                        <small class="text-muted fw-bold">${this.getVietnameseWordType(type)}:</small>
                        <div class="mt-1">
                            ${words.map(w => 
                                `<div class="word-family-item d-inline-block me-2 mb-1">
                                    <span class="badge bg-primary-soft text-primary">${w.word}</span>
                                    <small class="text-muted ms-1">(${w.meaning})</small>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    // Chuyển đổi loại từ sang tiếng Việt
    getVietnameseWordType(type) {
        const typeMap = {
            'noun': 'Danh từ',
            'verb': 'Động từ',
            'adjective': 'Tính từ',
            'adverb': 'Trạng từ',
            'preposition': 'Giới từ',
            'conjunction': 'Liên từ',
            'interjection': 'Thán từ'
        };
        return typeMap[type] || type;
    }

    // Tìm từ trùng lặp trong danh sách từ vựng
    findDuplicateWords(wordList) {
        const wordCount = new Map();
        const duplicates = new Set();

        // Đếm số lần xuất hiện của mỗi từ (không phân biệt hoa thường)
        wordList.forEach(word => {
            const normalizedWord = word.word.toLowerCase().trim();
            const count = wordCount.get(normalizedWord) || 0;
            wordCount.set(normalizedWord, count + 1);
        });

        // Tìm những từ xuất hiện nhiều hơn 1 lần
        wordCount.forEach((count, word) => {
            if (count > 1) {
                duplicates.add(word);
            }
        });

        return duplicates;
    }

    // Hiển thị cảnh báo về từ trùng lặp
    showDuplicateAlert(duplicateWords) {
        const alertElement = document.getElementById('duplicateAlert');
        const messageElement = document.getElementById('duplicateMessage');
        
        if (duplicateWords.size > 0) {
            const duplicateList = Array.from(duplicateWords).join(', ');
            messageElement.textContent = `Tìm thấy ${duplicateWords.size} từ trùng lặp: ${duplicateList}`;
            alertElement.style.display = 'block';
        } else {
            alertElement.style.display = 'none';
        }
    }

    // Debounced search function
    debouncedSearch(searchTerm) {
        // Clear existing timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Set new timer
        this.searchDebounceTimer = setTimeout(() => {
            this.performSearch(searchTerm);
        }, 300); // 300ms debounce delay
    }

    // Perform actual search
    performSearch(searchTerm) {
        const trimmedTerm = searchTerm.toLowerCase().trim();
        
        // Clear previous highlights
        this.clearHighlights();
        
        if (!trimmedTerm) {
            this.displayVocabularyList();
            return;
        }

        const filteredWords = this.vocabulary.filter(word => {
            // Tìm kiếm trong từ gốc và nghĩa chính
            if (word.word.toLowerCase().includes(trimmedTerm) ||
                word.meaning.toLowerCase().includes(trimmedTerm) ||
                (word.example && word.example.toLowerCase().includes(trimmedTerm))) {
                return true;
            }
            
            // Tìm kiếm trong definitions array
            if (word.definitions && word.definitions.some(def => 
                def.definition.toLowerCase().includes(trimmedTerm) ||
                (def.example && def.example.toLowerCase().includes(trimmedTerm)) ||
                def.partOfSpeech.toLowerCase().includes(trimmedTerm))) {
                return true;
            }
            
            // Tìm kiếm trong synonyms (new structure: array of objects)
            if (word.synonyms && word.synonyms.some(synonym => 
                synonym.word.toLowerCase().includes(trimmedTerm) ||
                synonym.meaning.toLowerCase().includes(trimmedTerm))) {
                return true;
            }
            
            // Tìm kiếm trong antonyms (new structure: array of objects)
            if (word.antonyms && word.antonyms.some(antonym => 
                antonym.word.toLowerCase().includes(trimmedTerm) ||
                antonym.meaning.toLowerCase().includes(trimmedTerm))) {
                return true;
            }
            
            // Tìm kiếm trong word family (new structure: object with arrays of objects)
            if (word.wordFamily) {
                for (const [type, words] of Object.entries(word.wordFamily)) {
                    if (words && Array.isArray(words) && words.some(w => 
                        w.word.toLowerCase().includes(trimmedTerm) ||
                        w.meaning.toLowerCase().includes(trimmedTerm))) {
                        return true;
                    }
                }
            }
            
            return false;
        });

        this.displayVocabularyList(filteredWords);
        
        // Highlight search term in results if there are matches
        if (filteredWords.length > 0 && trimmedTerm) {
            this.highlightSearchTerms(trimmedTerm);
        }
    }

    // Clear highlight marks
    clearHighlights() {
        const container = document.getElementById('vocabularyList');
        if (container) {
            const marks = container.querySelectorAll('mark');
            marks.forEach(mark => {
                const parent = mark.parentNode;
                parent.replaceChild(document.createTextNode(mark.textContent), mark);
                parent.normalize();
            });
        }
    }

    // Highlight search terms in the vocabulary display
    highlightSearchTerms(searchTerm) {
        const container = document.getElementById('vocabularyList');
        const textNodes = this.getTextNodes(container);
        
        textNodes.forEach(node => {
            if (node.textContent.toLowerCase().includes(searchTerm)) {
                const parent = node.parentNode;
                const html = node.textContent.replace(
                    new RegExp(`(${searchTerm})`, 'gi'),
                    '<mark class="bg-warning">$1</mark>'
                );
                const wrapper = document.createElement('span');
                wrapper.innerHTML = html;
                parent.replaceChild(wrapper, node);
            }
        });
    }

    // Helper function to get all text nodes
    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script and style elements
                    if (node.parentNode.tagName === 'SCRIPT' || 
                        node.parentNode.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Only accept text nodes with actual content
                    if (node.textContent.trim().length > 0) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        return textNodes;
    }

    // Legacy search function for backward compatibility
    searchVocabulary() {
        const searchTerm = document.getElementById('searchInput').value;
        this.performSearch(searchTerm);
    }

    toggleWordStatus(word) {
        if (this.learnedWords.has(word)) {
            this.learnedWords.delete(word);
        } else {
            this.learnedWords.add(word);
        }
        this.updateStatistics();
        this.saveProgress();
        this.displayVocabularyList();
    }

    // Practice Mode
    startPractice() {
        this.currentPracticeIndex = this.getRandomWordIndex();
        this.showPracticeWord();
    }
    
    // Get random word index (avoiding repetition of recent words)
    getRandomWordIndex() {
        if (this.vocabulary.length === 0) return 0;
        
        // If we only have a few words, don't worry about avoiding repetition
        if (this.vocabulary.length <= 3) {
            return Math.floor(Math.random() * this.vocabulary.length);
        }
        
        let newIndex;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            newIndex = Math.floor(Math.random() * this.vocabulary.length);
            attempts++;
        } while (
            this.recentPracticeWords.has(newIndex) && 
            attempts < maxAttempts
        );
        
        // Add to recent words set
        this.recentPracticeWords.add(newIndex);
        
        // Keep only last 5 recent words to avoid
        if (this.recentPracticeWords.size > Math.min(5, Math.floor(this.vocabulary.length / 2))) {
            const oldestIndex = Array.from(this.recentPracticeWords)[0];
            this.recentPracticeWords.delete(oldestIndex);
        }
        
        return newIndex;
    }

    showPracticeWord() {
        if (this.vocabulary.length === 0) return;

        const word = this.vocabulary[this.currentPracticeIndex];
        document.getElementById('practiceWord').textContent = word.meaning;
        document.getElementById('practiceMeaning').textContent = `(${word.type || 'N/A'})`;
        document.getElementById('practiceInput').value = '';
        document.getElementById('practiceResult').style.display = 'none';
        
        // Reset input styling
        const input = document.getElementById('practiceInput');
        input.classList.remove('practice-correct', 'practice-incorrect');
    }

    checkSpelling() {
        const userInput = document.getElementById('practiceInput').value.trim().toLowerCase();
        const correctWord = this.vocabulary[this.currentPracticeIndex].word.toLowerCase();
        const input = document.getElementById('practiceInput');
        const resultDiv = document.getElementById('practiceResult');

        if (!userInput) {
            this.showWarning('Vui lòng nhập từ tiếng Anh!');
            return;
        }

        const isCorrect = userInput === correctWord;
        
        if (isCorrect) {
            input.classList.remove('practice-incorrect');
            input.classList.add('practice-correct');
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> Chính xác! Bạn đã viết đúng từ "${this.vocabulary[this.currentPracticeIndex].word}".
                </div>
            `;
            this.learnedWords.add(this.vocabulary[this.currentPracticeIndex].word);
        } else {
            input.classList.remove('practice-correct');
            input.classList.add('practice-incorrect');
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle"></i> Sai rồi! Từ đúng là "${this.vocabulary[this.currentPracticeIndex].word}".
                </div>
            `;
        }

        resultDiv.style.display = 'block';
        this.updateStatistics();
        this.saveProgress();
    }

    nextPractice() {
        this.currentPracticeIndex = this.getRandomWordIndex();
        this.showPracticeWord();
    }

    // Utility Functions
    updateStatistics() {
        document.getElementById('totalWords').textContent = this.vocabulary.length;
        document.getElementById('learnedWords').textContent = this.learnedWords.size;
        
        const highScore = localStorage.getItem('highScore') || '0';
        document.getElementById('highScore').textContent = highScore;
        
        const progress = this.vocabulary.length > 0 ? 
            Math.round((this.learnedWords.size / this.vocabulary.length) * 100) : 0;
        document.getElementById('progressPercent').textContent = `${progress}%`;
    }

    saveProgress() {
        localStorage.setItem('learnedWords', JSON.stringify([...this.learnedWords]));
    }

    loadProgress() {
        const saved = localStorage.getItem('learnedWords');
        if (saved) {
            this.learnedWords = new Set(JSON.parse(saved));
        }
        
        // Load accent preference
        const savedAccent = localStorage.getItem('preferredAccent');
        if (savedAccent && ['en-US', 'en-GB'].includes(savedAccent)) {
            this.selectedAccent = savedAccent;
            document.getElementById('accentSelect').value = savedAccent;
            // Update voice will be called after speech initialization
        }
    }

    // UI Helper Functions
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showWarning(message) {
        this.showToast(message, 'warning');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toastId = 'toast_' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        // Add toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1055';
            document.body.appendChild(toastContainer);
        }

        // Add toast to container
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Show toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();

        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Prepositions Mode
    displayPrepositions() {
        const container = document.querySelector('#prepositionsArea .card-body');
        if (!this.prepositions || this.prepositions.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="fas fa-exclamation-triangle"></i> Không có dữ liệu giới từ!</h5>
                    <p>Có thể do:</p>
                    <ul>
                        <li>File <code>prepositions.json</code> không tồn tại hoặc lỗi</li>
                        <li>Cần chạy ứng dụng trên web server (không phải mở file trực tiếp)</li>
                        <li>Kiểm tra Console để xem lỗi chi tiết</li>
                    </ul>
                    <small>Hãy đảm bảo file <code>prepositions.json</code> nằm cùng thư mục với <code>index.html</code></small>
                </div>
            `;
            return;
        }

        let html = '<div class="row">';
        this.prepositions.forEach((prep, index) => {
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-primary text-white">
                            <h5 class="card-title mb-0 d-flex justify-content-between align-items-center">
                                <span><strong>${prep.preposition}</strong></span>
                                <div>
                                    <span class="badge bg-light text-dark me-2">${prep.category}</span>
                                    <button class="btn btn-sm btn-light" onclick="app.pronounceWord('${prep.preposition}')">
                                        <i class="fas fa-volume-up"></i>
                                    </button>
                                </div>
                            </h5>
                        </div>
                        <div class="card-body">
                            <p class="card-text"><strong>Nghĩa:</strong> ${prep.meaning}</p>
                            
                            ${prep.uses && prep.uses.length > 0 ? `
                                <div class="mb-3">
                                    <strong>Cách sử dụng:</strong>
                                    ${prep.uses.map(use => `
                                        <div class="mt-2 p-2 bg-light rounded">
                                            <h6 class="text-primary mb-1">${use.usage}</h6>
                                            <p class="small mb-2">${use.description}</p>
                                            <div class="ms-2">
                                                ${use.examples.map(ex => `
                                                    <div class="mb-1">
                                                        <em>"${ex.sentence}"</em><br>
                                                        <small class="text-muted">${ex.translation}</small>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${prep.commonMistakes && prep.commonMistakes.length > 0 ? `
                                <div class="alert alert-warning p-2">
                                    <small><strong>Lỗi thường gặp:</strong></small>
                                    ${prep.commonMistakes.map(mistake => `
                                        <div class="mt-1">
                                            <small>
                                                <strong>❌ Sai:</strong> ${mistake.incorrect}<br>
                                                <strong>✅ Đúng:</strong> ${mistake.correct}<br>
                                                <em>${mistake.explanation}</em>
                                            </small>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            ${prep.relatedPrepositions && prep.relatedPrepositions.length > 0 ? `
                                <div class="mt-2">
                                    <small><strong>Giới từ liên quan:</strong></small><br>
                                    ${prep.relatedPrepositions.map(rel => `<span class="badge bg-secondary me-1">${rel}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // Phrasal Verbs Mode
    displayPhrasalVerbs() {
        const container = document.querySelector('#phrasalVerbsBrowseContent');
        const dataToShow = this.filteredPhrasalVerbs.length >= 0 ? this.filteredPhrasalVerbs : this.phrasalVerbs;
        
        // Update total count
        document.getElementById('phrasalVerbsTotal').textContent = `${this.phrasalVerbs.length} cụm động từ`;
        
        if (!this.phrasalVerbs || this.phrasalVerbs.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="fas fa-exclamation-triangle"></i> Không có dữ liệu cụm động từ!</h5>
                    <p>Có thể do:</p>
                    <ul>
                        <li>File <code>phrasal_verbs.json</code> không tồn tại hoặc lỗi</li>
                        <li>Cần chạy ứng dụng trên web server (không phải mở file trực tiếp)</li>
                        <li>Kiểm tra Console để xem lỗi chi tiết</li>
                    </ul>
                    <small>Hãy đảm bảo file <code>phrasal_verbs.json</code> nằm cùng thư mục với <code>index.html</code></small>
                </div>
            `;
            return;
        }
        
        if (dataToShow.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <h5><i class="fas fa-search"></i> Không tìm thấy kết quả</h5>
                    <p>Không có cụm động từ nào khớp với từ khóa tìm kiếm.</p>
                    <button class="btn btn-primary" onclick="app.clearPhrasalVerbsSearch()">
                        <i class="fas fa-times"></i> Xóa bộ lọc
                    </button>
                </div>
            `;
            return;
        }

        let html = '<div class="row">';
        dataToShow.forEach((verb, index) => {
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-success text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title mb-0">
                                        <strong>${verb.verb}</strong>
                                    </h5>
                                    <span class="badge bg-light text-dark mt-1">${verb.type}</span>
                                </div>
                                <button class="btn btn-sm btn-light" onclick="app.pronounceWord('${verb.verb}')">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            ${verb.meanings && verb.meanings.length > 0 ? `
                                <div class="mb-3">
                                    <strong>Nghĩa:</strong>
                                    ${verb.meanings.map((meaning, idx) => `
                                        <div class="mt-2 p-2 ${idx % 2 === 0 ? 'bg-light' : 'bg-white'} rounded border">
                                            <h6 class="text-success mb-1">${meaning.definition}</h6>
                                            <p class="small text-muted mb-2">${meaning.vietnamese}</p>
                                            <div class="ms-2">
                                                ${meaning.examples.map(ex => `
                                                    <div class="mb-1">
                                                        <em>"${ex.sentence}"</em><br>
                                                        <small class="text-muted">${ex.translation}</small>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${verb.note ? `
                                <div class="alert alert-info p-2">
                                    <small><strong>Ghi chú:</strong> ${verb.note}</small>
                                </div>
                            ` : ''}

                            ${verb.synonyms && verb.synonyms.length > 0 ? `
                                <div class="mt-2">
                                    <small><strong>Từ đồng nghĩa:</strong></small><br>
                                    ${verb.synonyms.map(syn => `<span class="badge bg-success me-1">${syn}</span>`).join('')}
                                </div>
                            ` : ''}

                            ${verb.relatedVerbs && verb.relatedVerbs.length > 0 ? `
                                <div class="mt-2">
                                    <small><strong>Cụm động từ liên quan:</strong></small><br>
                                    ${verb.relatedVerbs.map(rel => `<span class="badge bg-secondary me-1">${rel}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // Idioms Mode
    displayIdioms() {
        const container = document.querySelector('#idiomsBrowseContent');
        
        // Use filtered idioms for display
        const idiomsToShow = this.filteredIdioms.length >= 0 ? this.filteredIdioms : this.idioms;
        
        // Update total count
        document.getElementById('idiomsTotal').textContent = `${this.idioms.length} thành ngữ`;
        
        if (!this.idioms || this.idioms.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="fas fa-exclamation-triangle"></i> Không có dữ liệu thành ngữ!</h5>
                    <p>Có thể do:</p>
                    <ul>
                        <li>File <code>idioms.json</code> không tồn tại hoặc lỗi</li>
                        <li>Cần chạy ứng dụng trên web server (không phải mở file trực tiếp)</li>
                        <li>Kiểm tra Console để xem lỗi chi tiết</li>
                    </ul>
                    <small>Hãy đảm bảo file <code>idioms.json</code> nằm cùng thư mục với <code>index.html</code></small>
                </div>
            `;
            return;
        }
        
        if (idiomsToShow.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <h5><i class="fas fa-search"></i> Không tìm thấy kết quả</h5>
                    <p>Không có thành ngữ nào khớp với từ khóa tìm kiếm.</p>
                    <button class="btn btn-info" onclick="app.clearIdiomsSearch()">
                        <i class="fas fa-times"></i> Xóa bộ lọc
                    </button>
                </div>
            `;
            return;
        }

        let html = '<div class="row">';
        idiomsToShow.forEach((idiom, index) => {
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-info text-white">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h5 class="card-title mb-1">
                                        <strong>${idiom.idiom}</strong>
                                    </h5>
                                    <div class="d-flex flex-wrap gap-1 mt-2">
                                        <span class="badge bg-light text-dark">${idiom.category}</span>
                                        <span class="badge bg-warning text-dark">Level: ${idiom.difficulty}</span>
                                        ${idiom.frequency ? `<span class="badge bg-secondary">${idiom.frequency}</span>` : ''}
                                        ${idiom.formalityLevel ? `<span class="badge bg-dark">${idiom.formalityLevel}</span>` : ''}
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-light ms-2" onclick="app.pronounceWord('${idiom.idiom}')">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <p class="card-text"><strong>Nghĩa:</strong> ${idiom.meaning}</p>
                                ${idiom.vietnamese ? `<p class="text-muted"><em>${idiom.vietnamese}</em></p>` : ''}
                            </div>
                            
                            ${idiom.examples && idiom.examples.length > 0 ? `
                                <div class="mb-3">
                                    <strong>Ví dụ:</strong>
                                    ${idiom.examples.map(ex => `
                                        <div class="mt-2 p-2 bg-light rounded">
                                            <em>"${ex.sentence}"</em><br>
                                            <small class="text-muted">${ex.translation}</small>
                                            ${ex.context ? `<br><span class="badge bg-info text-white mt-1">${ex.context}</span>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${idiom.origin ? `
                                <div class="alert alert-secondary p-2 mb-2">
                                    <small><strong>Nguồn gốc:</strong> ${idiom.origin}</small>
                                </div>
                            ` : ''}

                            ${idiom.usage ? `
                                <div class="alert alert-light p-2 mb-2">
                                    <small><strong>Cách sử dụng:</strong> ${idiom.usage}</small>
                                </div>
                            ` : ''}

                            ${idiom.synonyms && idiom.synonyms.length > 0 ? `
                                <div class="mt-2">
                                    <small><strong>Từ đồng nghĩa:</strong></small><br>
                                    ${idiom.synonyms.map(syn => `<span class="badge bg-info me-1">${syn}</span>`).join('')}
                                </div>
                            ` : ''}

                            ${idiom.relatedIdioms && idiom.relatedIdioms.length > 0 ? `
                                <div class="mt-2">
                                    <small><strong>Thành ngữ liên quan:</strong></small><br>
                                    ${idiom.relatedIdioms.map(rel => `<span class="badge bg-secondary me-1">${rel}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    // Duplicate Detection Functions
    checkPhrasalVerbsDuplicates() {
        const seen = new Set();
        const duplicates = [];
        
        this.phrasalVerbs.forEach((item, index) => {
            const key = item.verb.toLowerCase().trim();
            if (seen.has(key)) {
                duplicates.push({ item, index });
            } else {
                seen.add(key);
            }
        });
        
        if (duplicates.length > 0) {
            this.showPhrasalVerbsDuplicateAlert(duplicates);
        }
    }
    
    checkIdiomsDuplicates() {
        const seen = new Set();
        const duplicates = [];
        
        this.idioms.forEach((item, index) => {
            const key = item.idiom.toLowerCase().trim();
            if (seen.has(key)) {
                duplicates.push({ item, index });
            } else {
                seen.add(key);
            }
        });
        
        if (duplicates.length > 0) {
            this.showIdiomsDuplicateAlert(duplicates);
        }
    }
    
    showPhrasalVerbsDuplicateAlert(duplicates) {
        const alert = document.getElementById('phrasalVerbsDuplicateAlert');
        const message = document.getElementById('phrasalVerbsDuplicateMessage');
        
        const duplicateVerbs = duplicates.map(d => d.item.verb).join(', ');
        message.textContent = `Có ${duplicates.length} cụm động từ bị trùng lặp: ${duplicateVerbs}`;
        
        alert.classList.remove('d-none');
        
        console.warn('Phrasal Verbs Duplicates:', duplicates);
    }
    
    showIdiomsDuplicateAlert(duplicates) {
        const alert = document.getElementById('idiomsDuplicateAlert');
        const message = document.getElementById('idiomsDuplicateMessage');
        
        const duplicateIdioms = duplicates.map(d => d.item.idiom).join(', ');
        message.textContent = `Có ${duplicates.length} thành ngữ bị trùng lặp: ${duplicateIdioms}`;
        
        alert.classList.remove('d-none');
        
        console.warn('Idioms Duplicates:', duplicates);
    }

    // Search Functions
    searchPhrasalVerbs() {
        const searchTerm = document.getElementById('phrasalVerbsSearchInput').value.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredPhrasalVerbs = [...this.phrasalVerbs];
        } else {
            this.filteredPhrasalVerbs = this.phrasalVerbs.filter(item => {
                // Search in verb field (primary search field for phrasal verbs)
                const verbMatch = item.verb && item.verb.toLowerCase().includes(searchTerm);
                
                // Search in meanings
                const meaningMatch = item.meanings && item.meanings.some(meaning => 
                    (meaning.definition && meaning.definition.toLowerCase().includes(searchTerm)) ||
                    (meaning.vietnamese && meaning.vietnamese.toLowerCase().includes(searchTerm)) ||
                    (meaning.examples && meaning.examples.some(example => 
                        (example.sentence && example.sentence.toLowerCase().includes(searchTerm)) ||
                        (example.translation && example.translation.toLowerCase().includes(searchTerm))
                    ))
                );
                
                // Search in synonyms
                const synonymMatch = item.synonyms && item.synonyms.some(synonym => 
                    synonym.toLowerCase().includes(searchTerm)
                );
                
                // Search in usage notes
                const usageMatch = item.usage && item.usage.toLowerCase().includes(searchTerm);
                
                // Search in type and difficulty
                const typeMatch = (item.type && item.type.toLowerCase().includes(searchTerm)) ||
                                (item.difficulty && item.difficulty.toLowerCase().includes(searchTerm));
                
                return verbMatch || meaningMatch || synonymMatch || usageMatch || typeMatch;
            });
        }
        
        // Update search results display
        this.updatePhrasalVerbsSearchResults();
        this.displayPhrasalVerbs();
    }
    
    updatePhrasalVerbsSearchResults() {
        const searchTerm = document.getElementById('phrasalVerbsSearchInput').value.toLowerCase().trim();
        const resultsElement = document.getElementById('phrasalVerbsSearchResults');
        
        if (searchTerm === '') {
            resultsElement.innerHTML = '<i class="fas fa-list me-1"></i>Hiển thị tất cả';
            resultsElement.className = 'text-muted';
        } else {
            const count = this.filteredPhrasalVerbs.length;
            if (count > 0) {
                resultsElement.innerHTML = `<i class="fas fa-check-circle me-1 text-success"></i>Tìm thấy <strong>${count}</strong> kết quả`;
                resultsElement.className = 'text-success';
            } else {
                resultsElement.innerHTML = '<i class="fas fa-exclamation-circle me-1 text-warning"></i>Không tìm thấy kết quả nào';
                resultsElement.className = 'text-warning';
            }
        }
    }
    
    clearPhrasalVerbsSearch() {
        document.getElementById('phrasalVerbsSearchInput').value = '';
        this.searchPhrasalVerbs();
    }
    
    searchIdioms() {
        const searchTerm = document.getElementById('idiomsSearchInput').value.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredIdioms = [...this.idioms];
        } else {
            this.filteredIdioms = this.idioms.filter(item => {
                // Search in idiom field (primary search field for idioms)
                const idiomMatch = item.idiom && item.idiom.toLowerCase().includes(searchTerm);
                
                // Search in meaning and vietnamese translation
                const meaningMatch = (item.meaning && item.meaning.toLowerCase().includes(searchTerm)) ||
                                   (item.vietnamese && item.vietnamese.toLowerCase().includes(searchTerm));
                
                // Search in examples
                const exampleMatch = item.examples && item.examples.some(example => 
                    (example.sentence && example.sentence.toLowerCase().includes(searchTerm)) ||
                    (example.translation && example.translation.toLowerCase().includes(searchTerm)) ||
                    (example.context && example.context.toLowerCase().includes(searchTerm))
                );
                
                // Search in synonyms and related idioms
                const synonymMatch = (item.synonyms && item.synonyms.some(synonym => 
                    synonym.toLowerCase().includes(searchTerm)
                )) || (item.relatedIdioms && item.relatedIdioms.some(related => 
                    related.toLowerCase().includes(searchTerm)
                ));
                
                // Search in category, origin, usage and other metadata
                const metadataMatch = (item.category && item.category.toLowerCase().includes(searchTerm)) ||
                                    (item.origin && item.origin.toLowerCase().includes(searchTerm)) ||
                                    (item.usage && item.usage.toLowerCase().includes(searchTerm)) ||
                                    (item.difficulty && item.difficulty.toLowerCase().includes(searchTerm)) ||
                                    (item.frequency && item.frequency.toLowerCase().includes(searchTerm)) ||
                                    (item.formalityLevel && item.formalityLevel.toLowerCase().includes(searchTerm));
                
                return idiomMatch || meaningMatch || exampleMatch || synonymMatch || metadataMatch;
            });
        }
        
        // Update search results display
        this.updateIdiomsSearchResults();
        this.displayIdioms();
    }
    
    updateIdiomsSearchResults() {
        const searchTerm = document.getElementById('idiomsSearchInput').value.toLowerCase().trim();
        const resultsElement = document.getElementById('idiomsSearchResults');
        
        if (searchTerm === '') {
            resultsElement.innerHTML = '<i class="fas fa-list me-1"></i>Hiển thị tất cả';
            resultsElement.className = 'text-muted';
        } else {
            const count = this.filteredIdioms.length;
            if (count > 0) {
                resultsElement.innerHTML = `<i class="fas fa-check-circle me-1 text-success"></i>Tìm thấy <strong>${count}</strong> kết quả`;
                resultsElement.className = 'text-success';
            } else {
                resultsElement.innerHTML = '<i class="fas fa-exclamation-circle me-1 text-warning"></i>Không tìm thấy kết quả nào';
                resultsElement.className = 'text-warning';
            }
        }
    }
    
    clearIdiomsSearch() {
        document.getElementById('idiomsSearchInput').value = '';
        this.searchIdioms();
    }

    // Phrasal Verbs Browse/Practice Mode Switching
    showPhrasalVerbsBrowse() {
        this.phrasalVerbsPracticeMode = false;
        document.getElementById('phrasalVerbsBrowseContent').classList.remove('d-none');
        document.getElementById('phrasalVerbsPracticeContent').classList.add('d-none');
        document.getElementById('phrasalVerbsBrowseBtn').classList.add('active');
        document.getElementById('phrasalVerbsPracticeBtn').classList.remove('active');
        
        // Show search bar
        document.getElementById('phrasalVerbsSearchRow').style.display = 'flex';
        
        this.displayPhrasalVerbs();
    }

    showPhrasalVerbsPractice() {
        this.phrasalVerbsPracticeMode = true;
        document.getElementById('phrasalVerbsBrowseContent').classList.add('d-none');
        document.getElementById('phrasalVerbsPracticeContent').classList.remove('d-none');
        document.getElementById('phrasalVerbsBrowseBtn').classList.remove('active');
        document.getElementById('phrasalVerbsPracticeBtn').classList.add('active');
        
        // Hide search bar
        document.getElementById('phrasalVerbsSearchRow').style.display = 'none';
    }

    // Idioms Browse/Practice Mode Switching
    showIdiomsBrowse() {
        this.idiomsPracticeMode = false;
        document.getElementById('idiomsBrowseContent').classList.remove('d-none');
        document.getElementById('idiomsPracticeContent').classList.add('d-none');
        document.getElementById('idiomsBrowseBtn').classList.add('active');
        document.getElementById('idiomsPracticeBtn').classList.remove('active');
        
        // Show search bar
        document.getElementById('idiomsSearchRow').style.display = 'flex';
        
        this.displayIdioms();
    }

    showIdiomsPractice() {
        this.idiomsPracticeMode = true;
        document.getElementById('idiomsBrowseContent').classList.add('d-none');
        document.getElementById('idiomsPracticeContent').classList.remove('d-none');
        document.getElementById('idiomsBrowseBtn').classList.remove('active');
        document.getElementById('idiomsPracticeBtn').classList.add('active');
        
        // Hide search bar
        document.getElementById('idiomsSearchRow').style.display = 'none';
    }

    // Phrasal Verbs Quiz Functions
    startPhrasalVerbsQuiz() {
        if (!this.phrasalVerbs || this.phrasalVerbs.length === 0) {
            this.showError('Không có dữ liệu cụm động từ để luyện tập!');
            return;
        }

        this.phrasalVerbsQuizScore = 0;
        this.phrasalVerbsCurrentQuestion = 0;
        this.currentPhrasalVerbsQuizData = this.generatePhrasalVerbsQuestions();
        this.phrasalVerbsQuizTotal = this.currentPhrasalVerbsQuizData.length;

        document.getElementById('phrasalVerbsStartBtn').classList.add('d-none');
        document.getElementById('phrasalVerbsScore').textContent = this.phrasalVerbsQuizScore;
        document.getElementById('phrasalVerbsTotalQ').textContent = this.phrasalVerbsQuizTotal;

        this.showPhrasalVerbsQuestion();
    }

    generatePhrasalVerbsQuestions() {
        const questions = [];
        const usedVerbs = new Set();

        // Generate different types of questions
        this.phrasalVerbs.forEach(verb => {
            if (usedVerbs.has(verb.verb)) return;
            usedVerbs.add(verb.verb);

            // Question type 1: Meaning to phrasal verb
            if (verb.meanings && verb.meanings.length > 0) {
                const meaning = verb.meanings[0];
                const wrongAnswers = this.phrasalVerbs
                    .filter(v => v.verb !== verb.verb)
                    .slice(0, 3)
                    .map(v => v.verb);

                questions.push({
                    type: 'meaning-to-verb',
                    question: `Cụm động từ nào có nghĩa: "${meaning.vietnamese}"?`,
                    correct: verb.verb,
                    options: [verb.verb, ...wrongAnswers].sort(() => Math.random() - 0.5),
                    explanation: `"${verb.verb}" có nghĩa là "${meaning.vietnamese}"`
                });
            }

            // Question type 2: Complete the sentence
            if (verb.meanings && verb.meanings[0].examples && verb.meanings[0].examples.length > 0) {
                const example = verb.meanings[0].examples[0];
                const sentence = example.sentence.replace(new RegExp(verb.verb, 'gi'), '___');
                
                questions.push({
                    type: 'complete-sentence',
                    question: `Hoàn thành câu: "${sentence}"`,
                    correct: verb.verb,
                    options: [verb.verb, ...this.phrasalVerbs.filter(v => v.verb !== verb.verb).slice(0, 3).map(v => v.verb)]
                        .sort(() => Math.random() - 0.5),
                    explanation: `Câu đầy đủ: "${example.sentence}"`
                });
            }
        });

        return questions.slice(0, Math.min(10, questions.length));
    }

    showPhrasalVerbsQuestion() {
        if (this.phrasalVerbsCurrentQuestion >= this.currentPhrasalVerbsQuizData.length) {
            this.showPhrasalVerbsResults();
            return;
        }

        const question = this.currentPhrasalVerbsQuizData[this.phrasalVerbsCurrentQuestion];
        const progress = ((this.phrasalVerbsCurrentQuestion + 1) / this.phrasalVerbsQuizTotal) * 100;

        document.getElementById('phrasalVerbsProgress').style.width = `${progress}%`;
        document.getElementById('phrasalVerbsCurrentQ').textContent = this.phrasalVerbsCurrentQuestion + 1;

        document.getElementById('phrasalVerbsQuestion').innerHTML = `
            <h5>${question.question}</h5>
        `;

        const optionsHtml = question.options.map((option, index) => 
            `<button class="btn btn-outline-success w-100 mb-2 quiz-option" onclick="app.answerPhrasalVerbsQuestion('${option}', this)">
                ${String.fromCharCode(65 + index)}. ${option}
            </button>`
        ).join('');

        document.getElementById('phrasalVerbsOptions').innerHTML = optionsHtml;
        document.getElementById('phrasalVerbsResult').classList.add('d-none');
        document.getElementById('phrasalVerbsNextBtn').classList.add('d-none');
    }

    answerPhrasalVerbsQuestion(answer, buttonElement) {
        const question = this.currentPhrasalVerbsQuizData[this.phrasalVerbsCurrentQuestion];
        const isCorrect = answer === question.correct;
        
        // Disable all option buttons
        document.querySelectorAll('#phrasalVerbsOptions .quiz-option').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.includes(question.correct)) {
                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-success');
            } else if (btn === buttonElement && !isCorrect) {
                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-danger');
            }
        });

        if (isCorrect) {
            this.phrasalVerbsQuizScore++;
            document.getElementById('phrasalVerbsScore').textContent = this.phrasalVerbsQuizScore;
        }

        // Show result
        document.getElementById('phrasalVerbsResult').innerHTML = `
            <div class="alert ${isCorrect ? 'alert-success' : 'alert-danger'}">
                <h6>${isCorrect ? '✅ Chính xác!' : '❌ Sai rồi!'}</h6>
                <p>${question.explanation || `Đáp án đúng: ${question.correct}`}</p>
            </div>
        `;
        document.getElementById('phrasalVerbsResult').classList.remove('d-none');
        document.getElementById('phrasalVerbsNextBtn').classList.remove('d-none');
    }

    nextPhrasalVerbsQuestion() {
        this.phrasalVerbsCurrentQuestion++;
        this.showPhrasalVerbsQuestion();
    }

    showPhrasalVerbsResults() {
        const percentage = Math.round((this.phrasalVerbsQuizScore / this.phrasalVerbsQuizTotal) * 100);
        let message = '';
        
        if (percentage >= 80) {
            message = 'Xuất sắc! Bạn đã nắm vững cụm động từ!';
        } else if (percentage >= 60) {
            message = 'Tốt lắm! Hãy tiếp tục luyện tập!';
        } else {
            message = 'Cần cố gắng thêm! Hãy xem lại các cụm động từ!';
        }

        document.getElementById('phrasalVerbsQuestion').innerHTML = `
            <div class="text-center">
                <h4>🎉 Hoàn thành!</h4>
                <h2 class="text-success">${this.phrasalVerbsQuizScore}/${this.phrasalVerbsQuizTotal}</h2>
                <h3>${percentage}%</h3>
                <p class="mt-3">${message}</p>
                <button class="btn btn-success mt-3" onclick="app.startPhrasalVerbsQuiz()">
                    <i class="fas fa-redo"></i> Làm lại
                </button>
                <button class="btn btn-outline-success mt-3 ms-2" onclick="app.showPhrasalVerbsBrowse()">
                    <i class="fas fa-list"></i> Xem danh sách
                </button>
            </div>
        `;
        
        document.getElementById('phrasalVerbsOptions').innerHTML = '';
        document.getElementById('phrasalVerbsResult').classList.add('d-none');
        document.getElementById('phrasalVerbsNextBtn').classList.add('d-none');
    }

    // Idioms Quiz Functions
    startIdiomsQuiz() {
        if (!this.idioms || this.idioms.length === 0) {
            this.showError('Không có dữ liệu thành ngữ để luyện tập!');
            return;
        }

        this.idiomsQuizScore = 0;
        this.idiomsCurrentQuestion = 0;
        this.currentIdiomsQuizData = this.generateIdiomsQuestions();
        this.idiomsQuizTotal = this.currentIdiomsQuizData.length;

        document.getElementById('idiomsStartBtn').classList.add('d-none');
        document.getElementById('idiomsScore').textContent = this.idiomsQuizScore;
        document.getElementById('idiomsTotalQ').textContent = this.idiomsQuizTotal;

        this.showIdiomsQuestion();
    }

    generateIdiomsQuestions() {
        const questions = [];
        const usedIdioms = new Set();

        this.idioms.forEach(idiom => {
            if (usedIdioms.has(idiom.idiom)) return;
            usedIdioms.add(idiom.idiom);

            // Question type 1: Meaning to idiom
            const wrongAnswers = this.idioms
                .filter(i => i.idiom !== idiom.idiom)
                .slice(0, 3)
                .map(i => i.idiom);

            questions.push({
                type: 'meaning-to-idiom',
                question: `Thành ngữ nào có nghĩa: "${idiom.vietnamese || idiom.meaning}"?`,
                correct: idiom.idiom,
                options: [idiom.idiom, ...wrongAnswers].sort(() => Math.random() - 0.5),
                explanation: `"${idiom.idiom}" có nghĩa là "${idiom.vietnamese || idiom.meaning}"`
            });

            // Question type 2: Complete the sentence
            if (idiom.examples && idiom.examples.length > 0) {
                const example = idiom.examples[0];
                const sentence = example.sentence.replace(new RegExp(idiom.idiom, 'gi'), '___');
                
                questions.push({
                    type: 'complete-sentence',
                    question: `Hoàn thành câu: "${sentence}"`,
                    correct: idiom.idiom,
                    options: [idiom.idiom, ...this.idioms.filter(i => i.idiom !== idiom.idiom).slice(0, 3).map(i => i.idiom)]
                        .sort(() => Math.random() - 0.5),
                    explanation: `Câu đầy đủ: "${example.sentence}"`
                });
            }
        });

        return questions.slice(0, Math.min(10, questions.length));
    }

    showIdiomsQuestion() {
        if (this.idiomsCurrentQuestion >= this.currentIdiomsQuizData.length) {
            this.showIdiomsResults();
            return;
        }

        const question = this.currentIdiomsQuizData[this.idiomsCurrentQuestion];
        const progress = ((this.idiomsCurrentQuestion + 1) / this.idiomsQuizTotal) * 100;

        document.getElementById('idiomsProgress').style.width = `${progress}%`;
        document.getElementById('idiomsCurrentQ').textContent = this.idiomsCurrentQuestion + 1;

        document.getElementById('idiomsQuestion').innerHTML = `
            <h5>${question.question}</h5>
        `;

        const optionsHtml = question.options.map((option, index) => 
            `<button class="btn btn-outline-info w-100 mb-2 quiz-option" onclick="app.answerIdiomsQuestion('${option}', this)">
                ${String.fromCharCode(65 + index)}. ${option}
            </button>`
        ).join('');

        document.getElementById('idiomsOptions').innerHTML = optionsHtml;
        document.getElementById('idiomsResult').classList.add('d-none');
        document.getElementById('idiomsNextBtn').classList.add('d-none');
    }

    answerIdiomsQuestion(answer, buttonElement) {
        const question = this.currentIdiomsQuizData[this.idiomsCurrentQuestion];
        const isCorrect = answer === question.correct;
        
        // Disable all option buttons
        document.querySelectorAll('#idiomsOptions .quiz-option').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.includes(question.correct)) {
                btn.classList.remove('btn-outline-info');
                btn.classList.add('btn-info');
            } else if (btn === buttonElement && !isCorrect) {
                btn.classList.remove('btn-outline-info');
                btn.classList.add('btn-danger');
            }
        });

        if (isCorrect) {
            this.idiomsQuizScore++;
            document.getElementById('idiomsScore').textContent = this.idiomsQuizScore;
        }

        // Show result
        document.getElementById('idiomsResult').innerHTML = `
            <div class="alert ${isCorrect ? 'alert-success' : 'alert-danger'}">
                <h6>${isCorrect ? '✅ Chính xác!' : '❌ Sai rồi!'}</h6>
                <p>${question.explanation || `Đáp án đúng: ${question.correct}`}</p>
            </div>
        `;
        document.getElementById('idiomsResult').classList.remove('d-none');
        document.getElementById('idiomsNextBtn').classList.remove('d-none');
    }

    nextIdiomsQuestion() {
        this.idiomsCurrentQuestion++;
        this.showIdiomsQuestion();
    }

    showIdiomsResults() {
        const percentage = Math.round((this.idiomsQuizScore / this.idiomsQuizTotal) * 100);
        let message = '';
        
        if (percentage >= 80) {
            message = 'Xuất sắc! Bạn đã nắm vững thành ngữ!';
        } else if (percentage >= 60) {
            message = 'Tốt lắm! Hãy tiếp tục luyện tập!';
        } else {
            message = 'Cần cố gắng thêm! Hãy xem lại các thành ngữ!';
        }

        document.getElementById('idiomsQuestion').innerHTML = `
            <div class="text-center">
                <h4>🎉 Hoàn thành!</h4>
                <h2 class="text-info">${this.idiomsQuizScore}/${this.idiomsQuizTotal}</h2>
                <h3>${percentage}%</h3>
                <p class="mt-3">${message}</p>
                <button class="btn btn-info mt-3" onclick="app.startIdiomsQuiz()">
                    <i class="fas fa-redo"></i> Làm lại
                </button>
                <button class="btn btn-outline-info mt-3 ms-2" onclick="app.showIdiomsBrowse()">
                    <i class="fas fa-list"></i> Xem danh sách
                </button>
            </div>
        `;
        
        document.getElementById('idiomsOptions').innerHTML = '';
        document.getElementById('idiomsResult').classList.add('d-none');
        document.getElementById('idiomsNextBtn').classList.add('d-none');
    }

    // ===== Collocations Methods =====
    showCollocationsBrowse() {
        document.getElementById('collocationsBrowseContent').classList.remove('d-none');
        document.getElementById('collocationsPracticeContent').classList.add('d-none');
        document.getElementById('collocationsSearchRow').style.display = 'flex';
        
        document.getElementById('collocationsBrowseBtn').classList.add('active');
        document.getElementById('collocationsPracticeBtn').classList.remove('active');
        
        this.displayCollocations();
    }

    showCollocationsPractice() {
        document.getElementById('collocationsBrowseContent').classList.add('d-none');
        document.getElementById('collocationsPracticeContent').classList.remove('d-none');
        document.getElementById('collocationsSearchRow').style.display = 'none';
        
        document.getElementById('collocationsBrowseBtn').classList.remove('active');
        document.getElementById('collocationsPracticeBtn').classList.add('active');
    }

    displayCollocations() {
        const content = document.getElementById('collocationsBrowseContent');
        const collocationsToShow = this.filteredCollocations.length > 0 ? this.filteredCollocations : this.collocations;
        
        // Update total count
        document.getElementById('collocationsTotal').textContent = `${this.collocations.length} từ với collocations`;
        
        if (!this.collocations || this.collocations.length === 0) {
            content.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="fas fa-exclamation-triangle me-2"></i>Không có dữ liệu</h5>
                    <p class="mb-2">Hiện tại chưa có collocations nào. Vui lòng kiểm tra:</p>
                    <ul class="mb-0">
                        <li>File <code>collocation.json</code> không tồn tại hoặc lỗi</li>
                        <li>Dữ liệu trong file chưa đúng định dạng</li>
                    </ul>
                    <hr>
                    <small>Hãy đảm bảo file <code>collocation.json</code> nằm cùng thư mục với <code>index.html</code></small>
                </div>
            `;
            return;
        }

        if (collocationsToShow.length === 0) {
            content.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-search fa-2x mb-3"></i>
                    <p class="mb-0">Không tìm thấy collocation phù hợp với từ khóa tìm kiếm.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="row">';
        
        collocationsToShow.forEach(item => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-warning text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-star me-2"></i>${item.word}
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="list-group list-group-flush">
            `;
            
            item.collocations.forEach(coll => {
                html += `
                    <div class="list-group-item px-0">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1 text-primary">${coll.phrase}</h6>
                                <p class="mb-1 text-muted"><em>${coll.meaning}</em></p>
                                <small class="text-success">
                                    <i class="fas fa-quote-left me-1"></i>
                                    ${coll.example}
                                </small>
                                <br>
                                <small class="text-muted">
                                    <i class="fas fa-language me-1"></i>
                                    ${coll.exampleTranslation}
                                </small>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
    }

    searchCollocations() {
        const searchTerm = document.getElementById('collocationsSearchInput').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredCollocations = [...this.collocations];
            document.getElementById('collocationsSearchResults').innerHTML = 
                '<i class="fas fa-list me-1"></i>Hiển thị tất cả';
        } else {
            this.filteredCollocations = this.collocations.filter(item => {
                // Search in word
                if (item.word.toLowerCase().includes(searchTerm)) return true;
                
                // Search in collocations
                return item.collocations.some(coll => 
                    coll.phrase.toLowerCase().includes(searchTerm) ||
                    coll.meaning.toLowerCase().includes(searchTerm) ||
                    coll.example.toLowerCase().includes(searchTerm) ||
                    coll.exampleTranslation.toLowerCase().includes(searchTerm)
                );
            });
            
            document.getElementById('collocationsSearchResults').innerHTML = 
                `<i class="fas fa-search me-1"></i>Tìm thấy ${this.filteredCollocations.length} kết quả`;
        }
        
        this.displayCollocations();
    }

    clearCollocationsSearch() {
        document.getElementById('collocationsSearchInput').value = '';
        this.searchCollocations();
    }

    startCollocationsQuiz() {
        if (!this.collocations || this.collocations.length === 0) {
            this.showError('Không có dữ liệu collocation để luyện tập!');
            return;
        }

        this.collocationsQuizScore = 0;
        this.collocationsQuizTotal = 10;
        this.collocationsCurrentQuestion = 0;
        this.currentCollocationsQuizData = [];
        this.collocationsPracticeMode = true;

        // Generate quiz questions
        for (let i = 0; i < this.collocationsQuizTotal; i++) {
            const question = this.generateCollocationQuestion();
            if (question) this.currentCollocationsQuizData.push(question);
        }

        if (this.currentCollocationsQuizData.length === 0) {
            this.showError('Không thể tạo câu hỏi!');
            return;
        }

        document.getElementById('collocationsStartBtn').classList.add('d-none');
        this.showCollocationQuestion();
    }

    generateCollocationQuestion() {
        // Random word with collocations
        const randomItem = this.collocations[Math.floor(Math.random() * this.collocations.length)];
        
        // Random collocation from the word
        const randomColl = randomItem.collocations[Math.floor(Math.random() * randomItem.collocations.length)];
        
        // Split phrase to get the missing part
        const words = randomColl.phrase.split(' ');
        const missingIndex = Math.floor(Math.random() * words.length);
        const correctAnswer = words[missingIndex];
        
        // Create question with blank
        const questionPhrase = words.map((w, i) => i === missingIndex ? '______' : w).join(' ');
        
        // Generate wrong answers
        const wrongAnswers = [];
        const usedWords = new Set([correctAnswer]);
        
        // Get words from other collocations
        this.collocations.forEach(item => {
            item.collocations.forEach(coll => {
                const collWords = coll.phrase.split(' ');
                collWords.forEach(word => {
                    if (!usedWords.has(word) && word !== randomItem.word) {
                        wrongAnswers.push(word);
                        usedWords.add(word);
                    }
                });
            });
        });
        
        // Shuffle and take 3 wrong answers
        const shuffledWrong = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 3);
        
        // Combine and shuffle all options
        const options = [correctAnswer, ...shuffledWrong].sort(() => Math.random() - 0.5);
        
        return {
            question: questionPhrase,
            meaning: randomColl.meaning,
            example: randomColl.example,
            exampleTranslation: randomColl.exampleTranslation,
            options: options,
            correctAnswer: options.indexOf(correctAnswer),
            fullPhrase: randomColl.phrase
        };
    }

    showCollocationQuestion() {
        if (this.collocationsCurrentQuestion >= this.currentCollocationsQuizData.length) {
            this.showCollocationsResult();
            return;
        }

        const questionData = this.currentCollocationsQuizData[this.collocationsCurrentQuestion];
        
        // Update progress
        const progressPercentage = ((this.collocationsCurrentQuestion + 1) / this.currentCollocationsQuizData.length) * 100;
        document.getElementById('collocationsProgress').style.width = `${progressPercentage}%`;
        document.getElementById('collocationsCurrentQ').textContent = this.collocationsCurrentQuestion + 1;
        document.getElementById('collocationsTotalQ').textContent = this.currentCollocationsQuizData.length;
        document.getElementById('collocationsScore').textContent = this.collocationsQuizScore;

        // Show question
        const questionDiv = document.getElementById('collocationsQuestion');
        questionDiv.innerHTML = `
            <h4 class="mb-3">Chọn từ phù hợp để hoàn thành collocation:</h4>
            <div class="alert alert-info">
                <h3 class="text-primary">${questionData.question}</h3>
                <p class="mb-0"><em>${questionData.meaning}</em></p>
            </div>
            <p class="text-muted"><strong>Ví dụ:</strong> ${questionData.example}</p>
            <p class="text-muted"><em>${questionData.exampleTranslation}</em></p>
        `;

        // Create options
        const optionsContainer = document.getElementById('collocationsOptions');
        optionsContainer.innerHTML = '';
        
        questionData.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-warning btn-lg d-block w-100 mb-2';
            button.textContent = option;
            button.onclick = () => this.selectCollocationAnswer(index);
            optionsContainer.appendChild(button);
        });

        // Clear result
        document.getElementById('collocationsResult').innerHTML = '';
        document.getElementById('collocationsResult').classList.add('d-none');
        document.getElementById('collocationsNextBtn').classList.add('d-none');
    }

    selectCollocationAnswer(selectedIndex) {
        const questionData = this.currentCollocationsQuizData[this.collocationsCurrentQuestion];
        const isCorrect = selectedIndex === questionData.correctAnswer;
        
        if (isCorrect) {
            this.collocationsQuizScore++;
        }

        // Update buttons
        const buttons = document.querySelectorAll('#collocationsOptions button');
        buttons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === questionData.correctAnswer) {
                btn.classList.remove('btn-outline-warning');
                btn.classList.add('btn-success');
            } else if (index === selectedIndex && !isCorrect) {
                btn.classList.remove('btn-outline-warning');
                btn.classList.add('btn-danger');
            }
        });

        // Show result
        const resultDiv = document.getElementById('collocationsResult');
        resultDiv.classList.remove('d-none');
        
        if (isCorrect) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h5><i class="fas fa-check-circle me-2"></i>Chính xác!</h5>
                    <p class="mb-0"><strong>Collocation đầy đủ:</strong> ${questionData.fullPhrase}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-times-circle me-2"></i>Sai rồi!</h5>
                    <p class="mb-0"><strong>Collocation đúng:</strong> ${questionData.fullPhrase}</p>
                </div>
            `;
        }

        // Update score
        document.getElementById('collocationsScore').textContent = this.collocationsQuizScore;
        
        // Show next button
        document.getElementById('collocationsNextBtn').classList.remove('d-none');
    }

    nextCollocationQuestion() {
        this.collocationsCurrentQuestion++;
        this.showCollocationQuestion();
    }

    showCollocationsResult() {
        const percentage = Math.round((this.collocationsQuizScore / this.currentCollocationsQuizData.length) * 100);
        let message = '';
        
        if (percentage >= 80) {
            message = 'Xuất sắc! Bạn đã nắm vững collocations!';
        } else if (percentage >= 60) {
            message = 'Tốt lắm! Hãy tiếp tục luyện tập!';
        } else {
            message = 'Cần cố gắng thêm! Hãy ôn lại các collocations!';
        }

        document.getElementById('collocationsQuestion').innerHTML = `
            <div class="alert alert-success text-center">
                <i class="fas fa-trophy fa-3x mb-3"></i>
                <h3>Quiz hoàn thành!</h3>
                <h4>Điểm của bạn: ${this.collocationsQuizScore}/${this.currentCollocationsQuizData.length}</h4>
                <div class="progress mb-3" style="height: 30px;">
                    <div class="progress-bar bg-warning" style="width: ${percentage}%">
                        ${percentage}%
                    </div>
                </div>
                <p class="mb-0">${message}</p>
            </div>
        `;
        
        document.getElementById('collocationsOptions').innerHTML = '';
        document.getElementById('collocationsResult').classList.add('d-none');
        document.getElementById('collocationsNextBtn').classList.add('d-none');
        document.getElementById('collocationsStartBtn').classList.remove('d-none');
        
        this.collocationsPracticeMode = false;
    }
}

// Global function for flipCard (called from HTML)
function flipCard() {
    if (!app) return; // Safety check
    
    const flashcard = document.getElementById('flashcard');
    const frontDiv = document.querySelector('.flashcard-front');
    const backDiv = document.querySelector('.flashcard-back');
    
    // Safety checks
    if (!flashcard || !frontDiv || !backDiv) {
        console.error('Flashcard elements not found');
        return;
    }
    
    if (app.isFlashcardFlipped) {
        // Flip back to front
        flashcard.classList.remove('flipped');
        frontDiv.classList.remove('d-none');
        backDiv.classList.add('d-none');
        app.isFlashcardFlipped = false;
        
        // Reset height
        flashcard.style.minHeight = '250px';
    } else {
        // Flip to back
        flashcard.classList.add('flipped');
        frontDiv.classList.add('d-none');
        backDiv.classList.remove('d-none');
        app.isFlashcardFlipped = true;
        
        // Adjust height for extended content
        setTimeout(() => {
            const backHeight = backDiv.scrollHeight;
            if (backHeight > 250) {
                flashcard.style.minHeight = `${backHeight + 40}px`;
            }
        }, 300); // Wait for flip animation to complete
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VocabularyApp();
    // Export for use in HTML onclick handlers
    window.app = app;
});