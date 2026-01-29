import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface SearchResult {
    score: number;
    metadata: {
        title: string;
        slug: string;
    };
}

export default function SearchModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle with Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleOpenEvent = () => setIsOpen(true);

        window.addEventListener('keydown', handleKeydown);
        window.addEventListener('open-search-modal', handleOpenEvent);
        
        return () => {
            window.removeEventListener('keydown', handleKeydown);
            window.removeEventListener('open-search-modal', handleOpenEvent);
        };
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Cleanup state when closed
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setLoading(false);
        }
    }, [isOpen]);

    // Search Logic (Debounced + Keydown)
    const performSearch = async (searchTerm: string) => {
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
            if (res.ok) {
                const data = await res.json() as SearchResult[];
                setResults(data);
            }
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setLoading(false);
        }
    };

    // Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) performSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Handle Enter Key
    const handleKeyDownInput = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            performSearch(query);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out animate-[slideUp_0.3s_ease-out]">
                
                <style>{`
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                `}</style>
                
                {/* Search Bar */}
                <div className="flex items-center px-4 py-3 border-b border-white/10">
                    <span className="i-heroicons-magnifying-glass text-gray-400 text-xl mr-3"></span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg font-sans"
                        placeholder="Search posts..."
                        value={query}
                        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                        onKeyDown={handleKeyDownInput}
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="ml-2 px-2 py-0.5 text-xs text-gray-500 hover:text-white"
                    >
                        ESC
                    </button>
                </div>

                {/* Content Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    
                    {/* Default State */}
                    {!loading && results.length === 0 && query.length === 0 && (
                        <div className="text-center py-8 text-gray-600 text-sm">
                            <p>Type to search...</p>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-8 text-gray-500 flex items-center justify-center">
                             <span className="i-heroicons-arrow-path animate-spin text-xl mr-2"></span>
                             Searching...
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && results.length === 0 && query.length >= 2 && (
                        <div className="text-center py-8 text-gray-500">
                            No matching signals found.
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-1">
                        {results.map((result) => (
                            <a 
                                href={`/blog/${result.metadata.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl group transition-colors border border-transparent hover:border-white/5"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-white group-hover:text-brand-accent transition-colors">
                                        {result.metadata.title}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-600 font-mono">
                                    {(result.score * 100).toFixed(0)}% MATCH
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
