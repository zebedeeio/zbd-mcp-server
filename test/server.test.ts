import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupMcpClientTest } from './mcp-client.js';
describe('MCP Tools Server', () => {
    // Set up the client that connects to our server
    const getClient = setupMcpClientTest('src/hello.ts');

    it('should list available tools', async () => {
        const client = getClient();
        const tools = await client.listTools();

        expect(tools).toBeDefined();
        expect(tools.tools).toBeInstanceOf(Array);

        // Check if our tools are in the list
        const toolNames = tools.tools.map((tool: any) => tool.name);
        expect(toolNames).toContain('Hello');
    });

    describe('Hello tool', () => {
        it('should validate required parameters', async () => {
            const client = getClient();

            // Missing required parameters should throw
            await expect(client.callTool({
                name: 'Hello',
                arguments: {
                    // Missing name
                },
            })).rejects.toThrow();
        });

        it('should return a greeting with the provided name', async () => {
            const client = getClient();

            const result = await client.callTool({
                name: 'Hello',
                arguments: {
                    name: 'John',
                },
            });

            expect(result).toBeDefined();
            expect(result.content).toBeInstanceOf(Array);
            expect(result.content.length).toBe(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toBe('Hello, John! Welcome to MCP Tools.');
        });
    });
});

describe('Weather MCP Tool Server', () => {
    // Set up the client that connects to our weather server
    const getClient = setupMcpClientTest('src/weather.ts');

    it('should list available tools', async () => {
        const client = getClient();
        const tools = await client.listTools();

        expect(tools).toBeDefined();
        expect(tools.tools).toBeInstanceOf(Array);

        // Check if our tools are in the list
        const toolNames = tools.tools.map((tool: any) => tool.name);
        expect(toolNames).toContain('get_alerts');
    });

    describe('get_alerts tool', () => {
        it('should validate required parameters', async () => {
            const client = getClient();

            // Missing required parameters should throw
            await expect(client.callTool({
                name: 'get_alerts',
                arguments: {
                    // Missing state
                },
            })).rejects.toThrow();
        });

        it('should return alerts for a valid state', async () => {
            const client = getClient();

            const result = await client.callTool({
                name: 'get_alerts',
                arguments: {
                    state: 'CA',
                },
            });

            expect(result).toBeDefined();
            expect(result.content).toBeInstanceOf(Array);
            expect(result.content.length).toBe(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toContain('Weather Alerts for CA:');
            expect(result.content[0].text).toContain('Wildfire warning');
            expect(result.content[0].text).toContain('Heat advisory');
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
});

describe('Blog MCP Tool Server', () => {
    // Set up the client that connects to our blog server
    const getClient = setupMcpClientTest('src/blog.ts');

    it('should list available tools', async () => {
        const client = getClient();
        const tools = await client.listTools();

        expect(tools).toBeDefined();
        expect(tools.tools).toBeInstanceOf(Array);

        // Check if our tools are in the list
        const toolNames = tools.tools.map((tool: any) => tool.name);
        expect(toolNames).toContain('get_frontmatter');
        expect(toolNames).toContain('create_blog_post');
    });

    describe('get_frontmatter tool', () => {
        // Mock date for consistent testing
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2023-01-01'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should validate required parameters', async () => {
            const client = getClient();

            // Missing required parameters should throw
            await expect(client.callTool({
                name: 'get_frontmatter',
                arguments: {
                    // Missing content
                },
            })).rejects.toThrow();
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
            // Check for date in ISO format (YYYY-MM-DD) instead of specific date
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
            // Check for date in ISO format (YYYY-MM-DD) instead of specific date
            expect(result.content[0].text).toMatch(/date: "\d{4}-\d{2}-\d{2}"/);
            expect(result.content[0].text).toContain('tags: ["test", "example"]');
            expect(result.content[0].text).toContain('# Custom Title in Content');
        });
    });
}); 