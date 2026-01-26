'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Bot, LayoutDashboard, MessageSquare, Users, Settings, Send, Clock, FileText, Smartphone, Megaphone } from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Smartphone },
    { name: 'Send Message', href: '/send', icon: Send },
    { name: 'Broadcast', href: '/broadcast', icon: Megaphone },
    { name: 'Scheduled', href: '/schedule', icon: Clock },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar className="border-r border-sidebar-border">
            <SidebarHeader className="p-4 bg-sidebar">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-sidebar-foreground">Esther Bot</h1>
                            <p className="text-xs text-sidebar-foreground/70">Multi-Account WhatsApp</p>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-sidebar">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider">
                        Navigation
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            className={`${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}`}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 bg-sidebar">
                <div className="text-xs text-sidebar-foreground/70">
                    Made with Whatsmeow + Go
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
