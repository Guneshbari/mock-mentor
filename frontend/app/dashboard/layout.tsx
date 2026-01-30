export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen pt-16">
            <main className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </main>
        </div>
    );
}
