export const LiquorixLogoIcon = ({ className }: { className?: string }) => (
    <div className={className}>
        <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Matrix/Cube Frame */}
            <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />

            {/* Liquid Core */}
            <path d="M16 8C16 8 10 14 10 18C10 21.3137 12.6863 24 16 24C19.3137 24 22 21.3137 22 18C22 14 16 8 16 8Z" fill="currentColor" opacity="0.8" />

            {/* Data/Tech Lines */}
            <path d="M16 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 24V30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M28 9L22 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4 9L10 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    </div>
);
