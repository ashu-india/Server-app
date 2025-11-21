// src/pages/PolicyManager.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSecurityPolicies } from '../hooks/useSecurityPolicies';
import { SecurityPolicy, PolicyRule } from '../types';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/layout/StatCard';
import { DataGrid } from '../components/layout/DataGrid';
import {
  PlusCircle,
  Trash,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  List,
  Grid,
  Search,
  RefreshCw,
  Sliders,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  FileText,
  Clock,
  Play,
  Pause,
  Eye,
  Copy,
  Download,
  Upload,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type ViewMode = 'cards' | 'list';
type PolicyFormStep = 'basic' | 'rules' | 'settings';

export const PolicyManager: React.FC = () => {
  const {
    policies,
    loading,
    error,
    fetchPolicies,
    refresh,
    createPolicy,
    updatePolicy,
    togglePolicy,
    deletePolicy
  } = useSecurityPolicies();

  const [view, setView] = useState<ViewMode>('cards');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partial<SecurityPolicy> | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formStep, setFormStep] = useState<PolicyFormStep>('basic');
  const [expandedRule, setExpandedRule] = useState<number | null>(null);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const filteredPolicies = useMemo(() => {
    let result = policies;
    
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(p => 
        (p.name || '').toLowerCase().includes(q) || 
        (p.description || '').toLowerCase().includes(q) || 
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (filter === 'active') {
      result = result.filter(p => p.is_active);
    } else if (filter === 'inactive') {
      result = result.filter(p => !p.is_active);
    }

    return result;
  }, [policies, query, filter]);

  const stats = useMemo(() => {
    const total = policies.length;
    const active = policies.filter(p => p.is_active).length;
    const inactive = total - active;
    
    const bySeverity = {
      critical: policies.filter(p => p.severity === 'critical').length,
      high: policies.filter(p => p.severity === 'high').length,
      medium: policies.filter(p => p.severity === 'medium').length,
      low: policies.filter(p => p.severity === 'low').length,
    };

    const byCategory = policies.reduce((acc, policy) => {
      const category = policy.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRules = policies.reduce((sum, policy) => sum + (policy.rules?.length || 0), 0);

    return { 
      total, 
      active, 
      inactive, 
      bySeverity, 
      byCategory,
      totalRules,
      avgRulesPerPolicy: total > 0 ? (totalRules / total).toFixed(1) : '0'
    };
  }, [policies]);

  const policyTemplates = [
    {
      name: 'Antivirus Compliance',
      description: 'Monitor antivirus status and definition updates',
      category: 'antivirus',
      severity: 'high' as const,
      rules: [
        {
          id: 'template_av_running',
          field: 'antivirus.is_running',
          operator: 'equals' as const,
          value: 'true',
          description: 'Antivirus software must be running'
        },
        {
          id: 'template_av_updated',
          field: 'antivirus.is_updated',
          operator: 'equals' as const,
          value: 'true',
          description: 'Antivirus definitions must be up to date'
        }
      ]
    },
    {
      name: 'System Health',
      description: 'Monitor system resources and connectivity',
      category: 'system',
      severity: 'medium' as const,
      rules: [
        {
          id: 'template_system_online',
          field: 'client.last_seen',
          operator: 'less_than' as const,
          value: '1800000',
          description: 'System must report within last 30 minutes'
        }
      ]
    },
    {
      name: 'Network Security',
      description: 'Monitor network interface stability',
      category: 'network',
      severity: 'medium' as const,
      rules: [
        {
          id: 'template_network_stable',
          field: 'network.ip_stable',
          operator: 'equals' as const,
          value: 'true',
          description: 'IP addresses should remain stable'
        }
      ]
    }
  ];

  const openCreate = (template?: any) => {
    const basePolicy = {
      name: template?.name || '',
      description: template?.description || '',
      severity: template?.severity || 'medium',
      is_active: true,
      category: template?.category || 'general',
      auto_remediate: false,
      notification_enabled: true,
      check_frequency: 300,
      rules: template?.rules || [
        { 
          id: `r_${Date.now()}`, 
          field: 'client.last_seen', 
          operator: 'less_than' as const, 
          value: '1800000', 
          description: 'Client last seen within 30 minutes' 
        }
      ]
    };

    setEditing(basePolicy);
    setShowModal(true);
    setFormStep('basic');
  };

  const openEdit = (policy: SecurityPolicy) => {
    setEditing(JSON.parse(JSON.stringify(policy)));
    setShowModal(true);
    setFormStep('basic');
  };

  const duplicatePolicy = (policy: SecurityPolicy) => {
    const duplicated = {
      ...JSON.parse(JSON.stringify(policy)),
      id: undefined,
      name: `${policy.name} (Copy)`,
      created_at: undefined,
      updated_at: undefined
    };
    setEditing(duplicated);
    setShowModal(true);
    setFormStep('basic');
  };

  const savePolicy = async () => {
    if (!editing) return;
    
    if (!editing.name || !editing.name.trim()) {
      alert('Please provide a policy name.');
      return;
    }

    if ((editing.rules || []).length === 0) {
      alert('Please add at least one rule to the policy.');
      return;
    }

    // Validate all rules have required fields
    const invalidRules = (editing.rules || []).filter(rule => 
      !rule.field?.trim() || !rule.operator || !rule.value?.toString().trim()
    );

    if (invalidRules.length > 0) {
      alert('Please fill in all required fields for each rule (Field, Operator, and Value).');
      return;
    }

    try {
      if (editing.id) {
        await updatePolicy(editing.id, editing as SecurityPolicy);
      } else {
        await createPolicy(editing);
      }
      setShowModal(false);
      setEditing(null);
      setFormStep('basic');
    } catch (error) {
      console.error('Failed to save policy:', error);
      alert(`Failed to save policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await togglePolicy(id);
    } catch (error) {
      console.error('Failed to toggle policy:', error);
      alert(`Failed to toggle policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) return;
    
    try {
      await deletePolicy(id);
    } catch (error) {
      console.error('Failed to delete policy:', error);
      alert(`Failed to delete policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addNewRule = () => {
    if (!editing) return;
    
    const newRule: PolicyRule = {
      id: `r_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      description: ''
    };

    setEditing({
      ...editing,
      rules: [...(editing.rules || []), newRule]
    });
    setExpandedRule((editing.rules || []).length);
  };

  const updateRule = (index: number, updates: Partial<PolicyRule>) => {
    if (!editing?.rules) return;

    const updatedRules = [...editing.rules];
    updatedRules[index] = { ...updatedRules[index], ...updates };
    
    setEditing({
      ...editing,
      rules: updatedRules
    });
  };

  const removeRule = (index: number) => {
    if (!editing?.rules) return;

    const updatedRules = [...editing.rules];
    updatedRules.splice(index, 1);
    
    setEditing({
      ...editing,
      rules: updatedRules
    });
    
    if (expandedRule === index) {
      setExpandedRule(null);
    }
  };

  const moveRule = (fromIndex: number, toIndex: number) => {
    if (!editing?.rules) return;

    const updatedRules = [...editing.rules];
    const [movedRule] = updatedRules.splice(fromIndex, 1);
    updatedRules.splice(toIndex, 0, movedRule);
    
    setEditing({
      ...editing,
      rules: updatedRules
    });
    
    setExpandedRule(toIndex);
  };

  const exportPolicies = () => {
    try {
      const dataStr = JSON.stringify(policies, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-policies-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export policies:', error);
      alert('Failed to export policies. Please try again.');
    }
  };

  const importPolicies = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset import error
    setImportError(null);

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setImportError('Please select a JSON file.');
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImportError('File size too large. Please select a file smaller than 10MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validate imported data structure
        if (!Array.isArray(importedData)) {
          setImportError('Invalid file format: Expected an array of policies.');
          return;
        }

        // Validate each policy structure
        for (const policy of importedData) {
          if (!policy.name || typeof policy.name !== 'string') {
            setImportError('Invalid policy format: Each policy must have a name string.');
            return;
          }
          if (!Array.isArray(policy.rules)) {
            setImportError('Invalid policy format: Each policy must have a rules array.');
            return;
          }
        }

        console.log('Imported policies:', importedData);
        
        // Here you would typically call an import service
        // For now, we'll just show a success message
        alert(`Successfully validated ${importedData.length} policies. Ready to import.`);
        setImportExportOpen(false);
        
      } catch (error) {
        console.error('Error importing policies:', error);
        setImportError('Error parsing JSON file. Please check the file format.');
      }
    };

    reader.onerror = () => {
      setImportError('Error reading file. Please try again.');
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      case 'high': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
      case 'medium': return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
      case 'low': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <div className="flex items-center gap-1 text-green-600">
        <Play className="w-3 h-3" />
        <span className="text-xs font-medium">Active</span>
      </div> : 
      <div className="flex items-center gap-1 text-gray-500">
        <Pause className="w-3 h-3" />
        <span className="text-xs font-medium">Inactive</span>
      </div>;
  };

  const fieldExamples = [
    { value: 'antivirus.is_running', label: 'Antivirus - Running Status' },
    { value: 'antivirus.is_updated', label: 'Antivirus - Updated Status' },
    { value: 'client.last_seen', label: 'Client - Last Seen' },
    { value: 'client.status', label: 'Client - Status' },
    { value: 'network.ipv4_address', label: 'Network - IPv4 Address' },
    { value: 'software.version', label: 'Software - Version' },
    { value: 'threats.severity', label: 'Threats - Severity' }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Policies</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={fetchPolicies}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <PageHeader
  title="Policy Manager"
  description="Create and manage security policies to monitor compliance"
  icon={<ShieldCheck className="w-8 h-8 text-white" />}
  gradient="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900"
  
/>
 {/* Import/Export Card */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Policy Management</h3>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          <PlusCircle className="w-4 h-4" />
          Add Policy
        </button>
        <button 
          onClick={() => refresh()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>

    {/* Import/Export Section */}
    <div className="border-t border-gray-200 pt-4">
      <h4 className="font-medium text-gray-900 mb-3">Import & Export</h4>
      {importError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{importError}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={exportPolicies}
          className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <div className="font-medium text-gray-900">Export All Policies</div>
            <div className="text-sm text-gray-500">Download as JSON</div>
          </div>
        </button>
        
        <label className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <Upload className="w-5 h-5 text-green-600" />
          <div className="text-left">
            <div className="font-medium text-gray-900">Import Policies</div>
            <div className="text-sm text-gray-500">Upload JSON file</div>
          </div>
          <input
            type="file"
            accept=".json"
            onChange={importPolicies}
            className="hidden"
          />
        </label>
      </div>
    </div>
  </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Policies"
            value={stats.total}
            icon={<FileText className="w-4 h-4" />}
            color="blue"
            subtitle={`${stats.active} active`}
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={<Play className="w-4 h-4" />}
            color="green"
            subtitle={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}%`}
          />
          <StatCard
            title="Critical"
            value={stats.bySeverity.critical}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="red"
            subtitle="High severity"
          />
          <StatCard
            title="Total Rules"
            value={stats.totalRules}
            icon={<Zap className="w-4 h-4" />}
            color="purple"
            subtitle={`${stats.avgRulesPerPolicy} avg`}
          />
          <StatCard
            title="Categories"
            value={Object.keys(stats.byCategory).length}
            icon={<Sliders className="w-4 h-4" />}
            color="emerald"
            subtitle="Unique"
          />
          <StatCard
            title="Health"
            value={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 100}%`}
            icon={<ShieldCheck className="w-4 h-4" />}
            color="emerald"
            subtitle="Policy coverage"
          />
        </div>

        {/* Quick Templates */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick Start Templates</h2>
              <p className="text-sm text-gray-600 mt-1">Get started quickly with pre-configured policy templates</p>
            </div>
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {policyTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => openCreate(template)}
                className="p-4 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(template.severity).bg} ${getSeverityColor(template.severity).text}`}>
                    {template.severity}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{template.rules.length} rules</span>
                  <span className="capitalize">{template.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1">
                <button 
                  onClick={() => setView('cards')} 
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    view === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setView('list')} 
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Policies</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {filteredPolicies.length} of {policies.length} policies
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search policies by name, description, or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>


        {/* Policies List */}
        <DataGrid
          title="Security Policies"
          description={`Managing ${filteredPolicies.length} security policies across your environment`}
        
        >
          
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>Loading policies...</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-2">No policies found</p>
              <p className="text-gray-600">
                {query || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first security policy'
                }
              </p>
              {!query && filter === 'all' && (
                <button
                  onClick={() => openCreate()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Policy
                </button>
              )}
            </div>
          ) : view === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPolicies.map(policy => (
                <div 
                  key={policy.id} 
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                          {policy.name}
                        </h3>
                        {getStatusIcon(policy.is_active)}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{policy.description}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Category</span>
                      <span className="font-medium text-gray-900 capitalize">{policy.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Severity</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(policy.severity).bg} ${getSeverityColor(policy.severity).text}`}>
                        {policy.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Rules</span>
                      <span className="font-medium text-gray-900">{(policy.rules || []).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Check Frequency</span>
                      <span className="font-medium text-gray-900">{policy.check_frequency}s</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Updated <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(policy.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => duplicatePolicy(policy)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Duplicate policy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(policy)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit policy"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(policy.id)}
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title={policy.is_active ? 'Deactivate policy' : 'Activate policy'}
                      >
                        {policy.is_active ? 
                          <ToggleRight className="w-4 h-4" /> : 
                          <ToggleLeft className="w-4 h-4" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete policy"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPolicies.map(policy => (
                    <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{policy.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{policy.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusIcon(policy.is_active)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                        {policy.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(policy.severity).bg} ${getSeverityColor(policy.severity).text}`}>
                          {policy.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(policy.rules || []).length}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {policy.check_frequency}s
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => duplicatePolicy(policy)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(policy)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(policy.id)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title={policy.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {policy.is_active ? 
                              <ToggleRight className="w-4 h-4" /> : 
                              <ToggleLeft className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(policy.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataGrid>
        
      </div>

      {/* Enhanced Create/Edit Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editing.id ? 'Edit Security Policy' : 'Create Security Policy'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {editing.id ? 'Update policy configuration and rules' : 'Define a new security monitoring policy'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowModal(false); setEditing(null); setFormStep('basic'); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 pt-4 border-b border-gray-200">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {(['basic', 'rules', 'settings'] as PolicyFormStep[]).map((step, index) => (
                  <React.Fragment key={step}>
                    <button
                      onClick={() => setFormStep(step)}
                      className={`flex flex-col items-center transition-all duration-200 ${
                        formStep === step ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        formStep === step 
                          ? 'bg-blue-600 text-white' 
                          : formStep === 'settings' && step === 'rules' || formStep === 'rules' && step === 'basic'
                          ? 'bg-gray-300 text-gray-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-xs mt-1 capitalize">{step}</span>
                    </button>
                    {index < 2 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        (formStep === 'rules' && index === 0) || formStep === 'settings'
                          ? 'bg-blue-600' 
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Step 1: Basic Information */}
                {formStep === 'basic' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Policy Basics
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Policy Name *
                          </label>
                          <input 
                            value={editing.name || ''} 
                            onChange={e => setEditing({ ...editing, name: e.target.value })} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., Antivirus Update Compliance"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <select 
                            value={editing.category || 'general'} 
                            onChange={e => setEditing({ ...editing, category: e.target.value })} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="antivirus">Antivirus</option>
                            <option value="network">Network</option>
                            <option value="system">System</option>
                            <option value="software">Software</option>
                            <option value="compliance">Compliance</option>
                            <option value="general">General</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Severity Level
                          </label>
                          <select 
                            value={editing.severity || 'medium'} 
                            onChange={e => setEditing({ ...editing, severity: e.target.value as any })} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check Frequency (seconds) *
                          </label>
                          <input 
                            type="number" 
                            value={editing.check_frequency || 300} 
                            onChange={e => setEditing({ ...editing, check_frequency: Number(e.target.value) })} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="30"
                            step="30"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum 30 seconds recommended</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea 
                          value={editing.description || ''} 
                          onChange={e => setEditing({ ...editing, description: e.target.value })} 
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Describe what this policy monitors and its importance..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <div></div>
                      <button
                        onClick={() => setFormStep('rules')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
                      >
                        Continue to Rules
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Policy Rules */}
                {formStep === 'rules' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-500" />
                          Policy Rules
                          <span className="text-sm font-normal text-gray-500">
                            ({(editing.rules || []).length} rule{(editing.rules || []).length !== 1 ? 's' : ''})
                          </span>
                        </h3>
                        <button 
                          onClick={addNewRule}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Add Rule
                        </button>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        Define the conditions that trigger this policy. All rules must evaluate to true for the policy to pass.
                      </p>

                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {(editing.rules || []).map((rule, idx) => (
                          <div key={rule.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setExpandedRule(expandedRule === idx ? null : idx)}
                                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {expandedRule === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <h4 className="font-medium text-gray-900">Rule {idx + 1}</h4>
                              </div>
                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <button
                                    onClick={() => moveRule(idx, idx - 1)}
                                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                )}
                                {idx < (editing.rules?.length || 0) - 1 && (
                                  <button
                                    onClick={() => moveRule(idx, idx + 1)}
                                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => removeRule(idx)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {expandedRule === idx && (
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3">
                                <div className="lg:col-span-5">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Field Path *
                                  </label>
                                  <select
                                    value={rule.field}
                                    onChange={e => updateRule(idx, { field: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">Select a field...</option>
                                    {fieldExamples.map(field => (
                                      <option key={field.value} value={field.value}>
                                        {field.label}
                                      </option>
                                    ))}
                                  </select>
                                  <input 
                                    value={rule.field} 
                                    onChange={e => updateRule(idx, { field: e.target.value })} 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                                    placeholder="Or enter custom field path..."
                                  />
                                </div>
                                
                                <div className="lg:col-span-3">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Operator *
                                  </label>
                                  <select 
                                    value={rule.operator} 
                                    onChange={e => updateRule(idx, { operator: e.target.value as any })} 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="greater_than">Greater Than</option>
                                    <option value="less_than">Less Than</option>
                                    <option value="exists">Exists</option>
                                    <option value="not_exists">Not Exists</option>
                                  </select>
                                </div>
                                
                                <div className="lg:col-span-4">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Expected Value *
                                  </label>
                                  <input 
                                    value={rule.value as any} 
                                    onChange={e => updateRule(idx, { value: e.target.value })} 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Expected value or threshold"
                                  />
                                </div>

                                <div className="lg:col-span-12">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Rule Description
                                  </label>
                                  <input 
                                    value={rule.description || ''} 
                                    onChange={e => updateRule(idx, { description: e.target.value })} 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="What condition does this rule check?"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {(editing.rules || []).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No rules defined</p>
                          <p className="text-xs text-gray-400 mt-1">Add at least one rule to create this policy</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={() => setFormStep('basic')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Basics
                      </button>
                      <button
                        onClick={() => setFormStep('settings')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
                      >
                        Continue to Settings
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Policy Settings */}
                {formStep === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-purple-500" />
                        Policy Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                          <div className="flex items-center h-5 mt-0.5">
                            <input 
                              type="checkbox" 
                              checked={editing.is_active !== false} 
                              onChange={e => setEditing({ ...editing, is_active: e.target.checked })} 
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Active Policy</div>
                            <div className="text-sm text-gray-500 mt-1">Enable this policy to start monitoring and generating alerts</div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                          <div className="flex items-center h-5 mt-0.5">
                            <input 
                              type="checkbox" 
                              checked={editing.notification_enabled !== false} 
                              onChange={e => setEditing({ ...editing, notification_enabled: e.target.checked })} 
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Enable Notifications</div>
                            <div className="text-sm text-gray-500 mt-1">Send alert notifications when this policy is violated</div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                          <div className="flex items-center h-5 mt-0.5">
                            <input 
                              type="checkbox" 
                              checked={editing.auto_remediate || false} 
                              onChange={e => setEditing({ ...editing, auto_remediate: e.target.checked })} 
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Auto-remediate</div>
                            <div className="text-sm text-gray-500 mt-1">Attempt automatic fixes when violations are detected</div>
                          </div>
                        </label>

                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="font-medium text-gray-900 mb-2">Policy Summary</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>• {(editing.rules || []).length} rule{(editing.rules || []).length !== 1 ? 's' : ''} defined</div>
                            <div>• Checks every {editing.check_frequency} seconds</div>
                            <div>• {editing.severity} severity level</div>
                            <div>• {editing.category} category</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={() => setFormStep('rules')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Rules
                      </button>
                      <button
                        onClick={savePolicy}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editing.id ? 'Update Policy' : 'Create Policy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyManager;