export type ChatMessageRole = 'user' | 'assistant';

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
  totalRows?: number;
  sql?: string;
  explanation?: string;
}

export interface ErrorBlock {
  type: 'error';
  message: string;
  sql?: string;
}

export type ContentBlock = TextBlock | OptionsBlock | TableBlock | ErrorBlock;

export interface ChatMessageProps {
  role: ChatMessageRole;
  blocks: ContentBlock[];
  exportUrl?: string;
  onClarify?: (questionId: string, selectedOptions: string[]) => void;
  onExport?: (exportUrl: string) => void;
  isLastMessage?: boolean;
}
