import { EventEmitter } from 'events';
import { WorkerHost } from './worker-host';

export interface CustomBundler extends EventEmitter {
  bundle(): Promise<void>;
  bundled: Promise<void>;
  code: string;
  dispose(): void;
}

export interface CustomTestHost extends EventEmitter {
  workerHost: WorkerHost;
  start(): Promise<void>;
  runTests(code: string, manifest: Record<string, string> | null): Promise<unknown>;
  dispose(): void;
}
