import React, { useState, useEffect } from 'react';
import { Client, ClientDetailData } from '../types';
import { PolicyViolation, ComplianceStatus } from '../types/index';
import { NetworkChange } from '../services/policyService';
import { policyService } from '../services/policyService';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield, 
  TrendingUp, 
 
  Clock,
 
  Network,

  Activity,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatters } from '../utils/formatters';

interface PolicyViolationsTabProps {
  client: Client;
  data: ClientDetailData;
  onDataRefresh?: () => void;
}

export const PolicyViolationsTab: React.FC<PolicyViolationsTabProps> = ({ 
  client, 
  data,
  onDataRefresh 
}) => {
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [networkChanges, setNetworkChanges] = useState<NetworkChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<PolicyViolation | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const analyzeCompliance = async () => {
    setAnalyzing(true);
    try {
      const result = await policyService.analyzeClientCompliance(client, data);
      setViolations(result.violations);
      setCompliance(result.compliance);
      setNetworkChanges(result.changes);
      setLastAnalysis(new Date());
    } catch (error) {
      console.error('Failed to analyze compliance:', error);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeCompliance();
  }, [client, data]);

  const handleRefresh = () => {
    if (onDataRefresh) {
      onDataRefresh();
    }
    analyzeCompliance();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChangeIcon = (changeType: string) => {
    if (changeType.includes('added')) return <Wifi className="w-4 h-4 text-green-600" />;
    if (changeType.includes('removed')) return <WifiOff className="w-4 h-4 text-red-600" />;
    return <Network className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600 font-medium">Analyzing policy compliance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Policy Compliance</h2>
          <p className="text-sm text-slate-600">
            Real-time analysis of client security posture
            {lastAnalysis && (
              <span className="ml-2">• Last analyzed: {formatters.formatDateTime(lastAnalysis)}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Compliance Overview */}
      {compliance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Compliance Score</p>
                <p className={`text-2xl font-bold ${
                  compliance.overall_score >= 90 ? 'text-green-600' :
                  compliance.overall_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {compliance.overall_score}%
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {compliance.passed_checks} of {compliance.total_checks} checks passed
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical Violations</p>
                <p className="text-2xl font-bold text-red-600">{compliance.critical_violations}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Requires immediate attention
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Network Changes</p>
                <p className="text-2xl font-bold text-blue-600">{networkChanges.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Since last analysis
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Violations</p>
                <p className="text-2xl font-bold text-slate-900">{violations.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              All policy violations
            </div>
          </div>
        </div>
      )}

      {/* Network Changes */}
      {networkChanges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              Recent Network Changes ({networkChanges.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {networkChanges.map((change) => (
              <div key={change.id} className="p-4">
                <div className="flex items-center gap-3">
                  {getChangeIcon(change.change_type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{change.interface_name}</h4>
                      <span className="text-sm text-slate-500 capitalize">
                        {change.change_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mt-1">
                      {change.old_ipv4 && (
                        <div>Old IPv4: <span className="font-mono">{change.old_ipv4}</span></div>
                      )}
                      {change.new_ipv4 && (
                        <div>New IPv4: <span className="font-mono">{change.new_ipv4}</span></div>
                      )}
                      {change.old_ipv6 && (
                        <div>Old IPv6: <span className="font-mono">{change.old_ipv6}</span></div>
                      )}
                      {change.new_ipv6 && (
                        <div>New IPv6: <span className="font-mono">{change.new_ipv6}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violations List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Policy Violations ({violations.length})
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Detected policy violations based on real client data
          </p>
        </div>

        {violations.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Policy Violations</h3>
            <p className="text-slate-500">All policy checks passed successfully</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {violations.map((violation) => (
              <div
                key={violation.id}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedViolation(violation)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getSeverityIcon(violation.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{violation.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(violation.severity)}`}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{violation.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Detected: {formatters.formatDateTime(violation.detected_at)}</span>
                      <span>Type: {violation.violation_type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Violation Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSeverityIcon(selectedViolation.severity)}
                  <h3 className="text-lg font-bold text-slate-900">{selectedViolation.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                <p className="text-slate-700">{selectedViolation.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Evidence</h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedViolation.evidence, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Recommendation</h4>
                <p className="text-slate-700">{selectedViolation.recommendation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Severity:</span>
                  <span className={`ml-2 font-medium ${getSeverityColor(selectedViolation.severity)} px-2 py-1 rounded-full`}>
                    {selectedViolation.severity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Detected:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {formatters.formatDateTime(selectedViolation.detected_at)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Policy Rule:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {selectedViolation.policy_rule}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Status:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {selectedViolation.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await policyService.resolveViolation(selectedViolation.id);
                    setSelectedViolation(null);
                    analyzeCompliance();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};