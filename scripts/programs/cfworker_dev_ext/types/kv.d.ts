/**
 * @typedef {object} KVItem
 * @property {string} key
 * @property {string} value
 * @property {boolean} base64
 */
/**
 * @typedef {object} KVNamespaceInit
 * @property {string} name
 * @property {KVItem[]} items
 */
export class KV extends EventEmitter {
    /**
     * @param {string[]} filenames
     * @param {boolean} [watch]
     */
    constructor(filenames: string[], watch?: boolean);
    debounceHandle: NodeJS.Timeout;
    /** @type {KVNamespaceInit[]} */
    namespaces: KVNamespaceInit[];
    filenames: string[];
    watch: boolean;
    init(): Promise<void>;
    watcher: any;
    read(): Promise<void>;
    dispose(): void;
}
export type KVItem = {
    key: string;
    value: string;
    base64: boolean;
};
export type KVNamespaceInit = {
    name: string;
    items: KVItem[];
};
import { EventEmitter } from "events";
