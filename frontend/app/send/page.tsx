'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, CheckCircle, XCircle, Loader2, AlertTriangle, ShieldCheck, Smartphone } from 'lucide-react';

interface Account {
    id: string;
    name: string;
    phone: string;
    is_connected: boolean;
}

interface ValidationResult {
    can_send: boolean;
    reason: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function SendPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [validation, setValidation] = useState<ValidationResult | null>(null);

    useEffect(() => {
        const loadAccounts = async () => {
            try {
                const res = await fetch(`${API_URL}/api/accounts`);
                if (res.ok) {
                    const data = await res.json();
                    const connectedAccounts = (data.accounts || []).filter((a: Account) => a.is_connected);
                    setAccounts(connectedAccounts);
                    if (connectedAccounts.length > 0 && !selectedAccount) {
                        setSelectedAccount(connectedAccounts[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to load accounts:', err);
            } finally {
                setLoading(false);
            }
        };
        loadAccounts();
    }, [selectedAccount]);

    const formatPhone = (value: string) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('0')) {
            digits = '62' + digits.substring(1);
        }
        return digits;
    };

    const handlePhoneChange = (value: string) => {
        const formatted = formatPhone(value);
        setPhone(formatted);
        setValidation(null);
    };

    const validatePhone = async () => {
        if (!phone || phone.length < 10) return;
        try {
            const res = await fetch(`${API_URL}/api/validate?phone=${phone}&type=manual`);
            if (res.ok) {
                const data = await res.json();
                setValidation(data);
            }
        } catch (err) {
            console.error('Validation failed:', err);
        }
    };

    const handleSend = async () => {
        if (!phone || !message || !selectedAccount) return;
        setSending(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/api/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    message,
                    type: 'manual',
                    account_id: selectedAccount
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult({ type: 'success', text: 'Message sent successfully!' });
                setMessage('');
                setValidation(null);
            } else {
                setResult({ type: 'error', text: data.error || 'Failed to send message' });
            }
        } catch {
            setResult({ type: 'error', text: 'Failed to send message' });
        } finally {
            setSending(false);
            setTimeout(() => setResult(null), 5000);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Send Message</h1>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Send Message</h1>
                <p className="text-sm md:text-base text-muted-foreground">Send manual message to a phone number</p>
            </div>

            {result && (
                <Alert className={result.type === 'success' ? 'bg-primary/20 border-primary' : 'bg-destructive/20 border-destructive'}>
                    {result.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription>{result.text}</AlertDescription>
                </Alert>
            )}

            {accounts.length === 0 && (
                <Alert className="bg-amber-50 border-amber-500 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                        No connected accounts. Please go to <a href="/accounts" className="underline font-medium">Accounts</a> and connect at least one WhatsApp account.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Compose Message
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Send a message from your connected account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                        <div>
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Smartphone className="w-4 h-4" />
                                Send From Account
                            </label>
                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name} {acc.phone ? `(+${acc.phone})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Recipient Phone Number</label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    placeholder="628123456789"
                                    className="font-mono"
                                />
                                <Button
                                    variant="outline"
                                    onClick={validatePhone}
                                    disabled={!phone || phone.length < 10}
                                >
                                    Validate
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Format: 62xxx (08xxx will auto-convert to 628xxx)
                            </p>
                        </div>

                        {validation && (
                            <Alert className={validation.can_send ? 'bg-primary/20 border-primary' : 'bg-destructive/20 border-destructive'}>
                                {validation.can_send ? (
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                )}
                                <AlertDescription>
                                    {validation.can_send ? 'OK to send' : validation.reason}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="mt-1 min-h-[120px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {message.length} characters
                            </p>
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={sending || !phone || !message || !selectedAccount || accounts.length === 0}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Message
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg">Sending Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium">Safe to Send</p>
                                    <p className="text-muted-foreground">Manual messages are allowed anytime</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">Blocked Users</p>
                                    <p className="text-muted-foreground">Cannot send to blocked users</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">Multi-Account</p>
                                    <p className="text-muted-foreground">Select which account to send from</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
