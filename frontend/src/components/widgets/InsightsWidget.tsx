/**
 * Insights Widget - Display generated insights
 */

'use client';

import { useInsights } from '@/lib/hooks';
import { Card, CardSkeleton } from '@/components/common/Card';
import type { InsightType } from '@/lib/types';

const INSIGHT_ICONS: Record<InsightType, string> = {
  spending_increase: '📈',
  spending_decrease: '📉',
  top_category: '🎯',
  subscription_cost: '💳',
  budget_exceeded: '⚠️',
  budget_remaining: '✓',
  merchant_spike: '🔥',
  category_trend: '📊',
};

const INSIGHT_COLORS: Record<InsightType, string> = {
  spending_increase: 'bg-red-50 border-red-200',
  spending_decrease: 'bg-green-50 border-green-200',
  top_category: 'bg-blue-50 border-blue-200',
  subscription_cost: 'bg-purple-50 border-purple-200',
  budget_exceeded: 'bg-orange-50 border-orange-200',
  budget_remaining: 'bg-green-50 border-green-200',
  merchant_spike: 'bg-yellow-50 border-yellow-200',
  category_trend: 'bg-cyan-50 border-cyan-200',
};

export function InsightsWidget() {
  const { data: insights, isLoading } = useInsights(10);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return <Card>No insights available yet. Process your transactions to generate insights.</Card>;
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <Card
          key={insight.id}
          className={`border ${INSIGHT_COLORS[insight.insight_type] || 'bg-gray-50 border-gray-200'}`}
        >
          <div className="flex items-start gap-4">
            <div className="text-2xl">{INSIGHT_ICONS[insight.insight_type]}</div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{insight.insight_text}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                <span>{new Date(insight.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
