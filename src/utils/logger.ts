/**
 * Production-safe logger
 *
 * In dev (import.meta.env.DEV): passes through to console.log/warn/info.
 * In production: log/warn/info silently no-op — nothing a customer-facing
 * browser console should ever have shown. console.error always logs,
 * since errors are the one thing worth seeing even in production.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.log('message', data);   // dev only
 *   logger.warn('message');        // dev only
 *   logger.error('message', err);  // always logs
 */

const noop = (...args: unknown[]): void => {
  void args;
};

export const logger = {
  log: import.meta.env.DEV ? console.log.bind(console) : noop,
  warn: import.meta.env.DEV ? console.warn.bind(console) : noop,
  error: console.error.bind(console), // always log errors
  info: import.meta.env.DEV ? console.info.bind(console) : noop,
};
