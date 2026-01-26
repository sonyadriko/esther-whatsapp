const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface StatusResponse {
    connected: boolean;
    logged_in: boolean;
}

export interface StatsResponse {
    total_users: number;
    total_messages: number;
    incoming_messages: number;
    outgoing_messages: number;
    connected: boolean;
}

export interface MessagesResponse {
    messages: Message[];
    limit: number;
    offset: number;
}

export interface UsersResponse {
    users: User[];
}

export interface UserResponse {
    user: User;
}

export interface SettingsResponse {
    auto_reply_enabled: boolean;
    keywords: Record<string, string>;
}

export interface Message {
    id: string;
    user_id: string;
    direction: string;
    message_type: string;
    content: string | null;
    status: string;
    created_at: string;
}

export interface User {
    id: string;
    phone: string;
    name: string | null;
    notes: string | null;
    opt_in: boolean;
    blocked: boolean;
    last_user_message_at: string | null;
    last_system_sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export async function fetchStatus(): Promise<StatusResponse> {
    const res = await fetch(`${API_URL}/api/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_URL}/api/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function fetchMessages(limit = 50, offset = 0): Promise<MessagesResponse> {
    const res = await fetch(`${API_URL}/api/messages?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
}

export async function fetchUsers(): Promise<UsersResponse> {
    const res = await fetch(`${API_URL}/api/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export async function fetchUser(id: string): Promise<UserResponse> {
    const res = await fetch(`${API_URL}/api/users/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
}

export async function updateUser(id: string, data: { name?: string; notes?: string; blocked?: boolean; opt_in?: boolean }) {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
}

export async function fetchUserMessages(id: string, limit = 100, offset = 0): Promise<MessagesResponse> {
    const res = await fetch(`${API_URL}/api/users/${id}/messages?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch user messages');
    return res.json();
}

export async function sendMessage(phone: string, message: string, type: string = 'manual') {
    const res = await fetch(`${API_URL}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, type }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
}

export async function validateSend(phone: string, type: string = 'system') {
    const res = await fetch(`${API_URL}/api/validate?phone=${phone}&type=${type}`);
    if (!res.ok) throw new Error('Failed to validate');
    return res.json();
}

export async function fetchSettings(): Promise<SettingsResponse> {
    const res = await fetch(`${API_URL}/api/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
}

export async function updateSettings(settings: { auto_reply_enabled?: boolean }) {
    const res = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
}

export async function addKeyword(keyword: string, response: string) {
    const res = await fetch(`${API_URL}/api/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, response }),
    });
    if (!res.ok) throw new Error('Failed to add keyword');
    return res.json();
}

export async function deleteKeyword(keyword: string) {
    const res = await fetch(`${API_URL}/api/keywords/${encodeURIComponent(keyword)}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete keyword');
    return res.json();
}

export function getQRWebSocketURL(): string {
    return `${API_URL.replace('http', 'ws')}/api/qr`;
}
