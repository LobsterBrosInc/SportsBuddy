# SF Giants Intelligent MCP Server

An intelligent MCP (Model Context Protocol) server that uses LLM analysis to generate professional baseball insights for SF Giants games.

## Features

- **LLM-Powered Analysis**: Uses Anthropic Claude or OpenAI GPT-4 for intelligent baseball analysis
- **Comprehensive Data Collection**: Fetches detailed MLB data including stats, matchups, and trends
- **Professional Insights**: Generates analysis comparable to professional baseball analysts
- **Caching & Performance**: Intelligent caching to minimize API costs and improve response times
- **Structured Output**: Parses LLM responses into structured, usable data formats

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Choose your LLM provider
LLM_PROVIDER=anthropic

# Add your API key
ANTHROPIC_API_KEY=your_actual_api_key_here

# Or for OpenAI
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Start the Server

```bash
npm start
```

## Primary Function

### `getGiantsGamePreview(date)`

The main function that generates comprehensive game previews:

```javascript
// Example usage
const preview = await server.getGiantsGamePreview("2024-07-15", {
  includeWeather: true,
  includeInjuries: true,
  analysisDepth: "detailed"
});
```

## Available Tools

### Game Analysis
- `get-giants-game-preview` - LLM-analyzed game preview
- `analyze-pitcher-matchup` - Pitcher vs team analysis
- `get-team-momentum-analysis` - Recent performance trends
- `analyze-head-to-head` - Team vs team historical analysis
- `get-injury-impact-analysis` - Injury impact assessment

### Resources
- `giants://analysis/today` - Today's game analysis
- `giants://analysis/recent-performance` - Recent performance trends
- `giants://analysis/pitching-staff` - Pitching staff evaluation
- `giants://analysis/season-outlook` - Season outlook analysis

## LLM Integration

### Supported Providers

**Anthropic Claude** (Recommended)
- Models: claude-3-sonnet-20240229, claude-3-haiku-20240307, claude-3-opus-20240229
- Superior baseball analysis quality
- Better structured output

**OpenAI GPT-4**
- Models: gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo
- Good analysis quality
- Faster response times

### Baseball Expert System Prompt

The server uses a sophisticated system prompt that creates a professional baseball analyst persona:

```
You are a professional baseball analyst with 20+ years of experience covering MLB. 
You have deep knowledge of strategy, statistics, player performance, and baseball narratives.

Your analysis should be:
- Accurate and based on provided data
- Engaging for both casual and serious baseball fans
- Explanatory (explain WHY things matter, not just what)
- Contextual (provide historical and strategic context)
- Balanced (acknowledge uncertainties and multiple perspectives)
```

## Data Collection

### MLB API Integration

The server fetches comprehensive data including:

- **Game Information**: Teams, venue, time, status
- **Team Statistics**: Offensive/defensive stats, records, trends
- **Player Data**: Starting pitchers, key players, recent performance
- **Historical Data**: Head-to-head records, seasonal patterns
- **Situational Data**: Weather, injuries, lineup changes

### Example Data Structure

```json
{
  "gameContext": {
    "date": "2024-07-15",
    "venue": "Oracle Park",
    "opponent": "Los Angeles Dodgers",
    "isHomeGame": true
  },
  "teamStats": {
    "giants": { "offense": {...}, "pitching": {...} },
    "opponent": { "offense": {...}, "pitching": {...} }
  },
  "pitchingMatchup": {
    "giants": { "name": "Logan Webb", "era": "3.25" },
    "opponent": { "name": "Walker Buehler", "era": "3.84" }
  }
}
```

## Analysis Output

### Structured Analysis

The LLM generates analysis in structured sections:

- **Game Overview**: Why the matchup is interesting
- **Pitching Matchup**: Detailed starter analysis
- **Key Offensive Matchups**: Batter vs pitcher insights
- **Team Momentum**: Recent performance trends
- **Strategic Factors**: Tactical elements to watch
- **Weather/Venue Impact**: Environmental factors
- **Prediction & Narrative**: Game outcome assessment

### Example Analysis Output

```json
{
  "structured": {
    "gameOverview": {
      "content": "Tonight's Giants-Dodgers matchup features...",
      "bullets": ["Key rivalry game", "Playoff implications"],
      "keyTerms": ["division race", "pitching duel"]
    },
    "pitchingMatchup": {
      "content": "Logan Webb's sinker against Dodgers power...",
      "bullets": ["Webb's ground ball rate", "Dodgers vs sinkers"],
      "keyTerms": ["2.85 ERA", "high spin rate"]
    }
  },
  "keyInsights": [
    "Webb's recent dominance against division rivals",
    "Dodgers struggling vs ground ball pitchers"
  ],
  "predictions": {
    "outcome": "Giants favored",
    "confidence": "moderate"
  }
}
```

## Performance & Caching

### Request Caching

- **Game Previews**: Cached for 30 minutes
- **Team Stats**: Cached for 5 minutes
- **LLM Responses**: Cached to avoid duplicate API calls

### Cost Management

- **Request Monitoring**: Tracks API usage and costs
- **Token Optimization**: Efficient prompts to minimize costs
- **Retry Logic**: Handles API failures gracefully

### Usage Statistics

```javascript
const stats = llmAnalyzer.getUsageStats();
// Returns: { requestCount, totalCost, averageCostPerRequest }
```

## Architecture

### Core Components

1. **Server.js**: Main MCP server with tool/resource handlers
2. **MLBAPIClient**: Comprehensive MLB data fetching
3. **LLMAnalyzer**: LLM integration and prompt engineering
4. **DataFormatter**: Structures data for LLM consumption
5. **ResponseParser**: Parses LLM responses into structured data

### Data Flow

```
MLB API → DataFormatter → LLMAnalyzer → ResponseParser → Client
```

## Error Handling

- **API Timeouts**: Configurable timeout with retry logic
- **Rate Limiting**: Respects API rate limits
- **Graceful Degradation**: Continues with available data if some APIs fail
- **Validation**: Input validation for all tool parameters

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Debugging

Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `anthropic` | LLM provider (anthropic/openai) |
| `ANTHROPIC_API_KEY` | - | Anthropic API key |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `ENABLE_CACHING` | `true` | Enable response caching |
| `CACHE_TIMEOUT` | `1800000` | Cache timeout in milliseconds |
| `LOG_LEVEL` | `info` | Logging level |
| `API_TIMEOUT` | `10000` | API request timeout |

### Analysis Options

```javascript
{
  includeWeather: true,      // Include weather analysis
  includeInjuries: true,     // Include injury impact
  analysisDepth: "detailed", // basic/detailed/comprehensive
}
```

## API Costs

Estimated costs per request:
- **Anthropic Claude-3-Sonnet**: ~$0.15-0.30 per analysis
- **OpenAI GPT-4**: ~$0.20-0.40 per analysis

Costs vary based on:
- Analysis depth
- Amount of data processed
- Model selection

## Troubleshooting

### Common Issues

1. **LLM API Key Issues**
   - Verify API key is correct
   - Check API key permissions
   - Ensure sufficient API credits

2. **MLB API Timeouts**
   - Increase `API_TIMEOUT` value
   - Check internet connection
   - Verify MLB API status

3. **Analysis Quality**
   - Try different models
   - Adjust analysis depth
   - Check data quality

### Support

For issues or questions:
1. Check the logs with `LOG_LEVEL=debug`
2. Verify environment configuration
3. Test individual components
4. Review error messages for specific guidance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
