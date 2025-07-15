# 🚀 Quick Start - SF Giants Intelligent MCP Server

Get up and running with AI-powered baseball analysis in minutes!

## 1. Prerequisites

- Node.js 18+ installed
- An API key from either:
  - **Anthropic** (recommended): https://console.anthropic.com/
  - **OpenAI**: https://platform.openai.com/

## 2. Installation

```bash
# Navigate to the MCP server directory
cd mcp-server

# Install dependencies
npm install
```

## 3. Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your API key
nano .env
```

**For Anthropic (recommended):**
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_actual_api_key_here
```

**For OpenAI:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_actual_api_key_here
```

## 4. Test the Setup

```bash
# Run the test example
npm run test:example
```

You should see:
- ✅ Configuration verification
- ✅ MLB API connection test  
- ✅ LLM service connection test
- ✅ Data fetching demonstration

## 5. Start the Server

```bash
# Start the intelligent MCP server
npm start
```

## 6. Use the Analysis Tools

Once running, you can use these MCP tools:

### Get Today's Game Analysis
```javascript
// Tool: get-giants-game-preview
{
  "date": "2024-07-15",
  "analysisDepth": "detailed",
  "includeWeather": true,
  "includeInjuries": true
}
```

### Analyze Pitcher Matchups
```javascript
// Tool: analyze-pitcher-matchup
{
  "pitcherId": 12345,
  "opposingTeamId": 119,
  "season": "2024"
}
```

### Get Team Momentum Analysis
```javascript
// Tool: get-team-momentum-analysis
{
  "teamId": 137,
  "games": 10
}
```

## 7. View Analysis Results

The server returns structured analysis including:

- **Strategic Insights**: Professional-level game analysis
- **Pitching Matchups**: Detailed starter vs lineup breakdowns
- **Team Momentum**: Performance trends that matter
- **Key Players**: Who to watch and why
- **Predictions**: Data-driven outcome assessments

## 🎯 Example Output

```json
{
  "success": true,
  "date": "2024-07-15",
  "analysis": {
    "structured": {
      "gameOverview": {
        "content": "Tonight's Giants-Dodgers rivalry game features two teams fighting for NL West supremacy...",
        "keyTerms": ["division race", "playoff implications"]
      },
      "pitchingMatchup": {
        "content": "Logan Webb's sinker-heavy approach matches up well against a Dodgers lineup that struggles with ground ball pitchers...",
        "keyTerms": ["2.85 ERA", "ground ball rate"]
      }
    },
    "keyInsights": [
      "Webb has dominated division rivals with his recent form",
      "Dodgers are hitting .230 against sinkerball pitchers this season"
    ],
    "predictions": {
      "outcome": "Giants favored",
      "confidence": "moderate"
    }
  }
}
```

## 🔧 Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `LLM_PROVIDER` | `anthropic` | Choose `anthropic` or `openai` |
| `ANTHROPIC_MODEL` | `claude-3-sonnet-20240229` | Anthropic model selection |
| `OPENAI_MODEL` | `gpt-4-turbo-preview` | OpenAI model selection |
| `ENABLE_CACHING` | `true` | Cache responses to reduce costs |
| `CACHE_TIMEOUT` | `1800000` | Cache duration (30 minutes) |
| `LOG_LEVEL` | `info` | Logging verbosity |

## 💰 Cost Estimates

Per detailed game analysis:
- **Anthropic Claude-3-Sonnet**: ~$0.15-0.30
- **OpenAI GPT-4**: ~$0.20-0.40

Costs reduced by:
- Intelligent caching (30min cache)
- Optimized prompts
- Structured data formatting

## 🐛 Troubleshooting

### API Key Issues
```bash
# Test your API key
npm run test:example
```

### Connection Problems
```bash
# Check network and API status
curl -s "https://api.anthropic.com/v1/messages" -H "x-api-key: your_key"
```

### Performance Issues
```bash
# Enable debug logging
echo "LOG_LEVEL=debug" >> .env
npm start
```

## 🎉 You're Ready!

Your SF Giants Intelligent MCP Server is now running with:
- 🧠 AI-powered baseball analysis
- 📊 Professional-quality insights  
- ⚡ Real-time MLB data integration
- 🎯 Strategic game previews
- 📈 Performance trend analysis

Enjoy the most intelligent baseball analysis system available! 🏟️⚾
