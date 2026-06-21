import { api } from '../../utils/api';
import { config } from '../../utils/config';

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
  export_url?: string;
}

export const chatApi = {
  create: () =>
    api.post<{ id: string; name: string; status: string; created_at: string; updated_at: string }>(
      '/chats',
      { name: null, connection_ids: [] },
    ),

  sendPrompt: (chatId: string, prompt: string) =>
    api.post<PromptResponse>(`/chats/${chatId}/prompt`, { prompt }, { timeout: 300000 }),

  sendClarification: (chatId: string, questionId: string, selectedOptions: string[], customAnswer?: string) =>
    api.post<PromptResponse>(`/chats/${chatId}/clarify`, {
      question_id: questionId,
      selected_options: selectedOptions,
      custom_answer: customAnswer || null,
    }, { timeout: 300000 }),

  downloadExport: async (exportUrl: string) => {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${config.apiUrl}${exportUrl}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
