
export interface GDPRComplianceCheck {
  id: string;
  type: 'data_processing' | 'consent_management' | 'data_retention' | 'data_transfer' | 'breach_detection';
  status: 'compliant' | 'non_compliant' | 'warning' | 'under_review';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dataSubject?: string;
  legalBasis: string;
  findings: string[];
  recommendations: string[];
  deadline?: string;
  responsible: string;
  lastChecked: string;
  nextCheck: string;
}

export interface DataProcessingActivity {
  id: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  retentionPeriod: number;
  dataSubjects: string[];
  recipients: string[];
  thirdCountryTransfer: boolean;
  safeguards?: string[];
  consentRequired: boolean;
  automated: boolean;
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  email: string;
  purposes: string[];
  consentGiven: boolean;
  consentDate: string;
  withdrawalDate?: string;
  source: string;
  ipAddress: string;
  version: string;
}

export class GDPRComplianceService {
  private complianceChecks: Map<string, GDPRComplianceCheck> = new Map();
  private processingActivities: Map<string, DataProcessingActivity> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();

  constructor() {
    this.initializeComplianceFramework();
    this.startContinuousMonitoring();
  }

  private initializeComplianceFramework(): void {
    // Initialize standard processing activities
    this.setupStandardProcessingActivities();
    
    // Setup compliance checks
    this.setupComplianceChecks();
  }

  private setupStandardProcessingActivities(): void {
    const activities: DataProcessingActivity[] = [
      {
        id: 'crm-customer-data',
        purpose: 'Customer Relationship Management',
        dataCategories: ['contact_data', 'communication_data', 'transaction_data'],
        legalBasis: 'Contract performance (Art. 6(1)(b) GDPR)',
        retentionPeriod: 7, // years
        dataSubjects: ['customers', 'prospects'],
        recipients: ['sales_team', 'customer_service'],
        thirdCountryTransfer: false,
        consentRequired: false,
        automated: true
      },
      {
        id: 'marketing-communications',
        purpose: 'Direct Marketing Communications',
        dataCategories: ['contact_data', 'preference_data'],
        legalBasis: 'Consent (Art. 6(1)(a) GDPR)',
        retentionPeriod: 3,
        dataSubjects: ['prospects', 'customers'],
        recipients: ['marketing_team'],
        thirdCountryTransfer: false,
        consentRequired: true,
        automated: true
      },
      {
        id: 'analytics-processing',
        purpose: 'Business Analytics and Insights',
        dataCategories: ['usage_data', 'behavioral_data'],
        legalBasis: 'Legitimate interests (Art. 6(1)(f) GDPR)',
        retentionPeriod: 2,
        dataSubjects: ['users', 'customers'],
        recipients: ['analytics_team'],
        thirdCountryTransfer: false,
        consentRequired: false,
        automated: true
      }
    ];

    activities.forEach(activity => {
      this.processingActivities.set(activity.id, activity);
    });
  }

