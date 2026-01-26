'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, Plus, Trash2, CheckCircle, XCircle, Clock, Moon, Gauge } from 'lucide-react';

interface Keyword {
    keyword: string;
    response: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Settings
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
    const [awayEnabled, setAwayEnabled] = useState(true);
    const [awayMessage, setAwayMessage] = useState('');
    const [operatingStart, setOperatingStart] = useState(8);
    const [operatingEnd, setOperatingEnd] = useState(20);
    const [isOperating, setIsOperating] = useState(true);

    // Rate limits
    const [minDelayMs, setMinDelayMs] = useState(3000);
    const [maxDelayMs, setMaxDelayMs] = useState(10000);
    const [dailyLimitPerUser, setDailyLimitPerUser] = useState(5);

    // Keywords
    const [keywords, setKeywords] = useState<Record<string, string>>({});
    const [newKeyword, setNewKeyword] = useState('');
    const [newResponse, setNewResponse] = useState('');

    const loadSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/settings`);
            if (res.ok) {
                const data = await res.json();
                setAutoReplyEnabled(data.auto_reply_enabled ?? true);
                setAwayEnabled(data.away_enabled ?? true);
                setAwayMessage(data.away_message ?? '');
                setOperatingStart(data.operating_start ?? 8);
                setOperatingEnd(data.operating_end ?? 20);
                setIsOperating(data.is_operating ?? true);
                setMinDelayMs(data.min_delay_ms ?? 3000);
                setMaxDelayMs(data.max_delay_ms ?? 10000);
                setDailyLimitPerUser(data.daily_limit_per_user ?? 5);
                setKeywords(data.keywords ?? {});
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const updateSettings = async (updates: Record<string, unknown>) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings saved' });
                loadSettings();
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleAddKeyword = async () => {
        if (!newKeyword.trim() || !newResponse.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/keywords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: newKeyword, response: newResponse }),
            });
            if (res.ok) {
                setNewKeyword('');
                setNewResponse('');
                loadSettings();
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to add keyword' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteKeyword = async (keyword: string) => {
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/keywords/${encodeURIComponent(keyword)}`, { method: 'DELETE' });
            loadSettings();
        } catch {
            setMessage({ type: 'error', text: 'Failed to delete keyword' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm md:text-base text-muted-foreground">Configure bot behavior</p>
            </div>

            {message && (
                <Alert className={message.type === 'success' ? 'bg-primary/20 border-primary' : 'bg-destructive/20 border-destructive'}>
                    {message.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Bot Settings */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Bot Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium">Auto-Reply</p>
                                <p className="text-sm text-muted-foreground">Respond to keywords automatically</p>
                            </div>
                            <Switch
                                checked={autoReplyEnabled}
                                onCheckedChange={(checked) => {
                                    setAutoReplyEnabled(checked);
                                    updateSettings({ auto_reply_enabled: checked });
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Away Message</p>
                                    <p className="text-sm text-muted-foreground">Send when outside operating hours</p>
                                </div>
                            </div>
                            <Switch
                                checked={awayEnabled}
                                onCheckedChange={(checked) => {
                                    setAwayEnabled(checked);
                                    updateSettings({ away_enabled: checked });
                                }}
                            />
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <p className="font-medium">Operating Hours</p>
                                <Badge variant={isOperating ? 'default' : 'secondary'} className={isOperating ? 'bg-primary text-primary-foreground' : ''}>
                                    {isOperating ? 'Open' : 'Closed'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={operatingStart}
                                    onChange={(e) => setOperatingStart(parseInt(e.target.value))}
                                    min="0"
                                    max="23"
                                    className="w-20"
                                />
                                <span className="text-sm">:00 -</span>
                                <Input
                                    type="number"
                                    value={operatingEnd}
                                    onChange={(e) => setOperatingEnd(parseInt(e.target.value))}
                                    min="0"
                                    max="23"
                                    className="w-20"
                                />
                                <span className="text-sm">:00</span>
                                <Button
                                    size="sm"
                                    onClick={() => updateSettings({ operating_start: operatingStart, operating_end: operatingEnd })}
                                    disabled={saving}
                                    className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Away Message</label>
                            <Textarea
                                value={awayMessage}
                                onChange={(e) => setAwayMessage(e.target.value)}
                                placeholder="Message when outside operating hours..."
                                className="mt-1 min-h-[80px]"
                            />
                            <Button
                                size="sm"
                                onClick={() => updateSettings({ away_message: awayMessage })}
                                disabled={saving}
                                className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                Save Away Message
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Rate Limits */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Gauge className="w-5 h-5" />
                            Rate Limits
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Control message sending speed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Min Delay (seconds)</label>
                                <Input
                                    type="number"
                                    value={minDelayMs / 1000}
                                    onChange={(e) => setMinDelayMs(parseInt(e.target.value) * 1000)}
                                    min="1"
                                    max="60"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Max Delay (seconds)</label>
                                <Input
                                    type="number"
                                    value={maxDelayMs / 1000}
                                    onChange={(e) => setMaxDelayMs(parseInt(e.target.value) * 1000)}
                                    min="1"
                                    max="60"
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Daily Limit per User</label>
                            <Input
                                type="number"
                                value={dailyLimitPerUser}
                                onChange={(e) => setDailyLimitPerUser(parseInt(e.target.value))}
                                min="1"
                                max="100"
                                className="mt-1 w-32"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Maximum system messages per user per day
                            </p>
                        </div>

                        <Button
                            onClick={() => updateSettings({
                                min_delay_ms: minDelayMs,
                                max_delay_ms: maxDelayMs,
                                daily_limit_per_user: dailyLimitPerUser
                            })}
                            disabled={saving}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Save Rate Limits
                        </Button>

                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium mb-1">Current Settings:</p>
                            <ul className="text-muted-foreground space-y-1">
                                <li>• Delay: {minDelayMs / 1000}s - {maxDelayMs / 1000}s random</li>
                                <li>• Max {dailyLimitPerUser} system messages/user/day</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Keywords */}
                <Card className="lg:col-span-2">
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Keywords
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Auto-reply keywords and responses
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    placeholder="Keyword (e.g. info)"
                                />
                                <Textarea
                                    value={newResponse}
                                    onChange={(e) => setNewResponse(e.target.value)}
                                    placeholder="Response message"
                                    className="min-h-[60px]"
                                />
                                <Button
                                    onClick={handleAddKeyword}
                                    disabled={!newKeyword.trim() || !newResponse.trim() || saving}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Keyword
                                </Button>
                            </div>

                            <ScrollArea className="h-[180px]">
                                <div className="space-y-2 pr-4">
                                    {Object.entries(keywords).map(([kw, resp]) => (
                                        <div key={kw} className="p-3 bg-muted/50 rounded-lg border">
                                            <div className="flex items-start justify-between gap-2">
                                                <Badge variant="outline" className="shrink-0">{kw}</Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteKeyword(kw)}
                                                    disabled={saving}
                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{resp}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
