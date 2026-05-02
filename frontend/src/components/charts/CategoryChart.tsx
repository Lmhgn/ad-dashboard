/**
 * Category Pie Chart
 */

'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useCategories } from '@/lib/hooks';
import { Card, CardSkeleton } from '@/components/common/Card';

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444'];

export function CategoryChart() {
  const { data: categories, isLoading } = useCategories(7);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (!categories || categories.length === 0) {
    return <Card>No category data available</Card>;
  }

  const chartData = categories.map((cat) => ({
    name: cat.name,
    value: Math.round(cat.total_spend * 100) / 100,
  }));

  return (
    <Card>
      <h3 className="mb-4 text-lg font-bold text-gray-900">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
