import bcrypt from 'bcryptjs';
import makeMigrator from '../migrator.js';
import { 
  sequelize, 
  User, 
  Client, 
  Alert, 
  IOCIndicator, 
  ClientSoftware, 
  ClientAntivirus, 
  ClientNetworkInfo, 
  ClientThreatHistory,
  // New models
  ClientSnapshot,
  PolicyViolation,
  NetworkChange,
  SecurityPolicy,
  ComplianceStatus,
  ClientPerformanceMetrics,
  SystemEvent,
  IOCDistribution
} from '../models/index.js';

async function initDb() {
  try {
    await sequelize.authenticate();

    const migrator = makeMigrator();
    const pending = await migrator.pending();
    if (pending && pending.length) {
      console.log('Running migrations...');
      await migrator.up();
      console.log('Migrations applied');
    } else {
      console.log('No pending migrations');
    }

    // Seed default admin if none
    const usersCount = await User.count();
    if (usersCount === 0) {
      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'password';
      const hashed = await bcrypt.hash(defaultPassword, 10);
      await User.create({ 
        email: defaultEmail, 
        password_hash: hashed, 
        full_name: 'Administrator', 
        role: 'admin', 
        is_active: true,
        settings: { theme: 'dark', notifications: true }
      });
      console.log(`Seeded default user: ${defaultEmail} / ${defaultPassword}`);
    }

    const clientsCount = await Client.count();
    if (clientsCount === 0) {
      // Seed 5 dummy clients with new columns
      const clients = await Client.bulkCreate([
        { 
          unique_id: 'UNIQUE-001', 
          hostname: 'workstation-01', 
          os_name: 'Windows', 
          os_version: '10.0.19044', 
          arch: 'x64',
          cpu_cores: 8,
          total_memory: 17179869184,
          ip_address: '192.168.1.10',
          mac_address: '00:0a:95:9d:68:16',
          status: 'active', 
          threat_level: 'low', 
          last_seen: new Date(),
          security_score: 85,
          compliance_score: 90,
          last_compliance_check: new Date(),
          firewall_status: 'enabled',
          encryption_status: 'enabled'
        },
        { 
          unique_id: 'UNIQUE-002', 
          hostname: 'workstation-02', 
          os_name: 'Windows', 
          os_version: '10.0.18363', 
          arch: 'x64',
          cpu_cores: 4,
          total_memory: 8589934592,
          ip_address: '192.168.1.20',
          mac_address: '00:0a:95:9d:68:17',
          status: 'inactive', 
          threat_level: 'medium', 
          last_seen: new Date(),
          security_score: 65,
          compliance_score: 70,
          last_compliance_check: new Date(),
          firewall_status: 'disabled',
          encryption_status: 'partial'
        },
        { 
          unique_id: 'UNIQUE-003', 
          hostname: 'workstation-03', 
          os_name: 'Linux', 
          os_version: 'Ubuntu 20.04', 
          arch: 'x64',
          cpu_cores: 16,
          total_memory: 34359738368,
          ip_address: '192.168.1.30',
          mac_address: '00:0a:95:9d:68:18',
          status: 'active', 
          threat_level: 'high', 
          last_seen: new Date(),
          security_score: 45,
          compliance_score: 60,
          last_compliance_check: new Date(),
          firewall_status: 'enabled',
          encryption_status: 'enabled'
        },
        { 
          unique_id: 'UNIQUE-004', 
          hostname: 'workstation-04', 
          os_name: 'MacOS', 
          os_version: '10.15.7', 
          arch: 'arm64',
          cpu_cores: 12,
          total_memory: 17179869184,
          ip_address: '192.168.1.40',
          mac_address: '00:0a:95:9d:68:19',
          status: 'active', 
          threat_level: 'low', 
          last_seen: new Date(),
          security_score: 95,
          compliance_score: 95,
          last_compliance_check: new Date(),
          firewall_status: 'enabled',
          encryption_status: 'enabled'
        },
        { 
          unique_id: 'UNIQUE-005', 
          hostname: 'workstation-05', 
          os_name: 'Windows', 
          os_version: '11.0.22000', 
          arch: 'x64',
          cpu_cores: 6,
          total_memory: 12884901888,
          ip_address: '192.168.1.50',
          mac_address: '00:0a:95:9d:68:20',
          status: 'inactive', 
          threat_level: 'medium', 
          last_seen: new Date(),
          security_score: 75,
          compliance_score: 80,
          last_compliance_check: new Date(),
          firewall_status: 'enabled',
          encryption_status: 'disabled'
        }
      ]);
      console.log('Seeded 5 clients');

      // Seed related records (alerts, software, antivirus, network info, threat history)
      await Alert.bulkCreate([
        { 
          client_id: clients[0].id, 
          title: 'Suspicious activity', 
          description: 'Sample alert generated during seed', 
          severity: 'medium', 
          status: 'open', 
          detected_at: new Date(),
          violation_type: 'unauthorized_access',
          policy_rule: 'access_control',
          automatic_resolution: false
        },
        { 
          client_id: clients[1].id, 
          title: 'Unusual traffic detected', 
          description: 'Sample alert', 
          severity: 'low', 
          status: 'closed', 
          detected_at: new Date(),
          violation_type: 'network_anomaly',
          policy_rule: 'network_monitoring',
          automatic_resolution: true
        },
        { 
          client_id: clients[2].id, 
          title: 'Malware detected', 
          description: 'Potential malware on client', 
          severity: 'high', 
          status: 'open', 
          detected_at: new Date(),
          violation_type: 'malware_detection',
          policy_rule: 'antivirus_policy',
          automatic_resolution: false
        },
        { 
          client_id: clients[3].id, 
          title: 'System error', 
          description: 'Error detected in system logs', 
          severity: 'medium', 
          status: 'resolved', 
          detected_at: new Date(),
          violation_type: 'system_error',
          policy_rule: 'system_health',
          automatic_resolution: true
        },
        { 
          client_id: clients[4].id, 
          title: 'Failed login attempts', 
          description: 'Multiple failed login attempts detected', 
          severity: 'low', 
          status: 'open', 
          detected_at: new Date(),
          violation_type: 'brute_force',
          policy_rule: 'authentication_policy',
          automatic_resolution: false
        }
      ]);
      console.log('Seeded 5 alerts');

      // Seed IOC indicators
      const iocs = await IOCIndicator.bulkCreate([
        { 
          indicator_value: '192.168.1.1', 
          indicator_type: 'ip', 
          source: 'seed', 
          severity: 'low', 
          confidence_score: 0.6, 
          description: 'Sample IOC IP', 
          tags: JSON.stringify(['seed']), 
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        { 
          indicator_value: 'abc1234', 
          indicator_type: 'hash', 
          source: 'seed', 
          severity: 'medium', 
          confidence_score: 0.8, 
          description: 'Sample IOC hash', 
          tags: JSON.stringify(['seed']), 
          is_active: true,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
        },
        { 
          indicator_value: 'http://malicious-url.com', 
          indicator_type: 'url', 
          source: 'seed', 
          severity: 'high', 
          confidence_score: 0.9, 
          description: 'Malicious URL', 
          tags: JSON.stringify(['seed']), 
          is_active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        { 
          indicator_value: 'google.com', 
          indicator_type: 'domain', 
          source: 'seed', 
          severity: 'low', 
          confidence_score: 0.4, 
          description: 'Known safe domain', 
          tags: JSON.stringify(['seed']), 
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        },
        { 
          indicator_value: '8.8.8.8', 
          indicator_type: 'ip', 
          source: 'seed', 
          severity: 'low', 
          confidence_score: 0.5, 
          description: 'Sample IOC IP address', 
          tags: JSON.stringify(['seed']), 
          is_active: true,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        }
      ]);
      console.log('Seeded 5 IOC indicators');

      // Seed IOC distributions
      await IOCDistribution.bulkCreate([
        { ioc_id: iocs[0].id, distribution_data: JSON.stringify({ distributed_to: ['client-1', 'client-2'], timestamp: new Date() }) },
        { ioc_id: iocs[1].id, distribution_data: JSON.stringify({ distributed_to: ['client-3', 'client-4'], timestamp: new Date() }) },
        { ioc_id: iocs[2].id, distribution_data: JSON.stringify({ distributed_to: ['client-5'], timestamp: new Date() }) }
      ]);
      console.log('Seeded 3 IOC distributions');

      // Seed client software with new columns
      await ClientSoftware.bulkCreate([
        { 
          client_id: clients[0].id, 
          software_name: 'Google Chrome', 
          version: '91.0.4472.124', 
          publisher: 'Google', 
          install_date: new Date(), 
          is_security_related: false,
          vulnerability_score: 2.5,
          last_updated: new Date(),
          is_vulnerable: false,
          cve_ids: 'CVE-2021-30599,CVE-2021-30600'
        },
        { 
          client_id: clients[1].id, 
          software_name: 'Firefox', 
          version: '89.0', 
          publisher: 'Mozilla', 
          install_date: new Date(), 
          is_security_related: false,
          vulnerability_score: 1.8,
          last_updated: new Date(),
          is_vulnerable: true,
          cve_ids: 'CVE-2021-29950'
        },
        { 
          client_id: clients[2].id, 
          software_name: 'OpenSSH', 
          version: '8.4p1', 
          publisher: 'OpenSSH', 
          install_date: new Date(), 
          is_security_related: true,
          vulnerability_score: 6.2,
          last_updated: new Date(),
          is_vulnerable: true,
          cve_ids: 'CVE-2021-28041,CVE-2021-31653'
        },
        { 
          client_id: clients[3].id, 
          software_name: 'Safari', 
          version: '14.1.2', 
          publisher: 'Apple', 
          install_date: new Date(), 
          is_security_related: false,
          vulnerability_score: 0.5,
          last_updated: new Date(),
          is_vulnerable: false,
          cve_ids: null
        },
        { 
          client_id: clients[4].id, 
          software_name: 'Microsoft Edge', 
          version: '92.0.902.55', 
          publisher: 'Microsoft', 
          install_date: new Date(), 
          is_security_related: false,
          vulnerability_score: 3.1,
          last_updated: new Date(),
          is_vulnerable: true,
          cve_ids: 'CVE-2021-34537'
        }
      ]);
      console.log('Seeded 5 client software entries');

      // Seed antivirus records with new columns
      await ClientAntivirus.bulkCreate([
        { 
          client_id: clients[0].id, 
          software_name: 'Windows Defender', 
          version: '4.18.2102.5', 
          engine_version: '1.1.2102', 
          signature_date: new Date(), 
          is_running: true, 
          is_updated: true, 
          last_scan: new Date(), 
          last_scan_status: 'clean',
          real_time_protection: true,
          definition_age_days: 0,
          last_update_check: new Date()
        },
        { 
          client_id: clients[1].id, 
          software_name: 'McAfee', 
          version: '20.0', 
          engine_version: '1.0.0', 
          signature_date: new Date(), 
          is_running: true, 
          is_updated: false, 
          last_scan: new Date(), 
          last_scan_status: 'scan failed',
          real_time_protection: true,
          definition_age_days: 5,
          last_update_check: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        { 
          client_id: clients[2].id, 
          software_name: 'ClamAV', 
          version: '0.103.3', 
          engine_version: '1.0', 
          signature_date: new Date(), 
          is_running: true, 
          is_updated: true, 
          last_scan: new Date(), 
          last_scan_status: 'clean',
          real_time_protection: false,
          definition_age_days: 1,
          last_update_check: new Date()
        },
        { 
          client_id: clients[3].id, 
          software_name: 'Avast', 
          version: '21.4', 
          engine_version: '2.0.1', 
          signature_date: new Date(), 
          is_running: false, 
          is_updated: false, 
          last_scan: new Date(), 
          last_scan_status: 'outdated',
          real_time_protection: false,
          definition_age_days: 30,
          last_update_check: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        { 
          client_id: clients[4].id, 
          software_name: 'Bitdefender', 
          version: '26.0', 
          engine_version: '3.0.0', 
          signature_date: new Date(), 
          is_running: true, 
          is_updated: true, 
          last_scan: new Date(), 
          last_scan_status: 'clean',
          real_time_protection: true,
          definition_age_days: 0,
          last_update_check: new Date()
        }
      ]);
      console.log('Seeded 5 antivirus entries');

      // Seed network info with new columns
      await ClientNetworkInfo.bulkCreate([
        { 
          client_id: clients[0].id, 
          interface_name: 'eth0', 
          ipv4_address: '192.168.1.10', 
          ipv6_address: 'fe80::a00:27ff:fe60:9156', 
          mac_address: '00:0a:95:9d:68:16', 
          gateway: '192.168.1.1', 
          dns_servers: '["8.8.8.8", "8.8.4.4"]', 
          dhcp_enabled: true,
          connection_type: 'wired',
          connection_speed: 1000,
          subnet_mask: '255.255.255.0',
          is_primary: true,
          status: 'up',
          last_change: new Date()
        },
        { 
          client_id: clients[1].id, 
          interface_name: 'eth1', 
          ipv4_address: '192.168.1.20', 
          ipv6_address: 'fe80::a00:27ff:fe60:9157', 
          mac_address: '00:0a:95:9d:68:17', 
          gateway: '192.168.1.1', 
          dns_servers: '["8.8.8.8"]', 
          dhcp_enabled: false,
          connection_type: 'wireless',
          connection_speed: 300,
          subnet_mask: '255.255.255.0',
          is_primary: true,
          status: 'up',
          last_change: new Date()
        },
        { 
          client_id: clients[2].id, 
          interface_name: 'eth0', 
          ipv4_address: '192.168.2.10', 
          ipv6_address: 'fe80::a00:27ff:fe60:9158', 
          mac_address: '00:0a:95:9d:68:18', 
          gateway: '192.168.2.1', 
          dns_servers: '["8.8.8.8"]', 
          dhcp_enabled: true,
          connection_type: 'wired',
          connection_speed: 100,
          subnet_mask: '255.255.255.0',
          is_primary: true,
          status: 'up',
          last_change: new Date()
        },
        { 
          client_id: clients[3].id, 
          interface_name: 'eth0', 
          ipv4_address: '192.168.3.10', 
          ipv6_address: 'fe80::a00:27ff:fe60:9159', 
          mac_address: '00:0a:95:9d:68:19', 
          gateway: '192.168.3.1', 
          dns_servers: '["8.8.8.8", "1.1.1.1"]', 
          dhcp_enabled: false,
          connection_type: 'wireless',
          connection_speed: 600,
          subnet_mask: '255.255.255.0',
          is_primary: true,
          status: 'up',
          last_change: new Date()
        },
        { 
          client_id: clients[4].id, 
          interface_name: 'eth1', 
          ipv4_address: '192.168.4.10', 
          ipv6_address: 'fe80::a00:27ff:fe60:9160', 
          mac_address: '00:0a:95:9d:68:20', 
          gateway: '192.168.4.1', 
          dns_servers: '["8.8.4.4"]', 
          dhcp_enabled: true,
          connection_type: 'vpn',
          connection_speed: 50,
          subnet_mask: '255.255.255.0',
          is_primary: true,
          status: 'up',
          last_change: new Date()
        }
      ]);
      console.log('Seeded 5 network info entries');

      // Seed threat history with new columns
      await ClientThreatHistory.bulkCreate([
        { 
          client_id: clients[0].id, 
          threat_name: 'Ransomware', 
          threat_type: 'Malware', 
          severity: 'high', 
          description: 'Ransomware detected in the system', 
          detected_at: new Date(), 
          resolved_at: null, 
          detection_method: 'Signature-based', 
          metadata: '{}',
          file_path: 'C:\\Windows\\System32\\malware.exe',
          process_name: 'malware.exe',
          confidence_score: 0.95,
          mitigation_action: 'quarantined',
          ioc_matches: JSON.stringify(['malware_hash_abc123'])
        },
        { 
          client_id: clients[1].id, 
          threat_name: 'Phishing', 
          threat_type: 'Social Engineering', 
          severity: 'medium', 
          description: 'Phishing email detected', 
          detected_at: new Date(), 
          resolved_at: null, 
          detection_method: 'Email Analysis', 
          metadata: '{}',
          file_path: null,
          process_name: 'outlook.exe',
          confidence_score: 0.75,
          mitigation_action: 'deleted',
          ioc_matches: JSON.stringify(['phishing_url_xyz'])
        },
        { 
          client_id: clients[2].id, 
          threat_name: 'SQL Injection', 
          threat_type: 'Exploit', 
          severity: 'high', 
          description: 'SQL Injection detected in web app', 
          detected_at: new Date(), 
          resolved_at: new Date(), 
          detection_method: 'Web Application Firewall', 
          metadata: '{}',
          file_path: null,
          process_name: 'apache2',
          confidence_score: 0.88,
          mitigation_action: 'blocked',
          ioc_matches: JSON.stringify(['sql_pattern_123'])
        },
        { 
          client_id: clients[3].id, 
          threat_name: 'Trojan', 
          threat_type: 'Malware', 
          severity: 'low', 
          description: 'Trojan virus detected', 
          detected_at: new Date(), 
          resolved_at: null, 
          detection_method: 'Antivirus Scan', 
          metadata: '{}',
          file_path: '/usr/bin/trojan',
          process_name: 'trojan',
          confidence_score: 0.65,
          mitigation_action: 'quarantined',
          ioc_matches: JSON.stringify(['trojan_hash_def456'])
        },
        { 
          client_id: clients[4].id, 
          threat_name: 'DDoS Attack', 
          threat_type: 'Denial of Service', 
          severity: 'medium', 
          description: 'DDoS attack detected', 
          detected_at: new Date(), 
          resolved_at: new Date(), 
          detection_method: 'Network Monitoring', 
          metadata: '{}',
          file_path: null,
          process_name: null,
          confidence_score: 0.82,
          mitigation_action: 'blocked',
          ioc_matches: JSON.stringify(['ddos_pattern_789'])
        }
      ]);
      console.log('Seeded 5 threat history entries');

      // ============ SEED NEW MODELS ============

      // Seed client snapshots
      await ClientSnapshot.bulkCreate([
        {
          client_id: clients[0].id,
          snapshot_data: JSON.stringify({ software: 15, network: 3, security: 8 }),
          snapshot_type: 'full',
          checksum: 'abc123checksum'
        },
        {
          client_id: clients[1].id,
          snapshot_data: JSON.stringify({ software: 12, network: 2, security: 6 }),
          snapshot_type: 'full',
          checksum: 'def456checksum'
        }
      ]);
      console.log('Seeded 2 client snapshots');

      // Seed policy violations
      await PolicyViolation.bulkCreate([
        {
          client_id: clients[0].id,
          violation_type: 'antivirus_disabled',
          severity: 'high',
          title: 'Antivirus Protection Disabled',
          description: 'Real-time antivirus protection has been disabled on the endpoint',
          detected_at: new Date(),
          status: 'open',
          evidence: JSON.stringify({ av_status: 'disabled', last_update: '2023-01-01' }),
          recommendation: 'Enable real-time protection and update antivirus definitions',
          policy_rule: 'av_realtime_protection',
          auto_resolved: false
        },
        {
          client_id: clients[2].id,
          violation_type: 'firewall_disabled',
          severity: 'medium',
          title: 'Firewall Disabled',
          description: 'System firewall has been disabled',
          detected_at: new Date(),
          status: 'acknowledged',
          evidence: JSON.stringify({ firewall_status: 'disabled' }),
          recommendation: 'Enable system firewall immediately',
          policy_rule: 'firewall_enabled',
          auto_resolved: false,
          acknowledged_by: 'admin',
          acknowledged_at: new Date()
        }
      ]);
      console.log('Seeded 2 policy violations');

      // Seed network changes
      await NetworkChange.bulkCreate([
        {
          client_id: clients[1].id,
          interface_name: 'eth0',
          old_ipv4: '192.168.1.100',
          new_ipv4: '192.168.1.20',
          change_type: 'ipv4_changed',
          detected_at: new Date()
        },
        {
          client_id: clients[3].id,
          interface_name: 'wlan0',
          old_mac: '00:0a:95:9d:68:00',
          new_mac: '00:0a:95:9d:68:19',
          change_type: 'mac_changed',
          detected_at: new Date()
        }
      ]);
      console.log('Seeded 2 network changes');

      // Seed security policies
      await SecurityPolicy.bulkCreate([
        {
          name: 'Antivirus Compliance',
          description: 'Ensure all endpoints have updated antivirus protection',
          rules: JSON.stringify([
            { rule: 'av_enabled', condition: 'equals', value: true },
            { rule: 'av_updated', condition: 'equals', value: true }
          ]),
          severity: 'high',
          is_active: true,
          category: 'antivirus',
          auto_remediate: true,
          notification_enabled: true,
          check_frequency: 300
        },
        {
          name: 'Firewall Enforcement',
          description: 'Ensure firewall is enabled on all endpoints',
          rules: JSON.stringify([
            { rule: 'firewall_enabled', condition: 'equals', value: true }
          ]),
          severity: 'medium',
          is_active: true,
          category: 'network',
          auto_remediate: false,
          notification_enabled: true,
          check_frequency: 600
        }
      ]);
      console.log('Seeded 2 security policies');

      // Seed compliance status
      await ComplianceStatus.bulkCreate([
        {
          client_id: clients[0].id,
          overall_score: 90,
          passed_checks: 18,
          total_checks: 20,
          critical_violations: 0,
          high_violations: 1,
          medium_violations: 1,
          low_violations: 0,
          last_assessment: new Date(),
          antivirus_score: 85,
          network_score: 95,
          system_score: 90,
          software_score: 88,
          threat_score: 92
        },
        {
          client_id: clients[2].id,
          overall_score: 60,
          passed_checks: 12,
          total_checks: 20,
          critical_violations: 2,
          high_violations: 3,
          medium_violations: 2,
          low_violations: 1,
          last_assessment: new Date(),
          antivirus_score: 45,
          network_score: 70,
          system_score: 65,
          software_score: 50,
          threat_score: 70
        }
      ]);
      console.log('Seeded 2 compliance status entries');

      // Seed performance metrics
      await ClientPerformanceMetrics.bulkCreate([
        {
          client_id: clients[0].id,
          cpu_usage: 25.5,
          memory_usage: 65.2,
          disk_usage: 45.8,
          network_usage_sent: 1024000,
          network_usage_received: 2048000,
          process_count: 156,
          uptime_seconds: 86400,
          disk_total: 500000000000,
          disk_used: 229000000000,
          disk_free: 271000000000,
          active_connections: 23,
          open_ports: JSON.stringify([80, 443, 22, 3389])
        },
        {
          client_id: clients[1].id,
          cpu_usage: 45.8,
          memory_usage: 78.9,
          disk_usage: 67.3,
          network_usage_sent: 512000,
          network_usage_received: 1536000,
          process_count: 89,
          uptime_seconds: 43200,
          disk_total: 250000000000,
          disk_used: 168000000000,
          disk_free: 82000000000,
          active_connections: 12,
          open_ports: JSON.stringify([80, 443])
        }
      ]);
      console.log('Seeded 2 performance metrics entries');

      // Seed system events
      await SystemEvent.bulkCreate([
        {
          client_id: clients[0].id,
          event_type: 'system_reboot',
          event_source: 'system_monitor',
          severity: 'info',
          title: 'System Reboot Detected',
          description: 'Endpoint was rebooted by user',
          event_data: JSON.stringify({ user: 'john.doe', reason: 'maintenance' }),
          detected_at: new Date()
        },
        {
          client_id: clients[2].id,
          event_type: 'high_cpu_usage',
          event_source: 'performance_monitor',
          severity: 'warning',
          title: 'High CPU Usage Alert',
          description: 'CPU usage exceeded 90% for more than 5 minutes',
          event_data: JSON.stringify({ cpu_usage: 92.5, duration: 320 }),
          detected_at: new Date()
        }
      ]);
      console.log('Seeded 2 system events');
    }
  } catch (err) {
    console.error('Error initializing DB:', err);
    throw err;
  }
}

export default initDb;