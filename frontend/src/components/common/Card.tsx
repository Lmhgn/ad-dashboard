/**
 * Card Component - Reusable card wrapper
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CARD VARIANTS
// ============================================================================

export function KPICard({
  label,
  value,
  icon,
  change,
  trend,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
}) {
  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        {icon && <div className="text-2xl text-gray-400">{icon}</div>}
      </div>

      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">{value}</div>

        {change !== undefined && (
          <div
            className={`mt-2 text-sm font-medium ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}
          >
            {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

export function CardSkeleton() {
  return (
    <Card>
      <div className="space-y-4">
        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
        <div className="h-8 w-full rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
      </div>
    </Card>
  );
}
