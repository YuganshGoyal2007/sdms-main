import React from "react";

interface State { hasError: boolean; error: Error | null; }

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("AppErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                    <div className="bg-white border-2 border-red-200 rounded-lg p-6 max-w-2xl">
                        <h1 className="text-2xl font-bold text-red-900 mb-2">Something went wrong</h1>
                        <p className="text-sm text-red-700 mb-3">The app crashed. Reload the page to recover.</p>
                        <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto max-h-64 text-red-900 whitespace-pre-wrap">
                            {this.state.error?.message}
                            {"\n\n"}
                            {this.state.error?.stack}
                        </pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
