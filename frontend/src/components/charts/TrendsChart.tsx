/**
 * Trends Line Chart - Monthly trends and rolling averages
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTrends } from '@/lib/hooks';
import { Card, CardSkeleton } from '@/components/common/Card';

export function TrendsChart() {
  const { data: trends, isLoading } = useTrends();

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (!trends) {
    return <Card>No trend data available</Card>;
  }

  const chartData = [
    {
      name: '30-Day Avg',
      amount: Math.round(trends.rolling_30_day_avg * 100) / 100,
    },
    {
      name: '60-Day Avg',
      amount: Math.round(trends.rolling_60_day_avg * 100) / 100,
    },
    {
      name: '90-Day Avg',
      amount: Math.round(trends.rolling_90_day_avg * 100) / 100,
    },
    {
      name: 'This Month',
      amount: trends.current_month_spend,
    },
  ];

  return (
    <Card>
      <div>
        <h3 className="mb-4 text-lg font-bold text-gray-900">Trends</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-600">MoM Change</p>
            <p className={`text-2xl font-bold ${trends.mom_change_percent > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {trends.mom_change_percent > 0 ? '+' : ''}{trends.mom_change_percent.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-gray-600">Amount Change</p>
            <p className={`text-2xl font-bold ${trends.mom_change_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              £{Math.abs(trends.mom_change_amount).toFixed(2)}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
            <Bar dataKey="amount" fill="#4F46E5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
