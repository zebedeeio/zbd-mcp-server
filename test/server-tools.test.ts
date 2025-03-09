import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupMcpClientTest } from './mcp-client.js';

describe('MCP Server Tools', () => {
    describe('Hello tool', () => {
        // Set up the client that connects to our server with the Hello tool
        const getClient = setupMcpClientTest('src/hello.ts');

        it('should return a greeting with the provided name', async () => {
            const client = getClient();

            const result = await client.callTool({
                name: 'Hello',
                arguments: {
                    name: 'Test User',
                },
            });

            // Verify the response content
            expect(result).toBeDefined();
            expect(result.content).toBeInstanceOf(Array);
            expect(result.content.length).toBe(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toBe('Hello, Test User! Welcome to MCP Tools.');
        });
    });

    describe('get_alerts tool', () => {
        // Set up the client that connects to our weather server
        const getClient = setupMcpClientTest('src/weather.ts');

        it('should return alerts for a valid state', async () => {
            const client = getClient();

            const result = await client.callTool({
                name: 'get_alerts',
                arguments: {
                    state: 'CA',
                },
            });

            // Verify the response content
            expect(result).toBeDefined();
            expect(result.content).toBeInstanceOf(Array);
            expect(result.content.length).toBe(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toContain('Weather Alerts for CA:');
            expect(result.content[0].text).toContain('Wildfire warning in Northern California');
            expect(result.content[0].text).toContain('Heat advisory in Southern California');
        });

        it('should handle unknown states', async () => {
            const client = getClient();

            const result = await client.callTool({
                name: 'get_alerts',
                arguments: {
                    state: 'XX', // Non-existent state
                },
            });

            expect(result).toBeDefined();
            expect(result.content).toBeInstanceOf(Array);
            expect(result.content.length).toBe(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toContain('Weather Alerts for XX:');
            expect(result.content[0].text).toContain('No current alerts for this state');
        });
    });

    describe('get_frontmatter tool', () => {
        // Set up the client that connects to our blog server
        const getClient = setupMcpClientTest('src/blog.ts');

        // Mock date for consistent testing
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2023-01-01'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should generate frontmatter with minimal parameters', async () => {
            const client = getClient();

            const result = await client.callTool({
                name: 'get_frontmatter',
                arguments: {
                    content: '# Test Post\n\nThis is a test post.',
                },
            });

            expect(result).toBeDefined();
            expect(result.content).toBeInstanceOf(Array);
            expect(result.content.length).toBe(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toContain('title: "Test Post"');
            expect(result.content[0].text).toContain('author: "Anonymous"');
            expect(result.content[0].text).toMatch(/date: "\d{4}-\d{2}-\d{2}"/);
            expect(result.content[0].text).toContain('tags: []');
            expect(result.content[0].text).toContain('# Test Post');
        });

        it('should generate frontmatter with all parameters', async () => {
            const client = getClient();

            const result = await client.callTool({
                name: 'get_frontmatter',
                arguments: {
                    content: '# Custom Title in Content\n\nThis is a test post.',
                    title: 'Explicit Title',
                    author: 'Test Author',
                    tags: ['test', 'example'],
                },
            });

            expect(result).toBeDefined();
            expect(result.content).toBeInstanceOf(Array);
            expect(result.content.length).toBe(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toContain('title: "Explicit Title"');
            expect(result.content[0].text).toContain('author: "Test Author"');
            expect(result.content[0].text).toMatch(/date: "\d{4}-\d{2}-\d{2}"/);
            expect(result.content[0].text).toContain('tags: ["test", "example"]');
            expect(result.content[0].text).toContain('# Custom Title in Content');
        });
    });
}); 