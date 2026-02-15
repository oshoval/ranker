// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

import { logger, redact } from '@/shared/utils/logger';

describe('logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('respects level: error level only logs error', () => {
    logger.setLevel('error');
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error msg');
  });

  it('respects level: warn level logs warn and error', () => {
    logger.setLevel('warn');
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] warn msg');
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error msg');
  });

  it('respects level: info level logs info, warn, and error', () => {
    logger.setLevel('info');
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info msg');
    expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] warn msg');
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] error msg');
  });

  it('respects level: debug level logs all', () => {
    logger.setLevel('debug');
    logger.debug('debug msg');
    logger.info('info msg');

    expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG] debug msg');
    expect(consoleSpy.info).toHaveBeenCalledWith('[INFO] info msg');
  });

  it('respects level: silent level logs nothing', () => {
    logger.setLevel('silent');
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    expect(consoleSpy.error).not.toHaveBeenCalled();
  });

  it('redacts ghp_ tokens in logged messages', () => {
    logger.setLevel('error');
    logger.error('Failed with token ghp_abcdef123456789012345678901234567890');
    expect(consoleSpy.error).toHaveBeenCalledWith(
      '[ERROR] Failed with token [REDACTED]'
    );
  });

  it('redacts Bearer tokens in logged messages', () => {
    logger.setLevel('error');
    logger.error('Auth: Bearer secret-token-xyz');
    expect(consoleSpy.error).toHaveBeenCalledWith(
      '[ERROR] Auth: Bearer [REDACTED]'
    );
  });
});

describe('redact', () => {
  it('redacts ghp_xxx tokens', () => {
    expect(redact('token ghp_abcdef123456789012345678901234567890')).toBe(
      'token [REDACTED]'
    );
    expect(redact('ghp_abcdefghijklmnopqrstuvwxyz01234567890123')).toBe(
      '[REDACTED]'
    );
  });

  it('redacts ghs_xxx tokens', () => {
    expect(redact('secret ghs_abcdef123456789012345678901234567890')).toBe(
      'secret [REDACTED]'
    );
  });

  it('redacts Bearer tokens', () => {
    expect(redact('Authorization: Bearer secret-token-123')).toBe(
      'Authorization: Bearer [REDACTED]'
    );
    expect(redact('Bearer abc123xyz')).toBe('Bearer [REDACTED]');
  });

  it('redacts multiple tokens in one message', () => {
    const msg =
      'ghp_abcdefghijklmnopqrstuvwxyz01234567890123 and Bearer xyz789 token';
    expect(redact(msg)).toBe('[REDACTED] and Bearer [REDACTED] token');
  });

  it('passes through messages without tokens', () => {
    expect(redact('hello world')).toBe('hello world');
    expect(redact('some log message')).toBe('some log message');
  });
});
