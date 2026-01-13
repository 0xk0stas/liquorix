import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RouteNamesEnum } from 'localConstants';
import { LeftPanel } from 'pages/Dashboard/components/LeftPanel/LeftPanel';
import { DashboardHeader } from 'pages/Dashboard/components/DashboardHeader/DashboardHeader';
import styles from 'pages/Dashboard/dashboard.styles';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faAtom, faLayerGroup, faNetworkWired, faRotate, faSackDollar, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export const Reactor = () => {
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.mobilePanelContainer}>
                <LeftPanel
                    isOpen={isMobilePanelOpen}
                    setIsOpen={setIsMobilePanelOpen}
                />
            </div>

            <div
                style={{ backgroundImage: 'url(/background.svg)' }}
                className={styles.dashboardContent}
            >
                <div
                    className={classNames('w-full', {
                        [styles.dashboardContentMobilePanelOpen]: isMobilePanelOpen
                    })}
                >
                    <div className="w-full max-w-4xl mx-auto px-4">
                        <DashboardHeader />

                        {/* Back Button */}
                        <div className="mb-6 mt-4">
                            <button
                                onClick={() => navigate(RouteNamesEnum.dashboard)}
                                className="flex items-center gap-2 text-neutral-400 hover:text-orange-500 transition-colors font-mono text-sm uppercase tracking-widest group"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="group-hover:-translate-x-1 transition-transform" />
                                Return to Dashboard
                            </button>
                        </div>

                        {/* Main Content Card */}
                        <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
                            {/* Decorative Gradient */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                            {/* Header */}
                            <div className="relative z-10 mb-10">
                                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                                    PROTOCOL <span className="text-orange-500">REACTOR</span>
                                </h1>
                                <p className="text-neutral-400 max-w-2xl text-lg">
                                    The autonomous compounding engine powering your yields. Fully transparent, secure, and built on MultiversX.
                                </p>
                            </div>

                            {/* Strategy Visualization */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10">
                                <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faAtom} className="text-orange-500" />
                                        Strategy Core
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 font-mono text-xs">1</div>
                                            <div>
                                                <h4 className="text-white font-bold mb-1">Deposit & Aggregation</h4>
                                                <p className="text-sm text-neutral-400">Users deposit xEGLD. The protocol issues a meta ESDT representing proportional shares and aggregates all deposits into a single on-chain position.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 font-mono text-xs">2</div>
                                            <div>
                                                <h4 className="text-white font-bold mb-1">Collateralization</h4>
                                                <p className="text-sm text-neutral-400">The aggregated position is supplied as collateral to XOXNO's xLend protocol, maximizing capital efficiency.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 font-mono text-xs">3</div>
                                            <div>
                                                <h4 className="text-white font-bold mb-1">Leverage Loop</h4>
                                                <p className="text-sm text-neutral-400">The protocol autonomously borrows stablecoins (USDC) against the collateral, purchases more EGLD, stakes it for xEGLD, and re-supplies it to compound the position.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Features Grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-neutral-800/20 p-5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                                        <FontAwesomeIcon icon={faShieldHalved} className="text-orange-500 text-2xl mb-3" />
                                        <h4 className="text-white font-bold mb-1">Audited Security</h4>
                                        <p className="text-xs text-neutral-400">Built on battle-tested contracts and integrated with xLend's secure infrastructure.</p>
                                    </div>
                                    <div className="bg-neutral-800/20 p-5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                                        <FontAwesomeIcon icon={faRotate} className="text-orange-500 text-2xl mb-3" />
                                        <h4 className="text-white font-bold mb-1">Auto-Compounding</h4>
                                        <p className="text-xs text-neutral-400">Yields are automatically reinvested, creating a snowball effect for your portfolio.</p>
                                    </div>
                                    <div className="bg-neutral-800/20 p-5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                                        <FontAwesomeIcon icon={faLayerGroup} className="text-orange-500 text-2xl mb-3" />
                                        <h4 className="text-white font-bold mb-1">Meta ESDT Shares</h4>
                                        <p className="text-xs text-neutral-400">Your position is liquid. The meta ESDT tokens represent your share of the pool and can be transferred.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Visual How-To Guide */}
                            <div className="mb-16 relative z-10">
                                <h3 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faNetworkWired} className="text-orange-500" />
                                    Interface Guide
                                </h3>

                                <div className="space-y-12">
                                    {/* Step 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="order-2 md:order-1 relative group">
                                            <div className="absolute inset-0 bg-orange-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 aspect-video flex items-center justify-center">
                                                {/* Placeholder for user to replace */}
                                                <img
                                                    src="/guide-stake.png"
                                                    alt="Staking Interface"
                                                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.parentElement!.innerHTML = '<div class="flex flex-col items-center gap-2 text-neutral-500"><span class="text-4xl">📸</span><span class="text-xs font-mono uppercase">Add guide-stake.png to public/</span></div>';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="order-1 md:order-2">
                                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-black text-black mb-4 shadow-[0_0_15px_rgba(249,115,22,0.4)]">1</div>
                                            <h4 className="text-2xl font-bold text-white mb-2">Initiate Position</h4>
                                            <p className="text-neutral-400 leading-relaxed">
                                                Select your input token (EGLD or xEGLD). Use the <span className="text-orange-500 font-bold">Reactor Knob</span> to set your deposit amount precisely. The interface provides real-time feedback on your selected volume.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="order-1 md:order-1">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-orange-500/50 flex items-center justify-center font-black text-orange-500 mb-4">2</div>
                                            <h4 className="text-2xl font-bold text-white mb-2">Monitor Performance</h4>
                                            <p className="text-neutral-400 leading-relaxed">
                                                Your portfolio metrics are displayed in the <span className="text-white font-bold">sidebar</span> and <span className="text-white font-bold">Examine Panel</span>. Track your "Share Holding" (LQRX) which compounds over time, and watch the "Vault Value" grow against EGLD.
                                            </p>
                                        </div>
                                        <div className="order-2 md:order-2 relative group">
                                            <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 aspect-video flex items-center justify-center">
                                                <img
                                                    src="/guide-monitor.png"
                                                    alt="Monitoring Interface"
                                                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.parentElement!.innerHTML = '<div class="flex flex-col items-center gap-2 text-neutral-500"><span class="text-4xl">📊</span><span class="text-xs font-mono uppercase">Add guide-monitor.png to public/</span></div>';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="order-2 md:order-1 relative group">
                                            <div className="absolute inset-0 bg-green-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 aspect-video flex items-center justify-center">
                                                <img
                                                    src="/guide-unstake.png"
                                                    alt="Unstaking Interface"
                                                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.parentElement!.innerHTML = '<div class="flex flex-col items-center gap-2 text-neutral-500"><span class="text-4xl">💸</span><span class="text-xs font-mono uppercase">Add guide-unstake.png to public/</span></div>';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="order-1 md:order-2">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-orange-500/50 flex items-center justify-center font-black text-orange-500 mb-4">3</div>
                                            <h4 className="text-2xl font-bold text-white mb-2">Liquidate & Withdraw</h4>
                                            <p className="text-neutral-400 leading-relaxed">
                                                Need liquidity? Switch to the <span className="text-white font-bold">UNSTAKE</span> tab. You can exit your position instantly (swapping LQRX back to EGLD) or standard unstake depending on available liquidity depth.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* FAQ Section */}
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Frequently Asked Questions</h3>
                                    <div className="grid gap-4">
                                        <details className="group bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                                <span className="font-bold text-neutral-200">What are the risks?</span>
                                                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
                                            </summary>
                                            <div className="p-4 pt-0 text-sm text-neutral-400 leading-relaxed">
                                                Like all DeFi protocols, risks include smart contract vulnerabilities and liquidation risk if the collateral value drops significantly. However, our automated health factor maintenance aggressively mitigates liquidation risks.
                                            </div>
                                        </details>

                                        <details className="group bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                                <span className="font-bold text-neutral-200">How do I unstake?</span>
                                                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
                                            </summary>
                                            <div className="p-4 pt-0 text-sm text-neutral-400 leading-relaxed">
                                                Simply navigate to the Unstake tab on the dashboard. You can withdraw your xEGLD or EGLD at any time, subject to the unbonding period if applicable strategy constraints apply.
                                            </div>
                                        </details>

                                        <details className="group bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                                <span className="font-bold text-neutral-200">What is the APY?</span>
                                                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
                                            </summary>
                                            <div className="p-4 pt-0 text-sm text-neutral-400 leading-relaxed">
                                                The APY is dynamic and comes from two sources: the native staking yield of EGLD and the additional leverage yield generated by the borrowing loop. It typically outperforms standard staking.
                                            </div>
                                        </details>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
