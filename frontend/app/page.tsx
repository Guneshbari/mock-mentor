import { Navbar } from "@/components/navbar";
import { Hero, Features, OpenSourceSection, Footer } from "@/components/landing/sections";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <Hero />
                <Features />
                <OpenSourceSection />
            </main>
            <Footer />
        </div>
    );
}
