/**
 * LLM Analyzer - Baseball Intelligence Engine
 * Uses LLM to generate professional baseball analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export class LLMAnalyzer {
  constructor(provider = 'anthropic') {
    this.provider = provider;
    this.requestCount = 0;
    this.totalCost = 0;
    this.setupClient();
  }

  setupClient() {
    if (this.provider === 'anthropic') {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
    } else if (this.provider === 'openai') {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    } else {
      throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async makeRequest(messages, options = {}) {
    this.requestCount++;
    const startTime = Date.now();

    try {
      let response;
      
      if (this.provider === 'anthropic') {
        response = await this.client.messages.create({
          model: this.model,
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          messages: messages,
        });
        
        // Estimate cost (approximate rates)
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const estimatedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
        this.totalCost += estimatedCost;
        
        return {
          content: response.content[0].text,
          usage: response.usage,
          cost: estimatedCost,
          duration: Date.now() - startTime,
        };
      } else if (this.provider === 'openai') {
        response = await this.client.chat.completions.create({
          model: this.model,
          messages: messages,
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
        });
        
        // Estimate cost (approximate rates)
        const inputTokens = response.usage.prompt_tokens;
        const outputTokens = response.usage.completion_tokens;
        const estimatedCost = (inputTokens * 0.01 + outputTokens * 0.03) / 1000;
        this.totalCost += estimatedCost;
        
        return {
          content: response.choices[0].message.content,
          usage: response.usage,
          cost: estimatedCost,
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error(`LLM request failed (${this.provider}):`, error);
      throw error;
    }
  }

  // Main game analysis function
  async analyzeGameData(formattedData, options = {}) {
    const systemPrompt = this.getBaseballExpertSystemPrompt(options);
    const userPrompt = this.buildGameAnalysisPrompt(formattedData, options);

    const messages = this.formatMessages(systemPrompt, userPrompt);
    
    return await this.makeRequest(messages, {
      maxTokens: options.analysisDepth === 'comprehensive' ? 6000 : 4000,
      temperature: 0.7,
    });
  }

  // Pitcher matchup analysis
  async analyzePitcherMatchup(formattedData) {
    const systemPrompt = `You are a professional baseball analyst specializing in pitching matchups. 
    Analyze the pitcher vs team matchup data and provide insights that explain:
    - Pitcher's strengths and weaknesses against this type of lineup
    - Historical performance patterns
    - Key batters to watch
    - Strategic considerations for both teams
    - Prediction of likely outcomes based on matchup data`;

    const userPrompt = `Analyze this pitcher matchup data:
    ${JSON.stringify(formattedData, null, 2)}
    
    Provide a comprehensive analysis in the following format:
    - Pitcher Overview: [Key stats and recent form]
    - Matchup Advantages: [Where pitcher has edge]
    - Matchup Challenges: [Where opposing team has edge]
    - Key Batters to Watch: [Specific matchups to monitor]
    - Strategic Prediction: [Likely game flow and outcome]`;

    const messages = this.formatMessages(systemPrompt, userPrompt);
    return await this.makeRequest(messages);
  }

  // Team momentum analysis
  async analyzeMomentum(formattedData) {
    const systemPrompt = `You are a baseball analyst specializing in team momentum and performance trends. 
    Analyze recent team performance to identify patterns that predict future success or struggles.
    Focus on sustainable trends vs. statistical noise.`;

    const userPrompt = `Analyze this team momentum data:
    ${JSON.stringify(formattedData, null, 2)}
    
    Provide analysis covering:
    - Current Momentum: [Overall team direction]
    - Key Trends: [Specific patterns in recent games]
    - Sustainable Factors: [What's likely to continue]
    - Warning Signs: [Areas of concern]
    - Outlook: [Short-term performance prediction]`;

    const messages = this.formatMessages(systemPrompt, userPrompt);
    return await this.makeRequest(messages);
  }

  // Head-to-head analysis
  async analyzeHeadToHead(formattedData) {
    const systemPrompt = `You are a baseball analyst specializing in head-to-head matchups between teams. 
    Analyze the historical and current season data to identify meaningful patterns and advantages.`;

    const userPrompt = `Analyze this head-to-head matchup data:
    ${JSON.stringify(formattedData, null, 2)}
    
    Provide analysis covering:
    - Historical Context: [Season series record and trends]
    - Style Matchup: [How teams match up strategically]
    - Key Factors: [Players/situations that determine outcomes]
    - Prediction: [Which team has the advantage and why]`;

    const messages = this.formatMessages(systemPrompt, userPrompt);
    return await this.makeRequest(messages);
  }

  // Injury impact analysis
  async analyzeInjuryImpact(formattedData) {
    const systemPrompt = `You are a baseball analyst specializing in injury impact assessment. 
    Analyze how injuries affect team performance, lineup construction, and strategic options.`;

    const userPrompt = `Analyze this injury impact data:
    ${JSON.stringify(formattedData, null, 2)}
    
    Provide analysis covering:
    - Impact Assessment: [How injuries affect team strength]
    - Lineup Changes: [How team is adapting]
    - Opportunity Assessment: [Players stepping up]
    - Strategic Implications: [How it changes team approach]`;

    const messages = this.formatMessages(systemPrompt, userPrompt);
    return await this.makeRequest(messages);
  }

  // Pitching staff analysis
  async analyzePitchingStaff(formattedData) {
    const systemPrompt = `You are a baseball analyst specializing in pitching staff evaluation. 
    Analyze the complete pitching staff to identify strengths, weaknesses, and strategic implications.`;

    const userPrompt = `Analyze this pitching staff data:
    ${JSON.stringify(formattedData, null, 2)}
    
    Provide analysis covering:
    - Rotation Strength: [Starting pitching assessment]
    - Bullpen Analysis: [Relief pitching evaluation]
    - Workload Management: [Usage patterns and concerns]
    - Strategic Implications: [How pitching affects game planning]`;

    const messages = this.formatMessages(systemPrompt, userPrompt);
    return await this.makeRequest(messages);
  }

  // Season outlook analysis
  async analyzeSeasonOutlook(formattedData) {
    const systemPrompt = `You are a baseball analyst providing season outlook assessment. 
    Analyze current standings, performance trends, and roster composition to project team's season trajectory.`;

    const userPrompt = `Analyze this season outlook data:
    ${JSON.stringify(formattedData, null, 2)}
    
    Provide analysis covering:
    - Current Position: [Standings and playoff probability]
    - Team Strengths: [What's working well]
    - Areas for Improvement: [What needs addressing]
    - Key Factors: [What will determine season success]
    - Prediction: [Realistic season expectations]`;

    const messages = this.formatMessages(systemPrompt, userPrompt);
    return await this.makeRequest(messages);
  }

  // Core system prompt for baseball expertise
  getBaseballExpertSystemPrompt(options = {}) {
    const depth = options.analysisDepth || 'detailed';
    const includeWeather = options.includeWeather !== false;
    const includeInjuries = options.includeInjuries !== false;

    return `You are a professional baseball analyst with 20+ years of experience covering MLB. 
    You have deep knowledge of strategy, statistics, player performance, and baseball narratives.
    
    Your analysis should be:
    - Accurate and based on provided data
    - Engaging for both casual and serious baseball fans
    - Explanatory (explain WHY things matter, not just what)
    - Contextual (provide historical and strategic context)
    - Balanced (acknowledge uncertainties and multiple perspectives)
    
    Analysis level: ${depth}
    ${includeWeather ? 'Include weather impact when relevant.' : ''}
    ${includeInjuries ? 'Consider injury impacts on team performance.' : ''}
    
    Focus on insights that help fans understand:
    - What makes this game interesting from a baseball perspective
    - Key strategic elements and player matchups
    - How recent performance trends might affect the outcome
    - Why certain statistical patterns matter
    - What casual fans should watch for during the game
    
    Avoid:
    - Obvious statements that any fan would know
    - Overly technical jargon without explanation
    - Predictions presented as certainties
    - Irrelevant statistical minutiae
    
    Your tone should be knowledgeable but accessible, like a seasoned baseball analyst explaining the game to an interested audience.`;
  }

  // Build comprehensive game analysis prompt
  buildGameAnalysisPrompt(formattedData, options = {}) {
    const { game, opponent, isHomeGame, analysisDepth = 'detailed' } = formattedData;
    
    let prompt = `Analyze this SF Giants game data and provide a comprehensive preview:

GAME CONTEXT:
${JSON.stringify(formattedData.gameContext, null, 2)}

TEAM STATISTICS:
${JSON.stringify(formattedData.teamStats, null, 2)}

RECENT PERFORMANCE:
${JSON.stringify(formattedData.recentPerformance, null, 2)}

PITCHING MATCHUP:
${JSON.stringify(formattedData.pitchingMatchup, null, 2)}

`;

    if (formattedData.injuries) {
      prompt += `INJURY REPORT:
${JSON.stringify(formattedData.injuries, null, 2)}

`;
    }

    if (formattedData.weather) {
      prompt += `WEATHER CONDITIONS:
${JSON.stringify(formattedData.weather, null, 2)}

`;
    }

    if (formattedData.headToHead) {
      prompt += `HEAD-TO-HEAD RECORD:
${JSON.stringify(formattedData.headToHead, null, 2)}

`;
    }

    prompt += `Please provide a ${analysisDepth} analysis in the following format:

## Game Overview
[Brief summary of the matchup and why it's interesting]

## Pitching Matchup Analysis
[Detailed analysis of starting pitchers and how they match up against opposing lineups]

## Key Offensive Matchups
[Specific batter vs pitcher matchups and lineup advantages]

## Team Momentum & Recent Form
[How recent performance trends might affect this game]

## Strategic Factors
[Tactical elements fans should watch for]

## Key Players to Watch
[Specific players who could determine the outcome]

## Weather/Venue Impact
[How conditions might affect the game]

## Prediction & Narrative
[Your assessment of how the game might unfold and what makes it compelling]

Remember: Explain WHY these factors matter, not just what they are. Focus on insights that enhance fan understanding and enjoyment of the game.`;

    return prompt;
  }

  // Format messages for different LLM providers
  formatMessages(systemPrompt, userPrompt) {
    if (this.provider === 'anthropic') {
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
    } else if (this.provider === 'openai') {
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
    }
  }

  // Test connection to LLM service
  async testConnection() {
    try {
      const testMessages = this.formatMessages(
        'You are a helpful assistant.',
        'Respond with "Connection successful" if you can read this.'
      );
      
      const response = await this.makeRequest(testMessages, { maxTokens: 50 });
      
      if (response.content.toLowerCase().includes('connection successful')) {
        return true;
      }
      
      throw new Error('Unexpected response from LLM service');
    } catch (error) {
      console.error('LLM connection test failed:', error);
      throw error;
    }
  }

  // Get usage statistics
  getUsageStats() {
    return {
      provider: this.provider,
      model: this.model,
      requestCount: this.requestCount,
      totalCost: this.totalCost,
      averageCostPerRequest: this.requestCount > 0 ? this.totalCost / this.requestCount : 0,
    };
  }

  // Reset usage statistics
  resetUsageStats() {
    this.requestCount = 0;
    this.totalCost = 0;
  }
}
