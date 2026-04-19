import { NextResponse } from 'next/server';

const rateLimitMap = new Map();

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

export function rateLimit(request) {
    const ip = request.ip || 'unknown';
    const now = Date.now();
    const limit = rateLimitMap.get(ip);

    if (!limit || now > limit.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return null;
    }

    if (limit.count >= RATE_LIMIT_MAX) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    limit.count++;
    return null;
}

export function validateInput(data, schema) {
    try {
        schema.parse(data);
        return true;
    } catch (error) {
        return false;
    }
}
