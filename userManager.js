class UserManager {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    loadCurrentUser() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = user;
            return true;
        }
        return false;
    }

    loginUser(username) {
        if (!username.trim()) return false;
        
        this.currentUser = username;
        localStorage.setItem('currentUser', username);
        return true;
    }

    logoutUser() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserScores() {
        const scores = localStorage.getItem(`scores_${this.currentUser}`);
        return scores ? JSON.parse(scores) : [];
    }

    saveUserScore(scoreData) {
        if (!this.currentUser) return;
        
        const scores = this.getUserScores();
        scores.push({
            date: new Date().toISOString(),
            score: scoreData.percentage,
            correct: scoreData.correct,
            incorrect: scoreData.incorrect,
            unanswered: scoreData.unanswered,
            timeTaken: scoreData.timeTaken
        });
        
        localStorage.setItem(`scores_${this.currentUser}`, JSON.stringify(scores));
    }
} 