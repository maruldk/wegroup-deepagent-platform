
import { DecisionContext, DecisionResult } from '../autonomous-decision-engine';
import { PrismaClient } from '@prisma/client';

export interface HRDecisionModel {
  performancePrediction: (employeeData: any) => Promise<{ score: number; trends: string[] }>;
  skillGapAnalysis: (teamData: any) => Promise<{ gaps: string[]; recommendations: string[] }>;
  turnoverRiskAssessment: (employeeData: any) => Promise<{ risk: number; factors: string[] }>;
  careerPathRecommendation: (employeeData: any) => Promise<{ path: string; timeline: string }>;
  teamOptimization: (teamData: any) => Promise<{ composition: any; efficiency: number }>;
}

export class HRDecisionEngine implements HRDecisionModel {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * HR-specific Decision Making
   */
  async makeHRDecision(context: DecisionContext): Promise<DecisionResult> {
    const { action, data } = context;

    switch (action) {
      case 'performance_review':
        return this.handlePerformanceReview(data);
      
      case 'leave_approval':
        return this.handleLeaveApproval(data);
      
      case 'career_development':
        return this.handleCareerDevelopment(data);
      
      case 'team_optimization':
        return this.handleTeamOptimization(data);
      
      case 'recruitment_decision':
        return this.handleRecruitmentDecision(data);
      
      case 'training_recommendation':
        return this.handleTrainingRecommendation(data);
      
      default:
        return this.handleGenericHRDecision(context);
    }
  }

  /**
   * Performance Prediction
   */
  async performancePrediction(employeeData: any): Promise<{ score: number; trends: string[] }> {
    let score = 50; // Base score
    const trends: string[] = [];

    // Recent performance metrics
    if (employeeData.recentReviews) {
      const avgRating = employeeData.recentReviews.reduce((sum: number, review: any) => 
        sum + (review.overallRating || 3), 0) / employeeData.recentReviews.length;
      score += (avgRating - 3) * 15; // Scale from 3 (neutral) baseline
      
      if (avgRating > 4) trends.push('High performance trajectory');
      else if (avgRating < 2.5) trends.push('Performance concerns identified');
    }

    // Goal achievement
    if (employeeData.goalAchievement) {
      const achievementRate = employeeData.goalAchievement.completed / employeeData.goalAchievement.total;
      score += achievementRate * 20;
      
      if (achievementRate > 0.8) trends.push('Consistently exceeds goals');
      else if (achievementRate < 0.5) trends.push('Goal achievement below expectations');
    }

    // Engagement metrics
    if (employeeData.engagementScore) {
      score += (employeeData.engagementScore - 50) * 0.3;
      
      if (employeeData.engagementScore > 75) trends.push('High engagement level');
      else if (employeeData.engagementScore < 40) trends.push('Low engagement - intervention needed');
    }

    // Learning and development
    if (employeeData.trainingCompleted) {
      score += Math.min(employeeData.trainingCompleted * 2, 10);
      trends.push(`Completed ${employeeData.trainingCompleted} training sessions`);
    }

    // Attendance and punctuality
    if (employeeData.attendanceRate) {
      score += (employeeData.attendanceRate - 90) * 0.2;
      
      if (employeeData.attendanceRate > 95) trends.push('Excellent attendance record');
      else if (employeeData.attendanceRate < 85) trends.push('Attendance concerns');
    }

    return { 
      score: Math.max(0, Math.min(100, score)), 
      trends: trends.slice(0, 5) 
    };
  }

  /**
   * Skill Gap Analysis
   */
  async skillGapAnalysis(teamData: any): Promise<{ gaps: string[]; recommendations: string[] }> {
    const gaps: string[] = [];
    const recommendations: string[] = [];

    // Required vs actual skills mapping
    if (teamData.requiredSkills && teamData.teamMembers) {
      const teamSkills = new Set();
      teamData.teamMembers.forEach((member: any) => {
        if (member.skills) {
          member.skills.forEach((skill: string) => teamSkills.add(skill));
        }
      });

      teamData.requiredSkills.forEach((skill: string) => {
        if (!teamSkills.has(skill)) {
          gaps.push(skill);
        }
      });

      // Generate recommendations
      if (gaps.length > 0) {
        recommendations.push(`Training needed in: ${gaps.slice(0, 3).join(', ')}`);
        recommendations.push('Consider hiring specialist for critical gaps');
        recommendations.push('Implement mentorship program for skill transfer');
      }
    }

    // Future skill requirements
    if (teamData.futureProjects) {
      const emergingSkills = ['AI/ML', 'Cloud Architecture', 'DevOps', 'Data Analytics'];
      emergingSkills.forEach(skill => {
        const hasSkill = teamData.teamMembers?.some((member: any) => 
          member.skills?.includes(skill));
        if (!hasSkill) {
          recommendations.push(`Prepare for future needs: ${skill} training`);
        }
      });
    }

    return { gaps: gaps.slice(0, 10), recommendations: recommendations.slice(0, 5) };
  }

