import { useState, useEffect, useCallback } from 'react';
import { PolicyViolation, ViolationFilters, PaginatedResponse, PolicyViolationStats } from '../types';
import { policyService } from '../services/policyService';
import { getToken } from '../services/api';

interface UsePolicyViolationsReturn {
  violations: PolicyViolation[];
  loading: boolean;
  error: Error | null;
  fetchViolations: () => Promise<void>;
  refresh: () => Promise<void>;
  getViolationsBySeverity: (severity: string) => PolicyViolation[];
  getViolationsByStatus: (status: string) => PolicyViolation[];
  getViolationsByType: (type: string) => PolicyViolation[];
  getStats: () => PolicyViolationStats;
  resolveViolation: (violationId: string, notes?: string) => Promise<boolean>;
  acknowledgeViolation: (violationId: string, acknowledgedBy?: string) => Promise<boolean>;
  markViolationFalsePositive: (violationId: string, notes?: string) => Promise<boolean>;
  getAllViolations: (filters?: ViolationFilters) => Promise<PolicyViolation[]>;
  getAllViolationsPaginated: (page?: number, limit?: number, filters?: ViolationFilters) => Promise<PaginatedResponse<PolicyViolation>>;
  getViolationsByClient: (clientId: string, filters?: ViolationFilters) => Promise<PolicyViolation[]>;
  getViolationStats: () => Promise<PolicyViolationStats>;
  searchViolations: (query: string, filters?: ViolationFilters) => Promise<PolicyViolation[]>;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const usePolicyViolations = (
  clientId?: string, 
  pollInterval: number = 60000,
  initialFilters?: ViolationFilters
): UsePolicyViolationsReturn => {
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ViolationFilters | undefined>(initialFilters);
  
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const auto = JSON.parse(localStorage.getItem('autoRefresh') || 'true');
      return !!getToken() && Boolean(auto);
    } catch (e) {
      console.debug('usePolicyViolations init autoRefresh read failed', e);
      return !!getToken();
    }
  });

  const fetchViolations = useCallback(async (): Promise<void> => {
    if (!enabled) return;
    try {
      setLoading(true);
      let data: PolicyViolation[];
      
      if (clientId) {
        data = await policyService.getViolationsByClient(clientId, filters);
      } else {
        data = await policyService.getAllViolations(filters);
      }
      
      setViolations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch policy violations'));
    } finally {
      setLoading(false);
    }
  }, [enabled, clientId, filters]);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchViolations();
  }, [fetchViolations]);

  // Update violations when filters change
  useEffect(() => {
    fetchViolations();
  }, [fetchViolations, filters]);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let stopped = false;
    let backoff = 0;

    const sleep = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

    const poll = async (): Promise<void> => {
      while (!stopped && mounted) {
        try {
          await fetchViolations();
          backoff = 0;
        } catch {
          backoff = backoff ? Math.min(120000, backoff * 2) : 2000;
        }

        const waitMs = backoff || pollInterval;
        await sleep(waitMs);
      }
    };

    poll();
    return () => { 
      stopped = true; 
      mounted = false; 
    };
  }, [fetchViolations, enabled, pollInterval]);

  const getViolationsBySeverity = useCallback((severity: string): PolicyViolation[] => {
    return violations.filter(v => v.severity === severity);
  }, [violations]);

  const getViolationsByStatus = useCallback((status: string): PolicyViolation[] => {
    return violations.filter(v => v.status === status);
  }, [violations]);

  const getViolationsByType = useCallback((type: string): PolicyViolation[] => {
    return violations.filter(v => v.violation_type === type);
  }, [violations]);

  const getStats = useCallback((): PolicyViolationStats => {
    const bySeverity = {
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length,
    };

    const byStatus = {
      open: violations.filter(v => v.status === 'open').length,
      acknowledged: violations.filter(v => v.status === 'acknowledged').length,
      resolved: violations.filter(v => v.status === 'resolved').length,
      false_positive: violations.filter(v => v.status === 'false_positive').length,
    };

    const byType: Record<string, number> = {};
    violations.forEach(violation => {
      byType[violation.violation_type] = (byType[violation.violation_type] || 0) + 1;
    });

    return {
      total: violations.length,
      by_severity: bySeverity,
      by_status: byStatus,
      by_type: byType,
    };
  }, [violations]);

  const resolveViolation = useCallback(async (
    violationId: string, 
    notes?: string
  ): Promise<boolean> => {
    try {
      await policyService.resolveViolation(violationId, notes);
      await fetchViolations();
      return true;
    } catch (err) {
      console.error('Failed to resolve violation:', err);
      return false;
    }
  }, [fetchViolations]);

  const acknowledgeViolation = useCallback(async (
    violationId: string, 
    acknowledgedBy?: string
  ): Promise<boolean> => {
    try {
      await policyService.acknowledgeViolation(violationId, acknowledgedBy);
      await fetchViolations();
      return true;
    } catch (err) {
      console.error('Failed to acknowledge violation:', err);
      return false;
    }
  }, [fetchViolations]);

  const markViolationFalsePositive = useCallback(async (
    violationId: string, 
    notes?: string
  ): Promise<boolean> => {
    try {
      await policyService.markViolationFalsePositive(violationId, notes);
      await fetchViolations();
      return true;
    } catch (err) {
      console.error('Failed to mark violation as false positive:', err);
      return false;
    }
  }, [fetchViolations]);

  // ============ ADDITIONAL VIOLATION SERVICES ============

  const getAllViolations = useCallback(async (
    customFilters?: ViolationFilters
  ): Promise<PolicyViolation[]> => {
    try {
      return await policyService.getAllViolations(customFilters || filters);
    } catch (err) {
      console.error('Failed to get all violations:', err);
      setError(err instanceof Error ? err : new Error('Failed to get all violations'));
      return [];
    }
  }, [filters]);

  const getAllViolationsPaginated = useCallback(async (
    page: number = 1, 
    limit: number = 50, 
    customFilters?: ViolationFilters
  ): Promise<PaginatedResponse<PolicyViolation>> => {
    try {
      return await policyService.getAllViolationsPaginated(page, limit, customFilters || filters);
    } catch (err) {
      console.error('Failed to get paginated violations:', err);
      setError(err instanceof Error ? err : new Error('Failed to get paginated violations'));
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }
  }, [filters]);

  const getViolationsByClient = useCallback(async (
    targetClientId: string, 
    customFilters?: ViolationFilters
  ): Promise<PolicyViolation[]> => {
    try {
      return await policyService.getViolationsByClient(targetClientId, customFilters || filters);
    } catch (err) {
      console.error(`Failed to get violations for client ${targetClientId}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to get client violations'));
      return [];
    }
  }, [filters]);

  const getViolationStats = useCallback(async (): Promise<PolicyViolationStats> => {
    try {
      return await policyService.getViolationStats();
    } catch (err) {
      console.error('Failed to get violation stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to get violation statistics'));
      // Return default stats structure
      return {
        total: 0,
        by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
        by_status: { open: 0, acknowledged: 0, resolved: 0, false_positive: 0 },
        by_type: {}
      };
    }
  }, []);

  const searchViolations = useCallback(async (
    query: string, 
    customFilters?: ViolationFilters
  ): Promise<PolicyViolation[]> => {
    try {
      return await policyService.searchViolations(query, customFilters || filters);
    } catch (err) {
      console.error('Failed to search violations:', err);
      setError(err instanceof Error ? err : new Error('Failed to search violations'));
      return [];
    }
  }, [filters]);

  return {
    violations,
    loading,
    error,
    fetchViolations,
    refresh,
    getViolationsBySeverity,
    getViolationsByStatus,
    getViolationsByType,
    getStats,
    resolveViolation,
    acknowledgeViolation,
    markViolationFalsePositive,
    getAllViolations,
    getAllViolationsPaginated,
    getViolationsByClient,
    getViolationStats,
    searchViolations,
    enabled,
    setEnabled,
  };
};