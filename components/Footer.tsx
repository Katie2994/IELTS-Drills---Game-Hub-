import React from 'react';

interface FooterProps {
    filteredCount: number;
    totalCount: number;
}

const Footer: React.FC<FooterProps> = ({ filteredCount, totalCount }) => {
    return (
        <footer 
            className="w-full text-center text-white/50 text-xs tracking-wider space-y-1 pb-8"
            style={{ fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
        >
            <p>
                Showing {filteredCount} of {totalCount} games
            </p>
            <p>
                Developed by <a href="https://www.facebook.com/lethikieu.trinh1994" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-colors">Ms. Trinh Lê</a> | A project by <a href="https://ieltsdrills.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-colors">IELTS Drills</a>
            </p>
            <p>
                Copyright 2026 © <a href="https://drills.vn/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-colors">drills.vn</a>
            </p>
        </footer>
    );
};

export default Footer;
