import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
    id: string;
    phone: string;
    name: string | null;
    opt_in: boolean;
    blocked: boolean;
    last_user_message_at: string | null;
    last_system_sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    user_id: string;
    direction: 'incoming' | 'outgoing';
    message_type: 'reply' | 'system' | 'manual' | 'user';
    content: string | null;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    wa_message_id: string | null;
    created_at: string;
}
