// ============ BASE TYPES ============
export type ClientStatus = 'active' | 'inactive' | 'disconnected' | 'error';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IOCType = 'hash' | 'ip' | 'domain' | 'url' | 'email' | 'file_hash' | 'certificate';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'false_positive';

// ============ POLICY VIOLATION TYPES ============
export type PolicyViolationType = 
  | 'antivirus_outdated'
  | 'os_outdated'
  | 'security_patch_missing'
  | 'ip_address_changed'
  | 'network_interface_down'
  | 'firewall_disabled'
  | 'disk_encryption_disabled'
  | 'unauthorized_software'
  | 'suspicious_process'
  | 'memory_usage_high'
  | 'cpu_usage_high'
  | 'offline_too_long'
  | 'dns_configuration_issue'
  | 'open_ports_detected'
  | 'user_account_violation'
  | 'vulnerable_software'
  | 'no_antivirus'
  | 'real_time_protection_disabled';

export type PolicyViolationStatus = 'open' | 'acknowledged' | 'resolved' | 'false_positive';
export type SystemEventSeverity = 'info' | 'warning' | 'error' | 'critical';
export type NetworkChangeType = 'ipv4_changed' | 'ipv6_changed' | 'mac_changed' | 'interface_added' | 'interface_removed' | 'dhcp_enabled' | 'dhcp_disabled';

// ============ CORE ENTITY INTERFACES ============
export interface Client {
  id: string;
  unique_id: string;
  hostname: string;
  os_name: string;
  os_version: string;
  arch?: string;
  cpu_cores?: number;
  total_memory?: number;
  ip_address?: string;
  mac_address?: string;
  status: ClientStatus;
  threat_level: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  
  // Enhanced monitoring fields
  security_score?: number;
  compliance_score?: number;
  last_compliance_check?: string;
  firewall_status?: 'enabled' | 'disabled' | 'unknown';
  encryption_status?: 'enabled' | 'disabled' | 'unknown';
}

export interface ClientSoftware {
  id: string;
  client_id: string;
  software_name: string;
  version: string;
  publisher?: string;
  install_date?: string;
  file_path?: string;
  is_security_related: boolean;
  created_at: string;
  updated_at: string;
  
  // Vulnerability assessment fields
  vulnerability_score?: number;
  last_updated?: string;
  is_vulnerable?: boolean;
  cve_ids?: string;
}

export interface ClientAntivirus {
  id: string;
  client_id: string;
  software_name: string;
  version: string;
  engine_version?: string;
  signature_date?: string;
  is_running: boolean;
  is_updated: boolean;
  last_scan?: string;
  last_scan_status?: string;
  threats_found: number;
  created_at: string;
  updated_at: string;
  
  // Enhanced AV monitoring
  real_time_protection?: boolean;
  definition_age_days?: number;
  last_update_check?: string;
}

export interface ClientNetworkInfo {
  id: string;
  client_id: string;
  interface_name: string;
  ipv4_address?: string;
  ipv6_address?: string;
  mac_address?: string;
  gateway?: string;
  dns_servers?: string[];
  dhcp_enabled?: boolean;
  created_at: string;
  updated_at: string;
  
  // Enhanced network monitoring
  connection_type?: 'wired' | 'wireless' | 'vpn' | 'unknown';
  connection_speed?: number;
  subnet_mask?: string;
  is_primary?: boolean;
  status?: 'up' | 'down' | 'unknown';
  last_change?: string;
}

export interface ClientThreatHistory {
  id: string;
  client_id: string;
  threat_name: string;
  threat_type: string;
  severity: AlertSeverity;
  description?: string;
  detected_at: string;
  resolved_at?: string;
  detection_method?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  
  // Enhanced threat tracking
  file_path?: string;
  process_name?: string;
  confidence_score?: number;
  mitigation_action?: string;
  ioc_matches?: string;
}

export interface Alert {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  assigned_to?: string;
  ioc_id?: string;
  detected_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // Policy violation alerts
  violation_type?: string;
  policy_rule?: string;
  automatic_resolution?: boolean;
}

