/**
 * slide_engine.js - Pro Edition
 * Advanced navigation and interactive quiz logic.
 */

window.SlideEngine = {
    initialized: false,
    currentSlide: 0,
    sections: [],
    
    init: function() {
        if (this.initialized) return;
        this.sections = Array.from(document.querySelectorAll('main > section'));
        
        // Parse Markdown Bold
        this.sections.forEach(sec => {
            sec.innerHTML = sec.innerHTML
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        });

        // Setup initial view
        document.body.classList.add('presentation-mode');
        this.sections.forEach((sec, idx) => {
            sec.classList.add('slide-section');
            if(idx === 0) sec.classList.add('active-slide');
            
            // Hide all reveal items
            const reveals = sec.querySelectorAll('.reveal-item');
            reveals.forEach(r => {
                r.style.opacity = '0';
                r.style.transform = 'translateY(10px)';
            });
        });

        this.createUI();
        this.bindEvents();
        this.setupQuiz();
        this.updateView();
        
        console.log('Slide Engine Pro Ready');
        this.initialized = true;
    },

    createUI: function() {
        // Progress Bar
        if (!document.querySelector('.progress-bar-container')) {
            const pb = document.createElement('div');
            pb.className = 'progress-bar-container';
            pb.innerHTML = '<div id="progress-bar"></div>';
            document.body.appendChild(pb);
        }

        // Minimized Controls (Bottom Right)
        if (!document.getElementById('slide-controls')) {
            const controls = document.createElement('div');
            controls.id = 'slide-controls';
            controls.innerHTML = `
                <a href="index.html" id="home-btn" title="메인 화면으로">🏠 Home</a>
                <div class="control-sep"></div>
                <button id="prev-btn" title="이전 (Left Arrow)">←</button>
                <button id="next-btn" title="다음 (Right Arrow / Space)">→</button>
                <span id="slide-indicator">1 / ${this.sections.length}</span>
            `;
            document.body.appendChild(controls);
        }
    },

    bindEvents: function() {
        document.getElementById('prev-btn').addEventListener('click', () => this.prevSlide());
        document.getElementById('next-btn').addEventListener('click', () => this.nextSlide());
        
        // Direct Slide Navigation
        const indicator = document.getElementById('slide-indicator');
        if (indicator) {
            indicator.style.cursor = 'pointer';
            indicator.title = '클릭하여 페이지 이동';
            indicator.addEventListener('click', () => {
                const input = prompt(`이동할 페이지 번호를 입력하세요 (1 ~ ${this.sections.length})`);
                const pageNum = parseInt(input, 10);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.sections.length) {
                    this.currentSlide = pageNum - 1;
                    this.updateView();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                this.nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                this.prevSlide();
            }
        });
    },

    updateView: function() {
        this.sections.forEach((sec, idx) => {
            if (idx === this.currentSlide) {
                sec.classList.add('active-slide');
                sec.style.opacity = '1';
                sec.style.visibility = 'visible';
            } else {
                sec.classList.remove('active-slide');
                sec.style.opacity = '0';
                sec.style.visibility = 'hidden';
            }
        });
        
        // Progress update
        const indicator = document.getElementById('slide-indicator');
        if (indicator) indicator.textContent = `${this.currentSlide + 1} / ${this.sections.length}`;
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const progress = ((this.currentSlide + 1) / this.sections.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
    },

    nextSlide: function() {
        // Reveal hidden items first
        const currentSec = this.sections[this.currentSlide];
        const nextReveal = currentSec.querySelector('.reveal-item[style*="opacity: 0"]');
        
        if (nextReveal) {
            nextReveal.style.transition = 'all 0.5s ease';
            nextReveal.style.opacity = '1';
            nextReveal.style.transform = 'translateY(0)';
            return;
        }

        if (this.currentSlide < this.sections.length - 1) {
            this.currentSlide++;
            this.updateView();
        }
    },

    prevSlide: function() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateView();
        }
    },

    setupQuiz: function() {
        const quizzes = document.querySelectorAll('.quiz-container');
        quizzes.forEach(quiz => {
            const options = quiz.querySelectorAll('.quiz-btn');
            const feedback = quiz.querySelector('.quiz-feedback');
            
            options.forEach(option => {
                option.addEventListener('click', () => {
                    // Disable all options in this quiz
                    options.forEach(opt => {
                        opt.disabled = true;
                        if (opt.dataset.correct === 'true') {
                            opt.classList.add('correct', 'ring-4', 'ring-green-200');
                        }
                    });
                    
                    const isCorrect = option.dataset.correct === 'true';
                    if (isCorrect) {
                        feedback.innerHTML = '<span class="text-green-600 font-bold animate-bounce text-xl">정답입니다! 🎉</span>';
                    } else {
                        option.classList.add('wrong', 'ring-4', 'ring-red-200');
                        feedback.innerHTML = '<span class="text-red-500 font-bold text-xl">아쉬워요! 다음엔 꼭! 😢</span>';
                    }
                });
            });
        });
    }
};

window.SlideEngine.init();
