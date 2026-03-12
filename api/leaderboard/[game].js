/**
 * Serverless API for Leaderboard
 * Supports GET (fetch scores) and POST (submit score)
 *
 * This is a Vercel serverless function
 * Dynamic route: /api/leaderboard/[game]
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiting storage (in-memory is fine for rate limiting)
const rateLimits = new Map();

// Game configurations
const GAME_CONFIGS = {
    catchTheDoods: {
        maxScore: 200,  // Theoretical max in 45 seconds
        gameName: 'Catch the Falling Doods'
    },
    eatTheClouds: {
        maxScore: 10,   // Fixed goal
        gameName: 'Eat The Clouds'
    },
    whackADood: {
        maxScore: 100,  // Reasonable max
        gameName: 'Whack A Dood'
    },
    downloadGame: {
        maxScore: 50,   // Reasonable max in 20 seconds
        gameName: 'Download Game'
    }
};

// Helper: Get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           'unknown';
}

// Helper: Check rate limit
function checkRateLimit(ip) {
    const now = Date.now();
    const limit = rateLimits.get(ip);

    if (!limit) {
        rateLimits.set(ip, { count: 1, resetTime: now + (60 * 60 * 1000) }); // 1 hour
        return true;
    }

    if (now > limit.resetTime) {
        rateLimits.set(ip, { count: 1, resetTime: now + (60 * 60 * 1000) });
        return true;
    }

    if (limit.count >= 10) {
        return false; // Exceeded rate limit
    }

    limit.count++;
    return true;
}

// Helper: Validate score
function validateScore(game, score) {
    const config = GAME_CONFIGS[game];
    if (!config) return false;

    if (typeof score !== 'number') return false;
    if (!Number.isInteger(score)) return false;
    if (score < 0) return false;
    if (score > config.maxScore) return false;

    return true;
}

// Helper: Sanitize player name
function sanitizePlayerName(name) {
    if (!name || typeof name !== 'string') return 'Anonymous';

    // Remove HTML tags and trim
    const sanitized = name.replace(/<[^>]*>/g, '').trim();

    // Limit length
    return sanitized.substring(0, 30) || 'Anonymous';
}

// GET: Fetch leaderboard
async function getLeaderboard(game, limit = 100) {
    const key = `leaderboard:${game}`;
    const entries = await redis.zrange(key, 0, limit - 1, { rev: true, withScores: true });
    if (!entries || entries.length === 0) return [];

    const results = [];
    for (let i = 0; i < entries.length; i += 2) {
        const member = JSON.parse(entries[i]);
        results.push({ ...member, score: Number(entries[i + 1]) });
    }
    return results;
}

// POST: Submit score
async function submitScore(game, data) {
    const { score, playerName, gameData, timestamp } = data;

    if (!validateScore(game, score)) {
        throw new Error('Invalid score');
    }

    const key = `leaderboard:${game}`;
    const entry = {
        playerName: sanitizePlayerName(playerName),
        timestamp: timestamp || Date.now(),
        gameData: gameData || {}
    };

    await redis.zadd(key, { score, member: JSON.stringify(entry) });

    // Keep only top 100
    await redis.zremrangebyrank(key, 0, -101);

    const rank = await redis.zrevrank(key, JSON.stringify(entry));
    const total = await redis.zcard(key);

    return {
        success: true,
        rank: rank + 1,
        totalPlayers: total
    };
}

// Main handler
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get game name from URL
    const { game } = req.query;

    // Validate game
    if (!GAME_CONFIGS[game]) {
        return res.status(404).json({ error: 'Game not found' });
    }

    try {
        if (req.method === 'GET') {
            // Fetch leaderboard
            const limit = parseInt(req.query.limit) || 100;
            const scores = await getLeaderboard(game, limit);

            return res.status(200).json(scores);

        } else if (req.method === 'POST') {
            // Submit score
            const ip = getClientIP(req);

            // Check rate limit
            if (!checkRateLimit(ip)) {
                return res.status(429).json({
                    error: 'Too many requests. Please wait before submitting again.'
                });
            }

            const result = await submitScore(game, req.body);
            return res.status(201).json(result);

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('Leaderboard error:', error);
        return res.status(400).json({ error: error.message });
    }
}
