import { useState, useEffect, useCallback } from 'react';
import { SecurityPolicy } from '../types';
import { policyService } from '../services/policyService';

interface UseSecurityPoliciesReturn {
  policies: SecurityPolicy[];
  loading: boolean;
  error: Error | null;
  fetchPolicies: () => Promise<void>;
  refresh: () => Promise<void>;
  getPoliciesByCategory: (category: string) => SecurityPolicy[];
  getActivePolicies: () => SecurityPolicy[];
  getPolicyById: (id: string) => SecurityPolicy | undefined;
  createPolicy: (policyData: Partial<SecurityPolicy>) => Promise<boolean>;
  updatePolicy: (policyId: string, updates: Partial<SecurityPolicy>) => Promise<boolean>;
  togglePolicy: (policyId: string) => Promise<boolean>;
  deletePolicy: (policyId: string) => Promise<boolean>;
}

export const useSecurityPolicies = (): UseSecurityPoliciesReturn => {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await policyService.getPolicies();
      setPolicies(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch security policies'));
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const getPoliciesByCategory = useCallback((category: string) => {
    return policies.filter(p => p.category === category);
  }, [policies]);

  const getActivePolicies = useCallback(() => {
    return policies.filter(p => p.is_active);
  }, [policies]);

  const getPolicyById = useCallback((id: string) => {
    return policies.find(p => p.id === id);
  }, [policies]);

  const createPolicy = useCallback(async (policyData: Partial<SecurityPolicy>) => {
    try {
      await policyService.createPolicy(policyData);
      await refresh(); // Refresh the list after creation
      return true;
    } catch (err) {
      console.error('Failed to create policy:', err);
      setError(err instanceof Error ? err : new Error('Failed to create policy'));
      return false;
    }
  }, [refresh]);

  const updatePolicy = useCallback(async (policyId: string, updates: Partial<SecurityPolicy>) => {
    try {
      await policyService.updatePolicy(policyId, updates);
      await refresh(); // Refresh the list after update
      return true;
    } catch (err) {
      console.error('Failed to update policy:', err);
      setError(err instanceof Error ? err : new Error('Failed to update policy'));
      return false;
    }
  }, [refresh]);

  const togglePolicy = useCallback(async (policyId: string) => {
    try {
      await policyService.togglePolicy(policyId);
      await refresh(); // Refresh the list after toggle
      return true;
    } catch (err) {
      console.error('Failed to toggle policy:', err);
      setError(err instanceof Error ? err : new Error('Failed to toggle policy'));
      return false;
    }
  }, [refresh]);

  const deletePolicy = useCallback(async (policyId: string) => {
    try {
      await policyService.deletePolicy(policyId);
      await refresh(); // Refresh the list after deletion
      return true;
    } catch (err) {
      console.error('Failed to delete policy:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete policy'));
      return false;
    }
  }, [refresh]);

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    refresh,
    getPoliciesByCategory,
    getActivePolicies,
    getPolicyById,
    createPolicy,
    updatePolicy,
    togglePolicy,
    deletePolicy,
  };
};