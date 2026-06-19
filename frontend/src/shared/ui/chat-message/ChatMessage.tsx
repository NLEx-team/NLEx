import type { ChatMessageProps } from "./ChatMessage.types";
import "./ChatMessage.css";

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`chat-message chat-message--${role}`}>
      <div className="chat-message__bubble">{content}</div>
    </div>
  );
}
