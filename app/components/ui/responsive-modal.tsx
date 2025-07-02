
'use client';

/**
 * HYBRID SPRINT 2.1: Responsive Modal Component
 * Device-optimized modal/dialog component
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mobileLayoutService } from '@/lib/mobile/mobile-layout-service';
import { cn } from '@/lib/utils';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className
}) => {
  const deviceType = mobileLayoutService.getDeviceType();
  const modalClasses = mobileLayoutService.getModalClasses();

  const getSizeClasses = () => {
    if (deviceType === 'mobile') {
      return size === 'full' ? 'inset-0' : 'inset-x-0 bottom-0 rounded-t-lg';
    }

    const sizeMap = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      full: 'max-w-4xl'
    };

    return sizeMap[size];
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: deviceType === 'mobile' ? 1 : 0.95,
      y: deviceType === 'mobile' ? '100%' : 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            className={cn(
              'fixed z-50 bg-background shadow-lg',
              modalClasses,
              getSizeClasses(),
              deviceType !== 'mobile' && 'border',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={cn(
              'flex items-center justify-between border-b border-border',
              mobileLayoutService.isMobile() ? 'p-4' : 'p-6'
            )}>
              {title && (
                <h2 className={cn(
                  'font-semibold',
                  mobileLayoutService.getTextClasses({
                    mobile: 'text-lg',
                    tablet: 'text-xl',
                    desktop: 'text-xl'
                  })
                )}>
                  {title}
                </h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className={cn(
                  mobileLayoutService.getTouchClasses(),
                  'ml-auto'
                )}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className={cn(
              'flex-1 overflow-auto',
              mobileLayoutService.isMobile() ? 'p-4' : 'p-6'
            )}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className={cn(
                'border-t border-border',
                mobileLayoutService.isMobile() ? 'p-4' : 'p-6'
              )}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResponsiveModal;
