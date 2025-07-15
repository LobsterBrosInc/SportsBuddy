#!/usr/bin/env node

/**
 * Test Example for SF Giants Intelligent MCP Server
 * Demonstrates the LLM-powered baseball analysis capabilities
 */

import { GiantsIntelligentMCPServer } from './server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runExample() {
  console.log('🏟️  SF Giants Intelligent MCP Server - Test Example');
  console.log('=' .repeat(60));
  
  // Check if API keys are configured
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  console.log('Configuration Status:');
  console.log(`- LLM Provider: ${process.env.LLM_PROVIDER || 'anthropic'}`);
  console.log(`- Anthropic API Key: ${hasAnthropicKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`- OpenAI API Key: ${hasOpenAIKey ? '✅ Configured' : '❌ Missing'}`);
  console.log('');
  
  if (!hasAnthropicKey && !hasOpenAIKey) {
    console.log('❌ No LLM API keys configured. Please set either:');
    console.log('   - ANTHROPIC_API_KEY=your_key');
    console.log('   - OPENAI_API_KEY=your_key');
    console.log('');
    console.log('💡 Copy .env.example to .env and add your API keys');
    return;
  }
  
  try {
    // Create server instance
    const server = new GiantsIntelligentMCPServer();
    
    console.log('🚀 Testing server components...');
    
    // Test MLB API connection
    console.log('- Testing MLB API connection...');
    const mlbHealthy = await server.mlbClient.healthCheck();
    console.log(`  MLB API: ${mlbHealthy ? '✅ Connected' : '❌ Failed'}`);
    
    // Test LLM connection
    console.log('- Testing LLM connection...');
    try {
      await server.llmAnalyzer.testConnection();
      console.log('  LLM Service: ✅ Connected');
    } catch (error) {
      console.log(`  LLM Service: ❌ Failed - ${error.message}`);
      return;
    }
    
    console.log('');
    console.log('🔍 Example: Fetching comprehensive game data...');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Test data fetching
    const gameData = await server.fetchComprehensiveGameData(today);
    
    if (gameData.gameFound) {
      console.log('✅ Found Giants game data:');
      console.log(`  Date: ${gameData.game.gameDate}`);
      console.log(`  Opponent: ${gameData.opponent.name}`);
      console.log(`  Venue: ${gameData.venue.name}`);
      console.log(`  Home Game: ${gameData.isHomeGame ? 'Yes' : 'No'}`);
      
      console.log('');
      console.log('🧠 Example: Generating LLM analysis...');
      console.log('(This is a demonstration - actual analysis would require API keys)');
      
      // Format data for LLM (without actually calling LLM)
      const formattedData = server.dataFormatter.formatGameData(gameData);
      
      console.log('✅ Data formatted for LLM analysis:');
      console.log(`  Game Context: ${formattedData.gameContext ? 'Available' : 'Missing'}`);
      console.log(`  Team Stats: ${formattedData.teamStats ? 'Available' : 'Missing'}`);
      console.log(`  Recent Performance: ${formattedData.recentPerformance ? 'Available' : 'Missing'}`);
      console.log(`  Pitching Matchup: ${formattedData.pitchingMatchup ? 'Available' : 'Missing'}`);
      
      console.log('');
      console.log('📊 Example Analysis Structure:');
      console.log('  - Game Overview: Strategic matchup assessment');
      console.log('  - Pitching Matchup: Starter vs lineup analysis');
      console.log('  - Key Offensive Matchups: Batter vs pitcher insights');
      console.log('  - Team Momentum: Recent performance trends');
      console.log('  - Strategic Factors: Tactical elements to watch');
      console.log('  - Weather/Venue Impact: Environmental factors');
      console.log('  - Prediction & Narrative: Expert outcome assessment');
      
    } else {
      console.log('ℹ️  No Giants game found for today');
      console.log('   The server would normally analyze games when available');
    }
    
    console.log('');
    console.log('🎯 Available Analysis Tools:');
    console.log('  - get-giants-game-preview: Complete game analysis');
    console.log('  - analyze-pitcher-matchup: Pitcher vs team breakdown');
    console.log('  - get-team-momentum-analysis: Performance trend evaluation');
    console.log('  - analyze-head-to-head: Historical matchup insights');
    console.log('  - get-injury-impact-analysis: Injury impact assessment');
    
    console.log('');
    console.log('📈 Usage Statistics:');
    const stats = server.llmAnalyzer.getUsageStats();
    console.log(`  Provider: ${stats.provider}`);
    console.log(`  Model: ${stats.model}`);
    console.log(`  Requests: ${stats.requestCount}`);
    console.log(`  Total Cost: $${stats.totalCost.toFixed(4)}`);
    
    console.log('');
    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('🚀 To use the intelligent MCP server:');
    console.log('1. Configure your LLM API keys in .env');
    console.log('2. Start the server: npm start');
    console.log('3. Use MCP tools to get AI-powered baseball analysis');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('- Check your .env configuration');
    console.error('- Verify API keys are valid');
    console.error('- Ensure internet connection is stable');
    console.error('- Check MLB API status');
  }
}

// Run the example
runExample().catch(console.error);
