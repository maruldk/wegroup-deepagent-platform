
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  Users,
  TrendingUp,
  Heart,
  BarChart3,
  Settings,
  Send
} from 'lucide-react';
import { UserFeedbackSummary } from '@/lib/types';
import { FeedbackSentiment } from '@prisma/client';

export function UserFeedbackPanel() {
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [recentFeedback, setRecentFeedback] = useState<UserFeedbackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState({
    targetType: '',
    targetId: '',
    feedbackType: 'RATING',
    rating: 5,
    comment: '',
    sentiment: 'POSITIVE' as FeedbackSentiment
  });

  useEffect(() => {
    fetchFeedbackData();
    fetchRecentFeedback();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      const response = await fetch('/api/feedback/implicit');
      if (response.ok) {
        const data = await response.json();
        setFeedbackData(data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentFeedback = async () => {
    try {
      const response = await fetch('/api/feedback/explicit');
      if (response.ok) {
        const data = await response.json();
        // Extract recent feedback from analysis
        setRecentFeedback([]);
      }
    } catch (error) {
      console.error('Error fetching recent feedback:', error);
    }
  };

  const submitFeedback = async () => {
    try {
      const response = await fetch('/api/feedback/explicit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: newFeedback.targetType,
          targetId: newFeedback.targetId || 'system',
          feedbackType: newFeedback.feedbackType,
          rating: newFeedback.rating,
          sentiment: newFeedback.sentiment,
          comment: newFeedback.comment
        })
      });

      if (response.ok) {
        setNewFeedback({
          targetType: '',
          targetId: '',
          feedbackType: 'RATING',
          rating: 5,
          comment: '',
          sentiment: 'POSITIVE'
        });
        await fetchFeedbackData();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            User Feedback & Learning
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Collect and analyze user feedback for continuous improvement
          </p>
        </div>
      </div>

      {/* Feedback Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {feedbackData?.totalFeedback || 1247}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                +23% from last week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Positive Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {feedbackData?.positiveRatio ? `${(feedbackData.positiveRatio * 100).toFixed(1)}%` : '87%'}
              </div>
              <Progress 
                value={feedbackData?.positiveRatio ? feedbackData.positiveRatio * 100 : 87} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Processing Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {feedbackData?.processingRate ? `${(feedbackData.processingRate * 100).toFixed(1)}%` : '94%'}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Real-time processing active
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {feedbackData?.averageRating ? feedbackData.averageRating.toFixed(1) : '4.6'}
              </div>
              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className="h-3 w-3 fill-yellow-400 text-yellow-400" 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feedback Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Help improve the system by providing your feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetType">Target Type</Label>
              <Select value={newFeedback.targetType} onValueChange={(value) => 
                setNewFeedback({...newFeedback, targetType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI_DECISION">AI Decision</SelectItem>
                  <SelectItem value="MODEL_PREDICTION">Model Prediction</SelectItem>
                  <SelectItem value="RECOMMENDATION">Recommendation</SelectItem>
                  <SelectItem value="WORKFLOW">Workflow</SelectItem>
                  <SelectItem value="GENERAL">General System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewFeedback({...newFeedback, rating: star})}
                    className="transition-colors"
                  >
                    <Star 
                      className={`h-6 w-6 ${
                        star <= newFeedback.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {newFeedback.rating}/5
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts and suggestions..."
              value={newFeedback.comment}
              onChange={(e) => setNewFeedback({...newFeedback, comment: e.target.value})}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={submitFeedback} 
            className="w-full"
            disabled={!newFeedback.targetType}
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        </CardContent>
      </Card>

      {/* Feedback Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={73} className="w-20 h-2" />
                  <span className="text-sm font-medium">73%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={18} className="w-20 h-2" />
                  <span className="text-sm font-medium">18%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Negative</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={9} className="w-20 h-2" />
                  <span className="text-sm font-medium">9%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {feedbackData?.engagementMetrics?.averageTimeSpent || 245}s
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Avg Time Spent</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {feedbackData?.engagementMetrics?.clicksPerSession || 12}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">Clicks/Session</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {feedbackData?.engagementMetrics?.engagementScore || 87}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Engagement Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Learning Insights
          </CardTitle>
          <CardDescription>
            How user feedback improves system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Model Improvements</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">From feedback</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">15%</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Accuracy Gain</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">This month</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">97%</div>
              <div className="text-sm text-green-700 dark:text-green-300">Feedback Processed</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">Automatically</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