  private setupComplianceChecks(): void {
    const checks: GDPRComplianceCheck[] = [
      {
        id: 'consent-validity-check',
        type: 'consent_management',
        status: 'compliant',
        description: 'Überprüfung der Gültigkeit aller Einverständniserklärungen',
        severity: 'medium',
        legalBasis: 'Art. 7 GDPR - Conditions for consent',
        findings: ['Alle aktiven Einverständnisse sind gültig dokumentiert'],
        recommendations: ['Regelmäßige Auffrischung der Einverständnisse implementieren'],
        responsible: 'Data Protection Officer',
        lastChecked: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'data-retention-compliance',
        type: 'data_retention',
        status: 'warning',
        description: 'Überwachung der Datenspeicherdauer nach GDPR-Bestimmungen',
        severity: 'high',
        legalBasis: 'Art. 5(1)(e) GDPR - Storage limitation',
        findings: [
          'Einige Kundendaten überschreiten die definierte Aufbewahrungsfrist',
          '1,247 Datensätze älter als 7 Jahre gefunden'
        ],
        recommendations: [
          'Automatische Löschung für abgelaufene Daten implementieren',
          'Datenaufbewahrungsrichtlinie überarbeiten',
          'Regelmäßige Datenbereinigung durchführen'
        ],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        responsible: 'IT Operations',
        lastChecked: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'third-party-data-transfer',
        type: 'data_transfer',
        status: 'under_review',
        description: 'Bewertung von Datenübertragungen an Drittländer',
        severity: 'medium',
        legalBasis: 'Art. 44-49 GDPR - Transfers to third countries',
        findings: [
          'Verwendung von Cloud-Services mit US-Servern identifiziert',
          'Standard Contractual Clauses (SCCs) sind implementiert'
        ],
        recommendations: [
          'Transfer Impact Assessment (TIA) durchführen',
          'Zusätzliche Schutzmaßnahmen evaluieren',
          'EU-basierte Alternativen prüfen'
        ],
        responsible: 'Legal Team',
        lastChecked: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    checks.forEach(check => {
      this.complianceChecks.set(check.id, check);
    });
  }

  private startContinuousMonitoring(): void {
    // Continuous compliance monitoring
    setInterval(() => {
      this.performComplianceChecks();
    }, 60000); // Check every minute

    // Daily compliance report
    setInterval(() => {
      this.generateDailyComplianceReport();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async performComplianceChecks(): Promise<void> {
    try {
      await Promise.all([
        this.checkConsentCompliance(),
        this.checkDataRetention(),
        this.checkDataProcessingLegality(),
        this.monitorDataBreaches(),
        this.validateDataTransfers()
      ]);
    } catch (error) {
      console.error('Compliance check error:', error);
    }
  }

  private async checkConsentCompliance(): Promise<void> {
    // Check for consent validity, renewal requirements, etc.
    const expiredConsents = this.findExpiredConsents();
    
    if (expiredConsents.length > 0) {
      this.createComplianceIssue({
        type: 'consent_management',
        status: 'warning',
        description: `${expiredConsents.length} Einverständniserklärungen benötigen Erneuerung`,
        severity: 'medium',
        findings: [`${expiredConsents.length} abgelaufene Einverständnisse gefunden`]
      });
    }
  }

  private async checkDataRetention(): Promise<void> {
    // Check for data that exceeds retention periods
    const expiredData = this.findExpiredData();
    
    if (expiredData.length > 0) {
      this.createComplianceIssue({
        type: 'data_retention',
        status: 'non_compliant',
        description: `${expiredData.length} Datensätze überschreiten Aufbewahrungsfrist`,
        severity: 'high',
        findings: [`${expiredData.length} Datensätze zur Löschung vorgesehen`]
      });
    }
  }

  private async checkDataProcessingLegality(): Promise<void> {
    // Verify all processing activities have valid legal basis
    const activities = Array.from(this.processingActivities.values());
    
    for (const activity of activities) {
      if (activity.consentRequired && !this.hasValidConsent(activity.id)) {
        this.createComplianceIssue({
          type: 'data_processing',
          status: 'non_compliant',
          description: `Fehlende Einverständnisse für ${activity.purpose}`,
          severity: 'critical',
          findings: ['Verarbeitung ohne gültiges Einverständnis']
        });
      }
    }
  }

  private async monitorDataBreaches(): Promise<void> {
    // Monitor for potential data breaches
    const potentialBreaches = this.detectPotentialBreaches();
    
    for (const breach of potentialBreaches) {
      this.createComplianceIssue({
        type: 'breach_detection',
        status: 'critical',
        description: `Potentielle Datenschutzverletzung erkannt: ${breach.description}`,
        severity: 'critical',
        findings: breach.indicators,
        deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72h notification requirement
      });
    }
  }

  private async validateDataTransfers(): Promise<void> {
    // Validate international data transfers
    const activities = Array.from(this.processingActivities.values())
      .filter(activity => activity.thirdCountryTransfer);
    
    for (const activity of activities) {
      if (!activity.safeguards || activity.safeguards.length === 0) {
        this.createComplianceIssue({
          type: 'data_transfer',
          status: 'non_compliant',
          description: `Unzureichende Schutzmaßnahmen für Drittlandübertragung: ${activity.purpose}`,
          severity: 'high',
          findings: ['Fehlende angemessene Schutzmaßnahmen']
        });
      }
    }
  }

  private findExpiredConsents(): ConsentRecord[] {
    // Simulate finding expired consents
    return Array.from(this.consentRecords.values())
      .filter(consent => {
        const consentAge = Date.now() - new Date(consent.consentDate).getTime();
        return consentAge > (2 * 365 * 24 * 60 * 60 * 1000); // 2 years
      });
  }

  private findExpiredData(): any[] {
    // Simulate finding data that exceeds retention periods
    return [
      { id: 'data1', type: 'customer_record', age: 8 }, // years
      { id: 'data2', type: 'transaction_log', age: 10 }
    ];
  }

  private hasValidConsent(activityId: string): boolean {
    // Simulate consent validation
    return Math.random() > 0.1; // 90% have valid consent
  }

  private detectPotentialBreaches(): any[] {
    // Simulate breach detection
    if (Math.random() < 0.05) { // 5% chance of detecting potential breach
      return [{
        description: 'Ungewöhnliche Datenzugriffsmuster',
        indicators: [
          'Massendownload von Kundendaten',
          'Zugriff außerhalb Geschäftszeiten',
          'Unbekannte IP-Adresse'
        ]
      }];
    }
    return [];
  }

  private createComplianceIssue(issue: Partial<GDPRComplianceCheck>): void {
    const id = `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const complianceCheck: GDPRComplianceCheck = {
      id,
      type: issue.type || 'data_processing',
      status: issue.status || 'under_review',
      description: issue.description || 'Compliance issue detected',
      severity: issue.severity || 'medium',
      legalBasis: issue.legalBasis || 'GDPR General Compliance',
      findings: issue.findings || [],
      recommendations: issue.recommendations || ['Review and take corrective action'],
      deadline: issue.deadline,
      responsible: issue.responsible || 'Data Protection Officer',
      lastChecked: new Date().toISOString(),
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.complianceChecks.set(id, complianceCheck);
    console.log(`📋 GDPR Compliance Issue: ${complianceCheck.description}`);
  }

  private generateDailyComplianceReport(): void {
    const metrics = this.getComplianceMetrics();
    console.log('📊 Daily GDPR Compliance Report:', metrics);
  }

  public recordConsent(consent: Omit<ConsentRecord, 'id'>): string {
    const id = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const consentRecord: ConsentRecord = { id, ...consent };
    
    this.consentRecords.set(id, consentRecord);
    console.log(`✅ Consent recorded for ${consent.email}`);
    
    return id;
  }

  public withdrawConsent(consentId: string): boolean {
    const consent = this.consentRecords.get(consentId);
    if (consent) {
      consent.consentGiven = false;
      consent.withdrawalDate = new Date().toISOString();
      this.consentRecords.set(consentId, consent);
      console.log(`❌ Consent withdrawn for ${consent.email}`);
      return true;
    }
    return false;
  }

  public getComplianceStatus(): {
    overall: 'compliant' | 'non_compliant' | 'warning';
    checks: GDPRComplianceCheck[];
    criticalIssues: number;
    warnings: number;
  } {
    const checks = Array.from(this.complianceChecks.values());
    const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status !== 'compliant').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const nonCompliant = checks.filter(c => c.status === 'non_compliant').length;

    let overall: 'compliant' | 'non_compliant' | 'warning' = 'compliant';
    if (criticalIssues > 0 || nonCompliant > 0) {
      overall = 'non_compliant';
    } else if (warnings > 0) {
      overall = 'warning';
    }

    return {
      overall,
      checks,
      criticalIssues,
      warnings
    };
  }

  public getComplianceMetrics(): {
    totalChecks: number;
    compliantChecks: number;
    nonCompliantChecks: number;
    warningChecks: number;
    complianceRate: number;
    totalConsents: number;
    activeConsents: number;
    withdrawnConsents: number;
  } {
    const checks = Array.from(this.complianceChecks.values());
    const consents = Array.from(this.consentRecords.values());

    return {
      totalChecks: checks.length,
      compliantChecks: checks.filter(c => c.status === 'compliant').length,
      nonCompliantChecks: checks.filter(c => c.status === 'non_compliant').length,
      warningChecks: checks.filter(c => c.status === 'warning').length,
      complianceRate: checks.length > 0 ? (checks.filter(c => c.status === 'compliant').length / checks.length) * 100 : 100,
      totalConsents: consents.length,
      activeConsents: consents.filter(c => c.consentGiven).length,
      withdrawnConsents: consents.filter(c => !c.consentGiven).length
    };
  }

  public generateComplianceReport(): {
    summary: any;
    processingActivities: DataProcessingActivity[];
    complianceChecks: GDPRComplianceCheck[];
    consentOverview: any;
  } {
    return {
      summary: this.getComplianceMetrics(),
      processingActivities: Array.from(this.processingActivities.values()),
      complianceChecks: Array.from(this.complianceChecks.values()),
      consentOverview: {
        totalConsents: this.consentRecords.size,
        byPurpose: this.getConsentsByPurpose(),
        recentWithdrawals: this.getRecentWithdrawals()
      }
    };
  }

  private getConsentsByPurpose(): Record<string, number> {
    const purposeMap: Record<string, number> = {};
    
    Array.from(this.consentRecords.values()).forEach(consent => {
      if (consent.consentGiven) {
        consent.purposes.forEach(purpose => {
          purposeMap[purpose] = (purposeMap[purpose] || 0) + 1;
        });
      }
    });

    return purposeMap;
  }

  private getRecentWithdrawals(): ConsentRecord[] {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    return Array.from(this.consentRecords.values())
      .filter(consent => 
        consent.withdrawalDate && 
        new Date(consent.withdrawalDate).getTime() > sevenDaysAgo
      );
  }
}

export const gdprComplianceService = new GDPRComplianceService();
