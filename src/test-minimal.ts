/**
 * Minimal scheduler test entry point
 */

import cron from 'node-cron';
import { logger } from './utils/logger';

console.log('Starting minimal scheduler test...');

// Simple cron task
cron.schedule('* * * * *', () => {
  console.log('MINIMAL CRON FIRED at', new Date().toISOString());
});

console.log('Cron scheduled, waiting...');

// Keep process alive
setInterval(() => {
  console.log('Still alive at', new Date().toISOString());
}, 60000);
