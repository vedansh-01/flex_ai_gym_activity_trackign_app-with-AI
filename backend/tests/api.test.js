/**
 * FlexAI Backend – API Integration Tests
 * ────────────────────────────────────────
 * Uses Jest + Supertest to validate all backend routes,
 * security middleware, rate limiting, and response formats.
 *
 * Run:  npm test
 */

const request = require('supertest');

// ─── Build a testable Express app ──────────────────────────────────────────────
// We re-create the Express app inline so we can test without starting a real server.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  // Rate limiter – very tight for testing
  const testLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute for faster test feedback
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  });
  app.use('/api/ai', testLimiter);

  // Health check
  app.get('/', (req, res) => {
    res.send('FlexAI Secure AI Proxy is running...');
  });

  // Mount the real routes
  app.use('/api/chat', require('../src/routes/chat.routes'));
  app.use('/api/ai', require('../src/routes/ai.routes'));

  return app;
}

const app = createApp();

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 1 – Health Check
// ─────────────────────────────────────────────────────────────────────────────
describe('Health Check', () => {
  it('GET / should return 200 with welcome text', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('FlexAI');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 2 – Authentication Middleware (No Token)
// ─────────────────────────────────────────────────────────────────────────────
describe('Auth Middleware – Unauthorized Access', () => {
  it('POST /api/chat/send without token should return 401', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .send({ text: 'Hello coach' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('POST /api/ai/workout without token should return 401', async () => {
    const res = await request(app)
      .post('/api/ai/workout')
      .send({ prompt: 'Give me a chest workout' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('POST /api/ai/meal-plan without token should return 401', async () => {
    const res = await request(app)
      .post('/api/ai/meal-plan')
      .send({ prompt: 'Give me a high protein meal' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('GET /api/ai/subscription/status without token should return 401', async () => {
    const res = await request(app)
      .get('/api/ai/subscription/status');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('POST /api/ai/subscription/activate without token should return 401', async () => {
    const res = await request(app)
      .post('/api/ai/subscription/activate')
      .send({ code: 'Mirrorofgym1month@123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 3 – Authentication Middleware (Invalid Token)
// ─────────────────────────────────────────────────────────────────────────────
describe('Auth Middleware – Invalid Bearer Token', () => {
  const invalidToken = 'Bearer fake-invalid-token-12345';

  it('POST /api/chat/send with invalid token should return 401', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .set('Authorization', invalidToken)
      .send({ text: 'Hello coach' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('POST /api/ai/workout with invalid token should return 401', async () => {
    const res = await request(app)
      .post('/api/ai/workout')
      .set('Authorization', invalidToken)
      .send({ prompt: 'Give me a chest workout' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 4 – Input Validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Input Validation – Payload Size', () => {
  it('POST with oversized JSON body should return 413', async () => {
    // Create a payload larger than the 10kb limit
    const hugePayload = { text: 'x'.repeat(20000) };

    const res = await request(app)
      .post('/api/chat/send')
      .set('Authorization', 'Bearer fake-token')
      .send(hugePayload);

    // Express returns 413 Payload Too Large when body exceeds limit
    expect([413, 401]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 5 – Rate Limiting
// ─────────────────────────────────────────────────────────────────────────────
describe('Rate Limiting – AI Endpoints', () => {
  it('should return 429 after exceeding rate limit on /api/ai/workout', async () => {
    // Fire 11 requests rapidly (limit is 10)
    const results = [];
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/ai/workout')
        .send({ prompt: 'Give me a chest workout' });
      results.push(res.statusCode);
    }

    // At least one should be 429
    expect(results).toContain(429);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 6 – Security Headers
// ─────────────────────────────────────────────────────────────────────────────
describe('Security Headers (Helmet)', () => {
  it('should include security headers in response', async () => {
    const res = await request(app).get('/');

    // Helmet sets these headers
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-frame-options');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE 7 – Route Existence
// ─────────────────────────────────────────────────────────────────────────────
describe('Route Existence Check', () => {
  it('GET /nonexistent should return 404', async () => {
    const res = await request(app).get('/nonexistent-route');
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/chat/send route exists (returns 401, not 404)', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .send({ text: 'test' });
    expect(res.statusCode).not.toBe(404);
  });

  it('POST /api/ai/workout route exists (returns 401, not 404)', async () => {
    const res = await request(app)
      .post('/api/ai/workout')
      .send({ prompt: 'test' });
    expect(res.statusCode).not.toBe(404);
  });

  it('POST /api/ai/meal-plan route exists (returns 401, not 404)', async () => {
    const res = await request(app)
      .post('/api/ai/meal-plan')
      .send({ prompt: 'test' });
    expect(res.statusCode).not.toBe(404);
  });

  it('GET /api/ai/subscription/status route exists', async () => {
    const res = await request(app).get('/api/ai/subscription/status');
    expect(res.statusCode).not.toBe(404);
  });

  it('POST /api/ai/subscription/activate route exists', async () => {
    const res = await request(app)
      .post('/api/ai/subscription/activate')
      .send({ code: 'test' });
    expect(res.statusCode).not.toBe(404);
  });
});
