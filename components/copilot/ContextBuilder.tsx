import React from 'react';
import { Context, Focus } from './types';

interface ContextBuilderProps {
  context: Context;
  onChange: (context: Context) => void;
}

const ContextBuilder: React.FC<ContextBuilderProps> = ({ context, onChange }) => {
  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vendors = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
    onChange({ ...context, vendors });
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...context, projectName: e.target.value });
  };

  const handleFocusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...context, focus: e.target.value as Focus });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Analysis Context</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-xs font-medium text-slate-500 mb-1">
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. Phase 2 Expansion"
            value={context.projectName}
            onChange={handleProjectChange}
          />
        </div>

        <div>
          <label htmlFor="vendors" className="block text-xs font-medium text-slate-500 mb-1">
            Vendors (comma separated)
          </label>
          <input
            id="vendors"
            type="text"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. Hyundai, ABB, GE"
            defaultValue={context.vendors.join(', ')}
            onBlur={handleVendorChange}
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {context.vendors.map((vendor) => (
              <span key={vendor} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                {vendor}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="analysis-focus" className="block text-xs font-medium text-slate-500 mb-1">
            Analysis Focus
          </label>
          <select
            id="analysis-focus"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            value={context.focus}
            onChange={handleFocusChange}
          >
            <option value="Risk">Risk Assessment</option>
            <option value="Delivery">Delivery Obligations</option>
            <option value="Schedule">Schedule & Milestones</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ContextBuilder;
