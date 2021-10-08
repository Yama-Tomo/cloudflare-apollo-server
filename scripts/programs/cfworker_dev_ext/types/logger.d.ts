/**
 * Set the logger implementation.
 * @param {Logger} value
 */
export function setLogger(value: Logger): void;
/**
 * @param {number} time
 */
export function prettifyTime(time: number): string;
/**
 * @typedef {object} Logger
 * @property {(...args: any[]) => void} log
 * @property {(message: string) => void} info
 * @property {(message: string) => void} progress
 * @property {(message: string, time?: number) => void} success
 * @property {(message: string) => void} warn
 * @property {(err: any) => void} error
 */
export class ConsoleLogger {
    spinner: any;
    /**
     * @param {string} message
     */
    progress(message: string): void;
    /**
     * @param {any[]} args
     */
    log(...args: any[]): void;
    /**
     * @param {string} message
     */
    info(message: string): void;
    /**
     * @param {string} message
     * @param {number} [time]
     */
    success(message: string, time?: number): void;
    /**
     * @param {string} message
     */
    warn(message: string): void;
    /**
     * @param {any} err
     */
    error(err: any): void;
}
/**
 * The current logger.
 * @type {Logger}
 */
export let logger: Logger;
export type Logger = {
    log: (...args: any[]) => void;
    info: (message: string) => void;
    progress: (message: string) => void;
    success: (message: string, time?: number) => void;
    warn: (message: string) => void;
    error: (err: any) => void;
};
