// src/services/policyService.ts

// Add these imports if not already present
import { clientService } from './clientService';

// Add these interfaces to your types if not present
interface SecurityScoreBreakdown {
  antivirus: number;
  network: number;
  system: number;
  software: number;
  threat: number;
  compliance: number;
}

interface SecurityScoreWeights {
  antivirus: number;
  network: number;
  system: number;
  software: number;
  threat: number;
  compliance: number;
}

// Enhanced PolicyService class with security score calculation
class PolicyService {
  private securityScoreWeights: SecurityScoreWeights = {
    antivirus: 0.25,    // 25% - Critical for security
    network: 0.20,      // 20% - Network security importance
    system: 0.15,       // 15% - System health and updates
    software: 0.15,     // 15% - Software security
    threat: 0.15,       // 15% - Threat detection and response
    compliance: 0.10    // 10% - Policy compliance
  };

  // ============ ENHANCED COMPLIANCE & SECURITY SCORE CALCULATION ============

  /**
   * Enhanced method to analyze client compliance and calculate security score
   */
  async analyzeClientCompliance(client: Client, detailData: ClientDetailData): Promise<{
    violations: PolicyViolation[];
    compliance: ComplianceStatus;
    changes: NetworkChange[];
    securityScore: number;
    securityBreakdown: SecurityScoreBreakdown;
  }> {
    const violations: PolicyViolation[] = [];
    const changes: NetworkChange[] = [];
    
    // Get only active policies for compliance calculation
    const activePolicies = (await this.getPolicies()).filter(policy => policy.is_active);
    
    const previousSnapshot = await this.getLastClientSnapshot(client.id);
    
    // Run all compliance checks
    violations.push(...await this.checkAntivirusCompliance(client, detailData));
    violations.push(...await this.checkOSCompliance(client, detailData));
    
    const networkChanges = await this.analyzeNetworkChanges(client, detailData.network, previousSnapshot);
    changes.push(...networkChanges);
    violations.push(...await this.checkNetworkCompliance(client, detailData, networkChanges));
    
    violations.push(...await this.checkSecuritySoftwareCompliance(client, detailData));
    violations.push(...await this.checkSystemHealthCompliance(client, detailData));
    violations.push(...await this.checkThreatCompliance(client, detailData));

    // Calculate security score based on active policies and violations
    const { securityScore, securityBreakdown } = await this.calculateSecurityScore(
      client, 
      detailData, 
      violations, 
      activePolicies
    );

    // Calculate compliance score (legacy method for backward compatibility)
    const compliance = this.calculateComplianceScore(client.id, violations, activePolicies.length);

    // Save snapshot and create alerts
    await this.saveClientSnapshot(client, detailData);
    await this.createViolationAlerts(client, violations);

    // Update client record with new scores
    await this.updateClientSecurityScores(
      client.id, 
      securityScore, 
      compliance.overall_score,
      securityBreakdown
    );

    return { 
      violations, 
      compliance, 
      changes,
      securityScore,
      securityBreakdown
    };
  }

  /**
   * Calculate comprehensive security score based on active policies and violations
   */
  private async calculateSecurityScore(
    client: Client,
    clientData: ClientDetailData,
    violations: PolicyViolation[],
    activePolicies: SecurityPolicy[]
  ): Promise<{
    securityScore: number;
    securityBreakdown: SecurityScoreBreakdown;
  }> {
    // Calculate category scores
    const antivirusScore = this.calculateAntivirusSecurityScore(clientData.antivirus, violations);
    const networkScore = this.calculateNetworkSecurityScore(clientData.network, violations);
    const systemScore = this.calculateSystemSecurityScore(client, violations);
    const softwareScore = this.calculateSoftwareSecurityScore(clientData.software, violations);
    const threatScore = this.calculateThreatSecurityScore(clientData.threats, violations);
    const complianceScore = this.calculatePolicyComplianceScore(activePolicies, violations);

    const securityBreakdown: SecurityScoreBreakdown = {
      antivirus: antivirusScore,
      network: networkScore,
      system: systemScore,
      software: softwareScore,
      threat: threatScore,
      compliance: complianceScore
    };

    // Calculate weighted overall security score
    const securityScore = Math.round(
      (antivirusScore * this.securityScoreWeights.antivirus) +
      (networkScore * this.securityScoreWeights.network) +
      (systemScore * this.securityScoreWeights.system) +
      (softwareScore * this.securityScoreWeights.software) +
      (threatScore * this.securityScoreWeights.threat) +
      (complianceScore * this.securityScoreWeights.compliance)
    );

    return {
      securityScore: Math.max(0, Math.min(100, securityScore)),
      securityBreakdown
    };
  }

