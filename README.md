# SF Giants Baseball Game Preview App

A comprehensive Node.js application for previewing SF Giants baseball games with detailed analytics, predictions, and real-time data integration.

## 🏟️ Features

- **🧠 AI-Powered Analysis**: LLM-generated professional baseball insights using Anthropic Claude or OpenAI GPT-4
- **⚡ Real-time Game Data**: Live game schedules, scores, and statistics from MLB Stats API
- **📊 Intelligent Game Previews**: AI-analyzed strategic breakdowns with expert predictions
- **🎯 Smart Matchup Analysis**: LLM-powered pitcher vs team analysis with strategic insights
- **📈 Team Momentum Tracking**: AI assessment of performance trends and team direction
- **🏥 Injury Impact Analysis**: Intelligent evaluation of how injuries affect team performance
- **🏟️ Modern UI**: Responsive React frontend with TypeScript
- **🤖 Dual MCP Integration**: Both basic and intelligent MCP servers for different use cases
- **🔌 RESTful API**: Express.js backend with comprehensive endpoints
- **📝 Shared Types**: TypeScript interfaces shared across all services
- **🛠️ Development Tools**: ESLint, Prettier, Jest testing framework

## 🏗️ Project Structure

```
giants-preview-app/
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   └── types.ts       # Server-specific types
│   ├── package.json
│   └── tsconfig.json
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app component
│   │   ├── api.ts         # API client
│   │   └── types.ts       # Client-specific types
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── mcp-server/            # MCP server for MLB data
│   ├── src/
│   │   ├── index.ts       # MCP server entry point
│   │   ├── mlb-api.ts     # MLB API client
│   │   ├── analytics.ts   # Data analysis engine
│   │   └── types.ts       # MCP-specific types
│   ├── package.json
│   └── tsconfig.json
├── shared/                # Shared TypeScript types
│   ├── types.ts           # Common interfaces
│   ├── package.json
│   └── tsconfig.json
├── package.json           # Root package.json
├── .env.example           # Environment variables template
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd giants-preview-app
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development servers**
```bash
npm run dev
```

This will start all services concurrently:
- Client: http://localhost:3000
- Server: http://localhost:3001
- MCP Server: Available via stdio

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# MLB API Configuration
MLB_API_BASE_URL=https://statsapi.mlb.com/api/v1
GIANTS_TEAM_ID=137

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Client Configuration
REACT_APP_API_URL=http://localhost:3001

# MCP Server Configuration
MCP_SERVER_NAME=giants-mcp-server
USER_AGENT=giants-app/1.0
API_TIMEOUT=5000

# Intelligent MCP Server (LLM Analysis)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Caching
CACHE_ENABLED=true
CACHE_TTL=300000

# Logging
LOG_LEVEL=info
```

## 📚 API Documentation

### Base URL: `http://localhost:3001/api`

### Endpoints

#### Games
- `GET /games/upcoming` - Get upcoming Giants games
- `GET /games/:id/preview` - Get detailed game preview
- `GET /games/:id/boxscore` - Get game box score

#### Teams
- `GET /teams/:id` - Get team information
- `GET /teams/roster` - Get team roster
- `GET /schedule` - Get team schedule

#### Players
- `GET /players/:id` - Get player information
- `GET /players/:id/stats` - Get player statistics
- `GET /players/search` - Search for players

#### Standings
- `GET /standings` - Get league/division standings

#### Utility
- `GET /health` - Health check
- `GET /cache/stats` - Cache statistics (dev only)
- `DELETE /cache` - Clear cache (dev only)

### Query Parameters

**Upcoming Games**
```
?limit=10&startDate=2024-07-01&endDate=2024-07-31&gameType=R
```

**Game Preview**
```
?includeMatchups=true&includePredictions=true&includeWeather=true
```

**Team Roster**
```
?teamId=137&rosterType=active&season=2024
```

## 🧪 Testing

### Run all tests
```bash
npm run test
```

### Run tests for specific service
```bash
npm run test:server
npm run test:client
npm run test:mcp
```

### Run tests in watch mode
```bash
cd server && npm run test:watch
```

## 🔍 Development

### Build for production
```bash
npm run build
```

### Lint code
```bash
npm run lint
```

### Format code
```bash
npm run format
```

### Type checking
```bash
# Check all services
tsc --noEmit

# Check specific service
cd server && npm run build
cd client && npm run build
cd mcp-server && npm run build
```

## 📱 Client Usage

The React client provides an intuitive interface for:

1. **Game List**: View upcoming Giants games with team records and game details
2. **Game Preview**: Click on any game for detailed preview including:
   - Probable pitchers and their statistics
   - Weather conditions
   - Win probability predictions
   - Key matchup analysis
   - Game notes and insights

