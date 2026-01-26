import { QRCodeDisplay } from '@/components/qr-code-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">WhatsApp Login</h1>
                <p className="text-sm md:text-base text-muted-foreground">Connect your WhatsApp account</p>
            </div>

            <QRCodeDisplay />

            <Alert className="max-w-md mx-auto">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm md:text-base">How it works</AlertTitle>
                <AlertDescription>
                    <ul className="mt-2 space-y-1 text-xs md:text-sm">
                        <li>• Your session is stored locally in <code className="bg-muted px-1 rounded text-xs">wa_session.db</code></li>
                        <li>• You only need to scan once</li>
                        <li>• Session persists across restarts</li>
                        <li>• To logout, delete the session file</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}
