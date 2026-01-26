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
import { FileText, Plus, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    content: string;
    created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState('');
    const [newContent, setNewContent] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const loadTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/api/templates`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch (err) {
            console.error('Failed to load templates:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleAdd = async () => {
        if (!newName.trim() || !newContent.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, content: newContent }),
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
                setNewName('');
                setNewContent('');
                setMessage({ type: 'success', text: 'Template added' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to add template' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/templates/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
                setMessage({ type: 'success', text: 'Template deleted' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to delete template' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleCopy = (template: Template) => {
        navigator.clipboard.writeText(template.content);
        setCopiedId(template.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Templates</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Message templates</p>
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Message Templates</h1>
                <p className="text-sm md:text-base text-muted-foreground">Create reusable message templates</p>
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
                {/* Add Template */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            New Template
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Create a new message template
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Template Name</label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Welcome"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Message Content</label>
                            <Textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Type template content..."
                                className="mt-1 min-h-[150px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Tip: Gunakan {'{nama}'} untuk placeholder
                            </p>
                        </div>
                        <Button
                            onClick={handleAdd}
                            disabled={!newName.trim() || !newContent.trim() || saving}
                            className="w-full bg-[#A8DF8E] text-gray-800 hover:bg-[#8ecf75]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Template
                        </Button>
                    </CardContent>
                </Card>

                {/* Templates List */}
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Templates ({templates.length})
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Click copy to use in messages
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        {templates.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No templates yet</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-3 pr-4">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="p-3 bg-muted/50 rounded-lg border"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <Badge variant="outline">{template.name}</Badge>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopy(template)}
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        {copiedId === template.id ? (
                                                            <CheckCircle className="w-4 h-4 text-[#7ed56f]" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(template.id)}
                                                        disabled={saving}
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {template.content}
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
