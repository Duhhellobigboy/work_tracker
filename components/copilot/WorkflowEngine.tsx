import React from 'react';
import { WorkflowState } from './types';

interface WorkflowEngineProps {
  state: WorkflowState;
  onInit: () => void;
  onContinue: () => void;
  onObligations: () => void;
  onDeliverables: () => void;
  onGantt: () => void;
}

const WorkflowEngine: React.FC<WorkflowEngineProps> = ({
  state,
  onInit,
  onContinue,
  onObligations,
  onDeliverables,
  onGantt,
}) => {
  const isIdle = state === 'idle';
  const isReady = state === 'ready';
  const isAnalyzing = state === 'analyzing';
  const isExtracting = state === 'extracting';

  return (
    <div className="space-y-8">
      {/* STEP 1 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isReady ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>STEP 1</span>
          <h4 className="text-sm font-semibold text-slate-800">Initialize Analysis</h4>
        </div>
        <button
          onClick={onInit}
          disabled={isIdle}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all shadow-sm ${
            isReady
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          Initialize Contract Analysis
        </button>
      </section>

      {/* STEP 2 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isAnalyzing ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>STEP 2</span>
          <h4 className="text-sm font-semibold text-slate-800">Scan Execution</h4>
        </div>
        <button
          onClick={onContinue}
          disabled={!isAnalyzing && !isExtracting}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all shadow-sm ${
            isAnalyzing || isExtracting
              ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          Continue Scan (Repeat as needed)
        </button>
      </section>

      {/* STEP 3 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isExtracting ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>STEP 3</span>
          <h4 className="text-sm font-semibold text-slate-800">Generate Outputs</h4>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={onObligations}
            disabled={!isAnalyzing && !isExtracting}
            className={`text-left py-2 px-4 rounded border transition-all text-sm font-medium ${
              isAnalyzing || isExtracting
                ? 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            📋 Obligations Register
          </button>
          <button
            onClick={onDeliverables}
            disabled={!isAnalyzing && !isExtracting}
            className={`text-left py-2 px-4 rounded border transition-all text-sm font-medium ${
              isAnalyzing || isExtracting
                ? 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            📦 Deliverables Register
          </button>
          <button
            onClick={onGantt}
            disabled={!isAnalyzing && !isExtracting}
            className={`text-left py-2 px-4 rounded border transition-all text-sm font-medium ${
              isAnalyzing || isExtracting
                ? 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            📅 Gantt Day 0–30
          </button>
        </div>
      </section>
    </div>
  );
};

export default WorkflowEngine;
