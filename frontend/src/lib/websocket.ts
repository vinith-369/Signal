export type WSEventHandler = (data: any) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isIntentionalClose = false;

  public onMessage?: WSEventHandler;
  public onTyping?: WSEventHandler;
  public onStatusUpdate?: WSEventHandler;
  public onUserOnline?: (userId: string) => void;
  public onUserOffline?: (userId: string) => void;
  public onDelivered?: WSEventHandler;
  public onRead?: WSEventHandler;
  public onMessageUpdate?: WSEventHandler;
  public onMessageDeleted?: WSEventHandler;

  constructor(userId: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    this.url = `${baseUrl}/ws/${userId}?token=${token}`;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'new_message':
              this.onMessage?.(data);
              break;
            case 'typing':
              this.onTyping?.(data);
              break;
            case 'message_delivered':
              this.onDelivered?.(data);
              break;
            case 'message_read':
              this.onRead?.(data);
              break;
            case 'message_update':
              this.onMessageUpdate?.(data);
              break;
            case 'message_deleted':
              this.onMessageDeleted?.(data);
              break;
            case 'user_online':
              this.onUserOnline?.(data.user_id);
              break;
            case 'user_offline':
              this.onUserOffline?.(data.user_id);
              break;
            default:
              this.onStatusUpdate?.(data);
          }
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };

      this.ws.onerror = () => {
        // Will trigger onclose
      };
    } catch (e) {
      console.error('WS connect error:', e);
    }
  }

  sendMessage(conversationId: string, content: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        content
      }));
    }
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping
      }));
    }
  }

  sendMarkRead(messageId: string, conversationId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'mark_read',
        message_id: messageId,
        conversation_id: conversationId
      }));
    }
  }

  disconnect() {
    this.isIntentionalClose = true;
    this.ws?.close();
  }
}
