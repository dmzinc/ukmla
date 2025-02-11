let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let timeLeft = 60 * 60; // 60 minutes in seconds
let timer;
let questionAnswered = false;
let canProceedWithoutAnswer = true; // New variable to control skipping
const userManager = new UserManager();
const scoreHistory = new ScoreHistory(userManager);

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

// Modify the loadQuestions function to add more detailed logging
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        
        // Verify we have questions loaded
        if (!data.questions || data.questions.length === 0) {
            throw new Error('No questions found in the JSON file');
        }

        // Add detailed logging
        const totalQuestions = data.questions.length;
        console.log('Question Pool Statistics:');
        console.log(`Total questions available: ${totalQuestions}`);
        console.log(`First question: "${data.questions[0].question.substring(0, 50)}..."`);
        console.log(`Last question: "${data.questions[totalQuestions-1].question.substring(0, 50)}..."`);
        
        // Get 50 random questions from the pool
        questions = getRandomQuestions(data.questions, 50);
        
        // Log selection statistics
        const selectedIndices = new Set();
        questions.forEach(q => {
            const index = data.questions.findIndex(original => original.question === q.question);
            selectedIndices.add(index);
        });
        
        console.log('\nSelection Statistics:');
        console.log(`Selected ${questions.length} questions from ${totalQuestions} total questions`);
        console.log(`Selection range: from index ${Math.min(...selectedIndices)} to ${Math.max(...selectedIndices)}`);
        
        // Add question count to the start screen
        const questionCountElement = document.querySelector('.question-count');
        if (questionCountElement) {
            questionCountElement.textContent = `(Selected from a pool of ${totalQuestions} questions)`;
        }
        
        // Enable start button once questions are loaded
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').textContent = 'Start Test';
        
    } catch (error) {
        console.error('Error loading questions:', error);
        // Show error message to user
        alert('Error loading questions. Please refresh the page and try again.');
    }
}

// Update the initQuiz function to show loading state
async function initQuiz() {
    // Disable start button while loading
    const startBtn = document.getElementById('start-btn');
    startBtn.disabled = true;
    startBtn.textContent = 'Loading Questions...';
    
    await loadQuestions();
    
    // Reset button text
    startBtn.textContent = 'Start Test';
    
    // Add event listeners
    startBtn.addEventListener('click', startQuiz);
    document.getElementById('prev-btn').addEventListener('click', showPreviousQuestion);
    document.getElementById('next-btn').addEventListener('click', showNextQuestion);
    document.getElementById('submit-btn').addEventListener('click', submitQuiz);
    document.getElementById('view-progress-btn').addEventListener('click', showProgressScreen);
    document.getElementById('back-to-start').addEventListener('click', showStartScreen);
    
    // Add logout handler
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Add new event listeners for results screen buttons
    document.getElementById('retake-btn').addEventListener('click', retakeQuiz);
    document.getElementById('results-logout-btn').addEventListener('click', handleLogout);
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.add('hidden'));
}

function startQuiz() {
    hideAllScreens();
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
    hideAllScreens();
    document.getElementById('results-screen').classList.remove('hidden');
    
    const scoreData = calculateDetailedScore();
    scoreData.timeTaken = formatTimeTaken();
    
    // Save the score to history
    scoreHistory.saveScore(scoreData);
    
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

    // Add event listeners for the results screen buttons
    document.getElementById('retake-btn').addEventListener('click', retakeQuiz);
    document.getElementById('results-progress-btn').addEventListener('click', showProgressScreen);
    document.getElementById('results-logout-btn').addEventListener('click', handleLogout);
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

function showProgressScreen() {
    hideAllScreens();
    document.getElementById('progress-screen').classList.remove('hidden');
    updateProgressDisplay();
}

function showStartScreen() {
    hideAllScreens();
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('user-name').textContent = userManager.getCurrentUser();
    initQuiz();
}

function updateProgressDisplay() {
    const scores = scoreHistory.getScores();
    
    // Update summary statistics
    document.getElementById('tests-taken').textContent = scores.length;
    document.getElementById('average-score').textContent = `${scoreHistory.getAverageScore()}%`;
    document.getElementById('highest-score').textContent = `${scoreHistory.getHighestScore()}%`;
    
    // Update score history list
    const scoreList = document.getElementById('score-list');
    scoreList.innerHTML = '';
    
    scores.slice(0, 10).forEach(score => {
        const date = new Date(score.date).toLocaleDateString();
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.innerHTML = `
            <span class="score-date">${date}</span>
            <span class="score-details">
                Correct: ${score.correct} | Incorrect: ${score.incorrect} | Unanswered: ${score.unanswered}
            </span>
            <span class="score-value">${score.score.toFixed(2)}%</span>
        `;
        scoreList.appendChild(scoreItem);
    });
}

// Add these new functions
function initializeApp() {
    if (userManager.loadCurrentUser()) {
        showStartScreen();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username-input');
    
    loginBtn.addEventListener('click', () => handleLogin());
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const username = document.getElementById('username-input').value.trim();
    if (username) {
        userManager.loginUser(username);
        showStartScreen();
    }
}

// Add logout handling
function handleLogout() {
    userManager.logoutUser();
    location.reload();
}

// Add this new function
function retakeQuiz() {
    // Reset all quiz state
    currentQuestion = 0;
    userAnswers = [];
    timeLeft = 60 * 60; // Reset timer to 60 minutes
    questionAnswered = false;
    
    // Clear the questions array and load new questions
    questions = [];
    
    // Hide results screen
    document.getElementById('results-screen').classList.add('hidden');
    // Show start screen
    document.getElementById('start-screen').classList.remove('hidden');
    
    // Reset and load new questions
    loadQuestions();
    
    // Update the question count display
    document.getElementById('progress').textContent = 'Question: 1/50';
    
    // Clear any existing feedback or highlights
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
    }
    
    // Reset the question navigation panel
    updateQuestionNavPanel();
}

// Update window.onload
window.addEventListener('load', initializeApp); 