/**
 * Budget Widget - Display budget status for each category
 */

'use client';

import { useBudgetStatus } from '@/lib/hooks';
import { Card, CardSkeleton } from '@/components/common/Card';

export function BudgetWidget() {
  const { data: budgets, isLoading } = useBudgetStatus();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!budgets || budgets.length === 0) {
    return <Card>No budget data available. Set budget limits in settings.</Card>;
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const percentUsed = budget.used_percent;
        const statusColor =
          budget.status === 'exceeded' ? 'bg-red-500' : budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500';

        return (
          <Card key={budget.category_id}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{budget.category_name}</h4>
                <span
                  className={`text-sm font-medium ${
                    budget.status === 'exceeded'
                      ? 'text-red-600'
                      : budget.status === 'warning'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {percentUsed.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${statusColor} transition-all`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>

              {/* Amount Details */}
              <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                <span>£{budget.spent_this_month.toFixed(2)} of £{budget.budget_limit.toFixed(2)}</span>
                <span>
                  {budget.remaining > 0
                    ? `£${budget.remaining.toFixed(2)} remaining`
                    : `£${Math.abs(budget.remaining).toFixed(2)} over`}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
