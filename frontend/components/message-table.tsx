'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ArrowDownLeft, ArrowUpRight, Inbox } from 'lucide-react';
import type { Message } from '@/lib/api';

interface MessageTableProps {
    messages: Message[];
    loading?: boolean;
}

export function MessageTable({ messages, loading = false }: MessageTableProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl">Messages</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (messages.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Recent Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
                <ScrollArea className="w-full">
                    <div className="min-w-[600px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Direction</TableHead>
                                    <TableHead className="w-[80px]">Type</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead className="w-[80px]">Status</TableHead>
                                    <TableHead className="w-[150px]">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((msg) => (
                                    <TableRow key={msg.id}>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${msg.direction === 'outgoing' ? 'bg-[#A8DF8E] text-gray-800' : 'bg-[#FFD8DF] text-gray-800'}`}
                                            >
                                                {msg.direction === 'incoming' ? (
                                                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                                )}
                                                {msg.direction}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{msg.message_type}</span>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs md:text-sm truncate max-w-[200px] md:max-w-[300px]">{msg.content || '-'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    msg.status === 'read'
                                                        ? 'default'
                                                        : msg.status === 'delivered'
                                                            ? 'secondary'
                                                            : msg.status === 'failed'
                                                                ? 'destructive'
                                                                : 'outline'
                                                }
                                                className={`text-xs ${msg.status === 'read' || msg.status === 'delivered' ? 'bg-[#A8DF8E] text-gray-800' : ''}`}
                                            >
                                                {msg.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(msg.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
