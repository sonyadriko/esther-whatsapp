'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStats, fetchStatus, StatsResponse, StatusResponse } from '@/lib/api';
import { Users, MessageSquare, ArrowDownLeft, ArrowUpRight, QrCode, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, statusData] = await Promise.all([
          fetchStats(),
          fetchStatus(),
        ]);
        setStats(statsData);
        setStatus(statusData);
        setError(null);
      } catch {
        setError('Failed to load data. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 md:h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error}
            <p className="mt-2 text-sm opacity-80">
              Make sure the Go backend is running on port 8080
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">WhatsApp Bot Overview</p>
        </div>
        <StatusBadge connected={status?.connected || false} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          variant="mint"
        />
        <StatsCard
          title="Total Messages"
          value={stats?.total_messages || 0}
          icon={MessageSquare}
          variant="coral"
        />
        <StatsCard
          title="Incoming"
          value={stats?.incoming_messages || 0}
          icon={ArrowDownLeft}
          variant="blush"
        />
        <StatsCard
          title="Outgoing"
          value={stats?.outgoing_messages || 0}
          icon={ArrowUpRight}
          variant="cream"
        />
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-sm">Common operations for your WhatsApp bot</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <Button asChild variant="outline" className="h-auto py-3 md:py-4 justify-start hover:bg-[#F0FFDF] border-[#A8DF8E]">
              <Link href="/login" className="flex items-center gap-3">
                <QrCode className="w-6 h-6 md:w-8 md:h-8 text-[#7ed56f] shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm md:text-base">Connect WhatsApp</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Scan QR code to login</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 md:py-4 justify-start hover:bg-[#FFD8DF] border-[#FFAAB8]">
              <Link href="/messages" className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-[#FFAAB8] shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm md:text-base">View Messages</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">See message history</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 md:py-4 justify-start hover:bg-[#F0FFDF] border-[#A8DF8E]">
              <Link href="/users" className="flex items-center gap-3">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-[#7ed56f] shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm md:text-base">Manage Users</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">View user list</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-[#FFAAB8] bg-[#FFD8DF]">
        <AlertTriangle className="h-4 w-4 text-[#ff8a9b]" />
        <AlertTitle className="text-gray-800 text-sm md:text-base">Important Rules</AlertTitle>
        <AlertDescription className="text-gray-700">
          <ul className="mt-2 space-y-1 text-xs md:text-sm">
            <li>• Reply to user messages = ✅ Always safe</li>
            <li>• System notification = Max 1x per user per 24 hours</li>
            <li>• Operating hours = 08:00 - 20:00</li>
            <li>• Promo/Broadcast = 🚫 PROHIBITED</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
