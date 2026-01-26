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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchUsers, User } from '@/lib/api';
import { Megaphone, Play, Trash2, CheckCircle, XCircle, Loader2, Users, RefreshCw } from 'lucide-react';

interface Account {
    id: string;
    name: string;
    phone: string;
    is_connected: boolean;
}

interface Broadcast {
    id: string;
    name: string;
    message: string;
    account_id: string;
    recipients: string[];
    sent: number;
    failed: number;
    total: number;
    status: string;
    delay_ms: number;
    created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function BroadcastPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [recipientType, setRecipientType] = useState<'all' | 'optin' | 'custom'>('optin');
    const [customNumbers, setCustomNumbers] = useState('');
    const [delaySeconds, setDelaySeconds] = useState('5');

    const loadData = async () => {
        try {
            const [broadcastRes, accountRes, usersData] = await Promise.all([
                fetch(`${API_URL}/api/broadcasts`),
                fetch(`${API_URL}/api/accounts`),
                fetchUsers(),
            ]);

            if (broadcastRes.ok) {
                const data = await broadcastRes.json();
                setBroadcasts(data.broadcasts || []);
            }
            if (accountRes.ok) {
                const data = await accountRes.json();
                setAccounts(data.accounts || []);
            }
            setUsers(usersData.users || []);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, []);

    const getRecipients = (): string[] => {
        if (recipientType === 'custom') {
            return customNumbers
                .split('\n')
                .map((n) => n.trim().replace(/^0/, '62'))
                .filter((n) => n.length > 0);
        }
        if (recipientType === 'optin') {
            return users.filter((u) => u.opt_in && !u.blocked).map((u) => u.phone);
        }
        return users.filter((u) => !u.blocked).map((u) => u.phone);
    };

    const handleCreate = async () => {
        const recipients = getRecipients();
        if (!name.trim() || !broadcastMessage.trim() || !selectedAccount || recipients.length === 0) {
            setMessage({ type: 'error', text: 'Please fill all fields and select recipients' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        setSending(true);
        try {
            const res = await fetch(`${API_URL}/api/broadcasts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    message: broadcastMessage,
                    account_id: selectedAccount,
                    recipients,
                    delay_ms: parseInt(delaySeconds) * 1000,
                }),
            });
            if (res.ok) {
                setName('');
                setBroadcastMessage('');
                setCustomNumbers('');
                setMessage({ type: 'success', text: 'Broadcast created! Click Start to begin.' });
                loadData();
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to create broadcast' });
        } finally {
            setSending(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleStart = async (id: string) => {
        try {
            await fetch(`${API_URL}/api/broadcasts/${id}/start`, { method: 'POST' });
            loadData();
        } catch (err) {
            console.error('Failed to start broadcast:', err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`${API_URL}/api/broadcasts/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            console.error('Failed to delete broadcast:', err);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Broadcast</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Send to multiple users</p>
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Broadcast</h1>
                <p className="text-sm md:text-base text-muted-foreground">Send messages to multiple users with rate limiting</p>
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
                {/* Create Broadcast */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Megaphone className="w-5 h-5" />
                            New Broadcast
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Create a new broadcast campaign
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Campaign Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. New Year Promo"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Account</label>
                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.filter((a) => a.is_connected).map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name} {acc.phone ? `(+${acc.phone})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Recipients</label>
                            <Select value={recipientType} onValueChange={(v) => setRecipientType(v as 'all' | 'optin' | 'custom')}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="optin">Opted-in users ({users.filter((u) => u.opt_in && !u.blocked).length})</SelectItem>
                                    <SelectItem value="all">All users ({users.filter((u) => !u.blocked).length})</SelectItem>
                                    <SelectItem value="custom">Custom list</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {recipientType === 'custom' && (
                            <div>
                                <label className="text-sm font-medium">Phone Numbers (one per line)</label>
                                <Textarea
                                    value={customNumbers}
                                    onChange={(e) => setCustomNumbers(e.target.value)}
                                    placeholder="628123456789&#10;628234567890"
                                    className="mt-1 min-h-[80px] font-mono text-sm"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                placeholder="Type your broadcast message..."
                                className="mt-1 min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Delay between messages (seconds)</label>
                            <Input
                                type="number"
                                value={delaySeconds}
                                onChange={(e) => setDelaySeconds(e.target.value)}
                                min="3"
                                max="60"
                                className="mt-1 w-32"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Minimum 3 seconds untuk keamanan</p>
                        </div>

                        <Button
                            onClick={handleCreate}
                            disabled={sending}
                            className="w-full bg-[#A8DF8E] text-gray-800 hover:bg-[#8ecf75]"
                        >
                            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Megaphone className="w-4 h-4 mr-2" />}
                            Create Broadcast
                        </Button>
                    </CardContent>
                </Card>

                {/* Broadcasts List */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Campaigns ({broadcasts.length})
                                </CardTitle>
                                <CardDescription className="text-sm">Active and completed broadcasts</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={loadData}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        {broadcasts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No broadcasts yet</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-3 pr-4">
                                    {broadcasts.map((broadcast) => (
                                        <div key={broadcast.id} className="p-4 bg-muted/50 rounded-lg border">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium">{broadcast.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                broadcast.status === 'completed' ? 'bg-[#A8DF8E] text-gray-800' :
                                                                    broadcast.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-200 text-gray-600'
                                                            }
                                                        >
                                                            {broadcast.status}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {broadcast.sent}/{broadcast.total} sent
                                                            {broadcast.failed > 0 && `, ${broadcast.failed} failed`}
                                                        </span>
                                                    </div>
                                                    {broadcast.status === 'running' && (
                                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-[#A8DF8E] h-2 rounded-full transition-all"
                                                                style={{ width: `${(broadcast.sent / broadcast.total) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    {broadcast.status === 'pending' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStart(broadcast.id)}
                                                            className="h-8 px-2 text-[#6bc55f] hover:bg-[#F0FFDF]"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {broadcast.status !== 'running' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(broadcast.id)}
                                                            className="h-8 px-2 text-red-500 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{broadcast.message}</p>
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