  /**
   * Turnover Risk Assessment
   */
  async turnoverRiskAssessment(employeeData: any): Promise<{ risk: number; factors: string[] }> {
    let risk = 0;
    const factors: string[] = [];

    // Performance dissatisfaction
    if (employeeData.performanceRating && employeeData.performanceRating < 3) {
      risk += 0.2;
      factors.push('Below-average performance rating');
    }

    // Engagement score
    if (employeeData.engagementScore && employeeData.engagementScore < 40) {
      risk += 0.3;
      factors.push('Low engagement score');
    }

    // Career stagnation
    if (employeeData.lastPromotion) {
      const daysSincePromotion = (Date.now() - new Date(employeeData.lastPromotion).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePromotion > 1095) { // 3 years
        risk += 0.15;
        factors.push('No promotion in over 3 years');
      }
    }

    // Compensation satisfaction
    if (employeeData.salaryBenchmark && employeeData.salaryBenchmark < 0.9) {
      risk += 0.2;
      factors.push('Below-market compensation');
    }

    // Manager relationship
    if (employeeData.managerRating && employeeData.managerRating < 3) {
      risk += 0.15;
      factors.push('Poor manager relationship');
    }

    // Work-life balance
    if (employeeData.overtimeHours && employeeData.overtimeHours > 10) {
      risk += 0.1;
      factors.push('Excessive overtime hours');
    }

    // External opportunities
    if (employeeData.marketDemand === 'high') {
      risk += 0.1;
      factors.push('High market demand for skills');
    }

    return { risk: Math.min(risk, 1), factors };
  }

