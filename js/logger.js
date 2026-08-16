/**
 * Blanket Design Generator - Diagnostics & Telemetry Logger
 * Logging is DISABLED by default. Enable via window.BlanketLogger.enable() or localStorage.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'blanket_debug_logging_enabled';
  const MAX_LOGS = 50;

  class BlanketLogger {
    constructor() {
      // Disabled by default
      this.enabled = localStorage.getItem(STORAGE_KEY) === 'true';
      this.logs = [];
    }

    enable() {
      this.enabled = true;
      localStorage.setItem(STORAGE_KEY, 'true');
      console.log('%c[BlanketLogger] Debug logging ENABLED', 'color: #6366f1; font-weight: bold;');
    }

    disable() {
      this.enabled = false;
      localStorage.setItem(STORAGE_KEY, 'false');
      console.log('%c[BlanketLogger] Debug logging DISABLED', 'color: #ef4444; font-weight: bold;');
    }

    toggle() {
      if (this.enabled) this.disable();
      else this.enable();
      return this.enabled;
    }

    _format(level, msg) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
      const entry = { timestamp, level, msg };
      this.logs.unshift(entry);
      if (this.logs.length > MAX_LOGS) this.logs.pop();
      return '[Blanket ' + timestamp + '] [' + level + '] ' + msg;
    }

    debug(msg, ...args) {
      if (!this.enabled) return;
      console.debug('%c' + this._format('DEBUG', msg), 'color: #94a3b8;', ...args);
    }

    info(msg, ...args) {
      if (!this.enabled) return;
      console.info('%c' + this._format('INFO', msg), 'color: #6366f1; font-weight: bold;', ...args);
    }

    warn(msg, ...args) {
      if (!this.enabled) return;
      console.warn('%c' + this._format('WARN', msg), 'color: #f59e0b; font-weight: bold;', ...args);
    }

    error(msg, ...args) {
      console.error('%c' + this._format('ERROR', msg), 'color: #ef4444; font-weight: bold;', ...args);
    }
  }

  window.BlanketLogger = new BlanketLogger();
})();
