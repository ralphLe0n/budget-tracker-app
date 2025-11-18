import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { useMobile, getChartHeight, getMobileChartConfig } from '../../hooks/useMobile';
import { formatCurrency } from '../../utils/formatters';
import { THEME } from '../../config/theme';

/**
 * Mobile-Optimized Pie Chart
 *
 * Addresses CRITICAL mobile UX issue: Charts Barely Readable on Mobile
 *
 * Features:
 * - Hides labels on mobile (shows legend instead)
 * - Smaller radius on mobile
 * - Better legend layout
 */
export const MobilePieChart = ({ data, colors = THEME.chartColors }) => {
  const { isMobile, isLandscape } = useMobile();
  const config = getMobileChartConfig(isMobile);
  const height = getChartHeight(isMobile, isLandscape);

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={config.showPieLabels}
            label={config.showPieLabels ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
            outerRadius={config.pieOuterRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>

      {/* Mobile: Show legend below chart instead of labels */}
      {isMobile && (
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-gray-700">{item.name}</span>
              </div>
              <span className="font-bold text-gray-800">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Desktop: Show grid legend */}
      {!isMobile && data.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-700">{item.name}: {formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Mobile-Optimized Line Chart
 *
 * Features:
 * - Smaller font sizes on mobile
 * - Adjusted dot sizes
 * - Better axis formatting
 */
export const MobileLineChart = ({ data, lines }) => {
  const { isMobile, isLandscape } = useMobile();
  const config = getMobileChartConfig(isMobile);
  const height = getChartHeight(isMobile, isLandscape);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: config.axisFontSize }}
          angle={isMobile ? -45 : -45}
          textAnchor="end"
          height={isMobile ? 70 : 60}
        />
        <YAxis tick={{ fontSize: config.axisFontSize }} />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          labelFormatter={(label) => `Miesiąc: ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={config.lineStrokeWidth}
            name={line.name}
            dot={{ r: config.lineDotRadius }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Mobile-Optimized Bar Chart
 *
 * Features:
 * - Adjusted sizing for mobile
 * - Better label formatting
 */
export const MobileBarChart = ({ data, bars }) => {
  const { isMobile, isLandscape } = useMobile();
  const config = getMobileChartConfig(isMobile);
  const height = getChartHeight(isMobile, isLandscape);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="category"
          tick={{ fontSize: config.axisFontSize }}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? "end" : "middle"}
          height={isMobile ? 70 : 30}
        />
        <YAxis tick={{ fontSize: config.axisFontSize }} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.fill}
            name={bar.name}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default {
  MobilePieChart,
  MobileLineChart,
  MobileBarChart,
};
