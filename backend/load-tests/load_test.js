/**
 * FlexAI – k6 High-Concurrency Load Test
 * ────────────────────────────────────────
 * Simulates up to 1000+ concurrent virtual users (VUs) hitting
 * the FlexAI backend to measure throughput, latency, and error rates.
 *
 * Prerequisites:
 *   1. Install k6: https://k6.io/docs/get-started/installation/
 *      Windows: choco install k6   OR   winget install grafana.k6
 *   2. Start the backend: cd backend && npm start
 *   3. Run:  k6 run backend/load-tests/load_test.js
 *
 * The test uses the health check endpoint and unauthenticated route
 * checks to stress-test raw Express throughput without requiring
 * real Supabase auth tokens or OpenRouter API calls.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const healthLatency = new Trend('health_check_latency', true);
const authCheckLatency = new Trend('auth_check_latency', true);
const rateLimitLatency = new Trend('rate_limit_latency', true);

// ─── Test Configuration ────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  // Ramp up to 1000 VUs over 5 stages
  stages: [
    { duration: '30s', target: 50 },    // Warm-up: ramp to 50 users
    { duration: '1m',  target: 200 },   // Medium load
    { duration: '2m',  target: 500 },   // High load
    { duration: '2m',  target: 1000 },  // Peak load (1000+ concurrent)
    { duration: '30s', target: 0 },     // Cool-down
  ],

  thresholds: {
    // Health check: 95th percentile response should be under 500ms
    health_check_latency: ['p(95)<500'],
    // Auth middleware: should respond within 1s even under load
    auth_check_latency: ['p(95)<1000'],
    // Custom error rate (only true app errors) should be below 5%
    errors: ['rate<0.05'],
    // HTTP failures include 401/429 which are expected – allow higher rate
    http_req_failed: ['rate<0.99'],
  },
};

// ─── Default (Main) Function ───────────────────────────────────────────────────
export default function () {

  // ── Scenario 1: Health Check (GET /) ─────────────────────────────────────
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/`);
    
    healthLatency.add(res.timings.duration);

    // 200 = healthy, 429 = rate limited (still means server is alive)
    const passed = check(res, {
      'health responds (200 or 429)': (r) => r.status === 200 || r.status === 429,
    });

    errorRate.add(!passed);
  });

  sleep(0.5); // Brief pause between scenarios

  // ── Scenario 2: Auth Middleware Stress (POST without token) ──────────────
  group('Auth Middleware Stress', () => {
    const payload = JSON.stringify({ text: 'Load test message' });
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${BASE_URL}/api/chat/send`, payload, params);

    authCheckLatency.add(res.timings.duration);

    // 401 = auth guard working correctly, 429 = rate limiter working correctly
    const passed = check(res, {
      'auth guard responds correctly (401 or 429)': (r) => r.status === 401 || r.status === 429,
    });

    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── Scenario 3: AI Endpoint Auth Guard ──────────────────────────────────
  group('AI Workout Auth Guard', () => {
    const payload = JSON.stringify({ prompt: 'Generate a push workout' });
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${BASE_URL}/api/ai/workout`, payload, params);

    // Both 401 and 429 are valid security responses
    const passed = check(res, {
      'AI endpoint protected (401 or 429)': (r) => r.status === 401 || r.status === 429,
    });

    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── Scenario 4: Subscription Status Auth Guard ──────────────────────────
  group('Subscription Status Auth Guard', () => {
    const res = http.get(`${BASE_URL}/api/ai/subscription/status`);

    const passed = check(res, {
      'subscription guard responds (401 or 429)': (r) => r.status === 401 || r.status === 429,
    });

    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── Scenario 5: Rate Limiter Verification ───────────────────────────────
  group('Rate Limiter Stress', () => {
    // Fire a burst of rapid requests to trigger the rate limiter
    let got429 = false;
    for (let i = 0; i < 5; i++) {
      const res = http.get(`${BASE_URL}/`);
      rateLimitLatency.add(res.timings.duration);
      if (res.status === 429) {
        got429 = true;
      }
    }
    // Under peak load, rate limiting should kick in for some VUs
    // We don't mark this as an error because 429 is expected behavior
  });

  sleep(Math.random() * 2); // Random sleep 0-2s to simulate real users
}

// ─── Summary Handler ───────────────────────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    total_requests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
    avg_response_time: data.metrics.http_req_duration ? 
      Math.round(data.metrics.http_req_duration.values.avg) + 'ms' : 'N/A',
    p95_response_time: data.metrics.http_req_duration ? 
      Math.round(data.metrics.http_req_duration.values['p(95)']) + 'ms' : 'N/A',
    error_rate: data.metrics.errors ? 
      (data.metrics.errors.values.rate * 100).toFixed(2) + '%' : '0%',
    max_vus: data.metrics.vus_max ? data.metrics.vus_max.values.value : 0,
  };

  console.log('\n════════════════════════════════════════════════════');
  console.log('  FlexAI Load Test Summary');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Total Requests:     ${summary.total_requests}`);
  console.log(`  Avg Response Time:  ${summary.avg_response_time}`);
  console.log(`  P95 Response Time:  ${summary.p95_response_time}`);
  console.log(`  Error Rate:         ${summary.error_rate}`);
  console.log(`  Peak VUs:           ${summary.max_vus}`);
  console.log('════════════════════════════════════════════════════\n');

  return {
    'stdout': JSON.stringify(summary, null, 2),
  };
}
