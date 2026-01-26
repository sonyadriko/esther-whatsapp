'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, QrCode, Power, PowerOff, CheckCircle, XCircle, Loader2, Smartphone, RefreshCw } from 'lucide-react';

interface Account {
    id: string;
    name: string;
    phone: string;
    is_connected: boolean;
    is_logged_in: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [qrAccountId, setQrAccountId] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrStatus, setQrStatus] = useState<'idle' | 'connecting' | 'waiting' | 'success' | 'error'>('idle');

    const loadAccounts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/accounts`);
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (err) {
            console.error('Failed to load accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
        const interval = setInterval(loadAccounts, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddAccount = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });
            if (res.ok) {
                const data = await res.json();
                setAccounts(prev => [...prev, data.account]);
                setNewName('');
                setMessage({ type: 'success', text: 'Account added! Click Connect to scan QR code.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to add account' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/accounts/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setAccounts(prev => prev.filter(a => a.id !== id));
                setMessage({ type: 'success', text: 'Account removed' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to remove account' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleConnect = (accountId: string) => {
        setQrAccountId(accountId);
        setQrCode(null);
        setQrStatus('connecting');

        const wsUrl = `${API_URL.replace('http', 'ws')}/api/accounts/${accountId}/qr`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setQrStatus('waiting');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'qr':
                    setQrCode(data.code);
                    setQrStatus('waiting');
                    break;
                case 'success':
                    setQrStatus('success');
                    setQrCode(null);
                    setTimeout(() => {
                        setQrAccountId(null);
                        setQrStatus('idle');
                        loadAccounts();
                    }, 2000);
                    break;
                case 'connected':
                    setQrStatus('success');
                    setQrCode(null);
                    setQrAccountId(null);
                    break;
                case 'timeout':
                case 'error':
                    setQrStatus('error');
                    setQrCode(null);
                    break;
            }
        };

        ws.onerror = () => {
            setQrStatus('error');
        };

        ws.onclose = () => {
            if (qrStatus === 'waiting') {
                setQrStatus('error');
            }
        };
    };

    const handleDisconnect = async (id: string) => {
        try {
            await fetch(`${API_URL}/api/accounts/${id}/disconnect`, { method: 'POST' });
            loadAccounts();
        } catch (err) {
            console.error('Failed to disconnect:', err);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">WhatsApp Accounts</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage multiple accounts</p>
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">WhatsApp Accounts</h1>
                <p className="text-sm md:text-base text-muted-foreground">Manage multiple WhatsApp accounts</p>
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

            {/* Add Account */}
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add New Account
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Add a new WhatsApp account to manage
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                    <div className="flex gap-2">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Account name (e.g. Business, Personal)"
                            className="flex-1"
                        />
                        <Button
                            onClick={handleAddAccount}
                            disabled={!newName.trim() || saving}
                            className="bg-[#A8DF8E] text-gray-800 hover:bg-[#8ecf75]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* QR Code Modal */}
            {qrAccountId && (
                <Card className="border-2 border-[#A8DF8E]">
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <QrCode className="w-5 h-5" />
                            Scan QR Code - {accounts.find(a => a.id === qrAccountId)?.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Scan with WhatsApp on your phone
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 flex flex-col items-center space-y-4">
                        {qrStatus === 'connecting' && (
                            <div className="w-48 h-48 bg-[#F0FFDF] rounded-xl flex items-center justify-center">
                                <Loader2 className="w-12 h-12 animate-spin text-[#A8DF8E]" />
                            </div>
                        )}
                        {qrStatus === 'waiting' && qrCode && (
                            <div className="p-4 bg-white border-4 border-[#A8DF8E] rounded-xl">
                                <QRCodeSVG value={qrCode} size={200} />
                            </div>
                        )}
                        {qrStatus === 'success' && (
                            <div className="w-48 h-48 bg-[#F0FFDF] rounded-xl flex flex-col items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-[#A8DF8E] mb-2" />
                                <p className="text-[#6bc55f] font-medium">Connected!</p>
                            </div>
                        )}
                        {qrStatus === 'error' && (
                            <div className="w-48 h-48 bg-[#FFD8DF] rounded-xl flex flex-col items-center justify-center">
                                <XCircle className="w-16 h-16 text-[#FFAAB8] mb-2" />
                                <Button
                                    onClick={() => handleConnect(qrAccountId)}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Retry
                                </Button>
                            </div>
                        )}
                        <Button variant="outline" onClick={() => setQrAccountId(null)}>
                            Cancel
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Accounts List */}
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Accounts ({accounts.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                    {accounts.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No accounts yet. Add one above!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                                >
                                    <div>
                                        <p className="font-medium">{account.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="outline"
                                                className={account.is_connected ? 'bg-[#A8DF8E] text-gray-800' : 'bg-gray-200 text-gray-600'}
                                            >
                                                {account.is_connected ? '✓ Connected' : '○ Disconnected'}
                                            </Badge>
                                            {account.phone && (
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    +{account.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!account.is_logged_in ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleConnect(account.id)}
                                                disabled={saving || qrAccountId !== null}
                                                className="border-[#A8DF8E] text-[#6bc55f] hover:bg-[#F0FFDF]"
                                            >
                                                <QrCode className="w-4 h-4 mr-1" />
                                                Connect
                                            </Button>
                                        ) : account.is_connected ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDisconnect(account.id)}
                                                className="border-amber-500 text-amber-600 hover:bg-amber-50"
                                            >
                                                <PowerOff className="w-4 h-4 mr-1" />
                                                Disconnect
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleConnect(account.id)}
                                                className="border-[#A8DF8E] text-[#6bc55f] hover:bg-[#F0FFDF]"
                                            >
                                                <Power className="w-4 h-4 mr-1" />
                                                Reconnect
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAccount(account.id)}
                                            disabled={saving}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
