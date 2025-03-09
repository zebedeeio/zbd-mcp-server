import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create a mock MCP server for testing
const server = new McpServer({
    name: 'mock-server',
    version: '1.0.0',
});

// Register a simple "hello" tool
server.tool(
    'Hello',
    'Get a greeting with your name',
    {
        name: z.string().describe('Your name'),
    },
    async ({ name }) => {
        return {
            content: [
                {
                    type: 'text',
                    text: `Hello, ${name}!`,
                },
            ],
        };
    }
);

// Register a "get_forecast" tool
server.tool(
    'get_forecast',
    'Get weather forecast for a location',
    {
        latitude: z.number().min(-90).max(90).describe('Latitude of the location'),
        longitude: z.number().min(-180).max(180).describe('Longitude of the location'),
    },
    async ({ latitude, longitude }) => {
        // This is a mock implementation
        return {
            content: [
                {
                    type: 'text',
                    text: `Weather forecast for location (${latitude}, ${longitude}): Sunny, 75°F`,
                },
            ],
        };
    }
);

// Register a "get_alerts" tool
server.tool(
    'get_alerts',
    'Get weather alerts for a state',
    {
        state: z.string().min(2).max(2).describe('Two-letter state code (e.g. CA, NY)'),
    },
    async ({ state }) => {
        // This is a mock implementation
        const alerts = state === 'CA'
            ? ['Heat advisory in effect until 8 PM', 'Air quality alert until tomorrow morning']
            : ['No alerts for this state'];

        return {
            content: [
                {
                    type: 'text',
                    text: `Weather alerts for ${state}: ${alerts.join(', ')}`,
                },
            ],
        };
    }
);

// Start the server using stdio transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Mock MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 