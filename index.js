// SUKz Bot — Entry point for wispbyte
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file if present
const envPath = resolve(__dirname, '.env');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// Default PORT if not provided by host
if (!process.env.PORT) process.env.PORT = '3000';

// Start the bot
import('./artifacts/api-server/dist/index.mjs').catch(err => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