  /**
   * Career Path Recommendation
   */
  async careerPathRecommendation(employeeData: any): Promise<{ path: string; timeline: string }> {
    const currentLevel = employeeData.currentLevel || 'Junior';
    const skills = employeeData.skills || [];
    const interests = employeeData.interests || [];
    const performance = employeeData.performanceRating || 3;

    // Define career paths
    const careerPaths = {
      'Technical Leadership': {
        requirements: ['leadership', 'technical_expertise', 'mentoring'],
        timeline: performance > 4 ? '12-18 months' : '18-24 months'
      },
      'Product Management': {
        requirements: ['product_strategy', 'market_analysis', 'stakeholder_management'],
        timeline: '18-30 months'
      },
      'Architecture': {
        requirements: ['system_design', 'scalability', 'technology_strategy'],
        timeline: '24-36 months'
      },
      'Specialization': {
        requirements: ['deep_expertise', 'innovation', 'thought_leadership'],
        timeline: '12-24 months'
      }
    };

    // Score each path
    let bestPath = 'Specialization';
    let bestScore = 0;

    Object.entries(careerPaths).forEach(([path, config]) => {
      let score = 0;
      config.requirements.forEach(req => {
        if (skills.includes(req) || interests.includes(req)) {
          score += 1;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestPath = path;
      }
    });

    return {
      path: bestPath,
      timeline: careerPaths[bestPath as keyof typeof careerPaths].timeline
    };
  }

  /**
   * Team Optimization
   */
  async teamOptimization(teamData: any): Promise<{ composition: any; efficiency: number }> {
    const currentTeam = teamData.members || [];
    const projectRequirements = teamData.requirements || {};

    // Analyze current team composition
    const skillDistribution = this.analyzeSkillDistribution(currentTeam);
    const experienceDistribution = this.analyzeExperienceDistribution(currentTeam);
    
    // Calculate efficiency score
    let efficiency = 50; // Base efficiency
    
    // Skill coverage efficiency
    const skillCoverage = this.calculateSkillCoverage(skillDistribution, projectRequirements.skills || []);
    efficiency += skillCoverage * 30;
    
    // Experience balance efficiency
    const experienceBalance = this.calculateExperienceBalance(experienceDistribution);
    efficiency += experienceBalance * 20;

    // Optimal composition recommendations
    const recommendations = this.generateCompositionRecommendations(
      skillDistribution,
      experienceDistribution,
      projectRequirements
    );

    return {
      composition: {
        current: {
          skills: skillDistribution,
          experience: experienceDistribution,
          size: currentTeam.length
        },
        recommended: recommendations,
        gaps: this.identifyTeamGaps(skillDistribution, projectRequirements)
      },
      efficiency: Math.min(100, efficiency)
    };
  }

  /**
   * Decision Handlers
   */
  private async handlePerformanceReview(data: any): Promise<DecisionResult> {
    const prediction = await this.performancePrediction(data.employee);
    
    let reviewFrequency = 'quarterly';
    let urgency = 'normal';
    
    if (prediction.score < 40) {
      reviewFrequency = 'monthly';
      urgency = 'high';
    } else if (prediction.score > 80) {
      reviewFrequency = 'bi-annually';
      urgency = 'low';
    }

    return {
      decision: `Performance review schedule: ${reviewFrequency}`,
      confidence: 0.85,
      reasoning: [
        `Performance prediction score: ${prediction.score.toFixed(1)}`,
        `Identified trends: ${prediction.trends.length}`,
        `Review urgency: ${urgency}`
      ],
      recommendedActions: [
        {
          action: `Schedule ${reviewFrequency} performance review`,
          priority: urgency === 'high' ? 9 : urgency === 'low' ? 5 : 7,
          estimatedImpact: 'Improved performance tracking',
          autoExecute: urgency === 'high'
        }
      ],
      riskAssessment: {
        level: prediction.score < 40 ? 'HIGH' : prediction.score > 80 ? 'LOW' : 'MEDIUM',
        factors: prediction.trends,
        mitigation: this.getPerformanceMitigation(prediction.score)
      }
    };
  }

  private async handleLeaveApproval(data: any): Promise<DecisionResult> {
    const { leaveRequest } = data;
    
    let autoApprove = false;
    let confidence = 0.7;
    const reasoning: string[] = [];
    
    // Auto-approval rules
    if (leaveRequest.type === 'sick' && leaveRequest.days <= 3) {
      autoApprove = true;
      confidence = 0.95;
      reasoning.push('Sick leave under 3 days - auto-approved');
    } else if (leaveRequest.type === 'vacation' && leaveRequest.advanceNotice >= 14) {
      autoApprove = true;
      confidence = 0.9;
      reasoning.push('Vacation with adequate advance notice');
    }

    // Check team impact
    if (leaveRequest.teamImpact === 'high') {
      autoApprove = false;
      confidence = 0.6;
      reasoning.push('High team impact - requires manager review');
    }

    return {
      decision: autoApprove ? 'Auto-approve leave request' : 'Require manager approval',
      confidence,
      reasoning,
      recommendedActions: [
        {
          action: autoApprove ? 'Approve leave automatically' : 'Send to manager for review',
          priority: autoApprove ? 8 : 6,
          estimatedImpact: autoApprove ? 'Faster processing' : 'Careful review',
          autoExecute: autoApprove
        }
      ],
      riskAssessment: {
        level: autoApprove ? 'LOW' : 'MEDIUM',
        factors: leaveRequest.teamImpact === 'high' ? ['High team impact'] : ['Standard leave request'],
        mitigation: autoApprove ? ['Automatic notification to team'] : ['Manager review and decision']
      }
    };
  }

  private async handleCareerDevelopment(data: any): Promise<DecisionResult> {
    const careerPath = await this.careerPathRecommendation(data.employee);
    
    return {
      decision: `Recommended career path: ${careerPath.path}`,
      confidence: 0.8,
      reasoning: [
        `Career path: ${careerPath.path}`,
        `Timeline: ${careerPath.timeline}`,
        'Based on skills, interests, and performance'
      ],
      recommendedActions: [
        {
          action: 'Create development plan',
          priority: 7,
          estimatedImpact: 'Enhanced career satisfaction',
          autoExecute: false
        },
        {
          action: 'Identify required training',
          priority: 6,
          estimatedImpact: 'Skill development',
          autoExecute: true
        }
      ],
      riskAssessment: {
        level: 'LOW',
        factors: ['Data-driven career planning'],
        mitigation: ['Regular progress reviews', 'Flexible adjustment of plans']
      }
    };
  }

  private async handleTeamOptimization(data: any): Promise<DecisionResult> {
    const optimization = await this.teamOptimization(data.team);
    
    return {
      decision: `Team efficiency: ${optimization.efficiency.toFixed(1)}%`,
      confidence: 0.85,
      reasoning: [
        `Current efficiency: ${optimization.efficiency.toFixed(1)}%`,
        `Team size: ${optimization.composition.current.size}`,
        'Optimization based on skill and experience analysis'
      ],
      recommendedActions: this.getTeamOptimizationActions(optimization),
      riskAssessment: {
        level: optimization.efficiency > 75 ? 'LOW' : optimization.efficiency > 50 ? 'MEDIUM' : 'HIGH',
        factors: optimization.composition.gaps,
        mitigation: ['Skill development', 'Strategic hiring', 'Cross-training']
      }
    };
  }

  private async handleRecruitmentDecision(data: any): Promise<DecisionResult> {
    const { candidate, position } = data;
    
    let score = 0;
    const reasoning: string[] = [];
    
    // Skills match
    if (candidate.skills && position.requiredSkills) {
      const skillMatch = candidate.skills.filter((skill: string) => 
        position.requiredSkills.includes(skill)).length / position.requiredSkills.length;
      score += skillMatch * 40;
      reasoning.push(`Skill match: ${(skillMatch * 100).toFixed(1)}%`);
    }
    
    // Experience match
    if (candidate.experience && position.requiredExperience) {
      const expScore = Math.min(candidate.experience / position.requiredExperience, 1.2) * 30;
      score += expScore;
      reasoning.push(`Experience: ${candidate.experience} years (required: ${position.requiredExperience})`);
    }
    
    // Cultural fit
    if (candidate.culturalFitScore) {
      score += candidate.culturalFitScore * 20;
      reasoning.push(`Cultural fit: ${candidate.culturalFitScore.toFixed(1)}/5`);
    }
    
    // Interview performance
    if (candidate.interviewScore) {
      score += candidate.interviewScore * 10;
      reasoning.push(`Interview performance: ${candidate.interviewScore.toFixed(1)}/5`);
    }

    const recommendation = score > 75 ? 'Strong Hire' : score > 60 ? 'Hire' : score > 40 ? 'Consider' : 'Pass';
    
    return {
      decision: `Recruitment recommendation: ${recommendation}`,
      confidence: Math.min(score / 100, 0.9),
      reasoning,
      recommendedActions: [
        {
          action: recommendation === 'Pass' ? 'Decline candidate' : 'Proceed with offer',
          priority: recommendation === 'Strong Hire' ? 9 : recommendation === 'Hire' ? 7 : 5,
          estimatedImpact: recommendation === 'Pass' ? 'Continue search' : 'Team strengthening',
          autoExecute: recommendation === 'Pass'
        }
      ],
      riskAssessment: {
        level: recommendation === 'Strong Hire' ? 'LOW' : recommendation === 'Pass' ? 'LOW' : 'MEDIUM',
        factors: [`Candidate score: ${score.toFixed(1)}`],
        mitigation: recommendation !== 'Pass' ? ['Onboarding plan', 'Probation period'] : ['Continue recruitment']
      }
    };
  }

  private async handleTrainingRecommendation(data: any): Promise<DecisionResult> {
    const { employee, teamNeeds } = data;
    const skillGaps = await this.skillGapAnalysis({ teamMembers: [employee], requiredSkills: teamNeeds?.skills || [] });
    
    const priorityTraining = skillGaps.gaps.slice(0, 3);
    
    return {
      decision: `Training recommendation: ${priorityTraining.join(', ') || 'No critical gaps identified'}`,
      confidence: 0.8,
      reasoning: [
        `Skill gaps identified: ${skillGaps.gaps.length}`,
        `Priority training areas: ${priorityTraining.length}`,
        'Based on team needs and individual profile'
      ],
      recommendedActions: priorityTraining.map((skill, index) => ({
        action: `Enroll in ${skill} training`,
        priority: 8 - index,
        estimatedImpact: 'Skill development',
        autoExecute: index === 0
      })),
      riskAssessment: {
        level: skillGaps.gaps.length > 5 ? 'HIGH' : skillGaps.gaps.length > 2 ? 'MEDIUM' : 'LOW',
        factors: [`${skillGaps.gaps.length} skill gaps identified`],
        mitigation: ['Structured training plan', 'Progress monitoring', 'Mentorship support']
      }
    };
  }

  private async handleGenericHRDecision(context: DecisionContext): Promise<DecisionResult> {
    return {
      decision: 'Standard HR process',
      confidence: 0.6,
      reasoning: ['Generic HR decision applied', 'No specific optimization available'],
      recommendedActions: [
        {
          action: 'Follow standard HR process',
          priority: 5,
          estimatedImpact: 'Consistent workflow',
          autoExecute: false
        }
      ],
      riskAssessment: {
        level: 'MEDIUM',
        factors: ['Generic process applied'],
        mitigation: ['Monitor outcomes for improvement opportunities']
      }
    };
  }

  /**
   * Helper Methods
   */
  private analyzeSkillDistribution(team: any[]): Record<string, number> {
    const skillCount: Record<string, number> = {};
    team.forEach(member => {
      if (member.skills) {
        member.skills.forEach((skill: string) => {
          skillCount[skill] = (skillCount[skill] || 0) + 1;
        });
      }
    });
    return skillCount;
  }

  private analyzeExperienceDistribution(team: any[]): { junior: number; mid: number; senior: number } {
    const distribution = { junior: 0, mid: 0, senior: 0 };
    team.forEach(member => {
      const experience = member.experience || 0;
      if (experience < 3) distribution.junior++;
      else if (experience < 7) distribution.mid++;
      else distribution.senior++;
    });
    return distribution;
  }

  private calculateSkillCoverage(skillDist: Record<string, number>, required: string[]): number {
    if (required.length === 0) return 1;
    const covered = required.filter(skill => skillDist[skill] > 0).length;
    return covered / required.length;
  }

  private calculateExperienceBalance(expDist: { junior: number; mid: number; senior: number }): number {
    const total = expDist.junior + expDist.mid + expDist.senior;
    if (total === 0) return 0;
    
    // Ideal distribution: 30% junior, 50% mid, 20% senior
    const idealJunior = total * 0.3;
    const idealMid = total * 0.5;
    const idealSenior = total * 0.2;
    
    const juniorDiff = Math.abs(expDist.junior - idealJunior) / total;
    const midDiff = Math.abs(expDist.mid - idealMid) / total;
    const seniorDiff = Math.abs(expDist.senior - idealSenior) / total;
    
    return Math.max(0, 1 - (juniorDiff + midDiff + seniorDiff) / 3);
  }

  private generateCompositionRecommendations(
    skillDist: Record<string, number>,
    expDist: { junior: number; mid: number; senior: number },
    requirements: any
  ): any {
    const recommendations: any = {
      skillGaps: [],
      experienceAdjustments: [],
      optimalSize: Math.max(3, Math.min(8, (requirements.complexity || 5) + 2))
    };

    // Skill recommendations
    if (requirements.skills) {
      requirements.skills.forEach((skill: string) => {
        if (!skillDist[skill] || skillDist[skill] < 2) {
          recommendations.skillGaps.push({
            skill,
            priority: 'high',
            action: skillDist[skill] ? 'Add more expertise' : 'Add skill to team'
          });
        }
      });
    }

    // Experience recommendations
    const total = expDist.junior + expDist.mid + expDist.senior;
    if (total > 0) {
      if (expDist.senior / total < 0.15) {
        recommendations.experienceAdjustments.push('Add senior expertise');
      }
      if (expDist.mid / total < 0.4) {
        recommendations.experienceAdjustments.push('Add mid-level experience');
      }
    }

    return recommendations;
  }

  private identifyTeamGaps(skillDist: Record<string, number>, requirements: any): string[] {
    const gaps: string[] = [];
    
    if (requirements.skills) {
      requirements.skills.forEach((skill: string) => {
        if (!skillDist[skill]) {
          gaps.push(`Missing: ${skill}`);
        } else if (skillDist[skill] < 2) {
          gaps.push(`Insufficient: ${skill}`);
        }
      });
    }
    
    return gaps;
  }

  private getPerformanceMitigation(score: number): string[] {
    if (score < 40) {
      return [
        'Performance improvement plan',
        'Weekly check-ins with manager',
        'Additional training and support'
      ];
    } else if (score < 70) {
      return [
        'Regular feedback sessions',
        'Skill development opportunities',
        'Clear goal setting'
      ];
    } else {
      return [
        'Recognition and rewards',
        'Stretch assignments',
        'Leadership development'
      ];
    }
  }

  private getTeamOptimizationActions(optimization: any): any[] {
    const actions = [];
    
    if (optimization.efficiency < 75) {
      actions.push({
        action: 'Team restructuring analysis',
        priority: 8,
        estimatedImpact: 'Improved efficiency',
        autoExecute: false
      });
    }
    
    if (optimization.composition.gaps.length > 0) {
      actions.push({
        action: 'Address critical skill gaps',
        priority: 7,
        estimatedImpact: 'Enhanced capabilities',
        autoExecute: false
      });
    }
    
    actions.push({
      action: 'Cross-training program',
      priority: 6,
      estimatedImpact: 'Increased flexibility',
      autoExecute: false
    });
    
    return actions;
  }
}
