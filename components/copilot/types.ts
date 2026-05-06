export type Focus = 'Risk' | 'Delivery' | 'Schedule';

export type Context = {
  projectName: string;
  vendors: string[];
  focus: Focus;
};

export type WorkflowState = 'idle' | 'ready' | 'analyzing' | 'extracting';

export type PanelState = {
  inputText: string;
  context: Context;
  workflow: WorkflowState;
  lastPromptLabel: string | null;
  outputText: string;
};
