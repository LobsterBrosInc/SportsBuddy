/**
 * Data Formatter - Structures MLB data for LLM consumption
 * Transforms raw MLB API data into analysis-ready formats
 */

export class DataFormatter {
  constructor() {
    this.giantsTeamId = 137;
  }

  // Format comprehensive game data for LLM analysis
  formatGameData(rawData, options = {}) {
    const {
      game,
      opponent,
      isHomeGame,
      giantsStats,
      opponentStats,
      giantsRecentGames,
      opponentRecentGames,
      headToHead,
      probablePitchers,
      homePitcherStats,
      awayPitcherStats,
      weather,
      giantsInjuries,
      opponentInjuries,
    } = rawData;

    const formattedData = {
      gameContext: this.formatGameContext(game, opponent, isHomeGame),
      teamStats: this.formatTeamStats(giantsStats, opponentStats),
      recentPerformance: this.formatRecentPerformance(giantsRecentGames, opponentRecentGames),
      pitchingMatchup: this.formatPitchingMatchup(
        probablePitchers,
        homePitcherStats,
        awayPitcherStats,
        isHomeGame
      ),
    };

    // Add optional data based on options
    if (options.includeWeather !== false && weather) {
      formattedData.weather = this.formatWeather(weather);
    }

    if (options.includeInjuries !== false && (giantsInjuries || opponentInjuries)) {
      formattedData.injuries = this.formatInjuries(giantsInjuries, opponentInjuries);
    }

    if (headToHead) {
      formattedData.headToHead = this.formatHeadToHead(headToHead);
    }

    return formattedData;
  }

  // Format game context information
  formatGameContext(game, opponent, isHomeGame) {
    return {
      date: game.gameDate,
      venue: game.venue.name,
      isHomeGame,
      opponent: {
        name: opponent.name,
        id: opponent.id,
        record: game.teams.away.team.id === opponent.id 
          ? game.teams.away.leagueRecord 
          : game.teams.home.leagueRecord,
      },
      giants: {
        record: isHomeGame ? game.teams.home.leagueRecord : game.teams.away.leagueRecord,
      },
      gameType: game.gameType,
      gameNumber: game.gameNumber,
      seriesInfo: {
        gamesInSeries: game.gamesInSeries,
        seriesGameNumber: game.seriesGameNumber,
        seriesDescription: game.seriesDescription,
      },
    };
  }

  // Format team statistics for comparison
  formatTeamStats(giantsStats, opponentStats) {
    return {
      giants: this.extractKeyTeamStats(giantsStats),
      opponent: this.extractKeyTeamStats(opponentStats),
      comparison: this.compareTeamStats(giantsStats, opponentStats),
    };
  }

  // Extract key statistics from team stats
  extractKeyTeamStats(teamStats) {
    if (!teamStats || !teamStats.stats || teamStats.stats.length === 0) {
      return { available: false };
    }

    const stats = teamStats.stats[0].splits[0].stat;
    
    return {
      available: true,
      record: {
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        winPercentage: stats.winPercentage || '0.000',
      },
      offense: {
        runsPerGame: stats.runsPerGame || 0,
        homeRuns: stats.homeRuns || 0,
        battingAverage: stats.avg || '0.000',
        onBasePercentage: stats.obp || '0.000',
        sluggingPercentage: stats.slg || '0.000',
        ops: stats.ops || '0.000',
      },
      pitching: {
        earnedRunAverage: stats.earnedRunAverage || 0,
        whip: stats.whip || 0,
        strikeOuts: stats.strikeOuts || 0,
        homeRunsAllowed: stats.homeRunsAllowed || 0,
        qualityStarts: stats.qualityStarts || 0,
        saves: stats.saves || 0,
      },
      fielding: {
        errors: stats.errors || 0,
        fieldingPercentage: stats.fieldingPercentage || '0.000',
        doublePlays: stats.doublePlays || 0,
      },
      situational: {
        homeRecord: stats.homeWins && stats.homeLosses 
          ? `${stats.homeWins}-${stats.homeLosses}` 
          : 'N/A',
        awayRecord: stats.awayWins && stats.awayLosses 
          ? `${stats.awayWins}-${stats.awayLosses}` 
          : 'N/A',
        last10: stats.last10 || 'N/A',
        oneRunGames: stats.oneRunWins && stats.oneRunLosses 
          ? `${stats.oneRunWins}-${stats.oneRunLosses}` 
          : 'N/A',
      },
    };
  }

