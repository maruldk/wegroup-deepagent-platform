
'use client'

// SPRINT 2.9 - Advanced Security Dashboard
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, XCircle, Smartphone, Key } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface MFADevice {
  id: string
  deviceType: string
  deviceName: string
  isActive: boolean
  isVerified: boolean
  lastUsed: string
  createdAt: string
}

interface SecurityAnalytics {
  totalEvents: number
  securityEvents: { [key: string]: number }
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  topRiskyIPs: Array<{
    ip: string
    count: number
    avgRisk: number
  }>
  mfaUsage: {
    totalDevices: number
    activeDevices: number
    verifiedDevices: number
    usageRate: number
  }
}

interface ZeroTrustEvaluation {
  deviceTrusted: boolean
  locationTrusted: boolean
  behaviorNormal: boolean
  timeTrusted: boolean
  overallTrust: number
}

export default function AdvancedSecurityDashboard() {
  const [mfaDevices, setMfaDevices] = useState<MFADevice[]>([])
  const [securityAnalytics, setSecurityAnalytics] = useState<SecurityAnalytics | null>(null)
  const [zeroTrustEval, setZeroTrustEval] = useState<ZeroTrustEvaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showMFASetup, setShowMFASetup] = useState(false)
  const [setupType, setSetupType] = useState<'totp' | 'sms'>('totp')

  useEffect(() => {
    loadSecurityData()
    evaluateZeroTrust()
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      
      // Load MFA devices
      const mfaResponse = await fetch('/api/security/mfa')
      if (mfaResponse.ok) {
        const mfaData = await mfaResponse.json()
        setMfaDevices(mfaData.data?.devices || [])
      }

      // Load security analytics
      const analyticsResponse = await fetch('/api/security/zero-trust')
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setSecurityAnalytics(analyticsData.data)
      }
    } catch (error) {
      console.error('Failed to load security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const evaluateZeroTrust = async () => {
    try {
      const response = await fetch('/api/security/zero-trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_trust',
          requestData: {
            deviceFingerprint: 'browser-fingerprint',
            location: { country: 'US', city: 'San Francisco' }
          }
        })
      })

      if (response.ok) {
        const evalData = await response.json()
        setZeroTrustEval(evalData.data)
      }
    } catch (error) {
      console.error('Failed to evaluate zero trust:', error)
    }
  }

  const setupMFA = async (type: 'totp' | 'sms') => {
    try {
      const body = type === 'totp' 
        ? { action: 'setup_totp', deviceName: 'Security Dashboard Device' }
        : { action: 'setup_sms', phoneNumber: '+1234567890' }

      const response = await fetch('/api/security/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const setupData = await response.json()
        console.log('MFA Setup:', setupData)
        await loadSecurityData()
        setShowMFASetup(false)
      }
    } catch (error) {
      console.error('MFA setup failed:', error)
    }
  }

  const getTrustColor = (level: number) => {
    if (level >= 0.8) return 'text-green-600'
    if (level >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#10B981'
      case 'medium': return '#F59E0B'
      case 'high': return '#EF4444'
      case 'critical': return '#7C2D12'
      default: return '#6B7280'
    }
  }

  const securityEventsData = securityAnalytics?.securityEvents ? 
    Object.entries(securityAnalytics.securityEvents).map(([event, count]) => ({
      name: event.replace(/_/g, ' '),
      count
    })) : []

  const riskDistributionData = securityAnalytics?.riskDistribution ? 
    Object.entries(securityAnalytics.riskDistribution).map(([level, count]) => ({
      name: level,
      value: count,
      color: getRiskColor(level)
    })) : []

  const topRiskyIPsData = securityAnalytics?.topRiskyIPs?.slice(0, 5).map(ip => ({
    ip: ip.ip,
    risk: ip.avgRisk,
    count: ip.count
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Security Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Security Dashboard</h1>
          <p className="text-gray-600">Monitor security threats and manage access controls</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowMFASetup(true)} variant="outline">
            <Key className="h-4 w-4 mr-2" />
            Setup MFA
          </Button>
          <Button onClick={evaluateZeroTrust}>
            <Shield className="h-4 w-4 mr-2" />
            Evaluate Trust
          </Button>
        </div>
      </div>

      {/* Security Alerts */}
      {zeroTrustEval && zeroTrustEval.overallTrust < 0.7 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Zero-Trust evaluation indicates potential security risks. Overall trust score: {(zeroTrustEval.overallTrust * 100).toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAnalytics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MFA Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAnalytics?.mfaUsage?.activeDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {securityAnalytics?.mfaUsage?.verifiedDevices || 0} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTrustColor(zeroTrustEval?.overallTrust || 0)}`}>
              {((zeroTrustEval?.overallTrust || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Zero-Trust evaluation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk IPs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAnalytics?.topRiskyIPs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Monitored addresses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Security Overview</TabsTrigger>
          <TabsTrigger value="mfa">Multi-Factor Auth</TabsTrigger>
          <TabsTrigger value="zerotrust">Zero-Trust</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Events Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>Recent security event types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={securityEventsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="count" fill="#60B5FF" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Security risk levels breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {riskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mfa" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MFA Devices */}
            <Card>
              <CardHeader>
                <CardTitle>MFA Devices</CardTitle>
                <CardDescription>Manage multi-factor authentication devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mfaDevices.length === 0 ? (
                  <div className="text-center py-6">
                    <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No MFA devices configured</p>
                    <Button onClick={() => setShowMFASetup(true)} className="mt-4">
                      Setup First Device
                    </Button>
                  </div>
                ) : (
                  mfaDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {device.deviceType === 'TOTP' ? <Key className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{device.deviceName}</p>
                          <p className="text-sm text-gray-500">{device.deviceType}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={device.isVerified ? 'default' : 'secondary'}>
                          {device.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                        {device.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}

                {showMFASetup && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium">Setup MFA Device</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={setupType === 'totp' ? 'default' : 'outline'}
                        onClick={() => setSetupType('totp')}
                      >
                        TOTP App
                      </Button>
                      <Button
                        variant={setupType === 'sms' ? 'default' : 'outline'}
                        onClick={() => setSetupType('sms')}
                      >
                        SMS
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setupMFA(setupType)}>
                        Setup {setupType.toUpperCase()}
                      </Button>
                      <Button variant="outline" onClick={() => setShowMFASetup(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MFA Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>MFA Usage Statistics</CardTitle>
                <CardDescription>Multi-factor authentication adoption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Devices</p>
                    <p className="text-2xl font-bold">{securityAnalytics?.mfaUsage?.totalDevices || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Devices</p>
                    <p className="text-2xl font-bold">{securityAnalytics?.mfaUsage?.activeDevices || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Usage Rate</p>
                  <Progress value={(securityAnalytics?.mfaUsage?.usageRate || 0) * 100} className="w-full" />
                  <p className="text-xs text-gray-500">
                    {((securityAnalytics?.mfaUsage?.usageRate || 0) * 100).toFixed(1)}% of users have MFA enabled
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Verification Rate</p>
                  <Progress 
                    value={securityAnalytics?.mfaUsage?.totalDevices ? 
                      (securityAnalytics.mfaUsage.verifiedDevices / securityAnalytics.mfaUsage.totalDevices) * 100 : 0
                    } 
                    className="w-full" 
                  />
                  <p className="text-xs text-gray-500">
                    {securityAnalytics?.mfaUsage?.verifiedDevices || 0} of {securityAnalytics?.mfaUsage?.totalDevices || 0} devices verified
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zerotrust" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zero-Trust Evaluation</CardTitle>
              <CardDescription>Current trust assessment based on multiple factors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {zeroTrustEval && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${zeroTrustEval.deviceTrusted ? 'text-green-600' : 'text-red-600'}`}>
                        {zeroTrustEval.deviceTrusted ? '✓' : '✗'}
                      </div>
                      <p className="text-sm font-medium">Device Trust</p>
                      <p className="text-xs text-gray-500">Known device</p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${zeroTrustEval.locationTrusted ? 'text-green-600' : 'text-red-600'}`}>
                        {zeroTrustEval.locationTrusted ? '✓' : '✗'}
                      </div>
                      <p className="text-sm font-medium">Location Trust</p>
                      <p className="text-xs text-gray-500">Trusted network</p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${zeroTrustEval.behaviorNormal ? 'text-green-600' : 'text-red-600'}`}>
                        {zeroTrustEval.behaviorNormal ? '✓' : '✗'}
                      </div>
                      <p className="text-sm font-medium">Behavior</p>
                      <p className="text-xs text-gray-500">Normal patterns</p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${zeroTrustEval.timeTrusted ? 'text-green-600' : 'text-red-600'}`}>
                        {zeroTrustEval.timeTrusted ? '✓' : '✗'}
                      </div>
                      <p className="text-sm font-medium">Time Access</p>
                      <p className="text-xs text-gray-500">Business hours</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Overall Trust Score</span>
                      <span className={`text-sm font-bold ${getTrustColor(zeroTrustEval.overallTrust)}`}>
                        {(zeroTrustEval.overallTrust * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={zeroTrustEval.overallTrust * 100} className="w-full" />
                    <p className="text-xs text-gray-500">
                      Based on device, location, behavior, and time factors
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Analysis</CardTitle>
              <CardDescription>High-risk IP addresses and security incidents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Top Risky IP Addresses</h4>
                {topRiskyIPsData.map((ip) => (
                  <div key={ip.ip} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-mono text-sm">{ip.ip}</p>
                      <p className="text-xs text-gray-500">{ip.count} events</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Risk: {ip.risk.toFixed(1)}</p>
                      <Badge variant={ip.risk > 75 ? 'destructive' : ip.risk > 50 ? 'secondary' : 'default'}>
                        {ip.risk > 75 ? 'High' : ip.risk > 50 ? 'Medium' : 'Low'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
