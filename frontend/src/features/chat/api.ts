import { api } from '../../utils/api';
import { config } from '../../utils/config';


interface PromptResponseResult {
  status: string;
  question?: string;
  options?: string[];
  data?: any[][];
  total_rows?: number;
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
  export_url?: string;
  chat_title?: string;
}

interface ChatListResponse {
  id: string;
  title: string;
  catalog_ids: string[];
  updated_at: string;
}

interface ChatMessageResponse {
  id: string;
  role: 'user' | 'assistant';
  blocks: any[];
  export_url?: string;
  created_at: string;
}

export const chatApi = {
  getChats: () =>
    api.get<ChatListResponse[]>('/chats'),
    
  create: (catalogIds?: string[]) =>
    api.post<{ id: string; name: string; status: string; catalog_ids: string[]; created_at: string; updated_at: string }>('/chats', { catalog_ids: catalogIds || [] }),

  update: (chatId: string, name: string) =>
    api.patch<{ status: string; name: string }>(`/chats/${chatId}`, { name }),

  delete: (chatId: string) =>
    api.delete(`/chats/${chatId}`),

  getMessages: (chatId: string) =>
    api.get<ChatMessageResponse[]>(`/chats/${chatId}/messages`),

  sendPrompt: (chatId: string, prompt: string, catalogIds?: string[]) =>
    api.post<PromptResponse>(`/chats/${chatId}/prompt`, { prompt, catalog_ids: catalogIds || [] }),

  sendClarification: (chatId: string, questionId: string, selectedOptions: string[], customAnswer?: string) =>
    api.post<PromptResponse>(`/chats/${chatId}/clarify`, {
      question_id: questionId,
      selected_options: selectedOptions,
      custom_answer: customAnswer || null,
    }),

  deleteChat: (chatId: string) =>
    api.delete(`/chats/${chatId}`),

  getStatus: (chatId: string) =>
    api.get<{status: string}>(`/chats/${chatId}/status`),

  downloadExport: async (exportUrl: string) => {
    const response = await fetch(`${config.apiUrl}${exportUrl}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Export download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = response.headers.get('Content-Disposition');
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    a.download = match?.[1] || 'export.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
