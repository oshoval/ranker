// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function getDefaultLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LEVELS) {
    return envLevel;
  }
  if (process.env.NODE_ENV === 'test') return 'warn';
  if (process.env.NODE_ENV === 'production') return 'warn';
  return 'info';
}

const TOKEN_PATTERN = /gh[ps]_[A-Za-z0-9_]{36,}/g;
const BEARER_PATTERN = /Bearer\s+\S+/gi;

function redact(message: string): string {
  return message
    .replace(TOKEN_PATTERN, '[REDACTED]')
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]');
}

function redactArg(arg: unknown): unknown {
  if (typeof arg === 'string') return redact(arg);
  if (arg instanceof Error) {
    const clone = new Error(redact(arg.message));
    clone.name = arg.name;
    if (arg.stack) clone.stack = redact(arg.stack);
    return clone;
  }
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.parse(redact(JSON.stringify(arg)));
    } catch {
      return arg;
    }
  }
  return arg;
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = getDefaultLevel();
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[this.level];
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${redact(message)}`, ...args.map(redactArg));
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${redact(message)}`, ...args.map(redactArg));
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${redact(message)}`, ...args.map(redactArg));
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${redact(message)}`, ...args.map(redactArg));
    }
  }
}

export const logger = new Logger();
export { redact };
export type { LogLevel };
