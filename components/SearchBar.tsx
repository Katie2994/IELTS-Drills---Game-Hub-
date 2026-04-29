import React from 'react';

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="relative mb-8 w-80">
            <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl shadow-lg text-white
                           bg-white/10 backdrop-blur-xl border border-white/20
                           focus:outline-none focus:ring-2 focus:ring-white/50
                           placeholder-white/60 transition-all font-sans"
                style={{ fontFamily: '"Segoe UI", Roboto, sans-serif' }}
                aria-label="Search games"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
    );
};

export default SearchBar;