export interface IOCIndicator {
  id: string;
  indicator_value: string;
  indicator_type: IOCType;
  source: string;
  severity: AlertSeverity;
  confidence_score: number;
  description?: string;
  tags: string[];
  is_active: boolean;
  expires_at?: string;
  last_seen?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface ThreatHunt {
  id: string;
  client_id: string;
  hunt_name: string;
  hunt_query?: string;
  results_count: number;
  detection_found: boolean;
  severity: AlertSeverity;
  hunt_data?: Record<string, unknown>;
  executed_at: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// ============ POLICY & COMPLIANCE INTERFACES ============
export interface PolicyViolation {
  id: string;
  client_id: string;
  violation_type: PolicyViolationType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detected_at: string;
  resolved_at?: string;
  status: PolicyViolationStatus;
  evidence: Record<string, unknown>;
  recommendation: string;
  policy_rule: string;
  auto_resolved: boolean;
  resolution_notes?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  severity: AlertSeverity;
  is_active: boolean;
  category: string;
  auto_remediate: boolean;
  remediation_script?: string;
  notification_enabled: boolean;
  check_frequency: number;
  last_check?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  description: string;
}

export interface ComplianceStatus {
  id: string;
  client_id: string;
  overall_score: number;
  passed_checks: number;
  total_checks: number;
  critical_violations: number;
  high_violations: number;
  medium_violations: number;
  low_violations: number;
  last_assessment: string;
  antivirus_score: number;
  network_score: number;
  system_score: number;
  software_score: number;
  threat_score: number;
  created_at: string;
  updated_at: string;
}

export interface NetworkChange {
  id: string;
  client_id: string;
  interface_name: string;
  old_ipv4?: string;
  new_ipv4?: string;
  old_ipv6?: string;
  new_ipv6?: string;
  old_mac?: string;
  new_mac?: string;
  change_type: NetworkChangeType;
  detected_at: string;
  previous_snapshot_id?: string;
  current_snapshot_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientSnapshot {
  id: string;
  client_id: string;
  snapshot_data: {
    antivirus: ClientAntivirus[];
    network: ClientNetworkInfo[];
    software: ClientSoftware[];
    threats: ClientThreatHistory[];
    client: Partial<Client>;
    timestamp: string;
  };
  snapshot_type: 'full' | 'incremental';
  checksum: string;
  created_at: string;
  updated_at: string;
}

export interface ClientPerformanceMetrics {
  id: string;
  client_id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage_sent: number;
  network_usage_received: number;
  process_count: number;
  uptime_seconds: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  active_connections: number;
  open_ports: string[];
  created_at: string;
  updated_at: string;
}

export interface SystemEvent {
  id: string;
  client_id?: string;
  event_type: string;
  event_source: string;
  severity: SystemEventSeverity;
  title: string;
  description?: string;
  event_data: Record<string, unknown>;
  detected_at: string;
  correlation_id?: string;
  parent_event_id?: string;
  created_at: string;
  updated_at: string;
}

// ============ COMPOSITE & DATA INTERFACES ============
export interface ClientDetailData {
  client: Client;
  software: ClientSoftware[];
  antivirus: ClientAntivirus[];
  network: ClientNetworkInfo[];
  threats: ClientThreatHistory[];
}

export interface ClientComprehensiveData extends ClientDetailData {
  snapshots: ClientSnapshot[];
  violations: PolicyViolation[];
  networkChanges: NetworkChange[];
  compliance: ComplianceStatus | null;
  performanceMetrics: ClientPerformanceMetrics[];
  systemEvents: SystemEvent[];
}

export interface ComplianceAnalysisResult {
  violations: PolicyViolation[];
  compliance: ComplianceStatus;
  changes: NetworkChange[];
}

export interface PolicyAnalysisResult {
  client: Client;
  data: ClientDetailData;
  violations: PolicyViolation[];
  compliance: ComplianceStatus;
  networkChanges: NetworkChange[];
}

// ============ STATISTICS & DASHBOARD INTERFACES ============
export interface ClientStats {
  total: number;
  active: number;
  disconnected: number;
  error: number;
  highThreat: number;
  mediumThreat: number;
  lowThreat: number;
  avgSecurityScore: number;
  avgComplianceScore: number;
  healthy: number;
  atRisk: number;
}

export interface PolicyViolationStats {
  total: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_status: {
    open: number;
    acknowledged: number;
    resolved: number;
    false_positive: number;
  };
  by_type: Record<string, number>;
}

export interface NetworkChangeStats {
  total_changes: number;
  changes_by_type: Record<string, number>;
  changes_by_client: Record<string, number>;
  recent_changes: Array<{
    client_id: string;
    interface_name: string;
    change_type: string;
    detected_at: string;
  }>;
}

export interface ComplianceTrend {
  date: string;
  score: number;
  violations: number;
}

// ============ SERVICE INTERFACES ============
export interface ClientService {
  getClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | null>;
  getClientDetail(clientId: string): Promise<ClientDetailData | null>;
  getClientSoftware(clientId: string): Promise<ClientSoftware[]>;
  getClientAntivirus(clientId: string): Promise<ClientAntivirus[]>;
  getClientNetwork(clientId: string): Promise<ClientNetworkInfo[]>;
  getClientThreats(clientId: string): Promise<ClientThreatHistory[]>;
  updateClientStatus(clientId: string, status: string): Promise<void>;
  getClientsByStatus(status: string): Promise<Client[]>;
  getClientsByThreatLevel(level: string): Promise<Client[]>;
  searchClients(query: string): Promise<Client[]>;
  
  // Enhanced methods
  getClientSnapshots(clientId: string, limit?: number): Promise<ClientSnapshot[]>;
  getLatestClientSnapshot(clientId: string): Promise<ClientSnapshot | null>;
  createClientSnapshot(clientId: string, snapshotData: any): Promise<ClientSnapshot>;
  getClientViolations(clientId: string, filters?: any): Promise<PolicyViolation[]>;
  getClientNetworkChanges(clientId: string, limit?: number): Promise<NetworkChange[]>;
  getClientCompliance(clientId: string): Promise<ComplianceStatus | null>;
  getClientPerformanceMetrics(clientId: string, limit?: number): Promise<ClientPerformanceMetrics[]>;
  analyzeClientCompliance(clientId: string): Promise<ComplianceAnalysisResult>;
}

export interface PolicyService {
  analyzeClientCompliance(client: Client, detailData: ClientDetailData): Promise<ComplianceAnalysisResult>;
  getPolicies(): Promise<SecurityPolicy[]>;
  getViolationsByClient(clientId: string): Promise<PolicyViolation[]>;
  getAllViolations(filters?: any): Promise<PolicyViolation[]>;
  resolveViolation(violationId: string, notes?: string): Promise<void>;
  acknowledgeViolation(violationId: string, acknowledgedBy?: string): Promise<void>;
  markViolationFalsePositive(violationId: string, notes?: string): Promise<void>;
  createPolicy(policyData: Partial<SecurityPolicy>): Promise<SecurityPolicy>;
  updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy>;
  togglePolicy(policyId: string): Promise<SecurityPolicy>;
  deletePolicy(policyId: string): Promise<void>;
}

export interface AlertService {
  getAlerts(): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | null>;
  getAlertsByStatus(status: string): Promise<Alert[]>;
  getAlertsBySeverity(severity: AlertSeverity): Promise<Alert[]>;
  getClientAlerts(clientId: string): Promise<Alert[]>;
  createAlert(alert: Partial<Alert>): Promise<Alert | null>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null>;
  acknowledgeAlert(id: string): Promise<Alert | null>;
  resolveAlert(id: string): Promise<Alert | null>;
  getOpenAlerts(): Promise<Alert[]>;
  getRecentAlerts(hours?: number): Promise<Alert[]>;
}

// ============ HOOK RETURN TYPES ============
export interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: Error | null;
  fetchClients: () => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  filterByStatus: (status: string) => Client[];
  filterByThreatLevel: (level: string) => Client[];
  search: (query: string) => Client[];
  getStats: () => ClientStats;
  refresh: () => Promise<void>;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export interface UsePolicyViolationsReturn {
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
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export interface UseSecurityPoliciesReturn {
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
}

// ============ UTILITY & FORM TYPES ============
export interface Formatters {
  formatBytes(bytes: number): string;
  formatDateTime(date: string | Date): string;
  formatDate(date: string | Date): string;
  getRelativeTime(date: string | Date): string;
  formatDuration(seconds: number): string;
  formatPercentage(value: number): string;
}

export interface StatusColors {
  bg: string;
  text: string;
  border?: string;
}

export interface SeverityColors {
  bg: string;
  text: string;
  border: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

// ============ FILTER TYPES ============
export interface ClientFilters {
  status?: string;
  threat_level?: string;
  os_name?: string;
  search?: string;
}

export interface ViolationFilters {
  status?: string;
  severity?: string;
  violation_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface NetworkChangeFilters {
  client_id?: string;
  change_type?: string;
  start_date?: string;
  end_date?: string;
}

// ============ EXPORT ALL TYPES ============
export type {
  // Re-export for convenience

};