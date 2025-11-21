'use strict';

module.exports = {
  up: async ({ context: queryInterface }) => {
    // Create users
    await queryInterface.createTable('users', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      email: { type: 'VARCHAR(255)', allowNull: false, unique: true },
      password_hash: { type: 'VARCHAR(255)', allowNull: false },
      full_name: { type: 'VARCHAR(255)', allowNull: true },
      role: { type: 'VARCHAR(50)', defaultValue: 'admin' },
      is_active: { type: 'TINYINT', defaultValue: 1 },
      last_login: { type: 'DATETIME', allowNull: true },
      settings: { type: 'JSON', allowNull: true, defaultValue: '{}' },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // clients with new columns
    await queryInterface.createTable('clients', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      unique_id: { type: 'VARCHAR(255)' },
      hostname: { type: 'VARCHAR(255)' },
      os_name: { type: 'VARCHAR(255)' },
      os_version: { type: 'VARCHAR(255)' },
      arch: { type: 'VARCHAR(50)' },
      cpu_cores: { type: 'INTEGER' },
      total_memory: { type: 'BIGINT' },
      ip_address: { type: 'VARCHAR(100)' },
      mac_address: { type: 'VARCHAR(100)' },
      status: { type: 'VARCHAR(50)' },
      threat_level: { type: 'VARCHAR(50)' },
      last_seen: { type: 'DATETIME' },
      metadata: { type: 'TEXT' },
      // New columns
      security_score: { type: 'INTEGER', defaultValue: 0 },
      compliance_score: { type: 'INTEGER', defaultValue: 0 },
      last_compliance_check: { type: 'DATETIME', allowNull: true },
      firewall_status: { type: 'VARCHAR(50)', defaultValue: 'unknown' },
      encryption_status: { type: 'VARCHAR(50)', defaultValue: 'unknown' },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // client_software with new columns
    await queryInterface.createTable('client_software', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER' },
      software_name: { type: 'VARCHAR(255)' },
      version: { type: 'VARCHAR(255)' },
      publisher: { type: 'VARCHAR(255)' },
      install_date: { type: 'DATETIME' },
      file_path: { type: 'TEXT' },
      is_security_related: { type: 'TINYINT', defaultValue: 0 },
      // New columns
      vulnerability_score: { type: 'FLOAT', defaultValue: 0 },
      last_updated: { type: 'DATETIME', allowNull: true },
      is_vulnerable: { type: 'TINYINT', defaultValue: 0 },
      cve_ids: { type: 'TEXT', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // client_antivirus with new columns
    await queryInterface.createTable('client_antivirus', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER' },
      software_name: { type: 'VARCHAR(255)' },
      version: { type: 'VARCHAR(255)' },
      engine_version: { type: 'VARCHAR(255)' },
      signature_date: { type: 'DATETIME' },
      is_running: { type: 'TINYINT', defaultValue: 0 },
      is_updated: { type: 'TINYINT', defaultValue: 0 },
      last_scan: { type: 'DATETIME' },
      last_scan_status: { type: 'VARCHAR(255)' },
      threats_found: { type: 'INTEGER', defaultValue: 0 },
      // New columns
      real_time_protection: { type: 'TINYINT', defaultValue: 0 },
      definition_age_days: { type: 'INTEGER', defaultValue: 0 },
      last_update_check: { type: 'DATETIME', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // client_network_info with new columns
    await queryInterface.createTable('client_network_info', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER' },
      interface_name: { type: 'VARCHAR(255)' },
      ipv4_address: { type: 'VARCHAR(100)' },
      ipv6_address: { type: 'VARCHAR(100)' },
      mac_address: { type: 'VARCHAR(100)' },
      gateway: { type: 'VARCHAR(100)' },
      dns_servers: { type: 'TEXT' },
      dhcp_enabled: { type: 'TINYINT', defaultValue: 0 },
      // New columns
      connection_type: { type: 'VARCHAR(50)', defaultValue: 'unknown' },
      connection_speed: { type: 'BIGINT', allowNull: true },
      subnet_mask: { type: 'VARCHAR(100)', allowNull: true },
      is_primary: { type: 'TINYINT', defaultValue: 0 },
      status: { type: 'VARCHAR(50)', defaultValue: 'unknown' },
      last_change: { type: 'DATETIME', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // client_threat_history with new columns
    await queryInterface.createTable('client_threat_history', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER' },
      threat_name: { type: 'VARCHAR(255)' },
      threat_type: { type: 'VARCHAR(255)' },
      severity: { type: 'VARCHAR(50)' },
      description: { type: 'TEXT' },
      detected_at: { type: 'DATETIME' },
      resolved_at: { type: 'DATETIME', allowNull: true },
      detection_method: { type: 'VARCHAR(255)' },
      metadata: { type: 'TEXT' },
      // New columns
      file_path: { type: 'TEXT', allowNull: true },
      process_name: { type: 'VARCHAR(255)', allowNull: true },
      confidence_score: { type: 'FLOAT', defaultValue: 0 },
      mitigation_action: { type: 'VARCHAR(255)', allowNull: true },
      ioc_matches: { type: 'TEXT', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // alerts with new columns
    await queryInterface.createTable('alerts', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER', allowNull: true },
      title: { type: 'VARCHAR(255)' },
      description: { type: 'TEXT' },
      severity: { type: 'VARCHAR(50)' },
      status: { type: 'VARCHAR(50)' },
      assigned_to: { type: 'VARCHAR(255)', allowNull: true },
      ioc_id: { type: 'INTEGER', allowNull: true },
      detected_at: { type: 'DATETIME' },
      acknowledged_at: { type: 'DATETIME', allowNull: true },
      resolved_at: { type: 'DATETIME', allowNull: true },
      metadata: { type: 'TEXT', allowNull: true },
      // New columns
      violation_type: { type: 'VARCHAR(100)', allowNull: true },
      policy_rule: { type: 'VARCHAR(100)', allowNull: true },
      automatic_resolution: { type: 'TINYINT', defaultValue: 0 },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // ioc_indicators
    await queryInterface.createTable('ioc_indicators', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      indicator_value: { type: 'TEXT' },
      indicator_type: { type: 'VARCHAR(50)' },
      source: { type: 'VARCHAR(255)' },
      severity: { type: 'VARCHAR(50)' },
      confidence_score: { type: 'FLOAT', defaultValue: 0 },
      description: { type: 'TEXT' },
      tags: { type: 'TEXT' },
      is_active: { type: 'TINYINT', defaultValue: 1 },
      expires_at: { type: 'DATETIME', allowNull: true },
      last_seen: { type: 'DATETIME', allowNull: true },
      metadata: { type: 'TEXT' },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // ioc_distributions
    await queryInterface.createTable('ioc_distributions', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      ioc_id: { type: 'INTEGER' },
      distribution_data: { type: 'TEXT' },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // ============ NEW TABLES FOR POLICY VIOLATION TRACKING ============

    // client_snapshots
    await queryInterface.createTable('client_snapshots', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER', allowNull: false },
      snapshot_data: { type: 'JSON', allowNull: false },
      snapshot_type: { type: 'VARCHAR(50)', defaultValue: 'full' },
      checksum: { type: 'VARCHAR(255)', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // policy_violations
    await queryInterface.createTable('policy_violations', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER', allowNull: false },
      violation_type: { type: 'VARCHAR(100)', allowNull: false },
      severity: { 
        type: 'ENUM("low", "medium", "high", "critical")', 
        defaultValue: 'medium' 
      },
      title: { type: 'VARCHAR(255)', allowNull: false },
      description: { type: 'TEXT', allowNull: false },
      detected_at: { type: 'DATETIME', allowNull: false },
      resolved_at: { type: 'DATETIME', allowNull: true },
      status: { 
        type: 'ENUM("open", "acknowledged", "resolved", "false_positive")', 
        defaultValue: 'open' 
      },
      evidence: { type: 'JSON', allowNull: true },
      recommendation: { type: 'TEXT', allowNull: true },
      policy_rule: { type: 'VARCHAR(100)', allowNull: false },
      // Additional tracking fields
      auto_resolved: { type: 'TINYINT', defaultValue: 0 },
      resolution_notes: { type: 'TEXT', allowNull: true },
      acknowledged_by: { type: 'VARCHAR(255)', allowNull: true },
      acknowledged_at: { type: 'DATETIME', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // network_changes
    await queryInterface.createTable('network_changes', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER', allowNull: false },
      interface_name: { type: 'VARCHAR(255)', allowNull: false },
      old_ipv4: { type: 'VARCHAR(100)', allowNull: true },
      new_ipv4: { type: 'VARCHAR(100)', allowNull: true },
      old_ipv6: { type: 'VARCHAR(100)', allowNull: true },
      new_ipv6: { type: 'VARCHAR(100)', allowNull: true },
      old_mac: { type: 'VARCHAR(100)', allowNull: true },
      new_mac: { type: 'VARCHAR(100)', allowNull: true },
      change_type: { 
        type: 'ENUM("ipv4_changed", "ipv6_changed", "mac_changed", "interface_added", "interface_removed", "dhcp_enabled", "dhcp_disabled")', 
        allowNull: false 
      },
      detected_at: { type: 'DATETIME', allowNull: false },
      // Additional context
      previous_snapshot_id: { type: 'INTEGER', allowNull: true },
      current_snapshot_id: { type: 'INTEGER', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // security_policies
    await queryInterface.createTable('security_policies', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      name: { type: 'VARCHAR(255)', allowNull: false },
      description: { type: 'TEXT', allowNull: true },
      rules: { type: 'JSON', allowNull: false },
      severity: { 
        type: 'ENUM("low", "medium", "high", "critical")', 
        defaultValue: 'medium' 
      },
      is_active: { type: 'TINYINT', defaultValue: 1 },
      category: { type: 'VARCHAR(100)', defaultValue: 'general' },
      // Enforcement settings
      auto_remediate: { type: 'TINYINT', defaultValue: 0 },
      remediation_script: { type: 'TEXT', allowNull: true },
      notification_enabled: { type: 'TINYINT', defaultValue: 1 },
      // Scheduling
      check_frequency: { type: 'INTEGER', defaultValue: 300 },
      last_check: { type: 'DATETIME', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // compliance_status
    await queryInterface.createTable('compliance_status', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER', allowNull: false },
      overall_score: { type: 'INTEGER', defaultValue: 0 },
      passed_checks: { type: 'INTEGER', defaultValue: 0 },
      total_checks: { type: 'INTEGER', defaultValue: 0 },
      critical_violations: { type: 'INTEGER', defaultValue: 0 },
      high_violations: { type: 'INTEGER', defaultValue: 0 },
      medium_violations: { type: 'INTEGER', defaultValue: 0 },
      low_violations: { type: 'INTEGER', defaultValue: 0 },
      last_assessment: { type: 'DATETIME', allowNull: false },
      // Category-wise scores
      antivirus_score: { type: 'INTEGER', defaultValue: 0 },
      network_score: { type: 'INTEGER', defaultValue: 0 },
      system_score: { type: 'INTEGER', defaultValue: 0 },
      software_score: { type: 'INTEGER', defaultValue: 0 },
      threat_score: { type: 'INTEGER', defaultValue: 0 },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // client_performance_metrics
    await queryInterface.createTable('client_performance_metrics', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER', allowNull: false },
      cpu_usage: { type: 'FLOAT', defaultValue: 0 },
      memory_usage: { type: 'FLOAT', defaultValue: 0 },
      disk_usage: { type: 'FLOAT', defaultValue: 0 },
      network_usage_sent: { type: 'BIGINT', defaultValue: 0 },
      network_usage_received: { type: 'BIGINT', defaultValue: 0 },
      process_count: { type: 'INTEGER', defaultValue: 0 },
      uptime_seconds: { type: 'BIGINT', defaultValue: 0 },
      // Disk space details
      disk_total: { type: 'BIGINT', defaultValue: 0 },
      disk_used: { type: 'BIGINT', defaultValue: 0 },
      disk_free: { type: 'BIGINT', defaultValue: 0 },
      // Network connections
      active_connections: { type: 'INTEGER', defaultValue: 0 },
      open_ports: { type: 'TEXT', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });

    // system_events
    await queryInterface.createTable('system_events', {
      id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
      client_id: { type: 'INTEGER', allowNull: true },
      event_type: { type: 'VARCHAR(100)', allowNull: false },
      event_source: { type: 'VARCHAR(100)', allowNull: false },
      severity: { 
        type: 'ENUM("info", "warning", "error", "critical")', 
        defaultValue: 'info' 
      },
      title: { type: 'VARCHAR(255)', allowNull: false },
      description: { type: 'TEXT', allowNull: true },
      event_data: { type: 'JSON', allowNull: true },
      detected_at: { type: 'DATETIME', allowNull: false },
      // For event correlation
      correlation_id: { type: 'VARCHAR(255)', allowNull: true },
      parent_event_id: { type: 'INTEGER', allowNull: true },
      created_at: { type: 'DATETIME', defaultValue: new Date() },
      updated_at: { type: 'DATETIME', defaultValue: new Date() }
    });
  },

  down: async ({ context: queryInterface }) => {
    // Drop new tables first
    await queryInterface.dropTable('system_events');
    await queryInterface.dropTable('client_performance_metrics');
    await queryInterface.dropTable('compliance_status');
    await queryInterface.dropTable('security_policies');
    await queryInterface.dropTable('network_changes');
    await queryInterface.dropTable('policy_violations');
    await queryInterface.dropTable('client_snapshots');
    
    // Drop original tables
    await queryInterface.dropTable('ioc_distributions');
    await queryInterface.dropTable('ioc_indicators');
    await queryInterface.dropTable('alerts');
    await queryInterface.dropTable('client_threat_history');
    await queryInterface.dropTable('client_network_info');
    await queryInterface.dropTable('client_antivirus');
    await queryInterface.dropTable('client_software');
    await queryInterface.dropTable('clients');
    await queryInterface.dropTable('users');
  }
};