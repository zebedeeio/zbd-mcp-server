import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'node:child_process';
import { afterAll, beforeAll } from 'vitest';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';

/**
 * A custom transport for testing MCP servers
 */
class TestClientTransport {
    private process: ReturnType<typeof spawn> | null = null;
    private serverPath: string;
    private messageHandlers: Map<string, (response: any) => void> = new Map();
    private nextId = 1;

    constructor(serverPath: string) {
        this.serverPath = serverPath;
    }

    async connect(): Promise<void> {
        this.process = spawn('node', [this.serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!this.process.stdin || !this.process.stdout) {
            throw new Error('Failed to create process streams');
        }

        // Set up error handling
        this.process.on('error', (err) => {
            console.error('Server process error:', err);
        });

        this.process.stderr?.on('data', (data) => {
            console.error(`Server stderr: ${data.toString()}`);
        });

        // Set up message handling
        this.process.stdout.on('data', (data) => {
            try {
                const message = JSON.parse(data.toString());
                const handler = this.messageHandlers.get(message.id);
                if (handler) {
                    handler(message);
                    this.messageHandlers.delete(message.id);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
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

    async sendRequest(method: string, params: any): Promise<any> {
        if (!this.process?.stdin) {
            throw new Error('Transport not connected');
        }

        const id = String(this.nextId++);
        const request = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };

        return new Promise<any>((resolve, reject) => {
            this.messageHandlers.set(id, (response) => {
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });

            this.process!.stdin!.write(JSON.stringify(request) + '\n');
        });
    }
}

/**
 * Creates an MCP client for testing that connects to a server via child process
 * 
 * @param serverPath Path to the server script
 * @returns A setup object with the client and cleanup function
 */
export async function createMcpClient(serverPath: string) {
    const absoluteServerPath = join(process.cwd(), serverPath);
    const transport = new TestClientTransport(absoluteServerPath);

    await transport.connect();

    // Create a simplified client that uses our custom transport
    const client = {
        async listTools() {
            return transport.sendRequest('tools/list', {});
        },

        async callTool({ name, arguments: args }: { name: string, arguments: Record<string, any> }) {
            return transport.sendRequest('tools/call', {
                name,
                arguments: args
            });
        },

        async disconnect() {
            await transport.disconnect();
        }
    };

    const cleanup = async () => {
        await client.disconnect();
    };

    return { client, cleanup };
}

/**
 * Test fixture for MCP server tests using our custom client
 */
export function setupMcpClientTest(serverPath: string) {
    let client: any;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
        const setup = await createMcpClient(serverPath);
        client = setup.client;
        cleanup = setup.cleanup;
    });

    afterAll(async () => {
        await cleanup();
    });

    return () => client;
} 