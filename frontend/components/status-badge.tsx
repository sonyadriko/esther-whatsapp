'use client';

import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface StatusBadgeProps {
    connected: boolean;
}

export function StatusBadge({ connected }: StatusBadgeProps) {
    return (
        <Badge
            variant={connected ? 'default' : 'destructive'}
            className={`${connected ? 'bg-[#A8DF8E] text-gray-800 hover:bg-[#8ecf75]' : ''} flex items-center gap-2 px-3 py-1.5`}
        >
            {connected ? (
                <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Connected</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Disconnected</span>
                </>
            )}
        </Badge>
    );
}
