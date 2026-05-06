import React from 'react';

const InstructionsPanel: React.FC = () => {
  const steps = [
    { title: 'Click a button', description: 'The prompt is automatically copied to your clipboard.' },
    { title: 'Paste in Copilot', description: 'Go to Microsoft Copilot and paste (Ctrl+V).' },
    { title: 'Run and Review', description: 'Wait for Copilot to finish its section-by-section analysis.' },
    { title: 'Repeat with CONTINUE', description: 'If Copilot stops early, click "Continue Scan" and paste again.' },
    { title: 'Capture Results', description: 'Optionally paste Copilot\'s final output back here for reference.' },
  ];

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">How to Use</h3>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
              {i + 1}
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-800">{step.title}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-start gap-2 bg-indigo-50 p-3 rounded-lg">
          <span className="text-lg">💡</span>
          <p className="text-[11px] text-indigo-700 leading-tight">
            <strong>Pro Tip:</strong> Copilot works best when you keep it focused on one contract at a time in a fresh chat session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPanel;
