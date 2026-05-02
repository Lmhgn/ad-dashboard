/**
 * Dashboard Home Page
 */

'use client';

import { KPICards } from '@/components/dashboard/KPICards';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { TrendsChart } from '@/components/charts/TrendsChart';
import { InsightsWidget } from '@/components/widgets/InsightsWidget';
import { BudgetWidget } from '@/components/widgets/BudgetWidget';
import { CategoryGrid } from '@/components/widgets/CategoryGrid';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Spend Analytics</h1>
              <p className="mt-1 text-gray-600">Track and analyze your spending patterns</p>
            </div>
            <button className="rounded-lg bg-indigo-600 px-6 py-2 text-white font-medium hover:bg-indigo-700 transition-colors">
              + Add Budget
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <section className="mb-8">
          <KPICards />
        </section>

        {/* Charts */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CategoryChart />
          <TrendsChart />
        </section>

        {/* Category Grid */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Category Performance</h2>
          <CategoryGrid />
        </section>

        {/* Budget Status */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Budget Status</h2>
          <BudgetWidget />
        </section>

        {/* Insights */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Insights</h2>
          <InsightsWidget />
        </section>
      </div>
    </main>
  );
}
