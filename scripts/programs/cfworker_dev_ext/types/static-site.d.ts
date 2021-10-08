export class StaticSite extends EventEmitter {
    /**
     * @param {string | null} [directory]
     * @param {boolean} [watch]
     */
    constructor(directory?: string | null, watch?: boolean);
    debounceHandle: NodeJS.Timeout;
    ignored: string[];
    /** @type {Record<string, string>} */
    manifest: Record<string, string>;
    /** @type {Record<string, string>} */
    files: Record<string, string>;
    directory: string;
    watch: boolean;
    init(): Promise<void>;
    watcher: any;
    read(): Promise<void>;
    dispose(): void;
}
import { EventEmitter } from "events";
