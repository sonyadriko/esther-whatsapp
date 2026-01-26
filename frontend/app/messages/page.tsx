'use client';

import { useEffect, useState } from 'react';
import { MessageTable } from '@/components/message-table';
import { fetchMessages, Message } from '@/lib/api';

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchMessages(100, 0);
                setMessages(data.messages || []);
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setLoading(false);
            }
        };

        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-sm md:text-base text-muted-foreground">View all incoming and outgoing messages</p>
            </div>

            <MessageTable messages={messages} loading={loading} />
        </div>
    );
}
