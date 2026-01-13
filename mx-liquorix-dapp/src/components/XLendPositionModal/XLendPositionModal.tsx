import React from 'react';
import { xLendImageBaseUrl } from '@/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

interface XLendPositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    nonce: number;
}

export const XLendPositionModal = ({ isOpen, onClose, nonce }: XLendPositionModalProps) => {
    if (!isOpen) return null;

    // URL construction
    const imageUrl = `${xLendImageBaseUrl}${nonce}`;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full transform transition-all animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                        xLend Position
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
                    <div className="relative group rounded-xl overflow-hidden shadow-lg border border-white/10">
                        {/* Loading Placeholder */}
                        <div className="absolute inset-0 bg-neutral-900 animate-pulse -z-10" />

                        <img
                            src={imageUrl}
                            alt={`xLend Position #${nonce}`}
                            className="w-full h-auto max-h-[500px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                            onError={(e) => {
                                // Fallback styling if image fails
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('min-h-[200px]', 'flex', 'items-center', 'justify-center');
                                const span = document.createElement('span');
                                span.textContent = 'Image Unavailable';
                                span.className = 'text-neutral-500 font-medium';
                                e.currentTarget.parentElement?.appendChild(span);
                            }}
                        />
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold tracking-wider">
                            NONCE #{nonce}
                        </span>
                        <p className="text-neutral-500 text-sm">
                            Your generated position NFT art
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
