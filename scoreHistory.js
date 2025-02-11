class ScoreHistory {
    constructor(userManager) {
        this.userManager = userManager;
    }

    getScores() {
        return this.userManager.getUserScores()
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    saveScore(scoreData) {
        this.userManager.saveUserScore(scoreData);
    }

    getAverageScore() {
        const scores = this.getScores();
        if (scores.length === 0) return 0;
        const sum = scores.reduce((acc, score) => acc + score.score, 0);
        return (sum / scores.length).toFixed(2);
    }

    getHighestScore() {
        const scores = this.getScores();
        if (scores.length === 0) return 0;
        return Math.max(...scores.map(score => score.score));
    }
} 