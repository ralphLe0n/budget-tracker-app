import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { THEME } from '../config/theme';
import { categorizeDescription } from '../services/categorizationService';

const CSVImport = ({ accounts, categories, categoryRules, onImport, onClose, existingTransactions = [] }) => {
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
  const [duplicateOption, setDuplicateOption] = useState('skip'); // 'skip', 'import', 'review'
  const [duplicates, setDuplicates] = useState([]);
  const [newTransactions, setNewTransactions] = useState([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());

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
      // Parse all transactions
      const transactions = csvData.map(row => {
        const amount = parseAmount(row[columnMapping.amount]);
        const description = row[columnMapping.description] || 'Imported transaction';

        let category;
        if (columnMapping.category && row[columnMapping.category]) {
          category = row[columnMapping.category];
        } else {
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

      // Detect duplicates
      const { duplicates: dups, newTransactions: newTxns } = detectDuplicates(transactions);
      setDuplicates(dups);
      setNewTransactions(newTxns);

      // If in review mode, select all duplicates for import by default
      if (duplicateOption === 'review') {
        setSelectedDuplicates(new Set());
      }

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

    // Clean the string
    const cleaned = dateStr.toString().trim();

    // Try DD/MM/YYYY or DD-MM-YYYY format first (most common for European/international banks)
    const parts = cleaned.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [first, second, third] = parts.map(p => parseInt(p));

      // Determine format based on values
      // If first value is > 12 or (first <= 31 AND second <= 12), it's likely DD/MM/YYYY
      if (first > 12 || (first <= 31 && second <= 12)) {
        // DD/MM/YYYY format
        const day = first;
        const month = second;
        const year = third > 100 ? third : (third > 50 ? 1900 + third : 2000 + third);

        // Validate
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      // Try MM/DD/YYYY format as fallback
      if (second <= 31 && first <= 12) {
        const month = first;
        const day = second;
        const year = third > 100 ? third : (third > 50 ? 1900 + third : 2000 + third);

        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    // Try ISO format or other standard formats
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  };

  const detectDuplicates = (incomingTransactions) => {
    const duplicateList = [];
    const newList = [];

    incomingTransactions.forEach(incoming => {
      // Check if this transaction matches any existing transaction
      const isDuplicate = existingTransactions.some(existing => {
        // Compare date, description, and amount
        const sameDate = existing.date === incoming.date;
        const sameDescription = existing.description.toLowerCase().trim() === incoming.description.toLowerCase().trim();
        const sameAmount = Math.abs(existing.amount - incoming.amount) < 0.01; // Allow small floating point differences

        return sameDate && sameDescription && sameAmount;
      });

      if (isDuplicate) {
        duplicateList.push(incoming);
      } else {
        newList.push(incoming);
      }
    });

    return { duplicates: duplicateList, newTransactions: newList };
  };

  const handleImport = async () => {
    if (!validateMapping()) return;

    setImporting(true);
    setError('');

    try {
      // Determine which transactions to import based on duplicate option
      let transactionsToImport = [];

      if (duplicateOption === 'skip') {
        // Import only new transactions
        transactionsToImport = newTransactions;
      } else if (duplicateOption === 'import') {
        // Import everything (new + duplicates)
        transactionsToImport = [...newTransactions, ...duplicates];
      } else if (duplicateOption === 'review') {
        // Import new transactions + selected duplicates
        const selectedDupsArray = duplicates.filter((_, index) => selectedDuplicates.has(index));
        transactionsToImport = [...newTransactions, ...selectedDupsArray];
      }

      await onImport(transactionsToImport);

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
                  Found {newTransactions.length} new transaction(s) and {duplicates.length} duplicate(s)
                </p>
              </div>

              {/* Duplicate Detection Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">{newTransactions.length} New</p>
                      <p className="text-sm text-green-700">Unique transactions</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">{duplicates.length} Duplicates</p>
                      <p className="text-sm text-orange-700">Already exist in system</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Options */}
              {duplicates.length > 0 && (
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">How to handle duplicates?</h4>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateOption"
                        value="skip"
                        checked={duplicateOption === 'skip'}
                        onChange={(e) => setDuplicateOption(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Skip duplicates (Recommended)</p>
                        <p className="text-sm text-gray-600">Import only {newTransactions.length} new transactions</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateOption"
                        value="import"
                        checked={duplicateOption === 'import'}
                        onChange={(e) => setDuplicateOption(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Import all anyway</p>
                        <p className="text-sm text-gray-600">Import all {newTransactions.length + duplicates.length} transactions (including duplicates)</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="duplicateOption"
                        value="review"
                        checked={duplicateOption === 'review'}
                        onChange={(e) => setDuplicateOption(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Let me review duplicates</p>
                        <p className="text-sm text-gray-600">Choose which duplicates to import</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Review Duplicates Table */}
              {duplicateOption === 'review' && duplicates.length > 0 && (
                <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                  <h4 className="font-semibold text-gray-800 mb-3">Select duplicates to import:</h4>
                  <div className="overflow-x-auto bg-white rounded border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDuplicates(new Set(duplicates.map((_, i) => i)));
                                } else {
                                  setSelectedDuplicates(new Set());
                                }
                              }}
                              checked={selectedDuplicates.size === duplicates.length}
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {duplicates.map((dup, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedDuplicates.has(idx)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedDuplicates);
                                  if (e.target.checked) {
                                    newSet.add(idx);
                                  } else {
                                    newSet.delete(idx);
                                  }
                                  setSelectedDuplicates(newSet);
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{dup.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{dup.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{dup.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Preview New Transactions */}
              {newTransactions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Preview of new transactions (first 5):</h4>
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
                        {newTransactions.slice(0, 5).map((txn, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-gray-900">{txn.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{txn.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{txn.amount}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{txn.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Ready to import</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {duplicateOption === 'skip' && `${newTransactions.length} new transaction(s) will be imported`}
                      {duplicateOption === 'import' && `${newTransactions.length + duplicates.length} transaction(s) will be imported (including ${duplicates.length} duplicate(s))`}
                      {duplicateOption === 'review' && `${newTransactions.length + selectedDuplicates.size} transaction(s) will be imported (${newTransactions.length} new + ${selectedDuplicates.size} selected duplicate(s))`}
                      {' '}to <strong>{accounts.find(a => a.id === selectedAccount)?.name}</strong>
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
                  {importing ? 'Importing...' : duplicateOption === 'skip'
                    ? `Import ${newTransactions.length} New Transaction${newTransactions.length !== 1 ? 's' : ''}`
                    : duplicateOption === 'import'
                    ? `Import All ${newTransactions.length + duplicates.length} Transaction${newTransactions.length + duplicates.length !== 1 ? 's' : ''}`
                    : `Import ${newTransactions.length + selectedDuplicates.size} Transaction${newTransactions.length + selectedDuplicates.size !== 1 ? 's' : ''}`
                  }
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