  // Compare team statistics
  compareTeamStats(giantsStats, opponentStats) {
    const giants = this.extractKeyTeamStats(giantsStats);
    const opponent = this.extractKeyTeamStats(opponentStats);

    if (!giants.available || !opponent.available) {
      return { available: false };
    }

    return {
      available: true,
      offensiveAdvantage: this.calculateAdvantage(giants.offense.ops, opponent.offense.ops),
      pitchingAdvantage: this.calculateAdvantage(opponent.pitching.earnedRunAverage, giants.pitching.earnedRunAverage),
      recordAdvantage: this.calculateAdvantage(giants.record.winPercentage, opponent.record.winPercentage),
      homeFieldAdvantage: giants.situational.homeRecord !== 'N/A' ? 'Giants' : 'Neutral',
    };
  }

  // Calculate statistical advantage
  calculateAdvantage(value1, value2) {
    if (typeof value1 !== 'number' || typeof value2 !== 'number') {
      return 'Even';
    }

    const diff = Math.abs(value1 - value2);
    const avg = (value1 + value2) / 2;
    const percentDiff = (diff / avg) * 100;

    if (percentDiff < 5) return 'Even';
    return value1 > value2 ? 'Giants' : 'Opponent';
  }

  // Format recent performance data
  formatRecentPerformance(giantsGames, opponentGames) {
    return {
      giants: this.analyzeRecentGames(giantsGames, this.giantsTeamId),
      opponent: this.analyzeRecentGames(opponentGames),
    };
  }

  // Analyze recent games for patterns
  analyzeRecentGames(games, teamId = null) {
    if (!games || games.length === 0) {
      return { available: false };
    }

    const recentGames = games.slice(0, 10);
    let wins = 0;
    let runs = 0;
    let runsAllowed = 0;
    let homeGames = 0;
    let homeWins = 0;

    recentGames.forEach(game => {
      const isHome = teamId ? game.teams.home.team.id === teamId : true;
      const teamScore = isHome ? game.teams.home.score : game.teams.away.score;
      const opponentScore = isHome ? game.teams.away.score : game.teams.home.score;

      if (teamScore > opponentScore) wins++;
      runs += teamScore || 0;
      runsAllowed += opponentScore || 0;
      
      if (isHome) {
        homeGames++;
        if (teamScore > opponentScore) homeWins++;
      }
    });

    return {
      available: true,
      record: `${wins}-${recentGames.length - wins}`,
      winPercentage: (wins / recentGames.length).toFixed(3),
      runsPerGame: (runs / recentGames.length).toFixed(2),
      runsAllowedPerGame: (runsAllowed / recentGames.length).toFixed(2),
      runDifferential: runs - runsAllowed,
      homeRecord: homeGames > 0 ? `${homeWins}-${homeGames - homeWins}` : 'N/A',
      streak: this.calculateStreak(recentGames, teamId),
      trends: this.identifyTrends(recentGames, teamId),
    };
  }

  // Calculate current streak
  calculateStreak(games, teamId) {
    if (!games || games.length === 0) return 'N/A';

    let streak = 0;
    let isWinStreak = null;

    for (const game of games) {
      const isHome = teamId ? game.teams.home.team.id === teamId : true;
      const teamScore = isHome ? game.teams.home.score : game.teams.away.score;
      const opponentScore = isHome ? game.teams.away.score : game.teams.home.score;
      const isWin = teamScore > opponentScore;

      if (isWinStreak === null) {
        isWinStreak = isWin;
        streak = 1;
      } else if (isWinStreak === isWin) {
        streak++;
      } else {
        break;
      }
    }

    return `${isWinStreak ? 'W' : 'L'}${streak}`;
  }

