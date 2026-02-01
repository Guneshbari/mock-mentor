import { Navbar } from "@/components/navbar";
import { Hero, Features, Footer } from "@/components/landing/sections";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main>
                <Hero />
                <Features />
            </main>
            <Footer />
        </div>
    );
}
