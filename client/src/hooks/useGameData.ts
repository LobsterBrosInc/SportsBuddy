/**
 * Custom hook for managing Giants game data with comprehensive state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api';
import { GiantsGameData, UseGameDataReturn } from '../types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const STALE_DATA_THRESHOLD = 10 * 60 * 1000; // 10 minutes

interface CachedData {
  data: GiantsGameData;
  timestamp: Date;
}

export const useGameData = (): UseGameDataReturn => {
  const [data, setData] = useState<GiantsGameData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheRef = useRef<CachedData | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef<boolean>(false);

  // Check if cached data is still valid
  const isCacheValid = useCallback((cachedData: CachedData): boolean => {
    const now = new Date();
    const timeDiff = now.getTime() - cachedData.timestamp.getTime();
    return timeDiff < CACHE_DURATION;
  }, []);

  // Check if data is stale and needs background refresh
  const isDataStale = useCallback((cachedData: CachedData): boolean => {
    const now = new Date();
    const timeDiff = now.getTime() - cachedData.timestamp.getTime();
    return timeDiff > STALE_DATA_THRESHOLD;
  }, []);

  // Fetch data from API
  const fetchGameData = useCallback(
    async (showLoading: boolean = true): Promise<void> => {
      if (isUnmountedRef.current) return;

      // Check cache first if not forcing a refresh
      if (!showLoading && cacheRef.current && isCacheValid(cacheRef.current)) {
        setData(cacheRef.current.data);
        setLastUpdated(cacheRef.current.timestamp);
        setError(null);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        const gameData = await apiClient.getGiantsNextGame();

        if (isUnmountedRef.current) return;

        const now = new Date();

        // Update cache
        cacheRef.current = {
          data: gameData,
          timestamp: now,
        };

        // Update state
        setData(gameData);
        setLastUpdated(now);
        setError(null);
      } catch (err) {
        if (isUnmountedRef.current) return;

        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch game data';
        setError(errorMessage);

        // If we have cached data and this is a background refresh, keep showing cached data
        if (!showLoading && cacheRef.current) {
          setData(cacheRef.current.data);
          setLastUpdated(cacheRef.current.timestamp);
        } else {
          setData(null);
          setLastUpdated(null);
        }
      } finally {
        if (!isUnmountedRef.current && showLoading) {
          setLoading(false);
        }
      }
    },
    [isCacheValid, isUnmountedRef]
  );

  // Manual retry function
  const retry = useCallback(async (): Promise<void> => {
    await fetchGameData(true);
  }, [fetchGameData]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    // Clear cache to force fresh data
    cacheRef.current = null;
    await fetchGameData(true);
  }, [fetchGameData]);

  // Background refresh for stale data
  const backgroundRefresh = useCallback(async (): Promise<void> => {
    if (cacheRef.current && isDataStale(cacheRef.current)) {
      await fetchGameData(false); // Don't show loading for background refresh
    }
  }, [fetchGameData, isDataStale]);

  // Setup auto-refresh interval
  const setupAutoRefresh = useCallback((): void => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    autoRefreshIntervalRef.current = setInterval(() => {
      if (!isUnmountedRef.current) {
        backgroundRefresh();
      }
    }, AUTO_REFRESH_INTERVAL);
  }, [backgroundRefresh]);

  // Initial data fetch
  useEffect(() => {
    isUnmountedRef.current = false;
    fetchGameData(true);
    setupAutoRefresh();

    return () => {
      isUnmountedRef.current = true;
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [fetchGameData, setupAutoRefresh]);

  // Check for stale data on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (!isUnmountedRef.current) {
        backgroundRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [backgroundRefresh]);

  // Check for stale data on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isUnmountedRef.current) {
        backgroundRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [backgroundRefresh]);

  return {
    data,
    loading,
    error,
    retry,
    refresh,
    lastUpdated,
  };
};

export default useGameData;
