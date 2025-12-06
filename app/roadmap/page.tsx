// app/roadmap/page.tsx

"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Send, Loader2, ListOrdered } from 'lucide-react';

interface RoadmapStep {
    month: string;
    action: string;
}

interface RoadmapData {
    roadmapTitle: string;
    steps: RoadmapStep[];
}

export default function RoadmapPage() {
    const [uniName, setUniName] = useState('');
    const [major, setMajor] = useState('');
    const [grade, setGrade] = useState('');
    const [goal, setGoal] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setRoadmap(null);

        if (!uniName || !major || !grade) {
            setError("Please fill all required fields (University, Major, Grade).");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniName, major, grade, goal }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to get data from AI.');
            }

            if (!data.steps || !Array.isArray(data.steps)) {
                throw new Error('AI returned invalid Roadmap format.');
            }

            setRoadmap(data);

        } catch (err: any) {
            console.error("Roadmap Fetch Error:", err);
            setError(err.message || 'Could not generate roadmap.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 sm:p-10 text-slate-900">
            {/* Navigation */}
            <header className="mb-8">
                <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition">
                    <ChevronLeft size={20} className="mr-1" />
                    <span className="font-medium">Home</span>
                </Link>
            </header>

            <h1 className="text-4xl font-extrabold text-slate-900 mb-6 flex items-center">
                <ListOrdered size={32} className="mr-3 text-blue-600" />
                AI Roadmap: Admission Plan
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl">
                Enter your details, and our AI consultant will create a personalized, step-by-step admission plan.
            </p>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Input Form */}
                <div className="lg:w-1/3 p-6 bg-white rounded-xl shadow-lg h-fit border border-slate-200">
                    <h2 className="text-2xl font-bold mb-5 text-slate-800">Your Data</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input
                            type="text"
                            placeholder="Target University (e.g., Nazarbayev University)"
                            value={uniName}
                            onChange={(e) => setUniName(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Desired Major (e.g., Computer Science)"
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Current Grade/Year (e.g., 10th Grade)"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <textarea
                            placeholder="Specific Goal (e.g., Secure a state grant)"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold transition shadow-md ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin mr-2" />
                            ) : (
                                <Send size={20} className="mr-2" />
                            )}
                            {loading ? 'Generating...' : 'Generate Roadmap'}
                        </button>
                    </form>
                </div>

                {/* Right Column: Roadmap Result */}
                <div className="lg:w-2/3">
                    <div className="p-8 bg-white rounded-xl shadow-xl border border-slate-200 min-h-[400px]">
                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-20 text-blue-600">
                                <Loader2 size={40} className="animate-spin mx-auto mb-4" />
                                <p className="text-lg font-medium">AI is compiling your personalized plan...</p>
                                <p className="text-sm text-slate-500 mt-2">This may take up to 15 seconds.</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg">
                                <p className="font-bold">An error occurred:</p>
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Result State */}
                        {roadmap && (
                            <>
                                <h2 className="text-3xl font-bold text-slate-900 mb-6">{roadmap.roadmapTitle}</h2>
                                <ol className="space-y-6">
                                    {roadmap.steps.map((step, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold mr-4">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">{step.month}</p>
                                                <p className="text-lg text-slate-800">{step.action}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </>
                        )}

                        {/* Initial State */}
                        {!loading && !roadmap && !error && (
                            <div className="text-center py-20 text-slate-500">
                                <ListOrdered size={40} className="mx-auto mb-4" />
                                <p className="text-lg">Enter your data on the left to start planning.</p>
                                <p className="text-sm mt-2">The plan will account for UNT deadlines and your target university.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}