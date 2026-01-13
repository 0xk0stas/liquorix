import { cn } from "@/lib/utils";
import { useState } from "react";

interface BluetoothKeyProps {
    amount: number;
    onDeposit: (amount: number) => void;
    label?: string;
    token?: string;
}

export const BluetoothKey = ({
    amount,
    onDeposit,
    label = "YIELD NOW",
    token = "EGLD",
    accentColor = "#f97316" // Default orange
}: BluetoothKeyProps & { accentColor?: string }) => {
    const [checked, setChecked] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        // Prevent event bubbling just in case
        e.preventDefault();

        const nextState = !checked;
        setChecked(nextState);

        if (nextState) {
            try {
                await onDeposit(amount);
            } catch (error) {
                console.error("Action failed:", error);
            } finally {
                // Reset toggle after some time or immediately to allow another action
                setTimeout(() => setChecked(false), 1500);
            }
        }
    };

    return (
        <div className="relative inline-block scale-75 md:scale-90 lg:scale-100 group">
            {/* Label - Added pointer-events-none to prevent blocking clicks */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-center">
                <span
                    className="text-xs font-bold tracking-[0.3em] uppercase blur-[0.5px] block transition-colors duration-300"
                    style={{ color: accentColor }}
                >
                    {label}
                </span>
                <span className="text-[10px] font-mono text-neutral-600 tracking-[0.2em]">{token}</span>
            </div>

            <label className="wrap flex items-center justify-center cursor-pointer relative">
                <input
                    aria-label="Action"
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    readOnly
                />

                {/* The "Keyboard Key" Button Body */}
                <button
                    className={cn(
                        "button relative w-32 h-32 rounded-[2rem] transition-all duration-300 transform active:scale-95 flex items-center justify-center",
                        "bg-[#1a1a1a] shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.05),inset_0_-8px_15px_rgba(0,0,0,0.5)]"
                    )}
                    style={{
                        boxShadow: `0 15px 35px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.05), inset 0 -8px 15px rgba(0,0,0,0.5), 0 0 20px ${accentColor}40`,
                        ...(checked ? { boxShadow: `0 0 25px ${accentColor}66, 0 8px 20px rgba(0,0,0,0.8), inset 0 2px 4px ${accentColor}1A, inset 0 -8px 15px rgba(0,0,0,0.5)` } : {})
                    }}
                    onClick={handleToggle}
                >
                    {/* Top Surface / Cap */}
                    <div
                        className={cn(
                            "absolute inset-1.5 rounded-[1.75rem] transition-all duration-300",
                            "bg-gradient-to-b from-[#242424] to-[#121212] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border"
                        )}
                        style={{ borderColor: checked ? `${accentColor}40` : `${accentColor}1A` }}
                    />

                    {/* SVG Content Layer */}
                    <div className="relative z-10 w-16 h-16 flex items-center justify-center pointer-events-none">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="54"
                            height="54"
                            className="z-10 transition-all duration-500"
                            style={{
                                fill: checked ? accentColor : '#666',
                                filter: checked ? `drop-shadow(0 0 12px ${accentColor}CC)` : `drop-shadow(0 0 5px ${accentColor}33)`
                            }}
                        >
                            <path
                                d="M13.125 12L21 7.785L19.648 5.25l-7.354 2.756a.8.8 0 0 1-.588 0L4.352 5.25L3 7.793L10.875 12L3 16.207l1.352 2.543l7.354-2.756a.8.8 0 0 1 .588 0l7.354 2.756L21 16.193z"
                            />
                        </svg>
                    </div>

                    <div className="absolute top-2 left-6 right-6 h-px bg-white/5 rounded-full" />
                </button>

                {/* Status LED Indicator */}
                <div
                    className={cn(
                        "led absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-300"
                    )}
                    style={{
                        backgroundColor: checked ? accentColor : `${accentColor}66`, // Dimmer when off
                        boxShadow: checked ? `0 0 15px ${accentColor}` : `0 0 5px ${accentColor}33`
                    }}
                />
            </label>

            {/* Underglow */}
            <div
                className={cn(
                    "absolute inset-0 -z-10 blur-2xl transition-all duration-500 rounded-full",
                    checked ? "opacity-100 scale-150" : "opacity-60 scale-105"
                )}
                style={{ backgroundColor: `${accentColor}20` }}
            />
        </div>
    );
};
