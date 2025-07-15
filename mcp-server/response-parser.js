/**
 * Response Parser - Structures LLM responses into usable data
 * Parses LLM analysis responses into structured, consistent formats
 */

export class ResponseParser {
  constructor() {
    this.parseCache = new Map();
  }

  // Parse main game analysis response
  parseGameAnalysis(llmResponse) {
    const cacheKey = this.generateCacheKey(llmResponse);
    
    if (this.parseCache.has(cacheKey)) {
      return this.parseCache.get(cacheKey);
    }

    const analysis = llmResponse.content;
    const parsed = {
      rawAnalysis: analysis,
      structured: this.extractStructuredSections(analysis),
      keyInsights: this.extractKeyInsights(analysis),
      predictions: this.extractPredictions(analysis),
      playerSpotlight: this.extractPlayerSpotlight(analysis),
      strategicFactors: this.extractStrategicFactors(analysis),
      metadata: {
        analysisLength: analysis.length,
        confidence: this.assessConfidence(analysis),
        readabilityScore: this.calculateReadability(analysis),
        keywordsExtracted: this.extractKeywords(analysis),
        parsedAt: new Date().toISOString(),
      },
    };

    this.parseCache.set(cacheKey, parsed);
    return parsed;
  }

  // Extract structured sections from analysis
  extractStructuredSections(analysis) {
    const sections = {};
    
    // Common section patterns
    const sectionPatterns = [
      { name: 'gameOverview', pattern: /##\s*Game Overview\s*\n(.*?)(?=##|$)/is },
      { name: 'pitchingMatchup', pattern: /##\s*Pitching Matchup Analysis\s*\n(.*?)(?=##|$)/is },
      { name: 'offensiveMatchups', pattern: /##\s*Key Offensive Matchups\s*\n(.*?)(?=##|$)/is },
      { name: 'teamMomentum', pattern: /##\s*Team Momentum.*?\n(.*?)(?=##|$)/is },
      { name: 'strategicFactors', pattern: /##\s*Strategic Factors\s*\n(.*?)(?=##|$)/is },
      { name: 'keyPlayers', pattern: /##\s*Key Players.*?\n(.*?)(?=##|$)/is },
      { name: 'weatherVenue', pattern: /##\s*Weather.*?Impact\s*\n(.*?)(?=##|$)/is },
      { name: 'prediction', pattern: /##\s*Prediction.*?\n(.*?)(?=##|$)/is },
    ];

    sectionPatterns.forEach(({ name, pattern }) => {
      const match = analysis.match(pattern);
      if (match) {
        sections[name] = {
          content: match[1].trim(),
          bullets: this.extractBulletPoints(match[1]),
          keyTerms: this.extractKeyTermsFromSection(match[1]),
        };
      }
    });

    return sections;
  }

  // Extract key insights from analysis
  extractKeyInsights(analysis) {
    const insights = [];
    
    // Look for insight patterns
    const insightPatterns = [
      /(?:key|important|notable|significant|crucial).*?(?:advantage|disadvantage|factor|matchup|trend)/gi,
      /(?:should|will|likely|expect).*?(?:perform|struggle|dominate|favor)/gi,
      /(?:watch|monitor|focus).*?(?:player|matchup|situation)/gi,
    ];

    insightPatterns.forEach(pattern => {
      const matches = analysis.match(pattern);
      if (matches) {
        insights.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(insights)].slice(0, 8); // Deduplicate and limit
  }

  // Extract predictions and forecasts
  extractPredictions(analysis) {
    const predictions = {
      outcome: this.extractOutcomePrediction(analysis),
      score: this.extractScorePrediction(analysis),
      keyEvents: this.extractKeyEventPredictions(analysis),
      confidence: this.extractPredictionConfidence(analysis),
    };

    return predictions;
  }

  // Extract outcome prediction
  extractOutcomePrediction(analysis) {
    const outcomePatterns = [
      /(?:giants|sf)\s+(?:should|will|likely|expected).*?(?:win|lose|prevail|struggle)/gi,
      /(?:expect|predict|anticipate).*?(?:giants|sf).*?(?:win|lose|victory|defeat)/gi,
      /(?:advantage|favor).*?(?:giants|sf|opponent)/gi,
    ];

    for (const pattern of outcomePatterns) {
      const matches = analysis.match(pattern);
      if (matches) {
        return this.interpretOutcome(matches[0]);
      }
    }

    return 'No clear prediction';
  }

  // Interpret outcome from text
  interpretOutcome(text) {
    const positiveWords = ['win', 'victory', 'prevail', 'advantage', 'favor'];
    const negativeWords = ['lose', 'defeat', 'struggle', 'disadvantage'];
    
    const lowerText = text.toLowerCase();
    
    if (positiveWords.some(word => lowerText.includes(word))) {
      return 'Giants favored';
    } else if (negativeWords.some(word => lowerText.includes(word))) {
      return 'Opponent favored';
    }
    
    return 'Even matchup';
  }

  // Extract score prediction
  extractScorePrediction(analysis) {
    const scorePatterns = [
      /(?:score|final).*?(\d+[-\s]+\d+)/gi,
      /(\d+)\s*[-to]+\s*(\d+)/gi,
    ];

    for (const pattern of scorePatterns) {
      const matches = analysis.match(pattern);
      if (matches) {
        return matches[0].trim();
      }
    }

    return null;
  }

  // Extract key event predictions
  extractKeyEventPredictions(analysis) {
    const eventPatterns = [
      /(?:expect|likely|should see).*?(?:home runs?|strikeouts?|walks?|errors?)/gi,
      /(?:pitching|batting).*?(?:dominant|struggle|effective)/gi,
      /(?:late innings?|early|middle).*?(?:key|crucial|important)/gi,
    ];

    const events = [];
    eventPatterns.forEach(pattern => {
      const matches = analysis.match(pattern);
      if (matches) {
        events.push(...matches.slice(0, 3));
      }
    });

    return events;
  }

  // Extract prediction confidence
  extractPredictionConfidence(analysis) {
    const confidencePatterns = [
      /(?:confident|certain|likely|probable|possible|uncertain)/gi,
      /(?:strong|weak|moderate).*?(?:chance|likelihood|probability)/gi,
    ];

    const confidenceTerms = [];
    confidencePatterns.forEach(pattern => {
      const matches = analysis.match(pattern);
      if (matches) {
        confidenceTerms.push(...matches);
      }
    });

    return this.calculateConfidenceScore(confidenceTerms);
  }

  // Calculate confidence score
  calculateConfidenceScore(terms) {
    if (terms.length === 0) return 'moderate';

    const highConfidence = ['confident', 'certain', 'strong', 'likely'];
    const lowConfidence = ['uncertain', 'weak', 'possible'];

    const highCount = terms.filter(term => 
      highConfidence.some(hc => term.toLowerCase().includes(hc))
    ).length;

    const lowCount = terms.filter(term => 
      lowConfidence.some(lc => term.toLowerCase().includes(lc))
    ).length;

    if (highCount > lowCount) return 'high';
    if (lowCount > highCount) return 'low';
    return 'moderate';
  }

  // Extract player spotlight
  extractPlayerSpotlight(analysis) {
    const playerPatterns = [
      /(?:watch|key|important|spotlight).*?(?:player|pitcher|batter).*?([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+).*?(?:key|crucial|important|standout)/gi,
    ];

    const players = [];
    playerPatterns.forEach(pattern => {
      const matches = analysis.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const nameMatch = match.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
          if (nameMatch) {
            players.push({
              name: nameMatch[1],
              context: match.trim(),
              reason: this.extractPlayerReason(match),
            });
          }
        });
      }
    });

    return this.deduplicatePlayerSpotlight(players);
  }

  // Extract reason for player spotlight
  extractPlayerReason(context) {
    const reasons = [];
    
    if (context.toLowerCase().includes('matchup')) reasons.push('favorable matchup');
    if (context.toLowerCase().includes('hot')) reasons.push('hot streak');
    if (context.toLowerCase().includes('struggle')) reasons.push('struggling recently');
    if (context.toLowerCase().includes('power')) reasons.push('power threat');
    if (context.toLowerCase().includes('speed')) reasons.push('speed factor');
    if (context.toLowerCase().includes('clutch')) reasons.push('clutch performer');
    
    return reasons.length > 0 ? reasons.join(', ') : 'key player';
  }

  // Deduplicate player spotlight
  deduplicatePlayerSpotlight(players) {
    const seen = new Set();
    return players.filter(player => {
      if (seen.has(player.name)) return false;
      seen.add(player.name);
      return true;
    }).slice(0, 6); // Limit to 6 players
  }

  // Extract strategic factors
  extractStrategicFactors(analysis) {
    const strategyPatterns = [
      /(?:strategy|tactical|approach).*?(?:important|key|crucial)/gi,
      /(?:bullpen|lineup|defensive).*?(?:strategy|consideration)/gi,
      /(?:manager|coaching).*?(?:decision|choice|option)/gi,
    ];

    const factors = [];
    strategyPatterns.forEach(pattern => {
      const matches = analysis.match(pattern);
      if (matches) {
        factors.push(...matches.slice(0, 3));
      }
    });

    return factors;
  }

  // Extract bullet points from text
  extractBulletPoints(text) {
    const bulletPatterns = [
      /^[-*•]\s*(.+)$/gm,
      /^\d+\.\s*(.+)$/gm,
    ];

    const bullets = [];
    bulletPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        bullets.push(...matches.map(match => match.replace(/^[-*•\d+.\s]+/, '').trim()));
      }
    });

    return bullets;
  }

  // Extract key terms from section
  extractKeyTermsFromSection(text) {
    const terms = [];
    const termPatterns = [
      /(?:high|low|strong|weak|excellent|poor|outstanding|struggling)\s+\w+/gi,
      /\d+\.\d+\s+(?:ERA|WHIP|OPS|AVG)/gi,
      /\d+[-–]\d+\s+record/gi,
    ];

    termPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        terms.push(...matches.slice(0, 5));
      }
    });

    return terms;
  }

  // Parse pitcher analysis
  parsePitcherAnalysis(llmResponse) {
    const analysis = llmResponse.content;
    
    return {
      rawAnalysis: analysis,
      pitcherOverview: this.extractPitcherOverview(analysis),
      matchupAdvantages: this.extractMatchupAdvantages(analysis),
      matchupChallenges: this.extractMatchupChallenges(analysis),
      keyBatters: this.extractKeyBatters(analysis),
      strategicPrediction: this.extractStrategicPrediction(analysis),
      confidence: this.assessConfidence(analysis),
    };
  }

  // Parse momentum analysis
  parseMomentumAnalysis(llmResponse) {
    const analysis = llmResponse.content;
    
    return {
      rawAnalysis: analysis,
      currentMomentum: this.extractCurrentMomentum(analysis),
      keyTrends: this.extractKeyTrends(analysis),
      sustainableFactors: this.extractSustainableFactors(analysis),
      warningSignFactors: this.extractWarningSignFactors(analysis),
      outlook: this.extractOutlook(analysis),
    };
  }

  // Parse head-to-head analysis
  parseHeadToHeadAnalysis(llmResponse) {
    const analysis = llmResponse.content;
    
    return {
      rawAnalysis: analysis,
      historicalContext: this.extractHistoricalContext(analysis),
      styleMatchup: this.extractStyleMatchup(analysis),
      keyFactors: this.extractKeyFactors(analysis),
      prediction: this.extractPrediction(analysis),
    };
  }

  // Parse injury analysis
  parseInjuryAnalysis(llmResponse) {
    const analysis = llmResponse.content;
    
    return {
      rawAnalysis: analysis,
      impactAssessment: this.extractImpactAssessment(analysis),
      lineupChanges: this.extractLineupChanges(analysis),
      opportunityAssessment: this.extractOpportunityAssessment(analysis),
      strategicImplications: this.extractStrategicImplications(analysis),
    };
  }

  // Parse pitching staff analysis
  parsePitchingStaffAnalysis(llmResponse) {
    const analysis = llmResponse.content;
    
    return {
      rawAnalysis: analysis,
      rotationStrength: this.extractRotationStrength(analysis),
      bullpenAnalysis: this.extractBullpenAnalysis(analysis),
      workloadManagement: this.extractWorkloadManagement(analysis),
      strategicImplications: this.extractStrategicImplications(analysis),
    };
  }

  // Parse season outlook
  parseSeasonOutlook(llmResponse) {
    const analysis = llmResponse.content;
    
    return {
      rawAnalysis: analysis,
      currentPosition: this.extractCurrentPosition(analysis),
      teamStrengths: this.extractTeamStrengths(analysis),
      areasForImprovement: this.extractAreasForImprovement(analysis),
      keyFactors: this.extractKeyFactors(analysis),
      seasonPrediction: this.extractSeasonPrediction(analysis),
    };
  }

  // Helper methods for specific extractions
  extractPitcherOverview(analysis) {
    const match = analysis.match(/Pitcher Overview:(.*?)(?=Matchup|$)/is);
    return match ? match[1].trim() : 'No overview available';
  }

  extractMatchupAdvantages(analysis) {
    const match = analysis.match(/Matchup Advantages:(.*?)(?=Matchup Challenges|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractMatchupChallenges(analysis) {
    const match = analysis.match(/Matchup Challenges:(.*?)(?=Key Batters|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractKeyBatters(analysis) {
    const match = analysis.match(/Key Batters.*?:(.*?)(?=Strategic|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractStrategicPrediction(analysis) {
    const match = analysis.match(/Strategic Prediction:(.*?)$/is);
    return match ? match[1].trim() : 'No prediction available';
  }

  extractCurrentMomentum(analysis) {
    const match = analysis.match(/Current Momentum:(.*?)(?=Key Trends|$)/is);
    return match ? match[1].trim() : 'Unknown momentum';
  }

  extractKeyTrends(analysis) {
    const match = analysis.match(/Key Trends:(.*?)(?=Sustainable|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractSustainableFactors(analysis) {
    const match = analysis.match(/Sustainable Factors:(.*?)(?=Warning|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractWarningSignFactors(analysis) {
    const match = analysis.match(/Warning Signs:(.*?)(?=Outlook|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractOutlook(analysis) {
    const match = analysis.match(/Outlook:(.*?)$/is);
    return match ? match[1].trim() : 'No outlook available';
  }

  extractHistoricalContext(analysis) {
    const match = analysis.match(/Historical Context:(.*?)(?=Style|$)/is);
    return match ? match[1].trim() : 'No historical context';
  }

  extractStyleMatchup(analysis) {
    const match = analysis.match(/Style Matchup:(.*?)(?=Key Factors|$)/is);
    return match ? match[1].trim() : 'No style analysis';
  }

  extractKeyFactors(analysis) {
    const match = analysis.match(/Key Factors:(.*?)(?=Prediction|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractPrediction(analysis) {
    const match = analysis.match(/Prediction:(.*?)$/is);
    return match ? match[1].trim() : 'No prediction available';
  }

  extractImpactAssessment(analysis) {
    const match = analysis.match(/Impact Assessment:(.*?)(?=Lineup|$)/is);
    return match ? match[1].trim() : 'No impact assessment';
  }

  extractLineupChanges(analysis) {
    const match = analysis.match(/Lineup Changes:(.*?)(?=Opportunity|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractOpportunityAssessment(analysis) {
    const match = analysis.match(/Opportunity Assessment:(.*?)(?=Strategic|$)/is);
    return match ? match[1].trim() : 'No opportunity assessment';
  }

  extractStrategicImplications(analysis) {
    const match = analysis.match(/Strategic Implications:(.*?)$/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractRotationStrength(analysis) {
    const match = analysis.match(/Rotation Strength:(.*?)(?=Bullpen|$)/is);
    return match ? match[1].trim() : 'No rotation analysis';
  }

  extractBullpenAnalysis(analysis) {
    const match = analysis.match(/Bullpen Analysis:(.*?)(?=Workload|$)/is);
    return match ? match[1].trim() : 'No bullpen analysis';
  }

  extractWorkloadManagement(analysis) {
    const match = analysis.match(/Workload Management:(.*?)(?=Strategic|$)/is);
    return match ? match[1].trim() : 'No workload analysis';
  }

  extractCurrentPosition(analysis) {
    const match = analysis.match(/Current Position:(.*?)(?=Team Strengths|$)/is);
    return match ? match[1].trim() : 'No position analysis';
  }

  extractTeamStrengths(analysis) {
    const match = analysis.match(/Team Strengths:(.*?)(?=Areas for|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractAreasForImprovement(analysis) {
    const match = analysis.match(/Areas for Improvement:(.*?)(?=Key Factors|$)/is);
    return match ? this.extractBulletPoints(match[1]) : [];
  }

  extractSeasonPrediction(analysis) {
    const match = analysis.match(/Prediction:(.*?)$/is);
    return match ? match[1].trim() : 'No season prediction';
  }

  // Utility methods
  assessConfidence(analysis) {
    const confidenceIndicators = [
      'strongly', 'clearly', 'obviously', 'definitely', 'certainly',
      'likely', 'probably', 'should', 'expect', 'confident',
      'uncertain', 'possibly', 'might', 'could', 'maybe'
    ];

    const matches = confidenceIndicators.filter(indicator =>
      analysis.toLowerCase().includes(indicator)
    );

    const strongIndicators = ['strongly', 'clearly', 'obviously', 'definitely', 'certainly'];
    const weakIndicators = ['uncertain', 'possibly', 'might', 'could', 'maybe'];

    const strongCount = matches.filter(m => strongIndicators.includes(m)).length;
    const weakCount = matches.filter(m => weakIndicators.includes(m)).length;

    if (strongCount > weakCount) return 'high';
    if (weakCount > strongCount) return 'low';
    return 'moderate';
  }

  calculateReadability(text) {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    if (avgWordsPerSentence < 15) return 'easy';
    if (avgWordsPerSentence < 25) return 'moderate';
    return 'complex';
  }

  extractKeywords(text) {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'a', 'an', 'as', 'if', 'so', 'no', 'not', 'up', 'out', 'down', 'only', 'its',
      'it', 'he', 'she', 'they', 'we', 'you', 'i', 'my', 'me', 'us', 'our', 'their'
    ]);

    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const wordCount = {};

    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  generateCacheKey(llmResponse) {
    const content = llmResponse.content || '';
    return content.substring(0, 100).replace(/\s+/g, '');
  }

  clearCache() {
    this.parseCache.clear();
  }

  getCacheStats() {
    return {
      size: this.parseCache.size,
      keys: Array.from(this.parseCache.keys()),
    };
  }
}
