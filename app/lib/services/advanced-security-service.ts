
// SPRINT 2.9 - Advanced Security Service (MFA, Zero-Trust)
import { prisma } from '@/lib/db'
import { MFADeviceType, SecurityEventType, SecurityStatus } from '@prisma/client'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'

export interface MFASetupResult {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  deviceId: string
}

export interface SecurityRiskAssessment {
  riskScore: number // 0-100
  factors: RiskFactor[]
  recommendation: string
  action: 'ALLOW' | 'DENY' | 'REQUIRE_MFA' | 'MONITOR'
}

export interface RiskFactor {
  factor: string
  impact: number // 0-1
  description: string
}

export interface ZeroTrustEvaluation {
  deviceTrusted: boolean
  locationTrusted: boolean
  behaviorNormal: boolean
  timeTrusted: boolean
  overallTrust: number // 0-1
}

export class AdvancedSecurityService {
  private static instance: AdvancedSecurityService
  private blacklistedIPs: Set<string> = new Set()
  private trustedNetworks: Set<string> = new Set()
  private deviceFingerprints: Map<string, any> = new Map()

  static getInstance(): AdvancedSecurityService {
    if (!AdvancedSecurityService.instance) {
      AdvancedSecurityService.instance = new AdvancedSecurityService()
    }
    return AdvancedSecurityService.instance
  }

  constructor() {
    this.initializeTrustedNetworks()
  }

  private initializeTrustedNetworks(): void {
    // Add common trusted network ranges (office, VPN, etc.)
    this.trustedNetworks.add('192.168.0.0/16')
    this.trustedNetworks.add('10.0.0.0/8')
    this.trustedNetworks.add('172.16.0.0/12')
  }

