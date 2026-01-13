import { cn } from "@/lib/utils";
import { useLiquorixInfo } from "@/hooks/useLiquorixInfo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faHistory, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { XLendPositionModal } from "@/components/XLendPositionModal/XLendPositionModal";
import { useGetAccount, EnvironmentsEnum } from "@/lib";
import axios from "axios";
import { useEffect, useState } from "react";
import { API_URL, contractAddress, environment, networkLabel, apyUrl } from "@/config";

export const ExaminePanel = () => {
    const { lendingInfo, finalBalanceUsd, finalBalanceEgld, sharePriceUsd, totalUserShares, pnl, pnlPercentage, systemInfo } = useLiquorixInfo();
    const [isXLendModalOpen, setIsXLendModalOpen] = useState(false);
    const nonce = systemInfo?.liquid_staking_nonce || 0;

    const formattedShares = totalUserShares ? (Number(totalUserShares) / 1e18).toFixed(4) : "0.0000";

    const { address } = useGetAccount();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [xLendHealthFactor, setXLendHealthFactor] = useState<number | null>(null);

    // Fetch xLend position data from XOXNO API (same endpoint used for APY in Header)
    useEffect(() => {
        const fetchXLendPosition = async () => {
            try {
                const { data } = await axios.get(apyUrl);
                console.log('Fetched xLend Position Data:', data);
                if (data && data.healthFactor !== undefined) {
                    setXLendHealthFactor(parseFloat(data.healthFactor));
                }
            } catch (error) {
                console.warn("Could not fetch xLend position data from XOXNO API");
            }
        };

        fetchXLendPosition();
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!address) return;
            try {
                // Fetch last 5 transactions sent to the contract
                const response = await axios.get(`${API_URL}/accounts/${address}/transactions?receiver=${contractAddress}&size=5&status=success&withScResults=true`);
                setTransactions(response.data);
            } catch (error) {
                console.error("Failed to fetch history", error);
            }
        };

        fetchTransactions();
    }, [address]);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
            " " +
            date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    };

    const getActionType = (tx: any) => {
        const data = tx.data ? atob(tx.data) : "";
        if (data.startsWith("deposit")) return "Deposit";
        if (data.startsWith("withdraw")) return "Withdraw";
        if (data.startsWith("borrow")) return "Borrow";
        if (data.startsWith("repay")) return "Repay";
        // Check SC results or other indicators if needed for complexity, 
        // strictly for simple display:
        return tx.function || "Transaction";
    };

    // Calculate LTV for the progress bar
    const supply = lendingInfo ? parseFloat(lendingInfo.total_supply_in_egld) : 0;
    const debt = lendingInfo ? parseFloat(lendingInfo.total_debt_in_egld) : 0;
    const ltv = supply > 0 ? (debt / supply) * 100 : 0;

    // Use health factor from XOXNO API if available, otherwise fallback to calculated LTV
    // Health factor is typically a value like 1.5 (safe) - we display it directly as the Risk Factor
    const displayRiskFactor = xLendHealthFactor !== null ? xLendHealthFactor : ltv;

    const stats = [
        {
            label: "Your Position",
            value: `${finalBalanceEgld} EGLD`,
            subValue: `$${finalBalanceUsd} • ${formattedShares} LQRX`,
            color: "text-white",
            glow: "bg-white/5"
        },
        {
            label: "Unrealized PNL",
            value: `$${pnl.toFixed(3)}`,
            subValue: `${pnl >= 0 ? '+' : ''}${pnlPercentage.toFixed(3)}%`,
            color: pnl >= 0 ? "text-green-500" : "text-red-500",
            glow: pnl >= 0 ? "bg-green-500/10" : "bg-red-500/10"
        },
        {
            label: "Share Price",
            value: `$${sharePriceUsd}`,
            subValue: "1 LQRX",
            color: "text-orange-500",
            glow: "bg-orange-500/10"
        },
        {
            label: "Risk Factor",
            value: `${displayRiskFactor.toFixed(2)}%`,
            subValue: "AI LIVE MONITORING",
            color: lendingInfo?.can_be_liquidated ? "text-red-500" : "text-green-500",
            glow: lendingInfo?.can_be_liquidated ? "bg-red-500/10" : "bg-green-500/10"
        }
    ];

    const lendingStats = lendingInfo ? (() => {
        const totalSupplied = parseFloat(lendingInfo.total_supplied);
        const totalSuppliedEgld = parseFloat(lendingInfo.total_supply_in_egld);
        const liquidCollateralEgld = parseFloat(lendingInfo.liquidation_collateral_available_in_egld);

        const liquidCollateralXegld = totalSuppliedEgld > 0
            ? (liquidCollateralEgld * totalSupplied) / totalSuppliedEgld
            : 0;

        return [
            { label: "Total Supplied", value: lendingInfo.total_supplied, egld: `${lendingInfo.total_supply_in_egld} EGLD` },
            { label: "Total Borrowed", value: lendingInfo.total_borrowed, egld: "" },
            { label: "EGLD Price", value: `$${lendingInfo.egld_price_in_usd}`, egld: "Live Feed" },
            { label: "Liquid Collateral", value: liquidCollateralXegld.toFixed(2), egld: `${lendingInfo.liquidation_collateral_available_in_egld} EGLD` }
        ];
    })() : [];

    return (
        <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 px-4">

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="relative group overflow-hidden bg-neutral-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl transition-all hover:border-orange-500/20 shadow-2xl">
                        {/* Animated Border Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />

                        <div className={cn("absolute inset-0 transition-opacity opacity-50 group-hover:opacity-100", stat.glow)} />
                        <div className="relative z-10">
                            <span className="text-[10px] font-mono tracking-[0.4em] text-neutral-500 uppercase block mb-4">{stat.label}</span>
                            <div className={cn("text-4xl font-black tabular-nums tracking-tight mb-2", stat.color)}>{stat.value}</div>
                            <div className="text-xs font-mono text-neutral-500 tracking-widest">{stat.subValue}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Protocol Metrics */}
                <div className="bg-neutral-950/50 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-md shadow-inner">
                    <div className="flex justify-between items-center mb-10 pl-1 border-l-2 border-orange-500/50">
                        <h3 className="text-sm font-bold tracking-[0.3em] text-neutral-400 uppercase">Liquorix Protocol Metrics</h3>
                        {nonce > 0 && (
                            <button
                                onClick={() => setIsXLendModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-all group"
                            >
                                <span className="text-[10px] font-bold text-orange-500 tracking-wider">xLend Position</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-10 gap-x-6">
                        {lendingStats.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase mb-3">{item.label}</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl font-bold text-white tabular-nums">{item.value}</span>
                                    {(item.label === "Total Supplied" || item.label === "Liquid Collateral") && (
                                        <img
                                            src="https://tools.multiversx.com/assets-cdn/tokens/XEGLD-e413ed/icon.png"
                                            alt="XEGLD"
                                            className="w-5 h-5 rounded-full"
                                        />
                                    )}
                                    {item.label === "Total Borrowed" && (
                                        <img
                                            src="https://tools.multiversx.com/assets-cdn/tokens/USDC-c76f1f/icon.png"
                                            alt="USDC"
                                            className="w-5 h-5 rounded-full"
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-mono text-orange-500/60 uppercase tracking-tighter">{item.egld}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Management / LTV */}
                <div className="bg-neutral-950/50 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-md relative overflow-hidden group/risk">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    {/* Sloth Analyst Visual */}
                    <div className="flex items-center gap-6 mb-8 relative z-10">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-transform duration-500 group-hover/risk:scale-105">
                            <img
                                src="/sloth-analyst.png"
                                alt="Sloth Analyst"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            {/* Breathing Glow */}
                            <div className="absolute inset-0 bg-orange-500/5 animate-pulse pointer-events-none" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold tracking-[0.3em] text-neutral-400 uppercase pl-1 border-l-2 border-orange-500/50">Risk / LTV Analysis</h3>
                            <span className="text-[10px] font-mono text-orange-500/60 mt-1 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Hodloth AI System: Active
                            </span>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="relative">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase">Current LTV Ratio</span>
                                <span className="text-3xl font-black text-white tabular-nums">{ltv.toFixed(2)}%</span>
                            </div>
                            {/* Progress Bar Container */}
                            <div className="h-4 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5 p-1">
                                <div
                                    className="h-full bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(ltv, 100)}%` }}
                                />
                                {/* Liquidation Threshold Marker */}
                                <div className="absolute top-10 md:top-0 right-[25%] h-10 md:h-full w-px bg-red-500/40 z-20" />
                            </div>
                            <div className="flex justify-between mt-3 px-1 text-[8px] font-mono text-neutral-700 uppercase tracking-[0.3em]">
                                <span>Safe</span>
                                <span className="text-red-500/50">Liquidation (75%)</span>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] leading-relaxed text-neutral-500 font-mono italic">
                                * The Loan-to-Value (LTV) ratio determines the borrowing capacity. If the ratio exceeds the liquidation threshold, the collateral may be automatically liquidated by the protocol bots.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Transaction History Section */}
            <div className="mt-8 bg-neutral-950/50 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-md shadow-inner">
                <div className="flex items-center gap-3 mb-8 pl-1 border-l-2 border-orange-500/50">
                    <FontAwesomeIcon icon={faHistory} className="text-orange-500/80" />
                    <h3 className="text-sm font-bold tracking-[0.3em] text-neutral-400 uppercase">Recent Activity</h3>
                </div>

                <div className="space-y-4">
                    {transactions.length > 0 ? (
                        transactions.map((tx: any) => {
                            const action = getActionType(tx);
                            const isDeposit = action.toLowerCase().includes('deposit');

                            // Helper to extract value from transaction, including SC results or ESDT transfers
                            const extractValue = (tx: any) => {
                                // 1. Direct EGLD Value
                                if (tx.value && tx.value !== "0") return tx.value;

                                // 2. Check for Token Transfers in Action Arguments (for Deposits/Withdraws)
                                // API often returns 'action' with 'arguments' having 'transfers'
                                const actionTransfers = tx.action?.arguments?.transfers;
                                if (Array.isArray(actionTransfers) && actionTransfers.length > 0) {
                                    return actionTransfers[0].value;
                                }

                                // 3. Check SC Results (e.g. Contract sending EGLD back)
                                if (Array.isArray(tx.results)) {
                                    const valueResult = tx.results.find((r: any) => r.value && r.value !== "0");
                                    if (valueResult) return valueResult.value;
                                }

                                return "0";
                            };

                            const txValue = extractValue(tx);
                            const displayValue = txValue === "0" ? "-" : `${(Number(txValue) / 1e18).toFixed(2)}`;

                            return (
                                <div key={tx.txHash} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border",
                                            isDeposit ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                        )}>
                                            <FontAwesomeIcon icon={faExchangeAlt} className={cn("text-xs", isDeposit && "rotate-180")} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white tracking-wide uppercase">{action}</span>
                                            <span className="text-[10px] font-mono text-neutral-500">{formatTime(tx.timestamp)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-mono text-neutral-300">
                                            {displayValue === "-" ? "-" : `${displayValue} ${isDeposit ? 'EGLD' : 'xEGLD'}`}
                                        </span>
                                        <a
                                            href={`${environment === EnvironmentsEnum.mainnet ? 'https://explorer.multiversx.com' : 'https://devnet-explorer.multiversx.com'}/transactions/${tx.txHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-orange-500/50 hover:text-orange-500 transition-colors uppercase tracking-wider"
                                        >
                                            View Explorer ↗
                                        </a>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-neutral-600 font-mono text-xs uppercase tracking-widest">
                            No recent transactions found
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Info */}
            <div className="mt-12 text-center">
                <p className="text-[10px] font-mono tracking-[0.4em] text-neutral-700 uppercase">
                    All data is fetched directly from Liquorix Smart Contracts on {networkLabel}
                </p>
            </div>

            <XLendPositionModal
                isOpen={isXLendModalOpen}
                onClose={() => setIsXLendModalOpen(false)}
                nonce={nonce}
            />
        </div>
    );
};
