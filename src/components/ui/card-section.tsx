// src/components/ui/card-section.tsx
'use client';

import type React from 'react';
import { cn } from '@/lib/utils';

interface CardSectionProps {
  title?: string; 
  description?: string; 
  children: React.ReactNode;
  className?: string; 
}

export function CardSection({ title, description, children, className }: CardSectionProps) {
  const hasHeader = title || description;
  return (
    <div className={cn("w-full", className)}>
      {hasHeader && (
        <div className="mb-3"> 
          {title && <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