  /**
   * Calculate antivirus security score (0-100)
   */
  private calculateAntivirusSecurityScore(
    antivirus: ClientAntivirus[], 
    violations: PolicyViolation[]
  ): number {
    if (antivirus.length === 0) return 0;

    let score = 100;
    const avViolations = violations.filter(v => 
      v.violation_type.includes('antivirus') || 
      v.violation_type === 'no_antivirus' ||
      v.violation_type === 'real_time_protection_disabled'
    );

    // Deduct points for violations
    for (const violation of avViolations) {
      switch (violation.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Bonus points for good AV status
    const runningAV = antivirus.filter(av => av.is_running);
    const updatedAV = antivirus.filter(av => av.is_updated);
    
    if (runningAV.length > 0) score += 10;
    if (updatedAV.length === antivirus.length) score += 15;
    if (antivirus.every(av => av.threats_found === 0)) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate network security score (0-100)
   */
  private calculateNetworkSecurityScore(
    network: ClientNetworkInfo[], 
    violations: PolicyViolation[]
  ): number {
    let score = 100;
    const networkViolations = violations.filter(v => 
      v.violation_type.includes('network') || 
      v.violation_type.includes('ip_address') ||
      v.violation_type.includes('interface') ||
      v.violation_type.includes('dns') ||
      v.violation_type.includes('firewall')
    );

    // Deduct for network violations
    for (const violation of networkViolations) {
      switch (violation.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Bonus for stable network configuration
    const activeInterfaces = network.filter(n => n.status === 'up');
    const hasPrimaryInterface = network.some(n => n.is_primary);
    
    if (activeInterfaces.length > 0) score += 5;
    if (hasPrimaryInterface) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate system security score (0-100)
   */
  private calculateSystemSecurityScore(
    client: Client, 
    violations: PolicyViolation[]
  ): number {
    let score = 100;
    const systemViolations = violations.filter(v => 
      v.violation_type.includes('os_') ||
      v.violation_type.includes('memory_') ||
      v.violation_type.includes('cpu_') ||
      v.violation_type.includes('offline_') ||
      v.violation_type.includes('security_patch')
    );

    // Deduct for system violations
    for (const violation of systemViolations) {
      switch (violation.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Bonus for good system status
    if (client.status === 'active') score += 10;
    if (client.firewall_status === 'enabled') score += 15;
    if (client.encryption_status === 'enabled') score += 10;

    // Penalty for outdated OS
    if (this.isOSOutdated(client.os_name, client.os_version)) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate software security score (0-100)
   */
  private calculateSoftwareSecurityScore(
    software: ClientSoftware[], 
    violations: PolicyViolation[]
  ): number {
    let score = 100;
    const softwareViolations = violations.filter(v => 
      v.violation_type.includes('software') ||
      v.violation_type.includes('unauthorized_') ||
      v.violation_type.includes('vulnerable_') ||
      v.violation_type.includes('firewall_')
    );

    // Deduct for software violations
    for (const violation of softwareViolations) {
      switch (violation.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Check for security software
    const securitySoftware = software.filter(s => s.is_security_related);
    const vulnerableSoftware = software.filter(s => s.is_vulnerable);
    
    if (securitySoftware.length > 0) score += 10;
    if (vulnerableSoftware.length === 0) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate threat security score (0-100)
   */
  private calculateThreatSecurityScore(
    threats: ClientThreatHistory[], 
    violations: PolicyViolation[]
  ): number {
    let score = 100;
    const threatViolations = violations.filter(v => 
      v.violation_type.includes('threat') ||
      v.violation_type.includes('suspicious_')
    );

    // Deduct for threat violations
    for (const violation of threatViolations) {
      switch (violation.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Analyze threat history
    const unresolvedThreats = threats.filter(t => !t.resolved_at);
    const highSeverityThreats = unresolvedThreats.filter(t => 
      t.severity === 'high' || t.severity === 'critical'
    );

    // Penalty for unresolved threats
    if (unresolvedThreats.length > 0) score -= (unresolvedThreats.length * 5);
    if (highSeverityThreats.length > 0) score -= (highSeverityThreats.length * 10);

    // Bonus for no recent threats (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentThreats = threats.filter(t => 
      new Date(t.detected_at) > sevenDaysAgo
    );
    
    if (recentThreats.length === 0) score += 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate policy compliance score based on active policies
   */
  private calculatePolicyComplianceScore(
    activePolicies: SecurityPolicy[],
    violations: PolicyViolation[]
  ): number {
    if (activePolicies.length === 0) return 100;

    const totalRules = activePolicies.reduce((sum, policy) => 
      sum + (policy.rules?.length || 0), 0
    );

    if (totalRules === 0) return 100;

    // Count violations per policy rule
    const violatedRules = new Set(
      violations
        .map(v => v.evidence?.rule_id)
        .filter(Boolean)
    );

    const compliantRules = totalRules - violatedRules.size;
    const complianceRate = (compliantRules / totalRules) * 100;

    return Math.max(0, Math.min(100, complianceRate));
  }

  /**
   * Enhanced compliance score calculation using active policies
   */
  private calculateComplianceScore(
    clientId: string, 
    violations: PolicyViolation[],
    activePolicyCount: number
  ): ComplianceStatus {
    // Use active policies for compliance calculation
    const baseChecks = Math.max(10, activePolicyCount * 2); // Dynamic based on active policies
    const passedChecks = baseChecks - violations.length;
    const score = Math.max(0, (passedChecks / baseChecks) * 100);

    const critical = violations.filter(v => v.severity === 'critical').length;
    const high = violations.filter(v => v.severity === 'high').length;
    const medium = violations.filter(v => v.severity === 'medium').length;
    const low = violations.filter(v => v.severity === 'low').length;

    const now = new Date().toISOString();

    return {
      id: `compliance_${clientId}_${Date.now()}`,
      client_id: clientId,
      overall_score: Math.round(score),
      passed_checks: passedChecks,
      total_checks: baseChecks,
      critical_violations: critical,
      high_violations: high,
      medium_violations: medium,
      low_violations: low,
      last_assessment: now,
      antivirus_score: this.calculateCategoryScore(violations, ['antivirus']),
      network_score: this.calculateCategoryScore(violations, ['network']),
      system_score: this.calculateCategoryScore(violations, ['system']),
      software_score: this.calculateCategoryScore(violations, ['software']),
      threat_score: this.calculateCategoryScore(violations, ['threat']),
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Update client record with security and compliance scores
   */
  private async updateClientSecurityScores(
    clientId: string,
    securityScore: number,
    complianceScore: number,
    securityBreakdown: SecurityScoreBreakdown
  ): Promise<void> {
    try {
      const updateData: Partial<Client> = {
        security_score: securityScore,
        compliance_score: complianceScore,
        last_compliance_check: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...(await this.getClient(clientId))?.metadata,
          security_breakdown: securityBreakdown,
          last_security_assessment: new Date().toISOString()
        }
      };

      // Update threat level based on security score
      if (securityScore >= 90) {
        updateData.threat_level = 'low';
      } else if (securityScore >= 70) {
        updateData.threat_level = 'medium';
      } else if (securityScore >= 50) {
        updateData.threat_level = 'high';
      } else {
        updateData.threat_level = 'critical';
      }

      await clientService.updateClient(clientId, updateData);
      
      console.log(`Updated client ${clientId} security scores:`, {
        securityScore,
        complianceScore,
        threatLevel: updateData.threat_level
      });
    } catch (error) {
      console.error(`Failed to update client ${clientId} security scores:`, error);
      throw new Error(`Unable to update client security scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get client data (helper method)
   */
  private async getClient(clientId: string): Promise<Client | null> {
    try {
      return await clientService.getClientById(clientId);
    } catch (error) {
      console.error(`Failed to fetch client ${clientId}:`, error);
      return null;
    }
  }

  // ============ ENHANCED POLICY EVALUATION METHODS ============

  /**
   * Enhanced method to calculate client compliance score using only active policies
   */
  async calculateClientComplianceScore(client: Client, clientData: ClientDetailData): Promise<{
    overallScore: number;
    policyScores: PolicyScore[];
    violations: PolicyViolation[];
    compliance: ComplianceStatus;
    securityScore: number;
    securityBreakdown: SecurityScoreBreakdown;
  }> {
    // Only use active policies for evaluation
    const activePolicies = (await this.getPolicies()).filter(p => p.is_active);
    const policyScores: PolicyScore[] = [];
    const allViolations: PolicyViolation[] = [];

    console.log(`Evaluating ${activePolicies.length} active policies for client ${client.id}`);

    for (const policy of activePolicies) {
      const evaluation = await this.evaluatePolicy(policy, client, clientData);
      const policyScore: PolicyScore = {
        policyId: policy.id!,
        policyName: policy.name,
        score: evaluation.score,
        maxScore: 100,
        passedRules: evaluation.details.filter(d => d.passed).length,
        totalRules: evaluation.details.length,
        isCompliant: evaluation.passed,
        evaluationDetails: evaluation.details,
        lastEvaluated: new Date().toISOString()
      };

      policyScores.push(policyScore);

      if (!evaluation.passed) {
        const violations = this.createPolicyViolations(policy, evaluation, client);
        allViolations.push(...violations);
      }
    }

    // Calculate scores based on active policies
    const overallScore = policyScores.length > 0 
      ? policyScores.reduce((sum, score) => sum + score.score, 0) / policyScores.length
      : 100;

    // Calculate comprehensive security score
    const { securityScore, securityBreakdown } = await this.calculateSecurityScore(
      client,
      clientData,
      allViolations,
      activePolicies
    );

    const compliance = this.calculateComplianceStatus(
      client.id, 
      overallScore, 
      allViolations,
      activePolicies.length
    );

    // Update client record with new scores
    await this.updateClientSecurityScores(
      client.id,
      securityScore,
      overallScore,
      securityBreakdown
    );

    await this.createViolationAlerts(client, allViolations);

    return {
      overallScore,
      policyScores,
      violations: allViolations,
      compliance,
      securityScore,
      securityBreakdown
    };
  }

  /**
   * Enhanced compliance status calculation
   */
  private calculateComplianceStatus(
    clientId: string, 
    overallScore: number, 
    violations: PolicyViolation[],
    activePolicyCount: number
  ): ComplianceStatus {
    const now = new Date().toISOString();
    
    const critical = violations.filter(v => v.severity === 'critical').length;
    const high = violations.filter(v => v.severity === 'high').length;
    const medium = violations.filter(v => v.severity === 'medium').length;
    const low = violations.filter(v => v.severity === 'low').length;

    const totalViolations = critical + high + medium + low;
    const baseChecks = Math.max(10, activePolicyCount * 2);

    return {
      id: `compliance_${clientId}_${Date.now()}`,
      client_id: clientId,
      overall_score: Math.round(overallScore),
      passed_checks: Math.max(0, baseChecks - totalViolations),
      total_checks: baseChecks,
      critical_violations: critical,
      high_violations: high,
      medium_violations: medium,
      low_violations: low,
      last_assessment: now,
      antivirus_score: this.calculateCategoryScore(violations, ['antivirus']),
      network_score: this.calculateCategoryScore(violations, ['network']),
      system_score: this.calculateCategoryScore(violations, ['system']),
      software_score: this.calculateCategoryScore(violations, ['software']),
      threat_score: this.calculateCategoryScore(violations, ['threat']),
      created_at: now,
      updated_at: now
    };
  }

  // ============ ENHANCED BULK OPERATIONS ============

  /**
   * Bulk evaluate all clients and update their security scores
   */
  async bulkEvaluateAllClients(): Promise<{
    clientId: string;
    securityScore: number;
    complianceScore: number;
    threatLevel: string;
    violations: number;
  }[]> {
    try {
      const clients = await clientService.getClients();
      const results = [];

      for (const client of clients) {
        try {
          const clientData = await clientService.getClientDetail(client.id);
          if (clientData) {
            const complianceResult = await this.calculateClientComplianceScore(client, clientData);
            
            results.push({
              clientId: client.id,
              securityScore: complianceResult.securityScore,
              complianceScore: complianceResult.overallScore,
              threatLevel: client.threat_level || 'unknown',
              violations: complianceResult.violations.length
            });

            console.log(`Evaluated client ${client.id}:`, {
              securityScore: complianceResult.securityScore,
              complianceScore: complianceResult.overallScore,
              violations: complianceResult.violations.length
            });
          }
        } catch (error) {
          console.error(`Failed to evaluate client ${client.id}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to bulk evaluate clients:', error);
      throw new Error(`Unable to perform bulk evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get security dashboard with comprehensive metrics
   */
  async getSecurityDashboard(): Promise<{
    overallSecurityScore: number;
    overallComplianceScore: number;
    clientsAtRisk: number;
    totalViolations: number;
    policyCompliance: { policyId: string; policyName: string; complianceRate: number }[];
    securityTrend: { date: string; score: number }[];
    topSecurityRisks: { clientId: string; hostname: string; securityScore: number; criticalViolations: number }[];
  }> {
    try {
      const clients = await clientService.getClients();
      const activePolicies = (await this.getPolicies()).filter(p => p.is_active);
      const allViolations = await this.getAllViolations();

      // Calculate overall scores
      const securityScores = clients.map(c => c.security_score || 0).filter(score => score > 0);
      const complianceScores = clients.map(c => c.compliance_score || 0).filter(score => score > 0);
      
      const overallSecurityScore = securityScores.length > 0 
        ? Math.round(securityScores.reduce((a, b) => a + b, 0) / securityScores.length)
        : 0;
      
      const overallComplianceScore = complianceScores.length > 0
        ? Math.round(complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length)
        : 0;

      // Calculate clients at risk (security score < 70)
      const clientsAtRisk = clients.filter(c => (c.security_score || 0) < 70).length;

      // Get top security risks
      const topSecurityRisks = clients
        .filter(c => c.security_score !== undefined)
        .sort((a, b) => (a.security_score || 0) - (b.security_score || 0))
        .slice(0, 5)
        .map(client => ({
          clientId: client.id,
          hostname: client.hostname,
          securityScore: client.security_score || 0,
          criticalViolations: allViolations.filter(v => 
            v.client_id === client.id && v.severity === 'critical'
          ).length
        }));

      // Policy compliance rates
      const policyCompliance = activePolicies.map(policy => ({
        policyId: policy.id!,
        policyName: policy.name,
        complianceRate: Math.random() * 100 // This would need actual compliance data
      }));

      // Security trend (last 7 days - mock data)
      const securityTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          score: Math.max(50, Math.min(100, overallSecurityScore + (Math.random() * 20 - 10)))
        };
      }).reverse();

      return {
        overallSecurityScore,
        overallComplianceScore,
        clientsAtRisk,
        totalViolations: allViolations.length,
        policyCompliance,
        securityTrend,
        topSecurityRisks
      };
    } catch (error) {
      console.error('Failed to get security dashboard:', error);
      throw new Error(`Unable to get security dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const policyService = new PolicyService();
export default policyService;