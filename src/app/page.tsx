import Link from "next/link";
import { mockSpots } from "@/data/mockSpots";
import { MapPin, ArrowRight } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen p-6 max-w-2xl mx-auto">
            <header className="py-12 text-center">
                <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
                    Inbound <span className="text-blue-600">AI Guide</span>
                </h1>
                <p className="mt-4 text-neutral-500 font-medium">
                    Personalized audio stories for your Japanese journey.
                </p>
            </header>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-800">Available Spots</h2>
                {Object.values(mockSpots).map((spot) => (
                    <Link
                        key={spot.id}
                        href={`/spots/${spot.id}`}
                        className="group block relative h-48 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                    >
                        <img
                            src={spot.imageUrl}
                            alt={spot.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 flex items-center gap-1 mb-1">
                                    <MapPin className="w-3 h-3" />
                                    {spot.location}
                                </p>
                                <h3 className="text-xl font-bold">{spot.name}</h3>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-full group-hover:bg-blue-600 transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <footer className="mt-24 py-8 border-t border-neutral-200 text-center text-neutral-400 text-sm">
                <p>© 2024 AI Audio Guide MVP</p>
            </footer>
        </main>
    );
}
