
'use client';

/**
 * HYBRID SPRINT 2.1: Responsive Card Component
 * Device-optimized card component
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { mobileLayoutService } from '@/lib/mobile/mobile-layout-service';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  animate?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className,
  animate = true,
  interactive = false,
  onClick
}) => {
  const cardClasses = mobileLayoutService.getCardClasses();
  const touchClasses = interactive ? mobileLayoutService.getTouchClasses() : '';

  const cardContent = (
    <Card 
      className={cn(
        cardClasses,
        touchClasses,
        interactive && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <CardHeader className={cn(
          mobileLayoutService.isMobile() ? 'p-4 pb-2' : 'p-6 pb-2'
        )}>
          {title && (
            <CardTitle className={cn(
              mobileLayoutService.getTextClasses({
                mobile: 'text-lg',
                tablet: 'text-xl',
                desktop: 'text-xl'
              })
            )}>
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </CardHeader>
      )}
      
      {children && (
        <CardContent className={cn(
          mobileLayoutService.isMobile() ? 'p-4' : 'p-6',
          (title || subtitle) && (mobileLayoutService.isMobile() ? 'pt-0' : 'pt-0')
        )}>
          {children}
        </CardContent>
      )}
      
      {footer && (
        <CardFooter className={cn(
          mobileLayoutService.isMobile() ? 'p-4 pt-0' : 'p-6 pt-0'
        )}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        whileHover={interactive ? { y: -2 } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default ResponsiveCard;
