# ZBD MCP Server

Add Bitcoin powers to your LLM.

## Base SDK

This MCP server uses the official TypeScript SDK -- https://github.com/modelcontextprotocol/typescript-sdk

## Prerequisites

- Node.js 23+ (or Bun/Deno/Anything that supports running .ts files)
- Bun (for building executables)
- ZBD API key for payment processing

## ZBD Setup

Get your API key from the ZBD Developer Dashboard and put it in a new `.env` file under `ZBD_API_KEY=XXXXXXXXXXXX` (check `.env.example` for an example).

Once that's done run the `pnpm build` command and setup the MCP server on your client (e.g. Claude Desktop or Cursor).

## Installing Bun

If you don't have Bun installed, you can install it using one of the following methods:

### macOS and Linux

```bash
# Using curl (recommended)
curl -fsSL https://bun.sh/install | bash

# Using Homebrew
brew install oven-sh/bun/bun

# Using npm
npm install -g bun
```

### Windows

```bash
# Using PowerShell
powershell -c "irm bun.sh/install.ps1|iex"

# Using npm
npm install -g bun

# Using Scoop
scoop install bun
```

Verify your installation by running:

```bash
bun --version
```

## Installation

```bash
pnpm install
```

## Troubleshooting

- Use `ps aux | grep mcp-zbd | grep -v grep` to list all running ZBD MCP Server instances.
- Use `pkill -f mcp-zbd` to kill any duplicate ZBD MCP Server instances that may linger.

## Project Structure

This project demonstrates a modular approach to building MCP tools:

- Each tool is defined in its own TypeScript file in the `src` directory
- Each tool can be built into a standalone executable in the `bin` directory
- The main `index.ts` provides the actual tooling implementation

### Available Tools

1. **ZBD** (`src/zbd.ts`): ZBD API for global Bitcoin Lightning payments

## Creating New Tool

To create a new tool:

1. Create a new TypeScript file in the `src` directory (e.g., `src/mytool.ts`)
2. Use the existing tools as templates
3. Add a build script to `package.json`:

```json
"build:mytool": "mkdir -p bin && bun build src/mytool.ts --compile --minify --sourcemap --outfile bin/mcp-mytool"
```

4. Update the `build:all` script to include your new tool

## Usage

### Building Executables

```bash
# Build all tools
pnpm build

# Build a specific tool
pnpm build:zbd
```

The resulting executables will be in the `bin` directory and can be run directly:

```bash
./bin/mcp-zbd
```

## Cursor Notes

When using these tools with Cursor, always use the full path to the executable:

```
/path/to/your/project/bin/mcp-zbd
```

Alternatively, you can run the TypeScript files directly with Node:

```
/path/to/node ~/path/to/project/src/index.ts
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```