  // Identify performance trends
  identifyTrends(games, teamId) {
    if (!games || games.length < 5) return [];

    const trends = [];
    const recent5 = games.slice(0, 5);
    const previous5 = games.slice(5, 10);

    // Scoring trend
    const recentAvgRuns = recent5.reduce((sum, game) => {
      const isHome = teamId ? game.teams.home.team.id === teamId : true;
      return sum + (isHome ? game.teams.home.score : game.teams.away.score);
    }, 0) / recent5.length;

    const previousAvgRuns = previous5.reduce((sum, game) => {
      const isHome = teamId ? game.teams.home.team.id === teamId : true;
      return sum + (isHome ? game.teams.home.score : game.teams.away.score);
    }, 0) / previous5.length;

    if (recentAvgRuns > previousAvgRuns + 0.5) {
      trends.push('Offense improving');
    } else if (recentAvgRuns < previousAvgRuns - 0.5) {
      trends.push('Offense struggling');
    }

    // Add more trend analysis as needed
    return trends;
  }

  // Format pitching matchup data
  formatPitchingMatchup(probablePitchers, homePitcherStats, awayPitcherStats, isHomeGame) {
    if (!probablePitchers) {
      return { available: false };
    }

    const giantsPitcher = isHomeGame ? probablePitchers.home : probablePitchers.away;
    const opponentPitcher = isHomeGame ? probablePitchers.away : probablePitchers.home;
    const giantsPitcherStats = isHomeGame ? homePitcherStats : awayPitcherStats;
    const opponentPitcherStats = isHomeGame ? awayPitcherStats : homePitcherStats;

    return {
      available: true,
      giants: this.formatPitcherData(giantsPitcher, giantsPitcherStats),
      opponent: this.formatPitcherData(opponentPitcher, opponentPitcherStats),
      comparison: this.comparePitchers(giantsPitcherStats, opponentPitcherStats),
    };
  }

  // Format individual pitcher data
  formatPitcherData(pitcher, stats) {
    if (!pitcher) return { available: false };

    const pitcherInfo = {
      available: true,
      name: pitcher.fullName,
      id: pitcher.id,
      throwsHand: pitcher.pitchHand?.description || 'Unknown',
    };

    if (stats && stats.stats && stats.stats.length > 0) {
      const seasonStats = stats.stats[0].splits[0].stat;
      pitcherInfo.stats = {
        wins: seasonStats.wins || 0,
        losses: seasonStats.losses || 0,
        era: seasonStats.era || '0.00',
        whip: seasonStats.whip || '0.00',
        strikeOuts: seasonStats.strikeOuts || 0,
        walks: seasonStats.baseOnBalls || 0,
        inningsPitched: seasonStats.inningsPitched || '0.0',
        homeRunsAllowed: seasonStats.homeRuns || 0,
        qualityStarts: seasonStats.qualityStarts || 0,
        groundOuts: seasonStats.groundOuts || 0,
        airOuts: seasonStats.airOuts || 0,
      };
    }

    return pitcherInfo;
  }

  // Compare pitchers
  comparePitchers(giantsStats, opponentStats) {
    if (!giantsStats || !opponentStats) {
      return { available: false };
    }

    const giants = giantsStats.stats?.[0]?.splits?.[0]?.stat;
    const opponent = opponentStats.stats?.[0]?.splits?.[0]?.stat;

    if (!giants || !opponent) {
      return { available: false };
    }

    return {
      available: true,
      eraAdvantage: this.calculateAdvantage(parseFloat(opponent.era), parseFloat(giants.era)),
      whipAdvantage: this.calculateAdvantage(parseFloat(opponent.whip), parseFloat(giants.whip)),
      strikeoutAdvantage: this.calculateAdvantage(giants.strikeOuts, opponent.strikeOuts),
      recordAdvantage: this.calculateAdvantage(
        giants.wins / (giants.wins + giants.losses),
        opponent.wins / (opponent.wins + opponent.losses)
      ),
    };
  }

  // Format weather data
  formatWeather(weather) {
    if (!weather) return null;

    return {
      condition: weather.condition || 'Unknown',
      temperature: weather.temp || 'Unknown',
      wind: weather.wind || 'Unknown',
      impact: this.assessWeatherImpact(weather),
    };
  }

  // Assess weather impact on game
  assessWeatherImpact(weather) {
    const impacts = [];

    if (weather.condition && weather.condition.toLowerCase().includes('rain')) {
      impacts.push('Rain may affect play');
    }

    if (weather.wind) {
      const windSpeed = this.extractWindSpeed(weather.wind);
      if (windSpeed > 15) {
        impacts.push('Strong wind may affect ball flight');
      }
    }

    if (weather.temp) {
      const temp = this.extractTemperature(weather.temp);
      if (temp < 50) {
        impacts.push('Cold weather may reduce offensive production');
      } else if (temp > 85) {
        impacts.push('Hot weather may favor hitters');
      }
    }

    return impacts.length > 0 ? impacts : ['Minimal weather impact expected'];
  }

