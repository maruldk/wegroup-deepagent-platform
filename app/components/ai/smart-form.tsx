
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Sparkles,
  Save,
  Wand2,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SmartFormField {
  name: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'number';
  label: string;
  placeholder?: string;
  required?: boolean;
  aiSuggestions?: string[];
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    customValidator?: (value: any) => boolean | string;
  };
}

export interface AIFormSuggestion {
  field: string;
  suggestion: string;
  confidence: number;
  reason: string;
}

interface SmartFormProps {
  title: string;
  description?: string;
  fields: SmartFormField[];
  onSubmit: (data: any) => void;
  enableAISuggestions?: boolean;
  enableAutoCompletion?: boolean;
  showConfidenceScores?: boolean;
}

export function SmartForm({
  title,
  description,
  fields,
  onSubmit,
  enableAISuggestions = true,
  enableAutoCompletion = true,
  showConfidenceScores = true
}: SmartFormProps) {
  const [aiSuggestions, setAiSuggestions] = useState<AIFormSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const watchedValues = watch();

  // Generate AI suggestions based on form context
  const generateAISuggestions = async (formData: any): Promise<AIFormSuggestion[]> => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const suggestions: AIFormSuggestion[] = [];

    // Smart suggestions based on field types and content
    if (formData.email && !formData.company) {
      const domain = formData.email.split('@')[1];
      if (domain) {
        suggestions.push({
          field: 'company',
          suggestion: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          confidence: 0.75,
          reason: 'Abgeleitet von der E-Mail-Domain'
        });
      }
    }

    if (formData.title && formData.title.toLowerCase().includes('senior')) {
      suggestions.push({
        field: 'experience',
        suggestion: '5+ Jahre',
        confidence: 0.82,
        reason: 'Basierend auf der Berufsbezeichnung'
      });
    }

    if (formData.company && formData.company.toLowerCase().includes('tech')) {
      suggestions.push({
        field: 'industry',
        suggestion: 'Technology',
        confidence: 0.89,
        reason: 'Technologie-Unternehmen erkannt'
      });
    }

    // Content enhancement suggestions
    if (formData.description && formData.description.length < 50) {
      suggestions.push({
        field: 'description',
        suggestion: formData.description + ' Ich bin interessiert an innovativen Lösungen und würde gerne mehr über Ihre Services erfahren.',
        confidence: 0.71,
        reason: 'Beschreibung erweitern für bessere Qualifizierung'
      });
    }

    setIsAnalyzing(false);
    return suggestions;
  };

  // Calculate completion score
  const calculateCompletionScore = (data: any) => {
    const requiredFields = fields.filter(field => field.required);
    const completedRequired = requiredFields.filter(field => data[field.name] && data[field.name].trim()).length;
    const allFields = fields.length;
    const completedAll = fields.filter(field => data[field.name] && data[field.name].trim()).length;
    
    const requiredScore = requiredFields.length > 0 ? (completedRequired / requiredFields.length) * 70 : 70;
    const optionalScore = allFields > 0 ? (completedAll / allFields) * 30 : 30;
    
    return Math.round(requiredScore + optionalScore);
  };

  // Update suggestions when form data changes
  useEffect(() => {
    if (enableAISuggestions && Object.keys(watchedValues).length > 0) {
      const timer = setTimeout(() => {
        generateAISuggestions(watchedValues).then(setAiSuggestions);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [watchedValues, enableAISuggestions]);

  // Update completion score
  useEffect(() => {
    setCompletionScore(calculateCompletionScore(watchedValues));
  }, [watchedValues]);

  const applySuggestion = (suggestion: AIFormSuggestion) => {
    setValue(suggestion.field, suggestion.suggestion);
    setAppliedSuggestions(prev => new Set(prev.add(suggestion.field)));
    setAiSuggestions(prev => prev.filter(s => s.field !== suggestion.field));
  };

  const getSuggestionIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence >= 0.6) return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-orange-500" />;
  };

  const onFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                {title}
              </CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            {showConfidenceScores && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Vollständigkeit</div>
                <div className="flex items-center gap-2">
                  <Progress value={completionScore} className="w-20 h-2" />
                  <span className="text-sm font-medium">{completionScore}%</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                >
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                    {appliedSuggestions.has(field.name) && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        KI-optimiert
                      </Badge>
                    )}
                  </Label>
                  
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      {...register(field.name, {
                        required: field.required ? `${field.label} ist erforderlich` : false,
                        pattern: field.validation?.pattern ? {
                          value: field.validation.pattern,
                          message: 'Ungültiges Format'
                        } : undefined,
                        minLength: field.validation?.minLength ? {
                          value: field.validation.minLength,
                          message: `Mindestens ${field.validation.minLength} Zeichen erforderlich`
                        } : undefined
                      })}
                      className={errors[field.name] ? 'border-red-500' : ''}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      {...register(field.name, {
                        required: field.required ? `${field.label} ist erforderlich` : false,
                        pattern: field.validation?.pattern ? {
                          value: field.validation.pattern,
                          message: 'Ungültiges Format'
                        } : undefined
                      })}
                      className={errors[field.name] ? 'border-red-500' : ''}
                    />
                  )}
                  
                  {errors[field.name] && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors[field.name]?.message as string}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
              {enableAutoCompletion && (
                <Button type="button" variant="outline">
                  <Wand2 className="h-4 w-4 mr-2" />
                  KI-Vervollständigung
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {enableAISuggestions && (
        <AnimatePresence>
          {(aiSuggestions.length > 0 || isAnalyzing) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    KI-Verbesserungsvorschläge
                    {isAnalyzing && (
                      <Badge variant="secondary" className="text-xs">
                        <div className="animate-pulse">Analysiert...</div>
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={`${suggestion.field}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 border rounded-lg bg-blue-50/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getSuggestionIcon(suggestion.confidence)}
                              <span className="text-sm font-medium">
                                {fields.find(f => f.name === suggestion.field)?.label}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(suggestion.confidence * 100)}% sicher
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applySuggestion(suggestion)}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Übernehmen
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">
                            {suggestion.suggestion}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.reason}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
