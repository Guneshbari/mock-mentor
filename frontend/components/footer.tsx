export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-8 md:flex md:items-center md:justify-between">
                <div className="mt-8 md:order-1 md:mt-0">
                    <p className="text-center text-xs leading-5 text-muted-foreground">
                        &copy; {new Date().getFullYear()} Mock Mentor AI. All rights reserved.
                    </p>
                </div>
                <div className="flex justify-center space-x-6 md:order-2">
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                        Privacy Policy
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                        Terms of Service
                    </a>
                </div>
            </div>
        </footer>
    );
}
