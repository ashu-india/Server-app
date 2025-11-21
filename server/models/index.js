import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.MYSQL_DATABASE || 'bolt_db', process.env.MYSQL_USER || 'root', process.env.MYSQL_PASSWORD || '', {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  dialect: 'mysql',
  logging: false,
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  full_name: { type: DataTypes.STRING(255), allowNull: true },
  role: { type: DataTypes.STRING(50), defaultValue: 'admin' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login: { type: DataTypes.DATE, allowNull: true },
  settings: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Client = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  unique_id: DataTypes.STRING(255),
  hostname: DataTypes.STRING(255),
  os_name: DataTypes.STRING(255),
  os_version: DataTypes.STRING(255),
  arch: DataTypes.STRING(50),
  cpu_cores: DataTypes.INTEGER,
  total_memory: DataTypes.BIGINT,
  ip_address: DataTypes.STRING(100),
  mac_address: DataTypes.STRING(100),
  status: DataTypes.STRING(50),
  threat_level: DataTypes.STRING(50),
  last_seen: DataTypes.DATE,
  metadata: DataTypes.TEXT,
  // New fields for enhanced monitoring
  security_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  compliance_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_compliance_check: DataTypes.DATE,
  firewall_status: { type: DataTypes.STRING(50), defaultValue: 'unknown' },
  encryption_status: { type: DataTypes.STRING(50), defaultValue: 'unknown' },
}, {
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ClientSoftware = sequelize.define('ClientSoftware', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  software_name: DataTypes.STRING(255),
  version: DataTypes.STRING(255),
  publisher: DataTypes.STRING(255),
  install_date: DataTypes.DATE,
  file_path: DataTypes.TEXT,
  is_security_related: { type: DataTypes.BOOLEAN, defaultValue: false },
  // New fields for vulnerability assessment
  vulnerability_score: { type: DataTypes.FLOAT, defaultValue: 0 },
  last_updated: DataTypes.DATE,
  is_vulnerable: { type: DataTypes.BOOLEAN, defaultValue: false },
  cve_ids: { type: DataTypes.TEXT, allowNull: true }, // Comma-separated CVE IDs
}, {
  tableName: 'client_software',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ClientAntivirus = sequelize.define('ClientAntivirus', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  software_name: DataTypes.STRING(255),
  version: DataTypes.STRING(255),
  engine_version: DataTypes.STRING(255),
  signature_date: DataTypes.DATE,
  is_running: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_updated: { type: DataTypes.BOOLEAN, defaultValue: false },
  last_scan: DataTypes.DATE,
  last_scan_status: DataTypes.STRING(255),
  threats_found: { type: DataTypes.INTEGER, defaultValue: 0 },
  // New fields for enhanced AV monitoring
  real_time_protection: { type: DataTypes.BOOLEAN, defaultValue: false },
  definition_age_days: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_update_check: DataTypes.DATE,
}, {
  tableName: 'client_antivirus',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ClientNetworkInfo = sequelize.define('ClientNetworkInfo', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  interface_name: DataTypes.STRING(255),
  ipv4_address: DataTypes.STRING(100),
  ipv6_address: DataTypes.STRING(100),
  mac_address: DataTypes.STRING(100),
  gateway: DataTypes.STRING(100),
  dns_servers: DataTypes.TEXT,
  dhcp_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  // New fields for enhanced network monitoring
  connection_type: { type: DataTypes.STRING(50), defaultValue: 'unknown' }, // wired, wireless, vpn
  connection_speed: { type: DataTypes.BIGINT, allowNull: true }, // in Mbps
  subnet_mask: DataTypes.STRING(100),
  is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.STRING(50), defaultValue: 'unknown' }, // up, down, unknown
  last_change: DataTypes.DATE,
}, {
  tableName: 'client_network_info',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ClientThreatHistory = sequelize.define('ClientThreatHistory', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  threat_name: DataTypes.STRING(255),
  threat_type: DataTypes.STRING(255),
  severity: DataTypes.STRING(50),
  description: DataTypes.TEXT,
  detected_at: DataTypes.DATE,
  resolved_at: DataTypes.DATE,
  detection_method: DataTypes.STRING(255),
  metadata: DataTypes.TEXT,
  // New fields for enhanced threat tracking
  file_path: DataTypes.TEXT,
  process_name: DataTypes.STRING(255),
  confidence_score: { type: DataTypes.FLOAT, defaultValue: 0 },
  mitigation_action: DataTypes.STRING(255),
  ioc_matches: { type: DataTypes.TEXT, allowNull: true }, // JSON string of matched IOCs
}, {
  tableName: 'client_threat_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Alert = sequelize.define('Alert', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title: DataTypes.STRING(255),
  description: DataTypes.TEXT,
  severity: DataTypes.STRING(50),
  status: DataTypes.STRING(50),
  assigned_to: DataTypes.STRING(255),
  ioc_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  detected_at: DataTypes.DATE,
  acknowledged_at: DataTypes.DATE,
  resolved_at: DataTypes.DATE,
  metadata: DataTypes.TEXT,
  // New fields for policy violation alerts
  violation_type: DataTypes.STRING(100),
  policy_rule: DataTypes.STRING(100),
  automatic_resolution: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'alerts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const IOCIndicator = sequelize.define('IOCIndicator', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  indicator_value: DataTypes.TEXT,
  indicator_type: DataTypes.STRING(50),
  source: DataTypes.STRING(255),
  severity: DataTypes.STRING(50),
  confidence_score: { type: DataTypes.FLOAT, defaultValue: 0 },
  description: DataTypes.TEXT,
  tags: DataTypes.TEXT,
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  expires_at: DataTypes.DATE,
  last_seen: DataTypes.DATE,
  metadata: DataTypes.TEXT,
}, {
  tableName: 'ioc_indicators',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const IOCDistribution = sequelize.define('IOCDistribution', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  distribution_data: DataTypes.TEXT,
}, {
  tableName: 'ioc_distributions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ============ NEW MODELS FOR POLICY VIOLATION TRACKING ============

const ClientSnapshot = sequelize.define('ClientSnapshot', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  snapshot_data: { type: DataTypes.JSON, allowNull: false },
  snapshot_type: { type: DataTypes.STRING(50), defaultValue: 'full' }, // full, incremental
  checksum: DataTypes.STRING(255), // For change detection
}, {
  tableName: 'client_snapshots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const PolicyViolation = sequelize.define('PolicyViolation', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  violation_type: { type: DataTypes.STRING(100), allowNull: false },
  severity: { 
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), 
    defaultValue: 'medium' 
  },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  detected_at: { type: DataTypes.DATE, allowNull: false },
  resolved_at: { type: DataTypes.DATE, allowNull: true },
  status: { 
    type: DataTypes.ENUM('open', 'acknowledged', 'resolved', 'false_positive'), 
    defaultValue: 'open' 
  },
  evidence: { type: DataTypes.JSON, allowNull: true },
  recommendation: { type: DataTypes.TEXT, allowNull: true },
  policy_rule: { type: DataTypes.STRING(100), allowNull: false },
  // Additional tracking fields
  auto_resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
  resolution_notes: DataTypes.TEXT,
  acknowledged_by: DataTypes.STRING(255),
  acknowledged_at: DataTypes.DATE,
}, {
  tableName: 'policy_violations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const NetworkChange = sequelize.define('NetworkChange', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  interface_name: { type: DataTypes.STRING(255), allowNull: false },
  old_ipv4: DataTypes.STRING(100),
  new_ipv4: DataTypes.STRING(100),
  old_ipv6: DataTypes.STRING(100),
  new_ipv6: DataTypes.STRING(100),
  old_mac: DataTypes.STRING(100),
  new_mac: DataTypes.STRING(100),
  change_type: { 
    type: DataTypes.ENUM(
      'ipv4_changed', 
      'ipv6_changed', 
      'mac_changed', 
      'interface_added', 
      'interface_removed',
      'dhcp_enabled',
      'dhcp_disabled'
    ), 
    allowNull: false 
  },
  detected_at: { type: DataTypes.DATE, allowNull: false },
  // Additional context
  previous_snapshot_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  current_snapshot_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  tableName: 'network_changes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const SecurityPolicy = sequelize.define('SecurityPolicy', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  rules: { type: DataTypes.JSON, allowNull: false }, // Array of policy rules
  severity: { 
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), 
    defaultValue: 'medium' 
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  category: { type: DataTypes.STRING(100), defaultValue: 'general' }, // antivirus, network, system, etc.
  // Enforcement settings
  auto_remediate: { type: DataTypes.BOOLEAN, defaultValue: false },
  remediation_script: DataTypes.TEXT,
  notification_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  // Scheduling
  check_frequency: { type: DataTypes.INTEGER, defaultValue: 300 }, // seconds
  last_check: DataTypes.DATE,
}, {
  tableName: 'security_policies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ComplianceStatus = sequelize.define('ComplianceStatus', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  overall_score: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-100
  passed_checks: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_checks: { type: DataTypes.INTEGER, defaultValue: 0 },
  critical_violations: { type: DataTypes.INTEGER, defaultValue: 0 },
  high_violations: { type: DataTypes.INTEGER, defaultValue: 0 },
  medium_violations: { type: DataTypes.INTEGER, defaultValue: 0 },
  low_violations: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_assessment: { type: DataTypes.DATE, allowNull: false },
  // Category-wise scores
  antivirus_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  network_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  system_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  software_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  threat_score: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'compliance_status',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const ClientPerformanceMetrics = sequelize.define('ClientPerformanceMetrics', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  cpu_usage: { type: DataTypes.FLOAT, defaultValue: 0 }, // percentage
  memory_usage: { type: DataTypes.FLOAT, defaultValue: 0 }, // percentage
  disk_usage: { type: DataTypes.FLOAT, defaultValue: 0 }, // percentage
  network_usage_sent: { type: DataTypes.BIGINT, defaultValue: 0 }, // bytes
  network_usage_received: { type: DataTypes.BIGINT, defaultValue: 0 }, // bytes
  process_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  uptime_seconds: { type: DataTypes.BIGINT, defaultValue: 0 },
  // Disk space details
  disk_total: { type: DataTypes.BIGINT, defaultValue: 0 },
  disk_used: { type: DataTypes.BIGINT, defaultValue: 0 },
  disk_free: { type: DataTypes.BIGINT, defaultValue: 0 },
  // Network connections
  active_connections: { type: DataTypes.INTEGER, defaultValue: 0 },
  open_ports: { type: DataTypes.TEXT, allowNull: true }, // JSON array
}, {
  tableName: 'client_performance_metrics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const SystemEvent = sequelize.define('SystemEvent', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  event_type: { type: DataTypes.STRING(100), allowNull: false },
  event_source: { type: DataTypes.STRING(100), allowNull: false },
  severity: { 
    type: DataTypes.ENUM('info', 'warning', 'error', 'critical'), 
    defaultValue: 'info' 
  },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  event_data: { type: DataTypes.JSON, allowNull: true },
  detected_at: { type: DataTypes.DATE, allowNull: false },
  // For event correlation
  correlation_id: DataTypes.STRING(255),
  parent_event_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  tableName: 'system_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ============ ASSOCIATIONS ============

// Existing associations
Client.hasMany(ClientSoftware, { foreignKey: 'client_id' });
ClientSoftware.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(ClientAntivirus, { foreignKey: 'client_id' });
ClientAntivirus.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(ClientNetworkInfo, { foreignKey: 'client_id' });
ClientNetworkInfo.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(ClientThreatHistory, { foreignKey: 'client_id' });
ClientThreatHistory.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(Alert, { foreignKey: 'client_id' });
Alert.belongsTo(Client, { foreignKey: 'client_id' });

IOCIndicator.hasMany(IOCDistribution, { foreignKey: 'ioc_id' });
IOCDistribution.belongsTo(IOCIndicator, { foreignKey: 'ioc_id' });

// New associations for policy violation tracking
Client.hasMany(ClientSnapshot, { foreignKey: 'client_id' });
ClientSnapshot.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(PolicyViolation, { foreignKey: 'client_id' });
PolicyViolation.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(NetworkChange, { foreignKey: 'client_id' });
NetworkChange.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(ComplianceStatus, { foreignKey: 'client_id' });
ComplianceStatus.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(ClientPerformanceMetrics, { foreignKey: 'client_id' });
ClientPerformanceMetrics.belongsTo(Client, { foreignKey: 'client_id' });

Client.hasMany(SystemEvent, { foreignKey: 'client_id' });
SystemEvent.belongsTo(Client, { foreignKey: 'client_id' });

// Self-referencing for event correlation
SystemEvent.belongsTo(SystemEvent, { 
  as: 'ParentEvent', 
  foreignKey: 'parent_event_id' 
});
SystemEvent.hasMany(SystemEvent, { 
  as: 'ChildEvents', 
  foreignKey: 'parent_event_id' 
});

// Snapshot associations for change tracking
NetworkChange.belongsTo(ClientSnapshot, { 
  as: 'PreviousSnapshot', 
  foreignKey: 'previous_snapshot_id' 
});
NetworkChange.belongsTo(ClientSnapshot, { 
  as: 'CurrentSnapshot', 
  foreignKey: 'current_snapshot_id' 
});

export {
  sequelize,
  Sequelize,
  User,
  Client,
  ClientSoftware,
  ClientAntivirus,
  ClientNetworkInfo,
  ClientThreatHistory,
  Alert,
  IOCIndicator,
  IOCDistribution,
  // New models
  ClientSnapshot,
  PolicyViolation,
  NetworkChange,
  SecurityPolicy,
  ComplianceStatus,
  ClientPerformanceMetrics,
  SystemEvent,
};