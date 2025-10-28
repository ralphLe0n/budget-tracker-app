import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { THEME } from '../config/theme';
import { categorizeDescription } from '../services/categorizationService';

const CSVImport = ({ accounts, categories, categoryRules, onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    description: '',
    amount: '',
    category: ''
  });
  const [selectedAccount, setSelectedAccount] = useState('');
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Review
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [separator, setSeparator] = useState(',');
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [rawFileData, setRawFileData] = useState(null);

  const parseCSVFile = (fileData, delimiter, skipRows) => {
    Papa.parse(fileData, {
      complete: (results) => {
        if (results.data && results.data.length > skipRows) {
          // Skip the specified number of rows
          const dataRows = results.data.slice(skipRows - 1);

          if (dataRows.length === 0) {
            setError('No data found after skipping rows');
            return;
          }

          // First row after skip is the header
          const headerRow = dataRows[0];
          const detectedHeaders = headerRow;

          // Rest are data rows
          const dataOnlyRows = dataRows.slice(1);

          // Convert array rows to objects using headers
          const parsedData = dataOnlyRows
            .filter(row => row.length > 0 && row.some(cell => cell && cell.trim()))
            .map(row => {
              const obj = {};
              detectedHeaders.forEach((header, index) => {
                obj[header] = row[index] || '';
              });
              return obj;
            });

          setHeaders(detectedHeaders);
          setCsvData(parsedData);

          // Try to auto-detect column mappings
          const autoMapping = autoDetectColumns(detectedHeaders);
          setColumnMapping(autoMapping);

          setError('');

          // Show success message
          if (parsedData.length > 0) {
            setError('');
          }
        } else {
          setError('CSV file is empty or invalid');
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      },
      delimiter: delimiter,
      skipEmptyLines: true
    });
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setRawFileData(selectedFile);
    setError('');

    // Parse CSV with current settings
    parseCSVFile(selectedFile, separator, headerRowNumber);
  };

  const handleReparse = () => {
    if (rawFileData) {
      parseCSVFile(rawFileData, separator, headerRowNumber);
    }
  };

  const autoDetectColumns = (headers) => {
    const mapping = {
      date: '',
      description: '',
      amount: '',
      category: ''
    };

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();

      // Date detection
      if (!mapping.date && (lowerHeader.includes('date') || lowerHeader.includes('datum'))) {
        mapping.date = header;
      }

      // Description detection
      if (!mapping.description && (
        lowerHeader.includes('description') ||
        lowerHeader.includes('beschreibung') ||
        lowerHeader.includes('details') ||
        lowerHeader.includes('reference') ||
        lowerHeader.includes('memo') ||
        lowerHeader.includes('narration')
      )) {
        mapping.description = header;
      }

      // Amount detection
      if (!mapping.amount && (
        lowerHeader.includes('amount') ||
        lowerHeader.includes('betrag') ||
        lowerHeader.includes('value') ||
        lowerHeader.includes('balance') ||
        lowerHeader.includes('debit') ||
        lowerHeader.includes('credit')
      )) {
        mapping.amount = header;
      }

      // Category detection
      if (!mapping.category && (
        lowerHeader.includes('category') ||
        lowerHeader.includes('kategorie') ||
        lowerHeader.includes('type')
      )) {
        mapping.category = header;
      }
    });

    return mapping;
  };

  const handleMappingChange = (field, value) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateMapping = () => {
    if (!selectedAccount) {
      setError('Please select an account');
      return false;
    }

    if (!columnMapping.date || !columnMapping.description || !columnMapping.amount) {
      setError('Please map required fields: Date, Description, and Amount');
      return false;
    }

    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateMapping()) {
      setStep(3);
    }
  };

  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;

    // Remove currency symbols and spaces
    let cleaned = amountStr.toString()
      .replace(/[€$£¥₹]/g, '')
      .replace(/\s/g, '')
      .trim();

    // Handle different decimal separators
    // If there are multiple dots or commas, the last one is the decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      // German/European format: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Try to parse various date formats
    const date = new Date(dateStr);

    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    // Try DD/MM/YYYY or DD-MM-YYYY format
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      // Assume DD/MM/YYYY if first part is <= 31
      if (parseInt(parts[0]) <= 31) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return new Date().toISOString().split('T')[0];
  };

  const handleImport = async () => {
    if (!validateMapping()) return;

    setImporting(true);
    setError('');

    try {
      const transactions = csvData.map(row => {
        const amount = parseAmount(row[columnMapping.amount]);
        const description = row[columnMapping.description] || 'Imported transaction';

        // Determine category with priority:
        // 1. Category from CSV column (if mapped and exists)
        // 2. Auto-categorization from rules
        // 3. Default based on amount (Income/Other)
        let category;
        if (columnMapping.category && row[columnMapping.category]) {
          category = row[columnMapping.category];
        } else {
          // Try auto-categorization
          const autoCategory = categorizeDescription(description, categoryRules || []);
          category = autoCategory || (amount > 0 ? 'Income' : 'Other');
        }

        return {
          date: parseDate(row[columnMapping.date]),
          description: description,
          amount: amount,
          category: category,
          account_id: selectedAccount
        };
      });

      await onImport(transactions);

      // Reset form
      setFile(null);
      setCsvData([]);
      setHeaders([]);
      setColumnMapping({ date: '', description: '', amount: '', category: '' });
      setSelectedAccount('');
      setStep(1);

    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const getPreviewData = () => {
    return csvData.slice(0, 5).map(row => ({
      date: row[columnMapping.date],
      description: row[columnMapping.description],
      amount: row[columnMapping.amount],
      category: columnMapping.category ? row[columnMapping.category] : 'Not mapped'
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold" style={{ color: THEME.primary }}>
            Import Transactions from CSV
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Upload size={48} style={{ color: THEME.primary }} />
                </div>
                <p className="text-gray-600 mb-4">
                  Upload a CSV file from your bank account
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: THEME.primary }}
                >
                  Choose CSV File
                </label>
                {file && (
                  <p className="mt-4 text-sm text-gray-600">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              {/* CSV Settings */}
              {file && (
                <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-2">CSV Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Separator Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Column Separator
                      </label>
                      <select
                        value={separator}
                        onChange={(e) => setSeparator(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                      >
                        <option value=",">Comma (,)</option>
                        <option value=";">Semicolon (;)</option>
                        <option value="\t">Tab</option>
                        <option value="|">Pipe (|)</option>
                      </select>
                    </div>

                    {/* Header Row Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header Row Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={headerRowNumber}
                        onChange={(e) => setHeaderRowNumber(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Which row contains the column headers?
                      </p>
                    </div>
                  </div>

                  {/* Re-parse Button */}
                  <button
                    onClick={handleReparse}
                    className="w-full px-4 py-2 border-2 rounded-lg font-medium transition-colors"
                    style={{ borderColor: THEME.primary, color: THEME.primary }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = THEME.primary;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = THEME.primary;
                    }}
                  >
                    Apply Settings & Re-parse
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Success Message and Continue Button */}
              {csvData.length > 0 && !error && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle size={20} className="text-green-500" />
                    <span className="text-green-700">
                      Successfully parsed {csvData.length} rows with {headers.length} columns
                    </span>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full px-6 py-3 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                  >
                    Continue to Column Mapping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Map Your Columns</h3>
                <p className="text-gray-600 mb-6">
                  Match the columns from your CSV file to the transaction fields
                </p>
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  style={{ focusRing: THEME.primary }}
                >
                  <option value="">Select account...</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Column Mappings */}
              <div className="space-y-4">
                {/* Date Mapping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => handleMappingChange('date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Select column...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Description Mapping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.description}
                    onChange={(e) => handleMappingChange('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Select column...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Mapping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.amount}
                    onChange={(e) => handleMappingChange('amount', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Select column...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Category Mapping (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Column (Optional)
                  </label>
                  <select
                    value={columnMapping.category}
                    onChange={(e) => handleMappingChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Select column or leave empty...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    If not mapped, categories will be assigned based on amount (Income/Other)
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: THEME.primary }}
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Import */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Import</h3>
                <p className="text-gray-600">
                  Preview of the first 5 transactions (Total: {csvData.length} transactions)
                </p>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPreviewData().map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.amount}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Ready to import</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {csvData.length} transactions will be imported to{' '}
                      <strong>{accounts.find(a => a.id === selectedAccount)?.name}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={importing}
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {importing ? 'Importing...' : `Import ${csvData.length} Transactions`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImport;
