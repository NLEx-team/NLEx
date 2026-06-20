import { api } from '../../utils/api';

interface PromptResponseResult {
  status: string;
  question?: string;
  options?: string[];
  data?: any[][];
  headers?: string[];
  explanation?: string;
  sql?: string;
  message?: string;
}

interface PromptResponse {
  chat_id: string;
  status: string;
  next_steps: string[];
  result: PromptResponseResult;
}

export const chatApi = {
  create: () =>
    api.post<{ id: string; name: string; status: string; created_at: string; updated_at: string }>(
      '/chats',
      { name: null, connection_ids: [] },
    ),

  sendPrompt: (chatId: string, prompt: string) =>
    api.post<PromptResponse>(`/chats/${chatId}/prompt`, { prompt }),

  sendClarification: (chatId: string, questionId: string, selectedOptions: string[], customAnswer?: string) =>
    api.post<PromptResponse>(`/chats/${chatId}/clarify`, {
      question_id: questionId,
      selected_options: selectedOptions,
      custom_answer: customAnswer || null,
    }),
};
