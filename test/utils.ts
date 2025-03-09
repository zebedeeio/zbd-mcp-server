import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ChildProcess, spawn } from 'node:child_process';
import { join } from 'node:path';
import { afterAll, beforeAll } from 'vitest';
import { Readable, Writable } from 'node:stream';

/**
 * A custom transport for testing MCP servers that uses direct stream connections
 * instead of spawning a child process.
 */
export class TestTransport {
    private stdin: Writable;
    private stdout: Readable;
    private process: ChildProcess | null = null;
    private serverPath: string;

    constructor(serverPath: string) {
        this.serverPath = serverPath;
    }

    async connect(): Promise<void> {
        // Spawn the server process
        this.process = spawn('node', [this.serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!this.process.stdin || !this.process.stdout) {
            throw new Error('Failed to create process streams');
        }

        this.stdin = this.process.stdin;
        this.stdout = this.process.stdout;

        // Set up error handling
        this.process.on('error', (err) => {
            console.error('Server process error:', err);
        });

        this.process.stderr?.on('data', (data) => {
            console.error(`Server stderr: ${data.toString()}`);
        });

        // Wait a bit for the server to start
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    async disconnect(): Promise<void> {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    async sendMessage(message: any): Promise<void> {
        const messageStr = JSON.stringify(message) + '\n';
        return new Promise<void>((resolve, reject) => {
            this.stdin.write(messageStr, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async receiveMessage(): Promise<any> {
        return new Promise<any>((resolve) => {
            const onData = (data: Buffer) => {
                const message = JSON.parse(data.toString());
                this.stdout.removeListener('data', onData);
                resolve(message);
            };

            this.stdout.on('data', onData);
        });
    }
}

/**
 * Creates a test client for an MCP server.
 * 
 * @param serverPath Path to the server script
 * @returns A setup object with the client and cleanup function
 */
export async function createTestClient(serverPath: string) {
    const absoluteServerPath = join(process.cwd(), serverPath);
    const transport = new TestTransport(absoluteServerPath);

    await transport.connect();

    const client = {
        async callTool(name: string, args: Record<string, any>) {
            await transport.sendMessage({
                jsonrpc: '2.0',
                id: '1',
                method: 'tools/call',
                params: {
                    name,
                    arguments: args
                }
            });

            return await transport.receiveMessage();
        },

        async listTools() {
            await transport.sendMessage({
                jsonrpc: '2.0',
                id: '1',
                method: 'tools/list',
                params: {}
            });

            return await transport.receiveMessage();
        }
    };

    const cleanup = async () => {
        await transport.disconnect();
    };

    return { client, cleanup };
}

/**
 * Test fixture for MCP server tests
 */
export function setupMcpServerTest(serverPath: string) {
    let client: any;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
        const setup = await createTestClient(serverPath);
        client = setup.client;
        cleanup = setup.cleanup;
    });

    afterAll(async () => {
        await cleanup();
    });

    return () => client;
} 