  // Extract wind speed from weather string
  extractWindSpeed(windString) {
    const match = windString.match(/(\d+)\s*mph/i);
    return match ? parseInt(match[1]) : 0;
  }

  // Extract temperature from weather string
  extractTemperature(tempString) {
    const match = tempString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 70;
  }

  // Format injury data
  formatInjuries(giantsInjuries, opponentInjuries) {
    return {
      giants: this.formatTeamInjuries(giantsInjuries),
      opponent: this.formatTeamInjuries(opponentInjuries),
    };
  }

  // Format team-specific injury data
  formatTeamInjuries(injuries) {
    if (!injuries || !injuries.injuries || injuries.injuries.length === 0) {
      return { available: false, count: 0 };
    }

    return {
      available: true,
      count: injuries.injuries.length,
      keyInjuries: injuries.injuries.map(injury => ({
        player: injury.player,
        position: injury.position,
        injury: injury.injury,
        status: injury.status,
        impact: this.assessInjuryImpact(injury),
      })),
    };
  }

  // Assess injury impact
  assessInjuryImpact(injury) {
    // This would be more sophisticated in a real implementation
    const keyPositions = ['C', '1B', 'SS', 'CF', 'SP', 'CL'];
    if (keyPositions.includes(injury.position)) {
      return 'High impact';
    }
    return 'Moderate impact';
  }

  // Format head-to-head data
  formatHeadToHead(headToHead) {
    if (!headToHead || !headToHead.dates) {
      return { available: false };
    }

    const games = headToHead.dates.flatMap(date => date.games);
    let giantsWins = 0;
    let opponentWins = 0;

    games.forEach(game => {
      const giantsScore = game.teams.home.team.id === this.giantsTeamId 
        ? game.teams.home.score 
        : game.teams.away.score;
      const opponentScore = game.teams.home.team.id === this.giantsTeamId 
        ? game.teams.away.score 
        : game.teams.home.score;

      if (giantsScore > opponentScore) giantsWins++;
      else if (opponentScore > giantsScore) opponentWins++;
    });

    return {
      available: true,
      gamesPlayed: games.length,
      giantsWins,
      opponentWins,
      recentTrend: this.calculateHeadToHeadTrend(games),
    };
  }

  // Calculate head-to-head trend
  calculateHeadToHeadTrend(games) {
    if (games.length < 3) return 'Insufficient data';

    const recent3 = games.slice(0, 3);
    let giantsWins = 0;

    recent3.forEach(game => {
      const giantsScore = game.teams.home.team.id === this.giantsTeamId 
        ? game.teams.home.score 
        : game.teams.away.score;
      const opponentScore = game.teams.home.team.id === this.giantsTeamId 
        ? game.teams.away.score 
        : game.teams.home.score;

      if (giantsScore > opponentScore) giantsWins++;
    });

    if (giantsWins >= 2) return 'Giants favored recently';
    if (giantsWins <= 1) return 'Opponent favored recently';
    return 'Even recent trend';
  }

  // Format data for other analysis types
  formatPitcherMatchup(data) {
    return {
      pitcher: data.pitcherStats,
      opposingTeam: data.teamStats,
      headToHead: data.headToHead,
      season: data.season,
    };
  }

  formatMomentumData(data) {
    return {
      recentGames: data.recentGames,
      teamStats: data.teamStats,
      standings: data.standings,
      gamesSampled: data.games,
    };
  }

  formatHeadToHead(data) {
    return {
      games: data.headToHeadGames,
      team1: data.team1Stats,
      team2: data.team2Stats,
      season: data.season,
    };
  }

  formatInjuryData(data) {
    return {
      injuries: data.injuryReport,
      roster: data.roster,
      recentPerformance: data.recentGames,
      includeMinor: data.includeMinorInjuries,
    };
  }

  formatPitchingStaffData(data) {
    return {
      roster: data.roster,
      teamStats: data.stats,
      recentGames: data.recentGames,
    };
  }

  formatSeasonOutlook(data) {
    return {
      standings: data.standings,
      teamStats: data.stats,
      schedule: data.schedule,
      roster: data.roster,
    };
  }
}
