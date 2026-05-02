/**
 * Category Grid - Display category performance cards
 */

'use client';

import { useCategories } from '@/lib/hooks';
import { Card, CardSkeleton } from '@/components/common/Card';

const CATEGORY_ICONS: Record<string, string> = {
  Groceries: '🛒',
  Transport: '🚗',
  Dining: '🍽️',
  Subscriptions: '💳',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Healthcare: '⚕️',
  Utilities: '⚡',
  'Personal Care': '💇',
  Gifts: '🎁',
  Travel: '✈️',
  Work: '💼',
  Education: '📚',
  Other: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: 'bg-green-50 border-green-200',
  Transport: 'bg-blue-50 border-blue-200',
  Dining: 'bg-orange-50 border-orange-200',
  Subscriptions: 'bg-purple-50 border-purple-200',
  Entertainment: 'bg-pink-50 border-pink-200',
  Shopping: 'bg-cyan-50 border-cyan-200',
  Healthcare: 'bg-red-50 border-red-200',
  Utilities: 'bg-yellow-50 border-yellow-200',
  'Personal Care': 'bg-rose-50 border-rose-200',
  Gifts: 'bg-violet-50 border-violet-200',
  Travel: 'bg-indigo-50 border-indigo-200',
  Work: 'bg-slate-50 border-slate-200',
  Education: 'bg-sky-50 border-sky-200',
  Other: 'bg-gray-50 border-gray-200',
};

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories(9);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return <Card>No category data available.</Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => {
        const icon = CATEGORY_ICONS[category.name] || '📦';
        const colors = CATEGORY_COLORS[category.name] || CATEGORY_COLORS['Other'];
        const score = Math.min(100, Math.round(((100 - (category.total_spend / 600) * 100) + 50) / 1.5));

        return (
          <Card key={category.category_id} className={`border ${colors}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">£{category.total_spend.toFixed(2)}</span>
                    <span className="text-xs text-gray-600">/month</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{category.transaction_count} transactions</span>
                    <span className="font-medium text-gray-900">Avg: £{category.avg_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Score Indicator */}
              <div className="flex flex-col items-center justify-center rounded-lg bg-white px-3 py-2">
                <span className="text-lg font-bold text-indigo-600">{score}</span>
                <span className="text-xs text-gray-600">Score</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
