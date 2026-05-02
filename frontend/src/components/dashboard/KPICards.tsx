/**
 * KPI Cards - Hero metrics at top of dashboard
 */

'use client';

import { useSummary, useTrends } from '@/lib/hooks';
import { KPICard, CardSkeleton } from '@/components/common/Card';

export function KPICards() {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: trends, isLoading: trendsLoading } = useTrends();

  const isLoading = summaryLoading || trendsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!summary || !trends) {
    return <div className="text-center text-red-600">Failed to load summary data</div>;
  }

  // Calculate budget health score
  const budgetHealthy = summary.budget_status.filter((b) => b.status === 'safe').length;
  const totalBudgets = summary.budget_status.length;
  const budgetScore = totalBudgets > 0 ? Math.round((budgetHealthy / totalBudgets) * 100) : 0;

  const trend = trends.mom_change_percent > 0 ? 'up' : 'down';
  const change = Math.abs(trends.mom_change_percent);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Total Spend */}
      <KPICard
        label="Total Spend (YTD)"
        value={`£${(summary.total_spend_lifetime / 1000).toFixed(1)}k`}
        icon="💰"
      />

      {/* This Month */}
      <KPICard
        label="This Month"
        value={`£${summary.trends.current_month_spend.toFixed(2)}`}
        change={change}
        trend={trend}
      />

      {/* Budget Health */}
      <KPICard
        label="Budget Health"
        value={`${budgetScore}/100`}
        icon={budgetScore > 75 ? '✓' : budgetScore > 50 ? '⚠️' : '❌'}
      />
    </div>
  );
}
