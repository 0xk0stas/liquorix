"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LiquorixLogoIcon } from "@/components/ui/liquorix-logo";
import { useLiquorixInfo } from "@/hooks/useLiquorixInfo";
import { useGetIsLoggedIn } from "lib";
import { useNavigate, useLocation } from "react-router-dom";
import { RouteNamesEnum } from "localConstants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import axios from "axios";
import { apyUrl } from "@/config";

export function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position
            } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position
            } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position
            } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-slate-950 dark:text-white"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="#FF6900"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Background Paths",
    renderBackground = true,
}: {
    title?: string;
    renderBackground?: boolean;
}) {
    const words = title.split(" ");
    const { lendingInfo } = useLiquorixInfo();
    const [healthFactor, setHealthFactor] = useState<number | null>(null);

    // Fetch healthFactor from API for Risk Factor display
    useEffect(() => {
        const fetchHealthFactor = async () => {
            try {
                const { data } = await axios.get(apyUrl);
                if (data && data.healthFactor !== undefined) {
                    setHealthFactor(parseFloat(data.healthFactor));
                }
            } catch (error) {
                console.warn("Could not fetch healthFactor from XOXNO API");
            }
        };

        fetchHealthFactor();
    }, []);

    const supply = lendingInfo ? parseFloat(lendingInfo.total_supply_in_egld) : 0;
    const debt = lendingInfo ? parseFloat(lendingInfo.total_debt_in_egld) : 0;
    const ltv = supply > 0 ? (debt / supply) * 100 : 0;

    // Use healthFactor from API if available, otherwise fallback to calculated LTV
    const displayRiskFactor = healthFactor !== null ? healthFactor : ltv;

    const stats = [
        {
            label: "Total Supplied",
            value: lendingInfo?.total_supplied || "0.00",
            unit: "xEGLD",
        },
        {
            label: "Total Borrowed",
            value: lendingInfo?.total_borrowed || "0.00",
            unit: "USDC",
        },
        {
            label: "Risk Factor",
            value: displayRiskFactor.toFixed(2),
            unit: "%",
        }
    ];

    return (
        <div className="relative h-screen min-h-[850px] w-full flex items-center justify-center overflow-hidden">
            {renderBackground && (
                <div className="absolute inset-0">
                    <FloatingPaths position={1} />
                    <FloatingPaths position={-1} />
                </div>
            )}

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="flex justify-center mb-6"
                    >
                        <img
                            src="/liquorix-logo-minimal.png"
                            alt="Liquorix"
                            className="w-32 h-32 object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(255,105,0,0.5)]"
                        />
                    </motion.div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-4 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-4 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-neutral-900 to-neutral-700/80 
                                        dark:from-white dark:to-white/80"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                    >

                        <p className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 mb-6">
                            One vault. Maximum yield.
                        </p>

                        <p className="max-w-xl mx-auto text-base md:text-lg text-neutral-500 font-medium mb-12 leading-relaxed">
                            Liquorix is an AI-driven yield optimizer that intelligently rebalances your EGLD between staking and lending protocols to maximize your returns while maintaining instant liquidity.
                        </p>

                        {/* Live Protocol Stats in Hero */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
                            {stats.map((stat, i) => (
                                <div key={i} className="bg-white/[0.03] border border-white/5 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">{stat.label}</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-white tabular-nums tracking-tighter italic">{stat.value}</span>
                                        <span className="text-[10px] font-mono text-neutral-600 font-bold">{stat.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <LandingCTA />
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

const LandingCTA = () => {
    const isLoggedIn = useGetIsLoggedIn();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Only show the button if we are on the home page root
    if (pathname !== RouteNamesEnum.home) return null;

    return (
        <button
            onClick={() => navigate(isLoggedIn ? RouteNamesEnum.dashboard : RouteNamesEnum.unlock)}
            className="group relative px-12 py-5 bg-orange-500 rounded-full font-black text-black tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(249,115,22,0.3)] hover:shadow-[0_0_70px_rgba(249,115,22,0.5)]"
        >
            <span className="relative z-10 flex items-center gap-3">
                {isLoggedIn ? "Enter Dashboard" : "Initiate Reactor"}
                <FontAwesomeIcon icon={faArrowRight} className="transition-transform group-hover:translate-x-2" />
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};
