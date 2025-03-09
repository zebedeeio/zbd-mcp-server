# MCP Tools

This is a modular toolkit for creating MCP (Model Context Protocol) tools. Each tool is a standalone executable that can be used independently.

https://github.com/modelcontextprotocol/typescript-sdk

## Prerequisites

- Node.js 23+ (or Bun/Deno/Anything that supports running .ts files)
- Bun (for building executables)

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

## Project Structure

This project demonstrates a modular approach to building MCP tools:

- Each tool is defined in its own TypeScript file in the `src` directory
- Each tool can be built into a standalone executable in the `bin` directory
- The main `index.ts` provides a simple "Hello World" example

### Available Tools

1. **Hello** (`src/index.ts`): A simple greeting tool
2. **Weather** (`src/weather.ts`): Get weather alerts for a state
3. **Blog** (`src/blog.ts`): Tools for blog post creation and frontmatter generation

## Creating Your Own Tool

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
pnpm build:hello
pnpm build:weather
pnpm build:blog
```

The resulting executables will be in the `bin` directory and can be run directly:

```bash
./bin/mcp-hello
./bin/mcp-weather
./bin/mcp-blog
```

## Cursor Notes

When using these tools with Cursor, always use the full path to the executable:

```
/path/to/your/project/bin/mcp-hello
/path/to/your/project/bin/mcp-weather
/path/to/your/project/bin/mcp-blog
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

