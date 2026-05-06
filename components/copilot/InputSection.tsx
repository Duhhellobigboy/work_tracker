import React from 'react';

interface InputSectionProps {
  value: string;
  onChange: (value: string) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ value, onChange }) => {
  const charCount = value.length;

  return (
    <div className="relative">
      <label htmlFor="contract-input" className="block text-sm font-medium text-slate-700 mb-2">
        Paste emails, notes, or contract text
      </label>
      <div className="relative">
        <textarea
          id="contract-input"
          className="w-full h-80 p-4 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-sm"
          placeholder="Paste the source document text here for analysis..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute bottom-3 right-3 bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded border border-slate-200">
          {charCount.toLocaleString()} chars
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Your data remains in the browser. No AI processing happens on this server.
      </p>
    </div>
  );
};

export default InputSection;
