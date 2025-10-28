/**
 * Auto-categorization service
 * Matches transaction descriptions against user-defined rules
 */

/**
 * Convert simple keywords to regex pattern
 * @param {string} keywords - Comma-separated keywords
 * @returns {string} - Regex pattern
 */
export const keywordsToRegex = (keywords) => {
  // Split by comma, trim whitespace, escape special regex chars
  const parts = keywords
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape special chars

  return parts.join('|');
};

/**
 * Test if a regex pattern is valid
 * @param {string} pattern - Regex pattern to test
 * @returns {object} - { valid: boolean, error: string|null }
 */
export const validateRegex = (pattern) => {
  try {
    new RegExp(pattern);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: e.message };
  }
};

/**
 * Match a description against a single rule
 * @param {string} description - Transaction description
 * @param {object} rule - Rule object with pattern, is_regex, case_sensitive
 * @returns {boolean} - True if matches
 */
export const matchRule = (description, rule) => {
  try {
    let pattern = rule.pattern;

    // Convert keywords to regex if not in regex mode
    if (!rule.is_regex) {
      pattern = keywordsToRegex(pattern);
    }

    // Build regex with appropriate flags
    const flags = rule.case_sensitive ? '' : 'i';
    const regex = new RegExp(pattern, flags);

    return regex.test(description);
  } catch (e) {
    console.error('Error matching rule:', e);
    return false;
  }
};

/**
 * Find the best matching category for a description
 * @param {string} description - Transaction description
 * @param {array} rules - Array of rule objects sorted by priority
 * @returns {string|null} - Matched category or null
 */
export const categorizeDescription = (description, rules) => {
  if (!description || !rules || rules.length === 0) {
    return null;
  }

  // Sort by priority (lower number = higher priority)
  const sortedRules = [...rules]
    .filter(rule => rule.enabled)
    .sort((a, b) => a.priority - b.priority);

  // Find first matching rule
  for (const rule of sortedRules) {
    if (matchRule(description, rule)) {
      return rule.category;
    }
  }

  return null; // No match found
};

/**
 * Categorize multiple descriptions in batch
 * @param {array} descriptions - Array of description strings
 * @param {array} rules - Array of rule objects
 * @returns {array} - Array of matched categories (or null)
 */
export const batchCategorize = (descriptions, rules) => {
  return descriptions.map(desc => categorizeDescription(desc, rules));
};

/**
 * Get auto-categorization suggestions for a description
 * Shows all matching rules, not just the first one
 * @param {string} description - Transaction description
 * @param {array} rules - Array of rule objects
 * @returns {array} - Array of { category, rule } objects
 */
export const getSuggestions = (description, rules) => {
  if (!description || !rules || rules.length === 0) {
    return [];
  }

  const matches = [];

  for (const rule of rules) {
    if (rule.enabled && matchRule(description, rule)) {
      matches.push({
        category: rule.category,
        rule: rule
      });
    }
  }

  // Sort by priority
  return matches.sort((a, b) => a.rule.priority - b.rule.priority);
};

/**
 * Test a pattern against sample descriptions
 * Useful for UI testing before saving
 * @param {string} pattern - Pattern to test
 * @param {boolean} isRegex - Whether pattern is regex or keywords
 * @param {boolean} caseSensitive - Case sensitivity
 * @param {array} samples - Sample descriptions to test against
 * @returns {array} - Array of { description, matches } objects
 */
export const testPattern = (pattern, isRegex, caseSensitive, samples) => {
  const mockRule = {
    pattern,
    is_regex: isRegex,
    case_sensitive: caseSensitive,
    enabled: true
  };

  return samples.map(sample => ({
    description: sample,
    matches: matchRule(sample, mockRule)
  }));
};
