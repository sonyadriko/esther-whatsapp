'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Plus, Trash2, CheckCircle, XCircle, Calendar, Send } from 'lucide-react';

interface ScheduledMessage {
    id: string;
    phone: string;
    message: string;
    scheduled_at: string;
    status: string;
    created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function SchedulePage() {
    const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [phone, setPhone] = useState('');
    const [messageText, setMessageText] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadScheduled = async () => {
        try {
            const res = await fetch(`${API_URL}/api/scheduled`);
            if (res.ok) {
                const data = await res.json();
                setScheduled(data.scheduled || []);
            }
        } catch (err) {
            console.error('Failed to load scheduled:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadScheduled();
        const interval = setInterval(loadScheduled, 10000);
        return () => clearInterval(interval);
    }, []);

    const formatPhone = (value: string) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('0')) {
            digits = '62' + digits.slice(1);
        }
        return digits;
    };

    const handleSchedule = async () => {
        if (!phone.trim() || !messageText.trim() || !scheduledAt) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/scheduled`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    message: messageText,
                    scheduled_at: new Date(scheduledAt).toISOString()
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setScheduled(data.scheduled || []);
                setPhone('');
                setMessageText('');
                setScheduledAt('');
                setMessage({ type: 'success', text: 'Message scheduled' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to schedule message' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/scheduled/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                const data = await res.json();
                setScheduled(data.scheduled || []);
                setMessage({ type: 'success', text: 'Scheduled message cancelled' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to cancel' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        return now.toISOString().slice(0, 16);
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Scheduled Messages</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Schedule messages</p>
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Scheduled Messages</h1>
                <p className="text-sm md:text-base text-muted-foreground">Schedule messages for later delivery</p>
            </div>

            {message && (
                <Alert className={message.type === 'success' ? 'bg-[#F0FFDF] border-[#A8DF8E]' : 'bg-[#FFD8DF] border-[#FFAAB8]'}>
                    {message.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-[#7ed56f]" />
                    ) : (
                        <XCircle className="h-4 w-4 text-[#FFAAB8]" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Schedule Form */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Schedule New
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Set a message to be sent at a specific time
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Phone Number</label>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
                                placeholder="628123456789"
                                className="mt-1 font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type message..."
                                className="mt-1 min-h-[100px]"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Schedule For</label>
                            <Input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                min={getMinDateTime()}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Minimum 5 menit dari sekarang
                            </p>
                        </div>
                        <Button
                            onClick={handleSchedule}
                            disabled={!phone.trim() || !messageText.trim() || !scheduledAt || saving}
                            className="w-full bg-[#A8DF8E] text-gray-800 hover:bg-[#8ecf75]"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Message
                        </Button>
                    </CardContent>
                </Card>

                {/* Scheduled List */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Scheduled ({scheduled.length})
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Pending scheduled messages
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        {scheduled.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No scheduled messages</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-3 pr-4">
                                    {scheduled.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 bg-muted/50 rounded-lg border"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <p className="font-mono text-sm">{item.phone}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={item.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-[#A8DF8E] text-gray-800'}
                                                        >
                                                            {item.status}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.scheduled_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.status === 'pending' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={saving}
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
                                                {item.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
