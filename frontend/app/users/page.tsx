'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUsers, User } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Users as UsersIcon, ChevronRight } from 'lucide-react';

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchUsers();
                setUsers(data.users || []);
            } catch (err) {
                console.error('Failed to load users:', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-sm md:text-base text-muted-foreground">All users who have interacted with the bot</p>
                </div>
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
                <p className="text-sm md:text-base text-muted-foreground">Click on a user to view details and chat history</p>
            </div>

            {users.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No users yet</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg md:text-xl">User List ({users.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 md:p-6 md:pt-0">
                        <ScrollArea className="w-full">
                            <div className="min-w-[600px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Message</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow
                                                key={user.id}
                                                className="cursor-pointer hover:bg-[#F0FFDF]"
                                                onClick={() => router.push(`/users/${user.id}`)}
                                            >
                                                <TableCell className="font-mono text-xs md:text-sm">{user.phone}</TableCell>
                                                <TableCell className="text-xs md:text-sm">{user.name || '-'}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Badge
                                                            variant={user.blocked ? 'destructive' : 'default'}
                                                            className={`text-xs ${user.blocked ? '' : 'bg-[#A8DF8E] text-gray-800'}`}
                                                        >
                                                            {user.blocked ? '🚫' : '✓'}
                                                        </Badge>
                                                        {user.notes && (
                                                            <Badge variant="outline" className="text-xs">
                                                                📝
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {user.last_user_message_at
                                                        ? new Date(user.last_user_message_at).toLocaleString()
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
            )}
        </div>
    );
}
