const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { enforceHttps } = require('./src/middleware/httpsRedirect');
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

dotenv.config();

const app = express();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

// Security Middleware
app.use(enforceHttps);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' })); // prevent large payloads

// Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Basic Route
app.get('/', (req, res) => {
  res.send('FlexAI Secure AI Proxy is running...');
});

// Routes
app.use('/api/chat', require('./src/routes/chat.routes'));
app.use('/api/ai', require('./src/routes/ai.routes'));

// The error handler must be registered before any other error middleware and after all controllers
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FlexAI AI Proxy running on port ${PORT}`);
});

// Keep process alive
setInterval(() => {}, 60000);
