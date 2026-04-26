import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const AccordionSection = ({ title, section, isOpen, onToggle, children }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 overflow-hidden">
      <button
        onClick={() => onToggle(section)}
        className="w-full p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
      >
        <span className="font-bold text-lg text-gray-800 dark:text-white">{title}</span>
        {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

export default AccordionSection;