
'use client';

/**
 * HYBRID SPRINT 2.1: Responsive Form Components
 * Mobile-optimized form inputs and layouts
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mobileLayoutService } from '@/lib/mobile/mobile-layout-service';
import { cn } from '@/lib/utils';

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  label,
  error,
  helper,
  className,
  ...props
}) => {
  const inputClasses = mobileLayoutService.getInputClasses();

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input
        className={cn(inputClasses, error && 'border-destructive', className)}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-muted-foreground">{helper}</p>
      )}
    </div>
  );
};

interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const ResponsiveTextarea: React.FC<ResponsiveTextareaProps> = ({
  label,
  error,
  helper,
  className,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Textarea
        className={cn(
          'min-h-[100px] text-base',
          mobileLayoutService.isMobile() && 'text-base',
          error && 'border-destructive',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-muted-foreground">{helper}</p>
      )}
    </div>
  );
};

interface ResponsiveSelectProps {
  label?: string;
  error?: string;
  helper?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}

export const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  label,
  error,
  helper,
  placeholder,
  value,
  onValueChange,
  children,
  required
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(
          mobileLayoutService.getInputClasses(),
          error && 'border-destructive'
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-muted-foreground">{helper}</p>
      )}
    </div>
  );
};

interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const buttonClasses = mobileLayoutService.getButtonClasses(size);
  const touchClasses = mobileLayoutService.getTouchClasses();

  return (
    <Button
      variant={variant}
      className={cn(
        buttonClasses,
        touchClasses,
        fullWidth && 'w-full',
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </Button>
  );
};

interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  onSubmit,
  className
}) => {
  return (
    <form 
      onSubmit={onSubmit}
      className={cn(
        'space-y-6',
        mobileLayoutService.isMobile() && 'space-y-4',
        className
      )}
    >
      {children}
    </form>
  );
};

interface ResponsiveFieldGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveFieldGroup: React.FC<ResponsiveFieldGroupProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      'grid gap-4',
      mobileLayoutService.getGridClasses({
        mobile: 1,
        tablet: 2,
        desktop: 2
      }),
      className
    )}>
      {children}
    </div>
  );
};


