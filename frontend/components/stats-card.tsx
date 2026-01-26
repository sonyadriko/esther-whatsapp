'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'mint' | 'coral' | 'blush' | 'cream';
}

const variantStyles = {
    mint: 'from-[#A8DF8E] to-[#7ed56f]',
    coral: 'from-[#FFAAB8] to-[#ff8a9b]',
    blush: 'from-[#FFD8DF] to-[#ffb8c5]',
    cream: 'from-[#F0FFDF] to-[#d8f0c0]',
};

export function StatsCard({ title, value, icon: Icon, variant = 'mint' }: StatsCardProps) {
    return (
        <Card className={`bg-gradient-to-br ${variantStyles[variant]} border-0 shadow-lg`}>
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between text-gray-800">
                    <div className="min-w-0">
                        <p className="text-gray-700 text-xs md:text-sm font-medium truncate">{title}</p>
                        <p className="text-xl md:text-3xl font-bold mt-1">{value}</p>
                    </div>
                    <Icon className="w-6 h-6 md:w-10 md:h-10 opacity-70 shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}
