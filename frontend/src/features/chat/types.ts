export type MessageRole = 'user' | 'assistant';

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface OptionsBlock {
  type: 'options';
  questionId: string;
  question: string;
  options: string[];
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: any[][];
  sql?: string;
  explanation?: string;
  totalRows?: number;
}

export interface ChartBlock {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title?: string;
  xColumn?: string;
  yColumns?: string[];
  categoryColumn?: string;
  valueColumn?: string;
  stacked?: boolean;
  data?: any[][];
  headers?: string[];
}

export interface ErrorBlock {
  type: 'error';
  message: string;
  sql?: string;
}

export type ContentBlock = TextBlock | OptionsBlock | TableBlock | ChartBlock | ErrorBlock;

export interface ChatMessage {
  id: string;
  role: MessageRole;
  blocks: ContentBlock[];
  timestamp: string;
  exportUrl?: string;
  exportFilename?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  catalogIds: string[];
}
