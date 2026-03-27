export type Finding = {
  title: string;
  explanation: string;
  excerpt?: string;
  severity?: number;
};

export type AnalyzeResponse = {
  score: number;
  language: Finding[];
  logic: Finding[];
  context: Finding[];
};

export type AnalyzeHistoryItem = {
  at: number;
  score: number;
  preview: string;
  text: string;
};

