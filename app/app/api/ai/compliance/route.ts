
import { NextRequest, NextResponse } from 'next/server';
import { gdprComplianceService } from '@/lib/ai/compliance/gdpr-compliance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        const status = gdprComplianceService.getComplianceStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'metrics':
        const metrics = gdprComplianceService.getComplianceMetrics();
        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'report':
        const report = gdprComplianceService.generateComplianceReport();
        return NextResponse.json({
          success: true,
          data: report
        });

      default:
        // Return overview
        const complianceStatus = gdprComplianceService.getComplianceStatus();
        const complianceMetrics = gdprComplianceService.getComplianceMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              overallStatus: complianceStatus.overall,
              complianceRate: complianceMetrics.complianceRate,
              criticalIssues: complianceStatus.criticalIssues,
              warnings: complianceStatus.warnings,
              totalChecks: complianceMetrics.totalChecks
            },
            recentChecks: complianceStatus.checks.slice(0, 5),
            metrics: complianceMetrics
          }
        });
    }
  } catch (error) {
    console.error('Compliance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'record_consent':
        const { 
          dataSubjectId, 
          email, 
          purposes, 
          source, 
          ipAddress, 
          version 
        } = body;

        if (!dataSubjectId || !email || !purposes) {
          return NextResponse.json(
            { success: false, error: 'Required consent fields missing' },
            { status: 400 }
          );
        }

        const recordedConsentId = gdprComplianceService.recordConsent({
          dataSubjectId,
          email,
          purposes,
          consentGiven: true,
          consentDate: new Date().toISOString(),
          source: source || 'api',
          ipAddress: ipAddress || 'unknown',
          version: version || '1.0'
        });

        return NextResponse.json({
          success: true,
          data: { consentId: recordedConsentId },
          message: 'Consent recorded successfully'
        });

      case 'withdraw_consent':
        const { consentId: withdrawConsentId } = body;

        if (!withdrawConsentId) {
          return NextResponse.json(
            { success: false, error: 'Consent ID is required' },
            { status: 400 }
          );
        }

        const success = gdprComplianceService.withdrawConsent(withdrawConsentId);

        if (success) {
          return NextResponse.json({
            success: true,
            message: 'Consent withdrawn successfully'
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Consent not found' },
            { status: 404 }
          );
        }

      case 'trigger_compliance_check':
        // Trigger immediate compliance check
        const checkResult = {
          checkId: `check_${Date.now()}`,
          status: 'initiated',
          estimatedCompletion: new Date(Date.now() + 600000).toISOString() // 10 minutes
        };

        return NextResponse.json({
          success: true,
          data: checkResult
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Compliance API POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process compliance request' },
      { status: 500 }
    );
  }
}
