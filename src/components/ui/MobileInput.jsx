import React from 'react';

/**
 * Mobile-optimized input components
 *
 * Addresses HIGH PRIORITY mobile UX issue: Keyboard and Input Handling
 *
 * Features:
 * - Proper input types for mobile keyboards
 * - Prevents iOS zoom (16px minimum font-size)
 * - Currency formatting for amount inputs
 * - Better visual hierarchy
 */

/**
 * Currency/Amount Input
 * Uses inputMode="decimal" for better mobile keyboard
 */
export const AmountInput = ({
  value,
  onChange,
  placeholder = '0.00',
  className = '',
  label,
  required = false,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">
          zł
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full pl-12 pr-4 py-3 sm:py-2
            text-lg sm:text-base font-medium
            border-2 border-gray-300 rounded-xl
            focus:border-blue-500 focus:ring-2 focus:ring-blue-200
            transition-all
            ${className}
          `}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
          {...props}
        />
      </div>
    </div>
  );
};

/**
 * Date Input
 * Optimized for mobile date pickers
 */
export const DateInput = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="date"
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-3 sm:py-2
          text-base
          border-2 border-gray-300 rounded-xl
          focus:border-blue-500 focus:ring-2 focus:ring-blue-200
          transition-all
          ${className}
        `}
        style={{ fontSize: '16px' }} // Prevent iOS zoom
        {...props}
      />
    </div>
  );
};

/**
 * Text Input
 * Standard text input with mobile optimizations
 */
export const TextInput = ({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 sm:py-2
          text-base
          border-2 border-gray-300 rounded-xl
          focus:border-blue-500 focus:ring-2 focus:ring-blue-200
          transition-all
          ${className}
        `}
        style={{ fontSize: '16px' }} // Prevent iOS zoom
        {...props}
      />
    </div>
  );
};

/**
 * Select Input
 * Mobile-optimized select with larger touch targets
 */
export const SelectInput = ({
  value,
  onChange,
  options,
  label,
  required = false,
  className = '',
  placeholder = 'Select an option',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-3 sm:py-2
          text-base
          border-2 border-gray-300 rounded-xl
          focus:border-blue-500 focus:ring-2 focus:ring-blue-200
          transition-all
          bg-white
          ${className}
        `}
        style={{ fontSize: '16px' }} // Prevent iOS zoom
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Textarea Input
 * Mobile-optimized textarea
 */
export const TextAreaInput = ({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  rows = 3,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full px-4 py-3 sm:py-2
          text-base
          border-2 border-gray-300 rounded-xl
          focus:border-blue-500 focus:ring-2 focus:ring-blue-200
          transition-all
          resize-none
          ${className}
        `}
        style={{ fontSize: '16px' }} // Prevent iOS zoom
        {...props}
      />
    </div>
  );
};

export default {
  AmountInput,
  DateInput,
  TextInput,
  SelectInput,
  TextAreaInput,
};
