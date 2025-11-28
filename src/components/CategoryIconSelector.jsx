import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { THEME } from '../config/theme';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryHelpers';
import CategoryChangeModal from './modals/CategoryChangeModal';

const CategoryIconSelector = ({
  transaction,
  categories,
  onCategoryChange,
  onAddCategory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categoryIcon = getCategoryIcon(categories, transaction.category);
  const categoryColor = getCategoryColor(categories, transaction.category);
  const CategoryIcon = Icons[categoryIcon] || Icons.Tag;
  const isIncome = transaction.amount > 0;

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-md"
        style={{ backgroundColor: categoryColor + '20' }}
        title={`Category: ${transaction.category} - Click to change`}
      >
        {/* Category Icon */}
        <CategoryIcon style={{ color: categoryColor }} size={16} />

        {/* Type Indicator Dot */}
        <div
          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
          style={{ backgroundColor: isIncome ? THEME.success : THEME.danger }}
          title={isIncome ? 'Income' : 'Expense'}
        />
      </button>

      {/* Category Change Modal */}
      <CategoryChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={transaction}
        categories={categories}
        onCategoryChange={onCategoryChange}
        onAddCategory={onAddCategory}
      />
    </>
  );
};

export default CategoryIconSelector;
