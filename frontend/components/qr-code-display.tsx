'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getQRWebSocketURL } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Smartphone, RefreshCw } from 'lucide-react';

interface QRMessage {
    type: 'qr' | 'success' | 'timeout' | 'error' | 'connected';
    code?: string;
}

type Status = 'connecting' | 'waiting' | 'success' | 'error' | 'connected';

export function QRCodeDisplay() {
    const [qrCode, setQRCode] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>('connecting');
    const [message, setMessage] = useState('Connecting to server...');
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            try {
                const ws = new WebSocket(getQRWebSocketURL());
                wsRef.current = ws;

                ws.onopen = () => {
                    setStatus('waiting');
                    setMessage('Scan QR code with WhatsApp');
                };

                ws.onmessage = (event) => {
                    const data: QRMessage = JSON.parse(event.data);

                    switch (data.type) {
                        case 'qr':
                            setQRCode(data.code || null);
                            setStatus('waiting');
                            setMessage('Scan QR code with WhatsApp');
                            break;
                        case 'success':
                            setStatus('success');
                            setMessage('Connected successfully!');
                            setQRCode(null);
                            break;
                        case 'connected':
                            setStatus('connected');
                            setMessage('Already connected');
                            setQRCode(null);
                            break;
                        case 'timeout':
                            setStatus('error');
                            setMessage('QR code expired. Click refresh to try again.');
                            setQRCode(null);
                            break;
                        case 'error':
                            setStatus('error');
                            setMessage(data.code || 'An error occurred');
                            break;
                    }
                };

                ws.onerror = () => {
                    setStatus('error');
                    setMessage('Connection error. Is the backend running?');
                };

                ws.onclose = () => {
                    if (status !== 'success' && status !== 'connected') {
                        setStatus('error');
                        setMessage('Connection closed');
                    }
                };
            } catch {
                setStatus('error');
                setMessage('Failed to connect to WebSocket');
            }
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <Card className="w-full max-w-sm md:max-w-md mx-auto">
            <CardHeader className="text-center p-4 md:p-6">
                <CardTitle className="text-xl md:text-2xl">WhatsApp Login</CardTitle>
                <CardDescription className="text-sm">{message}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
                {status === 'connecting' && (
                    <div className="w-48 h-48 md:w-64 md:h-64 bg-[#F0FFDF] rounded-xl flex items-center justify-center">
                        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-[#A8DF8E]" />
                    </div>
                )}

                {status === 'waiting' && qrCode && (
                    <div className="p-3 md:p-4 bg-white border-4 border-[#A8DF8E] rounded-xl">
                        <QRCodeSVG value={qrCode} size={180} className="md:hidden" />
                        <QRCodeSVG value={qrCode} size={224} className="hidden md:block" />
                    </div>
                )}

                {status === 'success' && (
                    <div className="w-48 h-48 md:w-64 md:h-64 bg-[#F0FFDF] rounded-xl flex flex-col items-center justify-center">
                        <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-[#A8DF8E] mb-2" />
                        <p className="text-[#6bc55f] font-medium text-sm md:text-base">Connected!</p>
                    </div>
                )}

                {status === 'connected' && (
                    <div className="w-48 h-48 md:w-64 md:h-64 bg-[#F0FFDF] rounded-xl flex flex-col items-center justify-center">
                        <Smartphone className="w-12 h-12 md:w-16 md:h-16 text-[#A8DF8E] mb-2" />
                        <p className="text-[#6bc55f] font-medium text-sm md:text-base">Already Connected</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="w-48 h-48 md:w-64 md:h-64 bg-[#FFD8DF] rounded-xl flex flex-col items-center justify-center">
                        <XCircle className="w-12 h-12 md:w-16 md:h-16 text-[#FFAAB8] mb-4" />
                        <Button onClick={handleRefresh} className="bg-[#FFAAB8] hover:bg-[#ff8a9b] text-gray-800" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                )}

                <Alert className="bg-[#F0FFDF] border-[#A8DF8E]">
                    <AlertDescription className="text-xs md:text-sm text-gray-600">
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Open WhatsApp on your phone</li>
                            <li>Tap Menu → Linked Devices</li>
                            <li>Tap Link a Device</li>
                            <li>Scan this QR code</li>
                        </ol>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