### Key Components

- `App.tsx` - Main application component
- `GamePreview.tsx` - Detailed game preview display
- `api.ts` - API client with type-safe methods

## 🤖 MCP Server

The project includes two MCP servers:

### 1. Basic MCP Server (`/mcp-server/` - previous version)
Basic MLB data integration with standard tools and resources.

### 2. Intelligent MCP Server (`/mcp-server/` - **NEW AI-POWERED VERSION**)
**LLM-powered baseball analysis using Anthropic Claude or OpenAI GPT-4**

#### 🧠 AI Analysis Features
- **Professional Baseball Insights**: Uses LLM to generate expert-level analysis
- **Comprehensive Game Previews**: Detailed strategic analysis with predictions
- **Smart Matchup Analysis**: Pitcher vs team intelligent breakdowns
- **Team Momentum Analysis**: Recent performance trend evaluation
- **Injury Impact Assessment**: How injuries affect team performance

#### 🔧 Primary Function
```javascript
getGiantsGamePreview(date, options)
```

#### 🛠️ Available Tools
- `get-giants-game-preview` - LLM-analyzed comprehensive game preview
- `analyze-pitcher-matchup` - Intelligent pitcher vs team analysis
- `get-team-momentum-analysis` - AI-powered performance trend analysis
- `analyze-head-to-head` - Historical matchup analysis with insights
- `get-injury-impact-analysis` - Smart injury impact assessment

#### 📊 Available Resources
- `giants://analysis/today` - Today's AI-generated game analysis
- `giants://analysis/recent-performance` - Recent performance insights
- `giants://analysis/pitching-staff` - Pitching staff evaluation
- `giants://analysis/season-outlook` - Season outlook analysis

#### 🚀 LLM Integration
- **Anthropic Claude**: Superior baseball analysis quality (recommended)
- **OpenAI GPT-4**: Fast, reliable analysis generation
- **Professional Prompts**: Expert-level baseball analyst persona
- **Structured Output**: Parsed into usable data formats
- **Cost Management**: Intelligent caching to minimize API costs

#### 📈 Analysis Output
- **Game Overview**: Why the matchup is compelling
- **Pitching Matchup**: Detailed starter analysis
- **Key Offensive Matchups**: Strategic batter vs pitcher insights
- **Team Momentum**: Recent performance trends that matter
- **Strategic Factors**: Tactical elements fans should watch
- **Weather/Venue Impact**: Environmental factors affecting play
- **Prediction & Narrative**: Expert assessment of likely outcomes

#### 💡 Setup Requirements
1. Choose LLM provider: `LLM_PROVIDER=anthropic` or `LLM_PROVIDER=openai`
2. Add API key: `ANTHROPIC_API_KEY=your_key` or `OPENAI_API_KEY=your_key`
3. Start server: `cd mcp-server && npm start`

See `/mcp-server/README.md` for detailed setup instructions.

## 🔗 MLB API Integration

The app integrates with the MLB Stats API:

- **Base URL**: https://statsapi.mlb.com/api/v1
- **Giants Team ID**: 137
- **Rate Limits**: No explicit limits, but includes proper User-Agent
- **Data Coverage**: Live games, statistics, rosters, schedules

### Key Endpoints Used
- `/schedule` - Game schedules
- `/teams/{id}` - Team information
- `/teams/{id}/roster` - Team rosters
- `/game/{id}/feed/live` - Live game data
- `/people/{id}` - Player information
- `/people/{id}/stats` - Player statistics

## 🎨 Styling

The application uses a modern CSS design system:

- **Color Scheme**: SF Giants orange and black theme
- **Typography**: System fonts with responsive sizing
- **Layout**: CSS Grid and Flexbox for responsive design
- **Components**: Modular CSS with BEM methodology
- **Responsive**: Mobile-first approach with breakpoints

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
- Set `NODE_ENV=production`
- Update `REACT_APP_API_URL` to production server
- Configure proper CORS origins
- Set up process manager (PM2, Docker, etc.)

### Docker Support
```dockerfile
# Example Dockerfile structure
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Write TypeScript with strict mode
- Include tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- MLB Stats API for providing comprehensive baseball data
- SF Giants organization for inspiration
- React and TypeScript communities for excellent tooling
- Node.js ecosystem for robust backend capabilities

## 📞 Support

For questions or issues:
1. Check the existing GitHub issues
2. Create a new issue with detailed description
3. Include environment details and steps to reproduce

---

**Built with ❤️ for SF Giants fans**
