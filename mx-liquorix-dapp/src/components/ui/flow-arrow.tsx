import { motion } from "framer-motion";

interface FlowArrowProps {
    reversed?: boolean;
}

export const FlowArrow = ({ reversed = false }: FlowArrowProps) => {
    return (
        <div className="pointer-events-none relative w-16 h-20 translate-y-40 lg:translate-y-48 mx-0 overflow-visible">

            <svg
                viewBox="0 0 100 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full overflow-visible"
            >
                <defs>
                    <filter id="glowArrow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Base Path */}
                <path
                    d="M 5 20 L 95 20"
                    stroke="#404040"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="opacity-30"
                />

                {/* Energy Pulse (Animated Circle) */}
                <motion.circle
                    cx="0"
                    cy="20"
                    r="3"
                    fill="#f97316"
                    filter="url(#glowArrow)"
                    animate={{
                        cx: reversed ? [110, -10] : [-10, 110],
                        opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Arrowhead */}
                <motion.path
                    d={reversed ? "M 15 12 L 5 20 L 15 28" : "M 85 12 L 95 20 L 85 28"}
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glowArrow)"
                    className="opacity-80"
                />
            </svg>
        </div>
    );
};
