import React from 'react';

interface OutputCaptureProps {
  value: string;
  onChange: (value: string) => void;
}

const OutputCapture: React.FC<OutputCaptureProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="output-capture" className="block text-sm font-medium text-slate-700">
          Paste Copilot output here (optional)
        </label>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Reference Only</span>
      </div>
      <textarea
        id="output-capture"
        className="w-full h-64 p-4 font-mono text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-slate-50 shadow-inner"
        placeholder="Once you have the final results from Copilot, you can paste them here to keep everything in one place..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex justify-end">
        <button 
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => onChange('')}
        >
          Clear output
        </button>
      </div>
    </div>
  );
};

export default OutputCapture;
