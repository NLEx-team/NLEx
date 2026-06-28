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

  sendPromptStream: (
    chatId: string, 
    prompt: string, 
    catalogIds: string[] | undefined,
    onStatus: (status: string) => void
  ): Promise<PromptResponse> => {
    return new Promise((resolve, reject) => {
      let isResolved = false;
      const wsUrl = config.apiUrl.replace('http', 'ws') + `/chats/${chatId}/ws`;
      // By default browser sends cookies with WebSocket connection
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ prompt, catalog_ids: catalogIds || [] }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            onStatus(data.status);
          } else if (data.type === 'result') {
            isResolved = true;
            ws.close();
            resolve(data.response);
          } else if (data.type === 'error') {
            isResolved = true;
            ws.close();
            reject(new Error(data.message));
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.onerror = (e) => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error('WebSocket error occurred'));
        }
      };

      ws.onclose = (e) => {
        if (!isResolved && !e.wasClean) {
          isResolved = true;
          reject(new Error('WebSocket closed unexpectedly'));
        }
      };
    });
  },

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
