import React, { useState, useEffect } from 'react';
import InputSection from './InputSection';
import ContextBuilder from './ContextBuilder';
import WorkflowEngine from './WorkflowEngine';
import AdditionalTools from './AdditionalTools';
import InstructionsPanel from './InstructionsPanel';
import OutputCapture from './OutputCapture';
import { Context, WorkflowState } from './types';
import * as promptBuilder from '../../lib/copilot/promptBuilder';
import { copyToClipboard } from '../../lib/copilot/clipboard';

const CopilotPanel: React.FC = () => {
  // State
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState<Context>({
    projectName: '',
    vendors: [],
    focus: 'Risk',
  });
  const [workflow, setWorkflow] = useState<WorkflowState>('idle');
  const [outputText, setOutputText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Derived state
  const canInit = inputText.trim().length > 50;

  // Effects
  useEffect(() => {
    if (!canInit) {
      setWorkflow('idle');
    } else if (workflow === 'idle') {
      setWorkflow('ready');
    }
  }, [canInit, workflow]);

  // Handle seed from query param
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    if (seed) {
      try {
        // Decode base64 seed
        const decoded = decodeURIComponent(atob(seed));
        setInputText(decoded);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (err) {
        console.error('Failed to decode seed:', err);
      }
    }
  }, []);

  // Handlers
  const handleCopy = async (label: string, prompt: string) => {
    const ok = await copyToClipboard(prompt);
    setToast(ok ? `Copied: ${label}` : 'Copy failed — please copy manually');
    setTimeout(() => setToast(null), 3000);
  };

  const onInit = async () => {
    await handleCopy('Init Prompt', promptBuilder.buildInitPrompt(context, inputText));
    setWorkflow('analyzing');
  };

  const onContinue = async () => {
    await handleCopy('Continue Scan', promptBuilder.buildContinuePrompt(context));
  };

  const onObligations = async () => {
    await handleCopy('Obligations Register', promptBuilder.buildObligationsPrompt(context));
    setWorkflow('extracting');
  };

  const onDeliverables = async () => {
    await handleCopy('Deliverable Register', promptBuilder.buildDeliverablesPrompt(context));
    setWorkflow('extracting');
  };

  const onGantt = async () => {
    await handleCopy('Gantt Chart', promptBuilder.buildGanttPrompt(context));
    setWorkflow('extracting');
  };

  const onDailyBrief = async () => {
    await handleCopy('Daily Brief', promptBuilder.buildDailyBriefPrompt(context, inputText));
  };

  const onVendorIntel = async () => {
    await handleCopy('Vendor Intelligence', promptBuilder.buildVendorIntelPrompt(context, inputText));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Copilot Assistant</h1>
        <p className="mt-2 text-slate-500 max-w-2xl">
          Deterministic prompt orchestration for Microsoft Copilot. Analyze complex contracts and generate structured outputs without sending data to third-party AI APIs.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area (8/12) */}
        <main className="lg:col-span-8 space-y-10">
          {/* Section 1: Input */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <InputSection value={inputText} onChange={setInputText} />
          </section>

          {/* Section 2: Output Capture */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <OutputCapture value={outputText} onChange={setOutputText} />
          </section>
        </main>

        {/* Sidebar Area (4/12) */}
        <aside className="lg:col-span-4 space-y-6">
          <ContextBuilder context={context} onChange={setContext} />
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Workflow Engine</h3>
            <WorkflowEngine
              state={workflow}
              onInit={onInit}
              onContinue={onContinue}
              onObligations={onObligations}
              onDeliverables={onDeliverables}
              onGantt={onGantt}
            />
            <AdditionalTools
              onDailyBrief={onDailyBrief}
              onVendorIntel={onVendorIntel}
              disabled={!canInit}
            />
          </div>

          <InstructionsPanel />
        </aside>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700">
            <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
