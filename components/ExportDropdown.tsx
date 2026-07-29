"use client";

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet, Printer, FileDown } from 'lucide-react';

interface Props {
  onExport: (type: 'pdf' | 'csv' | 'excel' | 'print') => void;
  className?: string;
}

export default function ExportDropdown({ onExport, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: 'pdf' | 'csv' | 'excel' | 'print') => {
    onExport(type);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-stretch ${className}`} ref={dropdownRef}>
      <div className="flex items-stretch rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden w-full">
        {/* Main button: trigger PDF on mobile, toggle menu on desktop */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              handleSelect('pdf');
            } else {
              setIsOpen(!isOpen);
            }
          }}
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
        >
          <Download size={15} />
          <span>Export</span>
        </button>

        {/* Separator / Arrow button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="border-l border-zinc-200 dark:border-zinc-700 px-2 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          aria-label="Export options"
        >
          <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1.5 z-[110] text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-100">
          <button
            onClick={() => handleSelect('pdf')}
            type="button"
            className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <FileDown size={15} className="text-red-500" /> Export PDF
          </button>
          <button
            onClick={() => handleSelect('csv')}
            type="button"
            className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <FileText size={15} className="text-blue-500" /> Export CSV
          </button>
          <button
            onClick={() => handleSelect('excel')}
            type="button"
            className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-500" /> Export Excel
          </button>
          <button
            onClick={() => handleSelect('print')}
            type="button"
            className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <Printer size={15} className="text-zinc-500" /> Print
          </button>
        </div>
      )}
    </div>
  );
}
