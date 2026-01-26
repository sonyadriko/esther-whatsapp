'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchUser, fetchUserMessages, updateUser, User, Message } from '@/lib/api';
import { ArrowLeft, Ban, CheckCircle, MessageSquare, Save, User as UserIcon, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadData = async () => {
        try {
            const [userData, messagesData] = await Promise.all([
                fetchUser(id),
                fetchUserMessages(id, 200, 0),
            ]);
            setUser(userData.user);
            setMessages(messagesData.messages || []);
            setNotes(userData.user.notes || '');
            setName(userData.user.name || '');
        } catch (err) {
            console.error('Failed to load user:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const handleSaveNotes = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUser(user.id, { notes, name: name || undefined });
            setMessage({ type: 'success', text: 'User updated successfully' });
            loadData();
        } catch {
            setMessage({ type: 'error', text: 'Failed to update user' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleToggleBlock = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUser(user.id, { blocked: !user.blocked });
            setMessage({ type: 'success', text: user.blocked ? 'User unblocked' : 'User blocked' });
            loadData();
        } catch {
            setMessage({ type: 'error', text: 'Failed to update user' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-64 lg:col-span-1" />
                    <Skeleton className="h-64 lg:col-span-2" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Alert variant="destructive" className="max-w-md">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>User not found</AlertDescription>
                </Alert>
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/users">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Users
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/users">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {user.name || user.phone}
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground font-mono">{user.phone}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge className={user.blocked ? 'bg-red-500' : 'bg-[#A8DF8E] text-gray-800'}>
                        {user.blocked ? '🚫 Blocked' : '✓ Active'}
                    </Badge>
                    <Badge variant="outline">
                        {user.opt_in ? 'Opted In' : 'Opted Out'}
                    </Badge>
                </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* User Info Card */}
                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserIcon className="w-5 h-5" />
                            User Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter name"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes about this user..."
                                className="mt-1 min-h-[100px]"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleSaveNotes}
                                disabled={saving}
                                className="bg-[#A8DF8E] text-gray-800 hover:bg-[#8ecf75]"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                            <Button
                                onClick={handleToggleBlock}
                                disabled={saving}
                                variant={user.blocked ? 'default' : 'destructive'}
                                className={user.blocked ? 'bg-[#A8DF8E] text-gray-800 hover:bg-[#8ecf75]' : ''}
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                {user.blocked ? 'Unblock User' : 'Block User'}
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                            <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                            <p>Last message: {user.last_user_message_at ? new Date(user.last_user_message_at).toLocaleString() : 'Never'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Chat History Card */}
                <Card className="lg:col-span-2">
                    <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Chat History ({messages.length})
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Conversation with this user
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <ScrollArea className="h-[400px] md:h-[500px]">
                            {messages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No messages yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 pr-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-lg p-3 ${msg.direction === 'incoming'
                                                        ? 'bg-white border shadow-sm'
                                                        : 'bg-[#A8DF8E] text-gray-800'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                <div className={`flex items-center gap-2 mt-1 text-xs ${msg.direction === 'incoming' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                                                    <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                                                    <Badge variant="outline" className="text-[10px] py-0">
                                                        {msg.message_type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
