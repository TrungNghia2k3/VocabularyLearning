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

    getSampleVocabulary() {
        return [
            {
                word: "hello",
                meaning: "xin chào",
                type: "interjection",
                example: "Hello, how are you?",
                level: "basic"
            },
            {
                word: "computer",
                meaning: "máy tính",
                type: "noun",
                example: "I use my computer every day.",
                level: "basic"
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
        
        // Update extended info on flashcard back
        const extendedInfoContainer = document.getElementById('flashcardExtendedInfo');
        extendedInfoContainer.innerHTML = `
            ${this.renderSynonymsAntonyms(word)}
            ${this.renderWordFamily(word)}
        `;
        
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

    generateSynAntQuestion(wordsWithSynonymsAntonyms) {
        // Random word with synonyms/antonyms
        const randomWord = wordsWithSynonymsAntonyms[Math.floor(Math.random() * wordsWithSynonymsAntonyms.length)];
        
        // Question types
        const questionTypes = [];
        
        if (randomWord.synonyms && randomWord.synonyms.length > 0) {
            questionTypes.push('findSynonyms', 'synonymChoice', 'findOddOne');
        }
        
        if (randomWord.antonyms && randomWord.antonyms.length > 0) {
            questionTypes.push('findAntonyms', 'antonymChoice', 'findOddOne');
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
        const correctAnswers = word.synonyms.slice(0, 3); // Take up to 3 synonyms
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
        const correctAnswers = word.antonyms.slice(0, 3); // Take up to 3 antonyms
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
        const correctAnswer = word.synonyms[Math.floor(Math.random() * word.synonyms.length)];
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
        const correctAnswer = word.antonyms[Math.floor(Math.random() * word.antonyms.length)];
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
                correctAnswers = [word.antonyms[0]];
                wrongAnswers = word.synonyms.slice(0, 3);
                question = `Từ nào KHÁC với các từ còn lại? (Gợi ý: các từ còn lại đồng nghĩa với "${word.word}")`;
            } else {
                // 3 antonyms + 1 synonym (find the synonym)
                correctAnswers = [word.synonyms[0]];
                wrongAnswers = word.antonyms.slice(0, 3);
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
                if (w.synonyms) allWords.push(...w.synonyms);
                if (w.antonyms) allWords.push(...w.antonyms);
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

        // Add explanation
        if (questionData.type === 'findSynonyms') {
            resultHTML += `<strong>Giải thích:</strong> Các từ đồng nghĩa với "${questionData.word.word}" là: ${questionData.word.synonyms.join(', ')}`;
        } else if (questionData.type === 'findAntonyms') {
            resultHTML += `<strong>Giải thích:</strong> Các từ trái nghĩa với "${questionData.word.word}" là: ${questionData.word.antonyms.join(', ')}`;
        } else if (questionData.type === 'synonymChoice') {
            resultHTML += `<strong>Giải thích:</strong> "${questionData.correctAnswers[0]}" có nghĩa tương tự "${questionData.word.word}"`;
        } else if (questionData.type === 'antonymChoice') {
            resultHTML += `<strong>Giải thích:</strong> "${questionData.correctAnswers[0]}" có nghĩa trái ngược với "${questionData.word.word}"`;
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

    // Browse Mode
    displayVocabularyList(filteredWords = null) {
        const wordsToShow = filteredWords || this.vocabulary;
        const container = document.getElementById('vocabularyList');
        container.innerHTML = '';

        if (wordsToShow.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-center text-muted">Không tìm thấy từ vựng nào.</p></div>';
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
                        <p class="vocab-meaning">${word.meaning}</p>
                        <p class="text-muted small">${this.getPhonetic(word.word)}</p>
                        ${word.example ? `<p class="vocab-example">"${word.example}"</p>` : ''}
                        
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
                            `<span class="badge bg-success-soft text-success me-1 mb-1">${synonym}</span>`
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
                            `<span class="badge bg-danger-soft text-danger me-1 mb-1">${antonym}</span>`
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
                    <div class="word-type-group mb-1">
                        <small class="text-muted">${this.getVietnameseWordType(type)}:</small>
                        ${words.map(w => 
                            `<span class="badge bg-primary-soft text-primary me-1">${w}</span>`
                        ).join('')}
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
        
        if (!trimmedTerm) {
            this.displayVocabularyList();
            return;
        }

        const filteredWords = this.vocabulary.filter(word => {
            // Tìm kiếm trong từ gốc, nghĩa, và ví dụ
            if (word.word.toLowerCase().includes(trimmedTerm) ||
                word.meaning.toLowerCase().includes(trimmedTerm) ||
                (word.example && word.example.toLowerCase().includes(trimmedTerm))) {
                return true;
            }
            
            // Tìm kiếm trong synonyms
            if (word.synonyms && word.synonyms.some(synonym => 
                synonym.toLowerCase().includes(trimmedTerm))) {
                return true;
            }
            
            // Tìm kiếm trong antonyms
            if (word.antonyms && word.antonyms.some(antonym => 
                antonym.toLowerCase().includes(trimmedTerm))) {
                return true;
            }
            
            // Tìm kiếm trong word family
            if (word.wordFamily) {
                for (const [type, words] of Object.entries(word.wordFamily)) {
                    if (words && words.some(w => w.toLowerCase().includes(trimmedTerm))) {
                        return true;
                    }
                }
            }
            
            return false;
        });

        this.displayVocabularyList(filteredWords);
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