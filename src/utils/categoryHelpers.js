/**
 * Category helper utilities
 * Helper functions to work with category objects
 */

import { DEFAULT_CATEGORY_ICON, DEFAULT_CATEGORY_COLOR } from '../constants/categoryOptions';

/**
 * Get category names from category objects
 * @param {Array} categories - Array of category objects or strings
 * @returns {Array} Array of category name strings
 */
export const getCategoryNames = (categories) => {
  if (!categories || categories.length === 0) return [];

  // Handle both old format (strings) and new format (objects)
  return categories.map(cat => typeof cat === 'string' ? cat : cat.name);
};

/**
 * Find a category object by name
 * @param {Array} categories - Array of category objects
 * @param {string} name - Category name to find
 * @returns {Object|null} Category object or null if not found
 */
export const findCategoryByName = (categories, name) => {
  if (!categories || !name) return null;
  return categories.find(cat => cat.name === name) || null;
};

/**
 * Get icon for a category
 * @param {Array} categories - Array of category objects
 * @param {string} name - Category name
 * @returns {string} Icon name
 */
export const getCategoryIcon = (categories, name) => {
  const category = findCategoryByName(categories, name);
  return category?.icon || DEFAULT_CATEGORY_ICON;
};

/**
 * Get color for a category
 * @param {Array} categories - Array of category objects
 * @param {string} name - Category name
 * @returns {string} Color hex code
 */
export const getCategoryColor = (categories, name) => {
  const category = findCategoryByName(categories, name);
  return category?.color || DEFAULT_CATEGORY_COLOR;
};

/**
 * Create a new category object
 * @param {string} name - Category name
 * @param {string} icon - Icon name (default: 'Tag')
 * @param {string} color - Color hex code (default: '#3b82f6')
 * @returns {Object} Category object
 */
export const createCategory = (name, icon = DEFAULT_CATEGORY_ICON, color = DEFAULT_CATEGORY_COLOR) => {
  return { name, icon, color };
};
