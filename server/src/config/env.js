const dotenv = require('dotenv');
const { z } = require('zod');

// Load environment variables from .env file if available
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/hmwebdoctor'),
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SCAN_TIMEOUT_MS: z.coerce.number().default(30000),
  SCAN_CONNECT_TIMEOUT_MS: z.coerce.number().default(5000),
  MAX_SCAN_RESPONSE_BYTES: z.coerce.number().default(5242880),
  MAX_LINK_CHECKS: z.coerce.number().default(25),
  MAX_REDIRECTS: z.coerce.number().default(5),
  SCAN_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  SCAN_RATE_LIMIT_MAX: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  TRUST_PROXY: z.string().default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  throw new Error('Environment variable validation failed');
}

const config = Object.freeze(parsed.data);

module.exports = config;
