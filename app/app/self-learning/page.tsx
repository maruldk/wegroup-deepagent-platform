
/**
 * Self-Learning Analytics Page - Complete autonomous learning dashboard
 */

import React from 'react';
import { SelfLearningDashboard } from '@/components/ai/self-learning-dashboard';

export const metadata = {
  title: 'Self-Learning System | weGROUP DeepAgent Plattform',
  description: 'Monitor and manage autonomous learning systems including reinforcement learning, user feedback processing, and continuous optimization.',
};

export default function SelfLearningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SelfLearningDashboard />
      </div>
    </div>
  );
}
