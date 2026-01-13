"use client";

import { cn } from "@/lib/utils";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface ReactorKnobProps {
    maxLimit?: number; // The user's total balance
    onChange?: (value: number) => void;
    token?: string;
    decimals?: number;
    options?: Array<{ label: string, value: any, balance?: string }>;
    selectedOptionIndex?: number;
    onOptionChange?: (index: number) => void;
}

export default function ReactorKnob({
    maxLimit = 100,
    onChange,
    token = "EGLD",
    decimals = 2,
    options,
    selectedOptionIndex,
    onOptionChange
}: ReactorKnobProps) {
    // --- CONFIGURATION ---
    const MIN_DEG = -135;
    const MAX_DEG = 135;
    const TOTAL_TICKS = 40;
    const DEGREES_PER_TICK = (MAX_DEG - MIN_DEG) / TOTAL_TICKS;

    // --- STATE & PHYSICS ---
    const [isDragging, setIsDragging] = useState(false);

    // 1. RAW ANGLE: The exact, unsnapped position of your mouse (For the Light)
    const rawRotation = useMotionValue(45); // Start at 2/3 (45 deg)

    useEffect(() => {
        if (onChange) {
            const initialVal = (45 - MIN_DEG) / (MAX_DEG - MIN_DEG) * maxLimit;
            const rounded = Number(initialVal.toFixed(decimals));
            onChange(rounded);
        }
    }, [maxLimit, decimals]);

    // 2. SNAPPED ANGLE: The position of the mechanical knob (For the Physical Body)
    const snappedRotation = useMotionValue(45);

    // 3. SMOOTHED PHYSICS: Adds weight/inertia to the knob movement
    const smoothRotation = useSpring(snappedRotation, {
        stiffness: 400,
        damping: 35,
        mass: 0.8
    });

    // --- TRANSFORMATIONS ---

    // Display Value (0 to maxLimit) based on the PHYSICAL knob position
    const displayValue = useTransform(smoothRotation, [MIN_DEG, MAX_DEG], [0, maxLimit]);

    // Light Opacity based on the RAW mouse position (Instant Feedback)
    const lightOpacity = useTransform(rawRotation, [MIN_DEG, MAX_DEG], [0.05, 0.5]);

    // Light Blur Radius (Grows as energy increases)
    const lightBlur = useTransform(rawRotation, [MIN_DEG, MAX_DEG], ["0px", "20px"]);

    // --- INTERACTION LOGIC ---
    const knobRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
    }, []);

    // --- AUDIO FEEDBACK ---
    const lastTickRef = useRef<number>(45); // Start at initial rotation
    const audioContextRef = useRef<AudioContext | null>(null);

    const playTick = useCallback(() => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            // Mechanical Click Sound
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);

            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {
            // Ignore audio errors (e.g. autoplay prevention)
        }
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (e: PointerEvent) => {
            if (!knobRef.current) return;

            const rect = knobRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const x = e.clientX - centerX;
            const y = e.clientY - centerY;

            // Calculate Angle
            let rads = Math.atan2(y, x);
            let degs = rads * (180 / Math.PI) + 90;

            // Normalize
            if (degs > 180) degs -= 360;

            // Constraints
            if (degs < MIN_DEG && degs > -180) degs = MIN_DEG;
            if (degs > MAX_DEG) degs = MAX_DEG;

            // 1. UPDATE RAW (Instant Light)
            rawRotation.set(degs);

            // 2. UPDATE SNAPPED (Mechanical Knob)
            const snap = Math.round(degs / DEGREES_PER_TICK) * DEGREES_PER_TICK;

            // Only update and play sound if we moved to a new tick
            if (Math.abs(snap - lastTickRef.current) > 0.1) {
                snappedRotation.set(snap);
                lastTickRef.current = snap;
                playTick();
            }
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [isDragging, rawRotation, snappedRotation, DEGREES_PER_TICK, MAX_DEG, MIN_DEG, playTick]);

    // Generate tick marks
    const ticks = Array.from({ length: TOTAL_TICKS + 1 });

    return (
        // CONTAINER (Adjusted to not be full screen fixed, but relative to parent)
        <div className="relative w-full h-[400px] flex flex-col items-center justify-center overflow-visible bg-transparent">



            {/* COMPONENT WRAPPER */}
            <div className="relative z-10 scale-110 md:scale-125">

                <div className="relative w-64 h-64 select-none">

                    {/* Background Glow (Linked to Raw Input) */}
                    <motion.div
                        className="absolute inset-0 bg-orange-500 rounded-full blur-3xl transition-opacity duration-75"
                        style={{ opacity: lightOpacity }}
                    />

                    {/* --- TICK MARKS RING --- */}
                    <div className="absolute inset-0 pointer-events-none">
                        {ticks.map((_, i) => {
                            const angle = (i / TOTAL_TICKS) * (MAX_DEG - MIN_DEG) + MIN_DEG;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 left-1/2 w-1 h-full -translate-x-1/2"
                                    style={{ transform: `rotate(${angle}deg)` }}
                                >
                                    <TickMark currentRotation={smoothRotation} angle={angle} />
                                </div>
                            );
                        })}
                    </div>

                    {/* --- THE KNOB --- */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40">
                        <motion.div
                            ref={knobRef}
                            className={`relative w-full h-full rounded-full touch-none z-20 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                            style={{ rotate: smoothRotation }}
                            onPointerDown={handlePointerDown}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Knob Body */}
                            <div className="w-full h-full rounded-full bg-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-neutral-800 flex items-center justify-center relative overflow-hidden">

                                {/* Brushed Metal Texture */}
                                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%),conic-gradient(from_0deg,transparent_0deg,#000_360deg)]" />

                                {/* Top Cap */}
                                <div className="relative w-24 h-24 rounded-full bg-neutral-950 shadow-[inset_0_2px_5px_rgba(0,0,0,1)] border border-neutral-800/50 flex items-center justify-center">

                                    {/* Orange Indicator Line */}
                                    <motion.div
                                        className="absolute top-3 w-1.5 h-5 bg-orange-500 rounded-full"
                                        style={{ boxShadow: useTransform(rawRotation, (r) => `0 0 ${Math.max(5, (r + 135) / 10)}px orange`) }}
                                    />

                                    <div className="flex flex-col items-center mt-4 opacity-50">
                                        <span className="font-mono text-[10px] text-neutral-500 tracking-widest">{token}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 flex flex-col items-center w-full min-w-[300px] z-50">
                        {options && options.length > 1 && onOptionChange && typeof selectedOptionIndex === 'number' ? (
                            <StyledDropdown
                                options={options}
                                selectedIndex={selectedOptionIndex}
                                onChange={onOptionChange}
                            />
                        ) : (
                            <span className="text-[10px] text-neutral-600 font-mono tracking-[0.2em] mb-1">{token} OUTPUT</span>
                        )}
                        <DisplayValue
                            value={displayValue}
                            onChange={onChange}
                            token={token}
                            decimals={decimals}
                            onManualUpdate={(val) => {
                                const degs = ((val / maxLimit) * (MAX_DEG - MIN_DEG)) + MIN_DEG;
                                snappedRotation.set(degs);
                                rawRotation.set(degs);
                            }}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}

function TickMark({ currentRotation, angle }: { currentRotation: any, angle: number }) {
    const opacity = useTransform(currentRotation, (r: number) => {
        return r >= angle ? 1 : 0.2;
    });
    const color = useTransform(currentRotation, (r: number) => {
        return r >= angle ? "#f97316" : "#404040";
    });
    const boxShadow = useTransform(currentRotation, (r: number) => {
        return r >= angle ? "0 0 8px rgba(249, 115, 22, 0.6)" : "none";
    });

    return (
        <motion.div
            style={{ backgroundColor: color, opacity, boxShadow }}
            className="w-1 h-2.5 rounded-full transition-colors duration-75"
        />
    );
}


function StyledDropdown({
    options,
    selectedIndex,
    onChange
}: {
    options: Array<{ label: string, value: any, balance?: string }>,
    selectedIndex: number,
    onChange: (index: number) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options[selectedIndex];

    return (
        <div className="relative mb-3 z-50" ref={dropdownRef}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 bg-black/80 backdrop-blur-md border border-orange-500/30 text-orange-500 pl-4 pr-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all group min-w-[200px]"
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex flex-col items-start">
                    <span className="text-[10px] text-neutral-500 font-mono tracking-widest leading-none mb-0.5">POSITION</span>
                    <span className="text-xs font-bold font-mono tracking-wider">{selectedOption.label}</span>
                </div>

                <div className="flex items-center gap-2 pl-3 border-l border-orange-500/20">
                    <span className="text-[10px] text-neutral-400 font-mono">{selectedOption.balance}</span>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 w-full mb-2 bg-neutral-900/95 backdrop-blur-xl border border-orange-500/20 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[200px] overflow-y-auto no-scrollbar ring-1 ring-white/5"
                    >
                        {options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    onChange(idx);
                                    setIsOpen(false);
                                }}
                                className={`flex flex-col items-start px-4 py-2.5 text-left transition-colors border-b border-white/5 last:border-none hover:bg-white/5 ${selectedIndex === idx ? 'bg-orange-500/10' : ''}`}
                            >
                                <span className={`text-xs font-bold font-mono tracking-wider ${selectedIndex === idx ? 'text-orange-500' : 'text-neutral-300'}`}>
                                    {opt.label}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                    Balance: {opt.balance || '0.00'}
                                </span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DisplayValue({
    value,
    onChange,
    onManualUpdate,
    token,
    decimals
}: {
    value: any,
    onChange?: (val: number) => void,
    onManualUpdate: (val: number) => void,
    token: string,
    decimals: number
}) {
    const [display, setDisplay] = useState(value.get());
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState("");

    useMotionValueEvent(value, "change", (latest) => {
        const val = latest as number;
        // Ensure the value passed to the parent is exactly what is displayed (rounded to decimals)
        const rounded = Number(val.toFixed(decimals));
        setDisplay(val);
        if (onChange) onChange(rounded);
    });

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInputValue(display.toFixed(decimals));
        setIsEditing(true);
    };

    const handleInputBlur = () => {
        const val = parseFloat(inputValue);
        if (!isNaN(val)) {
            onManualUpdate(val);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    // Helper to format number
    const format = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

    return (
        <div className="relative text-center min-w-[240px] group flex flex-col items-center">
            <div className="relative flex items-center justify-center gap-3">
                {isEditing ? (
                    <input
                        autoFocus
                        type="number"
                        step="0.01"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        className="bg-neutral-900 border border-orange-500/50 text-orange-500 font-mono text-3xl font-black w-40 text-center rounded outline-none shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                    />
                ) : (
                    <>
                        <span className="absolute inset-0 blur-sm text-orange-500/50 font-mono text-3xl font-black tabular-nums tracking-widest pointer-events-none">
                            {format(display)}
                        </span>
                        <span className="relative font-mono text-3xl text-orange-500 font-black tabular-nums tracking-widest">
                            {format(display)}
                        </span>
                    </>
                )}

                <span className="text-sm text-neutral-600 font-mono font-bold">{token}</span>

                {!isEditing && (
                    <button
                        onClick={handleEditClick}
                        className="p-1.5 rounded-md bg-neutral-800/50 border border-neutral-700/50 text-neutral-500 hover:text-orange-500 hover:border-orange-500/30 transition-all opacity-0 group-hover:opacity-100 pointer-events-auto"
                        title="Edit Amount"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="mt-1 h-1 w-24 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent rounded-full" />
        </div>
    );
}
