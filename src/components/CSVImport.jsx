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
  const [separator, setSeparator] = useState(';');
  const [headerRowNumber, setHeaderRowNumber] = useState(1);
  const [rawFileData, setRawFileData] = useState(null);
  const [duplicateOption, setDuplicateOption] = useState('skip'); // 'skip', 'import', 'review'
  const [duplicates, setDuplicates] = useState([]);
  const [newTransactions, setNewTransactions] = useState([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());
  const [lastImportDate, setLastImportDate] = useState(() => {
    const saved = localStorage.getItem('lastImportDate');
    return saved || null;
  });

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

      // Save import timestamp
      const now = new Date().toISOString();
      localStorage.setItem('lastImportDate', now);
      setLastImportDate(now);

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

  const formatLastImportDate = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: THEME.primary }}>
                Import transakcji z pliku CSV
              </h2>
              {lastImportDate && (
                <p className="text-sm text-gray-500 mt-1">
                  Ostatni import: {formatLastImportDate(lastImportDate)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
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
                  Prześlij plik CSV z danymi transakcji z banku
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
                  Wybierz plik CSV
                </label>
                {file && (
                  <p className="mt-4 text-sm text-gray-600">
                    Wybrany plik: {file.name}
                  </p>
                )}
              </div>

              {/* CSV Settings */}
              {file && (
                <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-2">Ustawienia CSV</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Separator Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Separator kolumn
                      </label>
                      <select
                        value={separator}
                        onChange={(e) => setSeparator(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                      >
                        <option value=";">Średnik (;)</option>
                        <option value=",">Przecinek (,)</option>
                        <option value="\t">Tabulator</option>
                        <option value="|">Kreska (|)</option>
                      </select>
                    </div>

                    {/* Header Row Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numer wiersza z nagłówkami
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
                        Który wiersz zawiera nazwy kolumn?
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
                    Zastosuj ustawienia i ponownie przetworz
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
                      Pomyślnie przetworzono {csvData.length} wierszy z {headers.length} kolumnami
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Wstecz
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-colors"
                      style={{ backgroundColor: THEME.primary }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                    >
                      Dalej do mapowania kolumn
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Mapowanie kolumn</h3>
                <p className="text-gray-600 mb-6">
                  Dopasuj kolumny z pliku CSV do pól transakcji
                </p>
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konto <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  style={{ focusRing: THEME.primary }}
                >
                  <option value="">Wybierz konto...</option>
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
                    Kolumna z datą <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => handleMappingChange('date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Wybierz kolumnę...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Description Mapping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kolumna z opisem <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.description}
                    onChange={(e) => handleMappingChange('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Wybierz kolumnę...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Mapping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kolumna z kwotą <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.amount}
                    onChange={(e) => handleMappingChange('amount', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Wybierz kolumnę...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Category Mapping (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kolumna z kategorią (opcjonalnie)
                  </label>
                  <select
                    value={columnMapping.category}
                    onChange={(e) => handleMappingChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
                  >
                    <option value="">Wybierz kolumnę lub pozostaw puste...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Jeśli nie zmapowane, kategorie zostaną przypisane na podstawie kwoty (Przychód/Inne)
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
                  Wstecz
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: THEME.primary }}
                >
                  Dalej: Podgląd
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Import */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Podgląd importu</h3>
                <p className="text-gray-600">
                  Znaleziono {newTransactions.length} nowych transakcji i {duplicates.length} duplikatów
                </p>
              </div>

              {/* Duplicate Detection Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">{newTransactions.length} Nowych</p>
                      <p className="text-sm text-green-700">Unikalne transakcje</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">{duplicates.length} Duplikatów</p>
                      <p className="text-sm text-orange-700">Już istnieją w systemie</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Options */}
              {duplicates.length > 0 && (
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Jak obsłużyć duplikaty?</h4>
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
                        <p className="font-medium text-gray-900">Pomiń duplikaty (Zalecane)</p>
                        <p className="text-sm text-gray-600">Importuj tylko {newTransactions.length} nowych transakcji</p>
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
                        <p className="font-medium text-gray-900">Importuj wszystkie</p>
                        <p className="text-sm text-gray-600">Importuj wszystkie {newTransactions.length + duplicates.length} transakcji (łącznie z duplikatami)</p>
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
                        <p className="font-medium text-gray-900">Pozwól mi przejrzeć duplikaty</p>
                        <p className="text-sm text-gray-600">Wybierz które duplikaty zaimportować</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Review Duplicates Table */}
              {duplicateOption === 'review' && duplicates.length > 0 && (
                <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                  <h4 className="font-semibold text-gray-800 mb-3">Wybierz duplikaty do importu:</h4>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opis</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kwota</th>
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
                  <h4 className="font-semibold text-gray-800 mb-3">Podgląd nowych transakcji (pierwsze 5):</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opis</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kwota</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategoria</th>
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
                    <p className="font-medium text-blue-900">Gotowe do importu</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {duplicateOption === 'skip' && `${newTransactions.length} nowych transakcji zostanie zaimportowanych`}
                      {duplicateOption === 'import' && `${newTransactions.length + duplicates.length} transakcji zostanie zaimportowanych (w tym ${duplicates.length} duplikatów)`}
                      {duplicateOption === 'review' && `${newTransactions.length + selectedDuplicates.size} transakcji zostanie zaimportowanych (${newTransactions.length} nowych + ${selectedDuplicates.size} wybranych duplikatów)`}
                      {' '}do <strong>{accounts.find(a => a.id === selectedAccount)?.name}</strong>
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
                  Wstecz
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {importing ? 'Importowanie...' : duplicateOption === 'skip'
                    ? `Importuj ${newTransactions.length} ${newTransactions.length === 1 ? 'nową transakcję' : 'nowych transakcji'}`
                    : duplicateOption === 'import'
                    ? `Importuj wszystkie ${newTransactions.length + duplicates.length} ${newTransactions.length + duplicates.length === 1 ? 'transakcję' : 'transakcji'}`
                    : `Importuj ${newTransactions.length + selectedDuplicates.size} ${newTransactions.length + selectedDuplicates.size === 1 ? 'transakcję' : 'transakcji'}`
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
