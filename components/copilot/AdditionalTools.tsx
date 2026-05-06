import React from 'react';

interface AdditionalToolsProps {
  onDailyBrief: () => void;
  onVendorIntel: () => void;
  disabled: boolean;
}

const AdditionalTools: React.FC<AdditionalToolsProps> = ({
  onDailyBrief,
  onVendorIntel,
  disabled,
}) => {
  return (
    <div className="pt-6 border-t border-slate-100">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Independent Tools</h4>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onDailyBrief}
          disabled={disabled}
          className={`py-2 px-3 text-xs font-medium rounded border transition-all ${
            !disabled
              ? 'border-slate-300 hover:border-slate-900 text-slate-600 hover:text-slate-900'
              : 'border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          ☕ Daily Brief
        </button>
        <button
          onClick={onVendorIntel}
          disabled={disabled}
          className={`py-2 px-3 text-xs font-medium rounded border transition-all ${
            !disabled
              ? 'border-slate-300 hover:border-slate-900 text-slate-600 hover:text-slate-900'
              : 'border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          🏢 Vendor Intel
        </button>
      </div>
    </div>
  );
};

export default AdditionalTools;