  // Multi-Factor Authentication
  async setupTOTP(
    userId: string,
    deviceName: string,
    tenantId: string
  ): Promise<MFASetupResult> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `weGROUP-${deviceName}`,
        issuer: 'weGROUP Platform',
        length: 32
      })

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()

      // Create MFA device record
      const device = await prisma.mFADevice.create({
        data: {
          userId,
          deviceType: MFADeviceType.TOTP,
          deviceName,
          secret: secret.base32,
          backupCodes,
          tenantId
        }
      })

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

      // Log security event
      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.MFA_SUCCESS,
        details: { action: 'TOTP_SETUP', deviceName },
        tenantId
      })

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes,
        deviceId: device.id
      }
    } catch (error) {
      console.error('TOTP setup failed:', error)
      throw new Error('Failed to setup TOTP')
    }
  }

  async verifyTOTP(
    deviceId: string,
    token: string,
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      const device = await prisma.mFADevice.findUnique({
        where: { id: deviceId }
      })

      if (!device || !device.isActive || device.userId !== userId) {
        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.MFA_FAILURE,
          details: { reason: 'INVALID_DEVICE', deviceId },
          tenantId
        })
        return false
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: device.secret!,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps tolerance
      })

      if (verified) {
        // Update last used
        await prisma.mFADevice.update({
          where: { id: deviceId },
          data: {
            lastUsed: new Date(),
            failedAttempts: 0
          }
        })

        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.MFA_SUCCESS,
          details: { deviceId, method: 'TOTP' },
          tenantId
        })
      } else {
        // Increment failed attempts
        await prisma.mFADevice.update({
          where: { id: deviceId },
          data: {
            failedAttempts: { increment: 1 }
          }
        })

        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.MFA_FAILURE,
          details: { deviceId, method: 'TOTP', reason: 'INVALID_TOKEN' },
          tenantId
        })
      }

      return verified
    } catch (error) {
      console.error('TOTP verification failed:', error)
      return false
    }
  }

  async setupSMSMFA(
    userId: string,
    phoneNumber: string,
    tenantId: string
  ): Promise<string> {
    try {
      const device = await prisma.mFADevice.create({
        data: {
          userId,
          deviceType: MFADeviceType.SMS,
          deviceName: `SMS ${phoneNumber.slice(-4)}`,
          phoneNumber,
          tenantId
        }
      })

      // Send verification SMS (simulated)
      const verificationCode = this.generateSMSCode()
      
      // In production, send actual SMS here
      console.log(`SMS MFA verification code for ${phoneNumber}: ${verificationCode}`)

      // Store verification code temporarily (use Redis in production)
      this.deviceFingerprints.set(`sms_${device.id}`, {
        code: verificationCode,
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes
      })

      await this.logSecurityEvent({
        userId,
        eventType: SecurityEventType.MFA_SUCCESS,
        details: { action: 'SMS_SETUP', phone: phoneNumber.slice(-4) },
        tenantId
      })

      return device.id
    } catch (error) {
      console.error('SMS MFA setup failed:', error)
      throw new Error('Failed to setup SMS MFA')
    }
  }

  async verifySMSMFA(
    deviceId: string,
    code: string,
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      const storedData = this.deviceFingerprints.get(`sms_${deviceId}`)
      
      if (!storedData || Date.now() > storedData.expires) {
        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.MFA_FAILURE,
          details: { reason: 'CODE_EXPIRED', deviceId },
          tenantId
        })
        return false
      }

      const verified = storedData.code === code

      if (verified) {
        this.deviceFingerprints.delete(`sms_${deviceId}`)
        
        await prisma.mFADevice.update({
          where: { id: deviceId },
          data: {
            lastUsed: new Date(),
            isVerified: true,
            failedAttempts: 0
          }
        })

        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.MFA_SUCCESS,
          details: { deviceId, method: 'SMS' },
          tenantId
        })
      } else {
        await this.logSecurityEvent({
          userId,
          eventType: SecurityEventType.MFA_FAILURE,
          details: { deviceId, method: 'SMS', reason: 'INVALID_CODE' },
          tenantId
        })
      }

      return verified
    } catch (error) {
      console.error('SMS MFA verification failed:', error)
      return false
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }
    return codes
  }

  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Zero-Trust Security
  async evaluateZeroTrust(
    request: {
      userId: string
      ipAddress: string
      userAgent: string
      location?: any
      deviceFingerprint?: string
    },
    tenantId: string
  ): Promise<ZeroTrustEvaluation> {
    try {
      const deviceTrusted = await this.evaluateDeviceTrust(request.deviceFingerprint, request.userId)
      const locationTrusted = await this.evaluateLocationTrust(request.ipAddress, request.location)
      const behaviorNormal = await this.evaluateBehaviorTrust(request.userId, request.ipAddress)
      const timeTrusted = this.evaluateTimeTrust()

      const overallTrust = (
        (deviceTrusted ? 0.3 : 0) +
        (locationTrusted ? 0.25 : 0) +
        (behaviorNormal ? 0.25 : 0) +
        (timeTrusted ? 0.2 : 0)
      )

      return {
        deviceTrusted,
        locationTrusted,
        behaviorNormal,
        timeTrusted,
        overallTrust
      }
    } catch (error) {
      console.error('Zero-trust evaluation failed:', error)
      return {
        deviceTrusted: false,
        locationTrusted: false,
        behaviorNormal: false,
        timeTrusted: false,
        overallTrust: 0
      }
    }
  }

  private async evaluateDeviceTrust(fingerprint?: string, userId?: string): Promise<boolean> {
    if (!fingerprint || !userId) return false

    // Check if device has been seen before
    const knownDevice = this.deviceFingerprints.has(`device_${userId}_${fingerprint}`)
    
    if (knownDevice) {
      const deviceData = this.deviceFingerprints.get(`device_${userId}_${fingerprint}`)
      return deviceData?.trustScore > 0.7
    }

    // New device - default to untrusted
    return false
  }

  private async evaluateLocationTrust(ipAddress: string, location?: any): Promise<boolean> {
    // Check against blacklisted IPs
    if (this.blacklistedIPs.has(ipAddress)) return false

    // Check if IP is in trusted network ranges
    if (this.isInTrustedNetwork(ipAddress)) return true

    // Check location-based factors (if available)
    if (location) {
      return this.evaluateLocationFactors(location)
    }

    // Default to moderate trust for unknown locations
    return false
  }

  private isInTrustedNetwork(ipAddress: string): boolean {
    // Simple CIDR matching (in production, use proper CIDR library)
    for (const network of this.trustedNetworks) {
      if (this.matchesCIDR(ipAddress, network)) {
        return true
      }
    }
    return false
  }

  private matchesCIDR(ip: string, cidr: string): boolean {
    // Simplified CIDR matching - use proper library in production
    const [network, bits] = cidr.split('/')
    const networkParts = network.split('.').map(n => parseInt(n))
    const ipParts = ip.split('.').map(n => parseInt(n))

    const bitsNum = parseInt(bits)
    const bytes = Math.floor(bitsNum / 8)
    const remainingBits = bitsNum % 8

    // Check full bytes
    for (let i = 0; i < bytes; i++) {
      if (networkParts[i] !== ipParts[i]) return false
    }

    // Check remaining bits
    if (remainingBits > 0 && bytes < 4) {
      const mask = 0xFF << (8 - remainingBits)
      if ((networkParts[bytes] & mask) !== (ipParts[bytes] & mask)) return false
    }

    return true
  }

  private evaluateLocationFactors(location: any): boolean {
    // Check for suspicious location indicators
    const riskFactors = [
      location.isVPN,
      location.isProxy,
      location.isTor,
      location.isHosting,
      location.threatLevel > 0.3
    ]

    const riskCount = riskFactors.filter(Boolean).length
    return riskCount <= 1 // Allow up to 1 risk factor
  }

  private async evaluateBehaviorTrust(userId: string, ipAddress: string): Promise<boolean> {
    try {
      // Get recent security events for user
      const recentEvents = await prisma.securityLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      // Analyze behavioral patterns
      const uniqueIPs = new Set(recentEvents.map(e => e.ipAddress)).size
      const failedLogins = recentEvents.filter(e => e.eventType === SecurityEventType.LOGIN_FAILED).length
      const suspiciousActivity = recentEvents.filter(e => e.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY).length

      // Calculate behavior score
      let score = 1.0

      if (uniqueIPs > 5) score -= 0.3 // Too many different IPs
      if (failedLogins > 3) score -= 0.4 // Too many failed attempts
      if (suspiciousActivity > 0) score -= 0.5 // Any suspicious activity

      return score >= 0.6
    } catch (error) {
      console.error('Behavior evaluation failed:', error)
      return false
    }
  }

  private evaluateTimeTrust(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    // Business hours (9 AM - 6 PM, Monday-Friday) are more trusted
    const isBusinessHours = hour >= 9 && hour <= 18 && dayOfWeek >= 1 && dayOfWeek <= 5

    return isBusinessHours
  }

  // Risk Assessment
  async assessSecurityRisk(
    request: {
      userId: string
      action: string
      ipAddress: string
      userAgent: string
      resourceSensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    },
    tenantId: string
  ): Promise<SecurityRiskAssessment> {
    try {
      const factors: RiskFactor[] = []
      let totalRisk = 0

      // IP-based risk factors
      const ipRisk = await this.assessIPRisk(request.ipAddress)
      if (ipRisk.impact > 0) {
        factors.push(ipRisk)
        totalRisk += ipRisk.impact * 30
      }

      // User behavior risk
      const behaviorRisk = await this.assessBehaviorRisk(request.userId, request.action)
      if (behaviorRisk.impact > 0) {
        factors.push(behaviorRisk)
        totalRisk += behaviorRisk.impact * 25
      }

      // Time-based risk
      const timeRisk = this.assessTimeRisk()
      if (timeRisk.impact > 0) {
        factors.push(timeRisk)
        totalRisk += timeRisk.impact * 15
      }

      // Resource sensitivity risk
      const sensitivityRisk = this.assessSensitivityRisk(request.resourceSensitivity)
      factors.push(sensitivityRisk)
      totalRisk += sensitivityRisk.impact * 30

      // Determine action based on risk score
      let action: 'ALLOW' | 'DENY' | 'REQUIRE_MFA' | 'MONITOR'
      let recommendation: string

      if (totalRisk >= 80) {
        action = 'DENY'
        recommendation = 'Access denied due to high security risk'
      } else if (totalRisk >= 60) {
        action = 'REQUIRE_MFA'
        recommendation = 'Multi-factor authentication required'
      } else if (totalRisk >= 40) {
        action = 'MONITOR'
        recommendation = 'Allow access but monitor closely'
      } else {
        action = 'ALLOW'
        recommendation = 'Access granted - low risk'
      }

      // Log risk assessment
      await this.logSecurityEvent({
        userId: request.userId,
        eventType: SecurityEventType.DATA_ACCESS,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        details: {
          action: request.action,
          riskScore: totalRisk,
          recommendation: action,
          factors: factors.map(f => f.factor)
        },
        riskScore: totalRisk,
        tenantId
      })

      return {
        riskScore: Math.round(totalRisk),
        factors,
        recommendation,
        action
      }
    } catch (error) {
      console.error('Security risk assessment failed:', error)
      return {
        riskScore: 100,
        factors: [{ factor: 'ASSESSMENT_ERROR', impact: 1, description: 'Risk assessment failed' }],
        recommendation: 'Access denied due to assessment error',
        action: 'DENY'
      }
    }
  }

  private async assessIPRisk(ipAddress: string): Promise<RiskFactor> {
    let impact = 0
    let description = 'IP address appears normal'

    if (this.blacklistedIPs.has(ipAddress)) {
      impact = 1.0
      description = 'IP address is blacklisted'
    } else if (!this.isInTrustedNetwork(ipAddress)) {
      impact = 0.3
      description = 'IP address is outside trusted networks'
    }

    return {
      factor: 'IP_ADDRESS',
      impact,
      description
    }
  }

  private async assessBehaviorRisk(userId: string, action: string): Promise<RiskFactor> {
    try {
      // Get recent user activity
      const recentLogs = await prisma.securityLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      })

      let impact = 0
      let description = 'User behavior appears normal'

      // Check for rapid successive actions
      if (recentLogs.length > 50) {
        impact = 0.8
        description = 'Unusually high activity rate'
      } else if (recentLogs.length > 20) {
        impact = 0.4
        description = 'Higher than normal activity'
      }

      // Check for failed attempts
      const failedAttempts = recentLogs.filter(log => 
        log.status === SecurityStatus.FAILURE
      ).length

      if (failedAttempts > 5) {
        impact = Math.max(impact, 0.9)
        description = 'Multiple failed attempts detected'
      }

      return {
        factor: 'USER_BEHAVIOR',
        impact,
        description
      }
    } catch (error) {
      return {
        factor: 'USER_BEHAVIOR',
        impact: 0.2,
        description: 'Unable to assess user behavior'
      }
    }
  }

  private assessTimeRisk(): RiskFactor {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    let impact = 0
    let description = 'Access during normal hours'

    // Night hours (10 PM - 6 AM)
    if (hour >= 22 || hour <= 6) {
      impact = 0.3
      description = 'Access during night hours'
    }

    // Weekend access
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      impact = Math.max(impact, 0.2)
      description = 'Access during weekend'
    }

    return {
      factor: 'TIME_BASED',
      impact,
      description
    }
  }

  private assessSensitivityRisk(sensitivity: string): RiskFactor {
    const sensitivityMap = {
      LOW: { impact: 0.1, description: 'Low sensitivity resource' },
      MEDIUM: { impact: 0.3, description: 'Medium sensitivity resource' },
      HIGH: { impact: 0.6, description: 'High sensitivity resource' },
      CRITICAL: { impact: 0.9, description: 'Critical sensitivity resource' }
    }

    return {
      factor: 'RESOURCE_SENSITIVITY',
      ...sensitivityMap[sensitivity as keyof typeof sensitivityMap]
    }
  }

  // Security Event Logging
  async logSecurityEvent(event: {
    userId?: string
    eventType: SecurityEventType
    ipAddress?: string
    userAgent?: string
    location?: any
    details?: any
    riskScore?: number
    tenantId: string
  }): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          ipAddress: event.ipAddress || 'unknown',
          userAgent: event.userAgent,
          location: event.location,
          details: event.details,
          riskScore: event.riskScore || 0,
          status: event.riskScore && event.riskScore > 70 ? SecurityStatus.BLOCKED : SecurityStatus.SUCCESS,
          tenantId: event.tenantId
        }
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  // Security Analytics
  async getSecurityAnalytics(tenantId: string, timeRange: number = 7): Promise<any> {
    try {
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)

      const logs = await prisma.securityLog.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' }
      })

      const analytics = {
        totalEvents: logs.length,
        securityEvents: this.groupByEventType(logs),
        riskDistribution: this.analyzeRiskDistribution(logs),
        topRiskyIPs: this.getTopRiskyIPs(logs),
        threatTrends: this.analyzeThreatTrends(logs),
        mfaUsage: await this.getMFAUsageStats(tenantId, startDate)
      }

      return analytics
    } catch (error) {
      console.error('Failed to get security analytics:', error)
      return {}
    }
  }

  private groupByEventType(logs: any[]): any {
    return logs.reduce((groups, log) => {
      const type = log.eventType
      groups[type] = (groups[type] || 0) + 1
      return groups
    }, {})
  }

  private analyzeRiskDistribution(logs: any[]): any {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 }

    logs.forEach(log => {
      const risk = log.riskScore || 0
      if (risk <= 25) distribution.low++
      else if (risk <= 50) distribution.medium++
      else if (risk <= 75) distribution.high++
      else distribution.critical++
    })

    return distribution
  }

  private getTopRiskyIPs(logs: any[]): any[] {
    const ipRisk: { [ip: string]: { count: number, totalRisk: number } } = {}

    logs.forEach(log => {
      const ip = log.ipAddress
      if (!ipRisk[ip]) ipRisk[ip] = { count: 0, totalRisk: 0 }
      ipRisk[ip].count++
      ipRisk[ip].totalRisk += log.riskScore || 0
    })

    return Object.entries(ipRisk)
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        avgRisk: data.totalRisk / data.count
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 10)
  }

  private analyzeThreatTrends(logs: any[]): any {
    // Group by day and calculate threat levels
    const daily: { [date: string]: number } = {}

    logs.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0]
      daily[date] = (daily[date] || 0) + (log.riskScore || 0)
    })

    return Object.entries(daily)
      .map(([date, totalRisk]) => ({ date, risk: totalRisk }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private async getMFAUsageStats(tenantId: string, startDate: Date): Promise<any> {
    try {
      const devices = await prisma.mFADevice.findMany({
        where: { tenantId }
      })

      const activeDevices = devices.filter(d => d.isActive).length
      const verifiedDevices = devices.filter(d => d.isVerified).length
      const recentUsage = devices.filter(d => 
        d.lastUsed && new Date(d.lastUsed) > startDate
      ).length

      return {
        totalDevices: devices.length,
        activeDevices,
        verifiedDevices,
        recentUsage,
        usageRate: devices.length > 0 ? recentUsage / devices.length : 0
      }
    } catch (error) {
      console.error('Failed to get MFA usage stats:', error)
      return {}
    }
  }
}

export const advancedSecurity = AdvancedSecurityService.getInstance()
