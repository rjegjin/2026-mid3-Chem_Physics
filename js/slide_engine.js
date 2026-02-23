/**
 * slide_engine.js
 * Independent Slide Engine for Interactive Lessons.
 * Adds presentation controls and quiz logic without modifying existing core logic.
 */

window.SlideEngine = {
    initialized: false,
    currentSlide: 0,
    sections: [],
    
    init: function() {
        if (this.initialized) return;
        this.sections = Array.from(document.querySelectorAll('main > section'));
        
        // Add classes for styling
        document.body.classList.add('presentation-mode');
        this.sections.forEach((sec, idx) => {
            sec.classList.add('slide-section');
            if(idx === 0) sec.classList.add('active-slide');
        });

        this.createControls();
        this.bindEvents();
        this.setupQuiz();
        this.updateSlide();
        
        console.log('Slide Engine Initialized with', this.sections.length, 'slides.');
        this.initialized = true;
    },

    createControls: function() {
        if (document.getElementById('slide-controls')) return;
        
        const controls = document.createElement('div');
        controls.id = 'slide-controls';
        controls.innerHTML = `
            <button id="prev-btn">◀</button>
            <span id="slide-indicator">1 / ${this.sections.length}</span>
            <button id="next-btn">▶</button>
            <button id="toggle-quiz-mode" title="퀴즈 모드 전환">💡</button>
        `;
        document.body.appendChild(controls);
    },

    bindEvents: function() {
        document.getElementById('prev-btn').addEventListener('click', () => this.prevSlide());
        document.getElementById('next-btn').addEventListener('click', () => this.nextSlide());
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                this.nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                this.prevSlide();
            }
        });
    },

    updateSlide: function() {
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
        
        const indicator = document.getElementById('slide-indicator');
        if (indicator) indicator.textContent = `${this.currentSlide + 1} / ${this.sections.length}`;
    },

    nextSlide: function() {
        if (this.currentSlide < this.sections.length - 1) {
            this.currentSlide++;
            this.updateSlide();
        }
    },

    prevSlide: function() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateSlide();
        }
    },

    /* --- Quiz System Logic --- */
    setupQuiz: function() {
        const quizzes = document.querySelectorAll('.quiz-container');
        quizzes.forEach(quiz => {
            const options = quiz.querySelectorAll('.quiz-option');
            const feedback = quiz.querySelector('.quiz-feedback');
            
            options.forEach(option => {
                option.addEventListener('click', () => {
                    // Reset styling
                    options.forEach(opt => opt.classList.remove('correct', 'wrong'));
                    
                    const isCorrect = option.dataset.correct === 'true';
                    
                    if (isCorrect) {
                        option.classList.add('correct');
                        feedback.textContent = "정답입니다! 🎉";
                        feedback.style.color = "#15803d";
                    } else {
                        option.classList.add('wrong');
                        feedback.textContent = "다시 생각해 보세요. 🤔";
                        feedback.style.color = "#b91c1c";
                    }
                });
            });
        });
    }
};

// Initialize only if explicitly called or configured
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SlideEngine.init());
} else {
    window.SlideEngine.init();
}
