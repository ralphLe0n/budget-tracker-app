import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { THEME } from '../../config/theme';

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  valueColor,
  gradient = false
}) => {
  const cardClass = gradient
    ? "bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200"
    : "bg-white rounded-2xl shadow-lg p-6";

  const borderStyle = !gradient && color ? { borderLeft: `4px solid ${color}` } : {};

  return (
    <div className={cardClass} style={borderStyle}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${gradient ? 'text-gray-700' : 'text-gray-600'}`}>
          {title}
        </span>
        {Icon && <Icon style={{ color: color || THEME.primary }} size={24} />}
      </div>
      <p
        className="text-3xl font-bold"
        style={{ color: valueColor || (gradient ? THEME.success : '#1f2937') }}
      >
        {typeof value === 'number' ? formatCurrency(value) : value}
      </p>
      {subtitle && (
        <p className={`text-xs mt-1 ${gradient ? 'text-gray-600' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SummaryCard;
