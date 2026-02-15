"use client";
import { ReactNode } from "react";

interface DashboardGridProps {
    header: ReactNode;
    sidebar: ReactNode; // Agent Feed
    main: ReactNode;    // Signals + Graph
}

export default function DashboardGrid({ header, sidebar, main }: DashboardGridProps) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
            {/* Top Header takes full width */}
            <div className="flex-shrink-0 z-20 shadow-md">
                {header}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar (Feed) - Fixed width or percentage */}
                <aside className="w-[400px] flex-shrink-0 flex flex-col z-10 shadow-lg">
                    {sidebar}
                </aside>

                {/* Right Main Content */}
                <main className="flex-1 flex flex-col overflow-y-auto bg-card/20 p-6">
                    <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-6">
                        {main}
                    </div>
                </main>
            </div>
        </div>
    );
}
