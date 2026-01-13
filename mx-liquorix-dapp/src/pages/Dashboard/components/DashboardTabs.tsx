import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from "framer-motion";

interface DashboardTabsProps {
    activeTab: 'stake' | 'unstake' | 'examine' | 'swap';
    onTabChange: (tab: 'stake' | 'unstake' | 'examine' | 'swap') => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
    const tabs = [
        { id: 'stake', label: 'Deposit' },
        { id: 'unstake', label: 'Withdraw' },
        { id: 'examine', label: 'Examine' },
    ] as const;

    return (
        <div
            className="flex items-center justify-center mb-12 overflow-x-auto whitespace-nowrap px-4 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <div className="flex items-center bg-neutral-900/50 backdrop-blur-md p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-white/5 shadow-2xl w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center relative">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id as any)}
                            className={cn(
                                "relative flex-1 md:flex-none px-3 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-bold tracking-wide md:tracking-widest transition-colors duration-300 uppercase text-center z-10",
                                activeTab === tab.id ? "text-black" : "text-neutral-500 hover:text-orange-500/80"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-orange-500 rounded-lg md:rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] z-[-1]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Divider - Visible on all screens */}
                <div className="w-px h-4 md:h-8 bg-orange-500 mx-1 md:mx-2 shrink-0 opacity-50 md:opacity-100" />

                <button
                    onClick={() => onTabChange('swap')}
                    className={cn(
                        "relative flex-none px-4 md:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:text-sm font-bold tracking-wide md:tracking-widest transition-all duration-300 uppercase flex items-center justify-center gap-1 md:gap-2 z-10",
                        activeTab === 'swap'
                            ? "text-black"
                            : "text-neutral-500 hover:text-orange-500"
                    )}
                >
                    <FontAwesomeIcon icon={faExchangeAlt} className={cn("text-[10px] md:text-xs", activeTab !== 'swap' && "text-orange-500")} />
                    Swap
                    {activeTab === 'swap' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-orange-500 rounded-lg md:rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] z-[-1]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
