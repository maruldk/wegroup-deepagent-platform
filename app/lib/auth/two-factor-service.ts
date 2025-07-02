
/**
 * HYBRID SPRINT 2.1: Two-Factor Authentication Service
 * Handles TOTP-based 2FA implementation
 */

import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { TwoFactorAuthConfig, SecurityAction } from '@/lib/types';
import { securityAuditService } from './security-audit-service';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class TwoFactorService {
  private static instance: TwoFactorService;

  private constructor() {
    // Configure OTP library
    authenticator.options = {
      window: 2, // Allow 2 time windows (60 seconds each)
      step: 30   // 30-second time step
    };
  }

  public static getInstance(): TwoFactorService {
    if (!TwoFactorService.instance) {
      TwoFactorService.instance = new TwoFactorService();
    }
    return TwoFactorService.instance;
  }

  /**
   * Generate 2FA secret and backup codes for user
   */
  async initializeTwoFactor(userId: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    try {
      // Generate secret
      const secret = authenticator.generateSecret();
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Get user info for QR code
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create or update 2FA record
      await prisma.twoFactorAuth.upsert({
        where: { userId },
        create: {
          userId,
          secret,
          isEnabled: false,
          backupCodes
        },
        update: {
          secret,
          backupCodes
        }
      });

      // Generate QR code URL
      const serviceName = 'weGROUP DeepAgent';
      const qrCodeUrl = authenticator.keyuri(
        user.email,
        serviceName,
        secret
      );

      // Log security event
      await securityAuditService.logAction({
        userId,
        action: SecurityAction.TWO_FACTOR_ENABLE,
        resource: 'two_factor_auth',
        resourceId: userId,
        details: { initialized: true }
      });

      return {
        secret,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('Failed to initialize 2FA:', error);
      throw error;
    }
  }

  /**
   * Enable 2FA for user after token verification
   */
  async enableTwoFactor(
    userId: string, 
    token: string
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    try {
      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      if (!twoFactorAuth) {
        throw new Error('2FA not initialized for user');
      }

      // Verify the token
      const isValid = authenticator.check(token, twoFactorAuth.secret);
      
      if (!isValid) {
        // Log failed attempt
        await securityAuditService.logAction({
          userId,
          action: SecurityAction.TWO_FACTOR_FAILED,
          resource: 'two_factor_auth',
          resourceId: userId,
          details: { action: 'enable_attempt_failed' }
        });
        
        return { success: false };
      }

      // Enable 2FA
      const updatedAuth = await prisma.twoFactorAuth.update({
        where: { userId },
        data: { 
          isEnabled: true,
          lastUsed: new Date()
        }
      });

      // Log successful enable
      await securityAuditService.logAction({
        userId,
        action: SecurityAction.TWO_FACTOR_ENABLE,
        resource: 'two_factor_auth',
        resourceId: userId,
        details: { enabled: true }
      });

      return { 
        success: true, 
        backupCodes: updatedAuth.backupCodes 
      };
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(
    userId: string, 
    token: string,
    allowBackupCode: boolean = false
  ): Promise<{ valid: boolean; usedBackupCode?: boolean }> {
    try {
      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
        return { valid: false };
      }

      // First try TOTP token
      const isValidTotp = authenticator.check(token, twoFactorAuth.secret);
      
      if (isValidTotp) {
        // Update last used timestamp
        await prisma.twoFactorAuth.update({
          where: { userId },
          data: { lastUsed: new Date() }
        });

        // Log successful verification
        await securityAuditService.logAction({
          userId,
          action: SecurityAction.TWO_FACTOR_SUCCESS,
          resource: 'two_factor_auth',
          resourceId: userId,
          details: { method: 'totp' }
        });

        return { valid: true };
      }

      // Try backup code if allowed
      if (allowBackupCode && twoFactorAuth.backupCodes.includes(token)) {
        // Remove used backup code
        const updatedBackupCodes = twoFactorAuth.backupCodes.filter(
          code => code !== token
        );

        await prisma.twoFactorAuth.update({
          where: { userId },
          data: { 
            backupCodes: updatedBackupCodes,
            lastUsed: new Date()
          }
        });

        // Log backup code usage
        await securityAuditService.logAction({
          userId,
          action: SecurityAction.TWO_FACTOR_SUCCESS,
          resource: 'two_factor_auth',
          resourceId: userId,
          details: { method: 'backup_code' }
        });

        return { valid: true, usedBackupCode: true };
      }

      // Log failed verification
      await securityAuditService.logAction({
        userId,
        action: SecurityAction.TWO_FACTOR_FAILED,
        resource: 'two_factor_auth',
        resourceId: userId,
        details: { reason: 'invalid_token' }
      });

      return { valid: false };
    } catch (error) {
      console.error('Failed to verify 2FA token:', error);
      return { valid: false };
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string): Promise<boolean> {
    try {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { isEnabled: false }
      });

      // Log disable action
      await securityAuditService.logAction({
        userId,
        action: SecurityAction.TWO_FACTOR_DISABLE,
        resource: 'two_factor_auth',
        resourceId: userId,
        details: { disabled: true }
      });

      return true;
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      return false;
    }
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFactorStatus(userId: string): Promise<TwoFactorAuthConfig | null> {
    try {
      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId }
      });

      if (!twoFactorAuth) return null;

      return {
        id: twoFactorAuth.id,
        userId: twoFactorAuth.userId,
        secret: twoFactorAuth.secret,
        isEnabled: twoFactorAuth.isEnabled,
        backupCodes: twoFactorAuth.backupCodes,
        lastUsed: twoFactorAuth.lastUsed,
        createdAt: twoFactorAuth.createdAt,
        updatedAt: twoFactorAuth.updatedAt
      };
    } catch (error) {
      console.error('Failed to get 2FA status:', error);
      return null;
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes();
      
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { backupCodes }
      });

      // Log regeneration
      await securityAuditService.logAction({
        userId,
        action: SecurityAction.TWO_FACTOR_ENABLE,
        resource: 'two_factor_auth',
        resourceId: userId,
        details: { backup_codes_regenerated: true }
      });

      return backupCodes;
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      throw error;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async hasTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
        where: { userId },
        select: { isEnabled: true }
      });

      return twoFactorAuth?.isEnabled || false;
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
      return false;
    }
  }

  /**
   * Generate secure backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 8; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Get 2FA statistics for dashboard
   */
  async getTwoFactorStats(tenantId?: string): Promise<{
    totalUsers: number;
    enabled2FA: number;
    enabledPercentage: number;
    recentEnables: number;
  }> {
    try {
      const whereClause = tenantId ? { tenantId } : {};

      const [totalUsers, enabled2FA, recentEnables] = await Promise.all([
        prisma.user.count({ where: whereClause }),
        prisma.user.count({
          where: {
            ...whereClause,
            twoFactorAuth: {
              isEnabled: true
            }
          }
        }),
        prisma.user.count({
          where: {
            ...whereClause,
            twoFactorAuth: {
              isEnabled: true,
              updatedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            }
          }
        })
      ]);

      const enabledPercentage = totalUsers > 0 ? (enabled2FA / totalUsers) * 100 : 0;

      return {
        totalUsers,
        enabled2FA,
        enabledPercentage,
        recentEnables
      };
    } catch (error) {
      console.error('Failed to get 2FA statistics:', error);
      return {
        totalUsers: 0,
        enabled2FA: 0,
        enabledPercentage: 0,
        recentEnables: 0
      };
    }
  }
}

export const twoFactorService = TwoFactorService.getInstance();
