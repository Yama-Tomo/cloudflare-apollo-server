export class WorkerHost extends EventEmitter {
    /**
     * @param {number} port
     * @param {boolean} inspect
     * @param {StaticSite | null} site
     * @param {KV} kv
     */
    constructor(port: number, inspect: boolean, site: StaticSite | null, kv: KV);
    /** @type {import('puppeteer').Browser | undefined} */
    browser: import('puppeteer').Browser | undefined;
    /** @type {string|null} */
    localIP: string | null;
    port: number;
    inspect: boolean;
    server: Server;
    kv: KV;
    /** @type {Promise<import('puppeteer').Page>} */
    pageReady: Promise<import('puppeteer').Page>;
    resolvePage: (value: import("puppeteer").Page | PromiseLike<import("puppeteer").Page>) => void;
    dispose(): void;
    start(): Promise<void>;
    /**
     * @param {string} code The worker script.
     * @param {string} sourcePathname Where to list the script in the chrome devtools sources tree.
     * @param {string[]} globals Names of additional globals to expose.
     * @param {Record<string, string> | null} staticContentManifest Workers site manifest.
     * @param {import('./kv').KVNamespaceInit[]} kvNamespaces
     */
    setWorkerCode(code: string, sourcePathname?: string, globals?: string[], staticContentManifest?: Record<string, string> | null, kvNamespaces?: import('./kv').KVNamespaceInit[]): Promise<void>;
    reloadPage(): Promise<void>;
    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    handleRequestWithWorker: (req: import('http').IncomingMessage, res: import('http').ServerResponse) => Promise<void>;
    /**
     * @param {import('puppeteer').Page} page
     */
    forkConsoleLog(page: import('puppeteer').Page): Promise<void>;
}
import { EventEmitter } from "events";
import { Server } from "./server";
import { KV } from "./kv";
import { StaticSite } from "./static-site";
