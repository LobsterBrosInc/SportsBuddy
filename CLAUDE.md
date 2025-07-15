# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start all services concurrently (client, server, mcp-server)
- `npm run dev:server` - Start only the Express.js backend (port 3001)
- `npm run dev:client` - Start only the React frontend (port 3000)
- `npm run dev:mcp` - Start only the MCP server

### Build & Test
- `npm run build` - Build all services for production
- `npm run test` - Run all test suites across services
- `npm run lint` - Lint all TypeScript/JavaScript code
- `npm run format` - Format code with Prettier

### Individual Service Commands
- `cd server && npm run test:watch` - Run server tests in watch mode
- `cd client && npm test` - Run React tests
- `cd mcp-server && npm run test:example` - Test MCP server functionality

## Architecture Overview

This is a monorepo with four main components:

### 1. Root Package (`/`)
- Orchestrates all services via concurrently
- Shared ESLint and Prettier configuration
- Contains unified npm scripts for development workflow

### 2. Express.js Backend (`/server/`)
- **Port**: 3001
- **Framework**: Express.js with TypeScript
- **Key Dependencies**: cors, helmet, winston, express-rate-limit
- **Architecture**: Controllers → Services → MCP Client
- **Main Entry**: `src/index.ts`
- **API Base**: `/api`

### 3. React Frontend (`/client/`)
- **Port**: 3000 (Create React App)
- **Framework**: React 18 with TypeScript
- **Key Dependencies**: axios, react-router-dom, date-fns
- **Proxy**: Configured to proxy API calls to localhost:3001
- **Main Entry**: `src/App.tsx`

### 4. MCP Server (`/mcp-server/`)
- **Purpose**: Model Context Protocol server for MLB API integration
- **Type**: ES modules (`"type": "module"`)
- **LLM Integration**: Anthropic Claude or OpenAI GPT-4 for intelligent analysis
- **Key Features**: AI-powered game analysis, pitcher matchups, team momentum

### 5. Shared Types (`/shared/`)
- **Purpose**: Common TypeScript interfaces used across all services
- **Key Types**: Game, Team, Player, GamePreview, APIResponse

## Data Flow Architecture

1. **Client** → API requests to **Server** (port 3001)
2. **Server** → Communicates with **MCP Server** via stdio
3. **MCP Server** → Fetches from MLB Stats API + LLM analysis
4. **Response chain**: MCP → Server → Client

## Key Configuration

### Environment Variables
- MLB API: `https://statsapi.mlb.com/api/v1`
- Giants Team ID: `137`
- LLM Provider: `anthropic` or `openai` (for MCP server)

### Port Allocation
- Client: 3000
- Server: 3001
- MCP Server: stdio communication

## MLB API Integration

The MCP server handles all MLB API communication with:
- **Rate limiting**: Respectful API usage with User-Agent headers
- **Caching**: 5-minute TTL to reduce API calls
- **Error handling**: Graceful fallbacks for API failures
- **LLM Enhancement**: AI analysis layered on top of raw MLB data

## Type Safety

The project uses strict TypeScript across all services:
- Shared types in `/shared/types.ts` for cross-service consistency
- Server-specific types in `/server/src/types.ts`
- Client-specific types in `/client/src/types.ts`
- MCP-specific types in `/mcp-server/src/types.ts`

## Testing Strategy

- **Server**: Jest with supertest for API testing
- **Client**: React Testing Library with Jest
- **MCP**: Custom test examples for MCP protocol validation
- **Integration**: Full stack tests via client → server → mcp chain

## Development Workflow

1. `npm run install:all` - Install all dependencies
2. `npm run dev` - Start all services
3. Client available at http://localhost:3000
4. API available at http://localhost:3001/api
5. `npm run lint && npm run test` - Validate before commits

## MCP Server Intelligence

The MCP server provides AI-enhanced baseball analysis:
- **Professional Analysis**: LLM-generated expert insights
- **Pitcher Matchups**: Strategic analysis of starter vs team performance
- **Team Momentum**: AI assessment of recent performance trends
- **Game Previews**: Comprehensive pre-game analysis with predictions

Configure LLM provider via environment variables in `/mcp-server/.env`.