/// <reference types="node" />
export class Server extends EventEmitter {
    /**
     * @param {number} port
     * @param {StaticSite | null} staticSite
     */
    constructor(port: number, staticSite: StaticSite | null);
    pathPrefix: string;
    staticContentPrefix: string;
    reqPrefix: string;
    nextReqKey: number;
    indexHtml: string;
    /** @type {Map<number, import('http').IncomingMessage>} */
    reqs: Map<number, import('http').IncomingMessage>;
    port: number;
    staticSite: StaticSite;
    server: import("http").Server;
    serving: Promise<any>;
    serve(): Promise<any>;
    dispose(): Promise<any>;
    /**
     * @param {import('http').IncomingMessage} req
     */
    setReq(req: import('http').IncomingMessage): string;
    /** @type {import('http').RequestListener} */
    requestListener: import('http').RequestListener;
}
import { EventEmitter } from "events";
import { StaticSite } from "@cfworker/dev/src/static-site";
