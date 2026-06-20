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
}

export interface ErrorBlock {
  type: 'error';
  message: string;
  sql?: string;
}

export type ContentBlock = TextBlock | OptionsBlock | TableBlock | ErrorBlock;

export interface ChatMessage {
  id: string;
  role: MessageRole;
  blocks: ContentBlock[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
}
