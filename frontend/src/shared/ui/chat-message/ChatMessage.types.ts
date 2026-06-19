export type ChatMessageRole = "user" | "assistant";

export interface ChatMessageProps {
  role: ChatMessageRole;
  content: string;
}
