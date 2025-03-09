import { describe, it, expect } from 'vitest';
import { setupMcpClientTest } from './mcp-client';

describe('Mock MCP Server', () => {
    // Set up the client that connects to our mock server
    const getClient = setupMcpClientTest('test/mock-server.ts');

    it('should list available tools', async () => {
        const client = getClient();
        const tools = await client.listTools();

        expect(tools).toBeDefined();
        expect(tools.tools).toBeInstanceOf(Array);
        expect(tools.tools.length).toBeGreaterThanOrEqual(3);

        // Check if our tools are in the list
        const toolNames = tools.tools.map((tool: any) => tool.name);
        expect(toolNames).toContain('Hello');
        expect(toolNames).toContain('get_forecast');
        expect(toolNames).toContain('get_alerts');
    });

    it('should call the Hello tool', async () => {
        const client = getClient();
        const result = await client.callTool({
            name: 'Hello',
            arguments: {
                name: 'Test User',
            },
        });

        expect(result).toBeDefined();
        expect(result.content).toBeInstanceOf(Array);
        expect(result.content.length).toBeGreaterThanOrEqual(1);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toBe('Hello, Test User!');
    });

    it('should call the get_forecast tool', async () => {
        const client = getClient();
        const result = await client.callTool({
            name: 'get_forecast',
            arguments: {
                latitude: 37.7749,
                longitude: -122.4194,
            },
        });

        expect(result).toBeDefined();
        expect(result.content).toBeInstanceOf(Array);
        expect(result.content.length).toBeGreaterThanOrEqual(1);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('Weather forecast for location');
        expect(result.content[0].text).toContain('37.7749');
        expect(result.content[0].text).toContain('-122.4194');
    });

    it('should call the get_alerts tool', async () => {
        const client = getClient();
        const result = await client.callTool({
            name: 'get_alerts',
            arguments: {
                state: 'CA',
            },
        });

        expect(result).toBeDefined();
        expect(result.content).toBeInstanceOf(Array);
        expect(result.content.length).toBeGreaterThanOrEqual(1);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('Weather alerts for CA');
        expect(result.content[0].text).toContain('Heat advisory');
    });

    it('should handle errors for invalid tool arguments', async () => {
        const client = getClient();

        await expect(client.callTool({
            name: 'get_forecast',
            arguments: {
                latitude: 100, // Invalid latitude (> 90)
                longitude: -122.4194,
            },
        })).rejects.toThrow();
    });
}); 