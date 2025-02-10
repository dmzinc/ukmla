let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let timeLeft = 60 * 60; // 60 minutes in seconds
let timer;
let questionAnswered = false;
let canProceedWithoutAnswer = true; // New variable to control skipping

// Add this function to shuffle the array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Add this function to get random questions
function getRandomQuestions(allQuestions, count) {
    const shuffled = shuffleArray([...allQuestions]);
    return shuffled.slice(0, count);
}

// Modify the loadQuestions function
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        // Get 50 random questions from the pool
        questions = getRandomQuestions(data.questions, 50);
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

// Initialize the quiz
async function initQuiz() {
    await loadQuestions();
    document.getElementById('start-btn').addEventListener('click', startQuiz);
    document.getElementById('prev-btn').addEventListener('click', showPreviousQuestion);
    document.getElementById('next-btn').addEventListener('click', showNextQuestion);
    document.getElementById('submit-btn').addEventListener('click', submitQuiz);
}

function startQuiz() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('progress').textContent = `Question: 1/50`; // Update progress text
    startTimer();
    showQuestion(0);
    updateQuestionNavPanel();
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showQuestion(index) {
    currentQuestion = index;
    const question = questions[index];
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('progress').textContent = `Question: ${index + 1}/${questions.length}`;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Remove previous feedback if it exists
    const existingFeedback = document.getElementById('answer-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Add image if present
    const existingImage = document.getElementById('question-image');
    if (existingImage) {
        existingImage.remove();
    }
    
    if (question.image) {
        const imageContainer = document.createElement('div');
        imageContainer.id = 'question-image';
        imageContainer.className = 'question-image';
        const img = document.createElement('img');
        img.src = `images/${question.image}`; // Assuming images are stored in an 'images' folder
        img.alt = 'Question Image';
        imageContainer.appendChild(img);
        document.getElementById('question-text').after(imageContainer);
    }
    
    question.options.forEach((option, i) => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        
        if (userAnswers[index] !== undefined) {
            if (userAnswers[index] === i) {
                button.classList.add('selected');
            }
            button.disabled = true;
            showAnswerFeedback(index);
        }
        
        button.addEventListener('click', () => selectOption(i));
        optionsContainer.appendChild(button);
    });
    
    updateNavigationButtons();
    updateQuestionNavPanel();
}

function selectOption(optionIndex) {
    userAnswers[currentQuestion] = optionIndex;
    
    const optionsContainer = document.getElementById('options-container');
    const options = optionsContainer.getElementsByClassName('option');
    
    // Remove selected class from all options
    Array.from(options).forEach(option => {
        option.classList.remove('selected');
        option.disabled = true; // Disable all options after selection
    });
    
    // Add selected class to chosen option
    options[optionIndex].classList.add('selected');
    
    questionAnswered = true; // Mark question as answered
    showAnswerFeedback(currentQuestion);
    updateNavigationButtons(); // Enable the next button
    updateQuestionNavPanel();
}

function showAnswerFeedback(questionIndex) {
    const question = questions[questionIndex];
    const correctAnswerIndex = question.correct_answer.charCodeAt(0) - 65;
    const userAnswer = userAnswers[questionIndex];
    const isCorrect = userAnswer === correctAnswerIndex;
    
    // Remove existing feedback if it exists
    const existingFeedback = document.getElementById('answer-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'answer-feedback';
    feedbackDiv.innerHTML = `
        <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
            <p><strong>${isCorrect ? 'Correct!' : 'Incorrect'}</strong></p>
            <p class="correct-answer">Correct answer: ${question.options[correctAnswerIndex]}</p>
            <div class="justification">
                <strong>Explanation:</strong><br>
                ${question.justification}
            </div>
        </div>
    `;
    
    // Insert feedback after options container
    document.getElementById('options-container').after(feedbackDiv);
}

function showNextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion(currentQuestion);
    }
}

function showPreviousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
    }
}

function updateNavigationButtons() {
    document.getElementById('prev-btn').disabled = currentQuestion === 0;
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (currentQuestion === questions.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
    
    // Remove the questionAnswered check
    nextBtn.disabled = false;
}

function submitQuiz() {
    clearInterval(timer);
    showResults();
}

function showResults() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');

    const scoreData = calculateDetailedScore();
    document.getElementById('score').textContent = scoreData.percentage.toFixed(2);
    document.getElementById('time-taken').textContent = formatTimeTaken();

    // Add detailed score breakdown
    const scoreContainer = document.getElementById('score-container');
    scoreContainer.innerHTML = `
        <h3>Score Summary</h3>
        <p>Total Questions: ${questions.length}</p>
        <p>Correct Answers: ${scoreData.correct}</p>
        <p>Incorrect Answers: ${scoreData.incorrect}</p>
        <p>Unanswered Questions: ${scoreData.unanswered}</p>
        <p class="final-score">Final Score: ${scoreData.percentage.toFixed(2)}%</p>
        <p>Time Taken: <span id="time-taken">${formatTimeTaken()}</span></p>
    `;

    showMissedQuestions();
}

function calculateDetailedScore() {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questions.forEach((question, index) => {
        const correctAnswerIndex = question.correct_answer.charCodeAt(0) - 65;
        if (userAnswers[index] === undefined) {
            unanswered++;
        } else if (userAnswers[index] === correctAnswerIndex) {
            correct++;
        } else {
            incorrect++;
        }
    });

    return {
        correct,
        incorrect,
        unanswered,
        percentage: (correct / questions.length) * 100
    };
}

function formatTimeTaken() {
    const timeUsed = 3600 - timeLeft; // 3600 seconds = 60 minutes
    const minutes = Math.floor(timeUsed / 60);
    const seconds = timeUsed % 60;
    return `${minutes}m ${seconds}s`;
}

function showMissedQuestions() {
    const container = document.getElementById('missed-questions-container');
    container.innerHTML = '';

    questions.forEach((question, index) => {
        const correctAnswerIndex = question.correct_answer.charCodeAt(0) - 65;
        if (userAnswers[index] !== correctAnswerIndex) {
            const div = document.createElement('div');
            div.className = 'missed-question';
            div.innerHTML = `
                <p><strong>Question ${index + 1}:</strong> ${question.question}</p>
                <p>Your answer: ${question.options[userAnswers[index]] || 'Not answered'}</p>
                <p class="correct-answer">Correct answer: ${question.options[correctAnswerIndex]}</p>
                <div class="justification">
                    <strong>Explanation:</strong><br>
                    ${question.justification}
                </div>
            `;
            container.appendChild(div);
        }
    });
}

function updateQuestionNavPanel() {
    const panel = document.getElementById('question-numbers');
    panel.innerHTML = '';
    
    questions.forEach((_, index) => {
        const button = document.createElement('button');
        button.className = 'question-number';
        button.textContent = index + 1;
        
        // Add appropriate classes based on answer status
        if (userAnswers[index] !== undefined) {
            button.classList.add('answered');
        } else {
            button.classList.add('unanswered');
        }
        
        // Highlight current question
        if (index === currentQuestion) {
            button.classList.add('current');
        }
        
        // Add click handler to navigate to question
        button.addEventListener('click', () => {
            currentQuestion = index;
            showQuestion(index);
        });
        
        panel.appendChild(button);
    });
}

// Initialize the quiz when the page loads
window.addEventListener('load', initQuiz); 