const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class Api {
  private getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('signal_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async get(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  }

  async post(path: string, body: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  }

  async put(path: string, body: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  }

  async del(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  }

  // Auth & Profile
  login(username: string, password: string) {
    return this.post('/api/auth/login', { username, password });
  }
  register(userData: any) {
    return this.post('/api/auth/register', userData);
  }
  getMe() {
    return this.get('/api/auth/me');
  }
  updateProfile(data: any) {
    return this.put('/api/auth/me', data);
  }

  // Contacts
  getContacts() {
    return this.get('/api/contacts');
  }
  addContact(username: string) {
    return this.post('/api/contacts', { username });
  }
  removeContact(id: string) {
    return this.del(`/api/contacts/${id}`);
  }

  // Conversations
  getConversations() {
    return this.get('/api/conversations');
  }
  createConversation(type: string, memberIds: string[], name?: string) {
    return this.post('/api/conversations', { type, member_ids: memberIds, name });
  }
  getConversation(id: string) {
    return this.get(`/api/conversations/${id}`);
  }
  updateConversation(id: string, data: any) {
    return this.put(`/api/conversations/${id}`, data);
  }
  deleteConversation(id: string) {
    return this.del(`/api/conversations/${id}`);
  }

  // Messages
  getMessages(conversationId: string, limit?: number, before?: string) {
    let url = `/api/conversations/${conversationId}/messages`;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    if (params.toString()) url += `?${params.toString()}`;
    return this.get(url);
  }
  sendMessage(conversationId: string, content: string, messageType = 'text') {
    return this.post(`/api/conversations/${conversationId}/messages`, { content, message_type: messageType });
  }
  markRead(messageId: string) {
    return this.put(`/api/messages/${messageId}/read`, {});
  }
  deleteMessage(messageId: string) {
    return this.del(`/api/messages/${messageId}`);
  }

  // Search
  searchUsers(query: string) {
    return this.get(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  // Groups
  createGroup(name: string, memberIds: string[]) {
    return this.post('/api/groups', { type: 'group', member_ids: memberIds, name });
  }
  updateGroup(id: string, name: string) {
    return this.put(`/api/groups/${id}`, { name });
  }
  addGroupMember(groupId: string, username: string) {
    return this.post(`/api/groups/${groupId}/members`, { username });
  }
  removeGroupMember(groupId: string, userId: string) {
    return this.del(`/api/groups/${groupId}/members/${userId}`);
  }
}

export const api = new Api();
