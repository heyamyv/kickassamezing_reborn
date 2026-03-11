/**
 * Leaderboard Utility for Dood's Kickassamazin World
 * Handles both localStorage (personal bests) and global leaderboard
 */

class LeaderboardManager {
    constructor(gameName) {
        this.gameName = gameName;
        this.storageKey = `${gameName}_personalBest`;
        this.lastSubmitKey = `${gameName}_lastSubmit`;
        this.apiBaseUrl = '/api/leaderboard'; // Will be configured later
    }

    // ========== LOCAL STORAGE (Personal Bests) ==========

    getPersonalBest() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? parseInt(saved) : 0;
    }

    savePersonalBest(score) {
        const current = this.getPersonalBest();
        if (score > current) {
            localStorage.setItem(this.storageKey, score.toString());
            return true; // New record
        }
        return false; // Not a new record
    }

    isNewRecord(score) {
        return score > this.getPersonalBest();
    }

    // ========== RATE LIMITING ==========

    canSubmitToGlobal() {
        const lastSubmit = localStorage.getItem(this.lastSubmitKey);
        if (!lastSubmit) return true;

        const lastSubmitTime = parseInt(lastSubmit);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        return (now - lastSubmitTime) >= fiveMinutes;
    }

    getTimeUntilNextSubmit() {
        const lastSubmit = localStorage.getItem(this.lastSubmitKey);
        if (!lastSubmit) return 0;

        const lastSubmitTime = parseInt(lastSubmit);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        const timeRemaining = (lastSubmitTime + fiveMinutes) - now;

        return Math.max(0, Math.ceil(timeRemaining / 1000)); // Return seconds
    }

    markSubmitted() {
        localStorage.setItem(this.lastSubmitKey, Date.now().toString());
    }

    // ========== VALIDATION ==========

    isScoreValid(score, maxPossibleScore) {
        if (score < 0) return false;
        if (score > maxPossibleScore) return false;
        if (!Number.isInteger(score)) return false;
        return true;
    }

    // ========== GLOBAL LEADERBOARD API ==========

    async submitToGlobal(score, playerName = 'Anonymous', gameData = {}) {
        if (!this.canSubmitToGlobal()) {
            const seconds = this.getTimeUntilNextSubmit();
            throw new Error(`Please wait ${seconds} seconds before submitting again`);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/${this.gameName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score,
                    playerName,
                    gameData,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit score');
            }

            this.markSubmitted();
            return await response.json();
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }

    async getTopScores(limit = 100) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${this.gameName}?limit=${limit}`);

            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return []; // Return empty array on error
        }
    }

    // ========== UI HELPERS ==========

    formatScore(score) {
        return score.toLocaleString();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getPlayerRank(score, leaderboard) {
        const sortedScores = leaderboard
            .map(entry => entry.score)
            .sort((a, b) => b - a);

        const rank = sortedScores.findIndex(s => score >= s) + 1;
        return rank || leaderboard.length + 1;
    }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}
