import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';

const ChartsTab = ({
  hasActiveFilters,
  categorySpendingData,
  monthlyData,
  budgets,
  spendingByCategory,
  selectedCategories
}) => {
  const COLORS = THEME.chartColors;

  return (
    <>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Spending by Category {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
          </h3>
          {categorySpendingData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySpendingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categorySpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {categorySpendingData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-700">{item.name}: {formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <p>No expense data to display</p>
            </div>
          )}
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Monthly Trends {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke={THEME.success}
                  strokeWidth={2}
                  name="Income"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke={THEME.danger}
                  strokeWidth={2}
                  name="Expenses"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={THEME.primary}
                  strokeWidth={2}
                  name="Balance"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <p>No data to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget vs Actual Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Budget vs Actual Spending {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
        </h3>
        {categorySpendingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={budgets
                .filter(budget => selectedCategories.length === 0 || selectedCategories.includes(budget.category))
                .map(budget => {
                  const actualSpent = spendingByCategory[budget.category] || 0;
                  const remaining = budget.limit - actualSpent;
                  return {
                    category: budget.category,
                    spent: actualSpent,
                    remaining: remaining > 0 ? remaining : 0,
                    overspent: remaining < 0 ? Math.abs(remaining) : 0
                  };
                })}
              layout="vertical"
              barSize={30}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={100} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="spent" stackId="a" fill={THEME.primary} name="Spent" />
              <Bar dataKey="remaining" stackId="a" fill={THEME.success} name="Remaining" radius={[0, 8, 8, 0]} />
              <Bar dataKey="overspent" stackId="a" fill={THEME.danger} name="Over Budget" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            <p>No budget data to display</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ChartsTab;
