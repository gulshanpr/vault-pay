/**
 * Logging utilities for the VaultPay SDK
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  maxLogs?: number;
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  module?: string;
}

export class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      maxLogs: 1000,
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, module?: string): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const moduleStr = module ? `[${module}]` : '';
    
    return `${timestamp} ${prefix}${moduleStr} [${levelStr}] ${message}`;
  }

  private addLog(level: LogLevel, message: string, data?: any, module?: string): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      module
    };

    this.logs.push(entry);

    // Keep only the latest logs
    if (this.logs.length > this.config.maxLogs!) {
      this.logs = this.logs.slice(-this.config.maxLogs!);
    }
  }

  debug(message: string, data?: any, module?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    this.addLog(LogLevel.DEBUG, message, data, module);

    if (this.config.enableConsole) {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, module);
      console.debug(formatted, data ? data : '');
    }
  }

  info(message: string, data?: any, module?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    this.addLog(LogLevel.INFO, message, data, module);

    if (this.config.enableConsole) {
      const formatted = this.formatMessage(LogLevel.INFO, message, module);
      console.info(formatted, data ? data : '');
    }
  }

  warn(message: string, data?: any, module?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    this.addLog(LogLevel.WARN, message, data, module);

    if (this.config.enableConsole) {
      const formatted = this.formatMessage(LogLevel.WARN, message, module);
      console.warn(formatted, data ? data : '');
    }
  }

  error(message: string, data?: any, module?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    this.addLog(LogLevel.ERROR, message, data, module);

    if (this.config.enableConsole) {
      const formatted = this.formatMessage(LogLevel.ERROR, message, module);
      console.error(formatted, data ? data : '');
    }
  }

  getLogs(level?: LogLevel, module?: string): LogEntry[] {
    let filtered = this.logs;

    if (level !== undefined) {
      filtered = filtered.filter(log => log.level >= level);
    }

    if (module) {
      filtered = filtered.filter(log => log.module === module);
    }

    return filtered;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLevel(): LogLevel {
    return this.config.level;
  }
}

// Default logger instance
export const logger = new Logger({
  level: LogLevel.INFO,
  prefix: 'VaultPay',
  enableConsole: true
});

// Module-specific loggers
export const createModuleLogger = (module: string, level?: LogLevel) => {
  return new Logger({
    level: level || LogLevel.INFO,
    prefix: `VaultPay:${module}`,
    enableConsole: true
  });
};

// Performance logging utilities
export class PerformanceLogger {
  private timers: Map<string, number> = new Map();

  start(label: string): void {
    this.timers.set(label, performance.now());
    logger.debug(`Performance timer started: ${label}`);
  }

  end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Performance timer not found: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    logger.info(`Performance timer completed: ${label} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  measure<T>(label: string, fn: () => T): T;
  measure<T>(label: string, fn: () => Promise<T>): Promise<T>;
  measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(label);
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          this.end(label);
        });
      } else {
        this.end(label);
        return result;
      }
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

export const performanceLogger = new PerformanceLogger();