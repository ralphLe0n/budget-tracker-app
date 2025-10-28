import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, HelpCircle, TestTube, ChevronDown, ChevronUp } from 'lucide-react';
import { THEME } from '../config/theme';
import { validateRegex, testPattern, keywordsToRegex } from '../services/categorizationService';

const CategoryRulesManager = ({ rules, categories, onAddRule, onUpdateRule, onDeleteRule }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [expandedRules, setExpandedRules] = useState({});

  const [formData, setFormData] = useState({
    category: '',
    pattern: '',
    is_regex: false,
    case_sensitive: false,
    priority: 100,
    enabled: true
  });

  const [testInput, setTestInput] = useState('');
  const [patternError, setPatternError] = useState('');

  const resetForm = () => {
    setFormData({
      category: '',
      pattern: '',
      is_regex: false,
      case_sensitive: false,
      priority: 100,
      enabled: true
    });
    setPatternError('');
    setTestResults(null);
    setTestInput('');
  };

  const handleStartAdd = () => {
    resetForm();
    setShowAddForm(true);
    setEditingRuleId(null);
  };

  const handleStartEdit = (rule) => {
    setFormData({
      category: rule.category,
      pattern: rule.pattern,
      is_regex: rule.is_regex,
      case_sensitive: rule.case_sensitive,
      priority: rule.priority,
      enabled: rule.enabled
    });
    setEditingRuleId(rule.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRuleId(null);
    resetForm();
  };

  const validatePattern = (pattern, isRegex) => {
    if (!pattern.trim()) {
      return 'Pattern cannot be empty';
    }

    if (isRegex) {
      const validation = validateRegex(pattern);
      if (!validation.valid) {
        return `Invalid regex: ${validation.error}`;
      }
    }

    return null;
  };

  const handlePatternChange = (value) => {
    setFormData({ ...formData, pattern: value });
    const error = validatePattern(value, formData.is_regex);
    setPatternError(error || '');
    setTestResults(null);
  };

  const handleTestPattern = () => {
    if (patternError || !testInput.trim()) return;

    const samples = testInput.split('\n').filter(s => s.trim());
    const results = testPattern(
      formData.pattern,
      formData.is_regex,
      formData.case_sensitive,
      samples
    );
    setTestResults(results);
  };

  const handleSave = async () => {
    const error = validatePattern(formData.pattern, formData.is_regex);
    if (error) {
      setPatternError(error);
      return;
    }

    if (!formData.category) {
      setPatternError('Please select a category');
      return;
    }

    if (editingRuleId) {
      await onUpdateRule(editingRuleId, formData);
    } else {
      await onAddRule(formData);
    }

    handleCancel();
  };

  const toggleExpanded = (ruleId) => {
    setExpandedRules(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  const getRulesByCategory = () => {
    const grouped = {};
    rules.forEach(rule => {
      if (!grouped[rule.category]) {
        grouped[rule.category] = [];
      }
      grouped[rule.category].push(rule);
    });
    return grouped;
  };

  const groupedRules = getRulesByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Auto-Categorization Rules</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically assign categories based on transaction descriptions
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title="Show help"
        >
          <HelpCircle size={20} style={{ color: THEME.primary }} />
        </button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-900">How It Works</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Simple Mode (Keywords):</strong> Enter comma-separated keywords</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Example: <code className="bg-blue-100 px-1 rounded">apteka, pharmacy, drugstore</code></li>
              <li>Matches any of these words in the description</li>
            </ul>

            <p className="mt-3"><strong>Advanced Mode (Regex):</strong> Use regular expressions for complex patterns</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="bg-blue-100 px-1 rounded">\bshell\b</code> - Exact word "shell"</li>
              <li><code className="bg-blue-100 px-1 rounded">^spotify.*premium</code> - Starts with "spotify", contains "premium"</li>
              <li><code className="bg-blue-100 px-1 rounded">\d{4}</code> - Any 4 digits</li>
            </ul>

            <p className="mt-3"><strong>Priority:</strong> Lower numbers = higher priority. First match wins!</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="border-2 rounded-lg p-6 space-y-4" style={{ borderColor: THEME.primary, backgroundColor: THEME.primaryLight }}>
          <h4 className="font-semibold text-gray-800">
            {editingRuleId ? 'Edit Rule' : 'Add New Rule'}
          </h4>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_regex}
                onChange={(e) => {
                  setFormData({ ...formData, is_regex: e.target.checked });
                  setPatternError('');
                  setTestResults(null);
                }}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Advanced Mode (Regex)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.case_sensitive}
                onChange={(e) => setFormData({ ...formData, case_sensitive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Case Sensitive</span>
            </label>
          </div>

          {/* Pattern Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.is_regex ? 'Regex Pattern' : 'Keywords (comma-separated)'} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.pattern}
              onChange={(e) => handlePatternChange(e.target.value)}
              placeholder={formData.is_regex ? 'e.g., \bshell\b|gas.*station' : 'e.g., apteka, pharmacy, drugstore'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 font-mono text-sm"
              rows={3}
            />
            {patternError && (
              <p className="mt-1 text-sm text-red-600">{patternError}</p>
            )}
            {!formData.is_regex && formData.pattern && (
              <p className="mt-1 text-xs text-gray-500">
                Will be converted to regex: <code className="bg-gray-100 px-1 rounded">{keywordsToRegex(formData.pattern)}</code>
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (lower = higher priority)
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
              min="1"
              max="999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2"
            />
          </div>

          {/* Test Section */}
          <div className="border-t pt-4 space-y-3">
            <h5 className="font-medium text-gray-700 flex items-center gap-2">
              <TestTube size={18} />
              Test Your Pattern
            </h5>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test descriptions (one per line)&#10;e.g.:&#10;APTEKA CENTRUM&#10;Pharmacy Store&#10;Coffee Shop"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 text-sm"
              rows={3}
            />
            <button
              onClick={handleTestPattern}
              disabled={!formData.pattern || !testInput.trim() || !!patternError}
              className="px-4 py-2 border rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: THEME.primary, color: THEME.primary }}
            >
              Run Test
            </button>

            {testResults && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Test Results:</p>
                {testResults.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {result.matches ? (
                      <span className="text-green-600 font-semibold">✓</span>
                    ) : (
                      <span className="text-gray-400">✗</span>
                    )}
                    <span className={result.matches ? 'text-green-700' : 'text-gray-500'}>
                      {result.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!!patternError || !formData.category || !formData.pattern}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: THEME.primary }}
            >
              <Save size={18} />
              {editingRuleId ? 'Update Rule' : 'Add Rule'}
            </button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <button
          onClick={handleStartAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: THEME.primary }}
        >
          <Plus size={20} />
          Add Rule
        </button>
      )}

      {/* Rules List */}
      {Object.keys(groupedRules).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedRules).map(([category, categoryRules]) => (
            <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800">{category}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {categoryRules.length} rule{categoryRules.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {categoryRules
                  .sort((a, b) => a.priority - b.priority)
                  .map(rule => (
                    <div key={rule.id} className="p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}>
                              Priority: {rule.priority}
                            </span>
                            {rule.is_regex && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700">
                                REGEX
                              </span>
                            )}
                            {!rule.enabled && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600">
                                DISABLED
                              </span>
                            )}
                          </div>

                          <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all">
                            {rule.pattern}
                          </div>

                          <button
                            onClick={() => toggleExpanded(rule.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1"
                          >
                            {expandedRules[rule.id] ? (
                              <>
                                <ChevronUp size={14} /> Hide details
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} /> Show details
                              </>
                            )}
                          </button>

                          {expandedRules[rule.id] && (
                            <div className="mt-3 text-sm text-gray-600 space-y-1">
                              <p>Case sensitive: {rule.case_sensitive ? 'Yes' : 'No'}</p>
                              <p>Mode: {rule.is_regex ? 'Advanced (Regex)' : 'Simple (Keywords)'}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Created: {new Date(rule.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleStartEdit(rule)}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            title="Edit rule"
                          >
                            <Edit2 size={16} style={{ color: THEME.primary }} />
                          </button>
                          <button
                            onClick={() => onDeleteRule(rule.id)}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-red-50 transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 size={16} style={{ color: THEME.danger }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600">No rules created yet</p>
          <p className="text-sm text-gray-500 mt-2">Add your first rule to start auto-categorizing transactions</p>
        </div>
      )}
    </div>
  );
};

export default CategoryRulesManager;
