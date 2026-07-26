export interface User {
  id: string;
  username: string;
  display_name: string;
  phone: string;
  avatar_color: string;
  avatar_url: string | null;
  about: string;
  is_online: boolean;
  last_seen: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_color: string;
  content: string;
  message_type: 'text' | 'system' | 'image';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface ConversationMember {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  is_online: boolean;
  last_seen?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatar_url: string | null;
  members: ConversationMember[];
  last_message: Message | null;
  unread_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  is_muted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen?: string;
}

export type SidebarView = 'chats' | 'calls' | 'stories' | 'settings';
