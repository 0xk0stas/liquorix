import { useGetAccount, useGetIsLoggedIn } from "@/lib";
import { useState } from "react";
import classNames from "classnames";
import styles from "./dashboard.styles";
import { DashboardHeader } from "./components/DashboardHeader/DashboardHeader";
import { LeftPanel } from "./components/LeftPanel/LeftPanel";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import ReactorKnob from "@/components/ui/control-knob";
import { BluetoothKey } from "@/components/ui/bluetooth-key";
import { DashboardTabs, ExaminePanel, SwapPanel } from "./components";
import { useLiquorixInfo } from "@/hooks/useLiquorixInfo";
import { useDeposit } from "@/hooks/useDeposit";
import { useWithdraw } from "@/hooks/useWithdraw";
import { FlowArrow } from "@/components/ui/flow-arrow";
import IndustrialSwitch from "@/components/ui/toggle-switch";
import { useNavigate } from "react-router-dom";
import { RouteNamesEnum } from "localConstants";
import { xeGLDTokenId } from "@/config";
import { FloatingPaths } from "@/components/ui/background-paths";
import { motion, AnimatePresence } from "framer-motion";

export const Dashboard = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate(RouteNamesEnum.unlock);
  };

  const { balance } = useGetAccount();
  const egldBalance = (isLoggedIn && balance) ? parseFloat(balance) / 10 ** 18 : 0;
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'examine' | 'swap'>('stake');
  const [stakeToken, setStakeToken] = useState<'EGLD' | 'XEGLD'>('EGLD');

  const { deposit } = useDeposit();
  const { withdraw } = useWithdraw();
  const { lqrxTokens, lqrxToken, xegldToken, queryContract } = useLiquorixInfo();

  // Manage selected LQRX token index
  const [selectedShareTokenIndex, setSelectedShareTokenIndex] = useState(0);

  // Derive active share token
  const activeShareToken = (lqrxTokens && lqrxTokens.length > 0)
    ? lqrxTokens[selectedShareTokenIndex] || lqrxTokens[0]
    : null;

  // Auto-reset index if tokens change
  if (lqrxTokens && lqrxTokens.length > 0 && selectedShareTokenIndex >= lqrxTokens.length) {
    setSelectedShareTokenIndex(0);
  }

  const shareBalance = activeShareToken ? parseFloat(activeShareToken.balance) / 10 ** 18 : 0;
  const xegldBalance = xegldToken ? parseFloat(xegldToken.balance) / 10 ** 18 : 0;

  const getActiveBalance = () => {
    if (activeTab === 'stake') {
      return stakeToken === 'EGLD' ? egldBalance : xegldBalance;
    }
    return shareBalance;
  };

  const activeBalance = getActiveBalance();

  const handleAction = async () => {
    if (activeTab === 'stake') {
      await deposit(
        selectedAmount,
        stakeToken === 'XEGLD' ? (xegldToken?.identifier || xeGLDTokenId) : 'EGLD',
        () => {
          // Transaction successful, refetch contract data
          queryContract();
          // Also reset selection
          setSelectedAmount(0);
        }
      );
    } else if (activeTab === 'unstake') {
      const isMax = Math.abs(selectedAmount - shareBalance) < 0.0001;
      const amountToWithdraw = (isMax && activeShareToken?.balance) ? activeShareToken.balance : selectedAmount;

      const fullId = activeShareToken?.identifier || '';
      const parts = fullId.split('-');
      const tokenTicker = parts.length === 3 ? `${parts[0]}-${parts[1]}` : fullId;

      await withdraw(
        amountToWithdraw,
        tokenTicker,
        activeShareToken?.nonce || 0,
        () => {
          // Transaction successful, refetch contract data
          queryContract();
          // Also reset selection
          setSelectedAmount(0);
        }
      );
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.mobilePanelContainer}>
        <LeftPanel
          isOpen={isMobilePanelOpen}
          setIsOpen={setIsMobilePanelOpen}
        />
      </div>

      <div
        className={styles.dashboardContent}
      >
        {/* Animated Background Paths - Subtle Ghost Mode */}
        <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none overflow-hidden">
          <FloatingPaths position={1} />
        </div>

        {/* Cinematic Grain Texture */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

        <div
          className={classNames('w-full relative z-10', {
            [styles.dashboardContentMobilePanelOpen]: isMobilePanelOpen
          })}
        >
          <div className="w-full max-w-4xl mx-auto px-4">
            <DashboardHeader />
          </div>

          {/* Tabs Switcher */}
          <DashboardTabs activeTab={activeTab} onTabChange={(t) => {
            setActiveTab(t);
            setSelectedAmount(0); // Reset amount on tab switch
          }} />

          <AnimatePresence mode="wait">
            {activeTab === 'swap' && (
              <motion.div
                key="swap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SwapPanel />
              </motion.div>
            )}
            {activeTab === 'examine' && (
              <motion.div
                key="examine"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ExaminePanel />
              </motion.div>
            )}

            {(activeTab === 'stake' || activeTab === 'unstake') && (
              <motion.div
                key="stake-unstake"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center gap-4 z-10 px-0 md:px-4 -mt-16 md:-mt-12 overflow-hidden md:overflow-visible"
              >
                {/* Main Interaction Row */}



                <div className="flex flex-row items-center justify-center gap-1 md:gap-12 w-full max-w-[100vw]">
                  {/* Knob Section */}
                  <div className="flex-shrink-0 scale-[0.75] md:scale-100 origin-center ml-8 -mr-16 md:mr-0 relative z-10">
                    <ReactorKnob
                      maxLimit={activeBalance}
                      onChange={setSelectedAmount}
                      token={activeTab === 'stake' ? stakeToken : 'LQRX'}
                      decimals={4}
                      options={activeTab === 'unstake' && lqrxTokens && lqrxTokens.length > 1 ? lqrxTokens.map((token: any) => ({
                        label: token.identifier,
                        value: token,
                        balance: (parseFloat(token.balance) / 1e18).toFixed(4)
                      })) : undefined}
                      selectedOptionIndex={selectedShareTokenIndex}
                      onOptionChange={(idx) => {
                        setSelectedShareTokenIndex(idx);
                        setSelectedAmount(0);
                      }}
                    />
                  </div>

                  {/* Arrow Section */}
                  <div className={classNames("flex-shrink-0 scale-[0.8] md:scale-100 origin-center -mx-4 md:mx-0 relative z-0 opacity-80 md:opacity-100", {
                    "invisible": activeTab !== 'stake'
                  })}>
                    <FlowArrow reversed={activeTab === 'unstake'} />
                  </div>

                  {/* Controls Section */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-4 md:gap-8 scale-[0.8] md:scale-100 origin-center -ml-2 md:ml-0 z-20">
                    <div className={classNames("scale-75 origin-bottom", {
                      "invisible pointer-events-none": activeTab !== 'stake'
                    })}>
                      <IndustrialSwitch
                        initialValue={stakeToken === 'EGLD'}
                        onToggle={(isOn) => setStakeToken(isOn ? 'EGLD' : 'XEGLD')}
                      />
                    </div>

                    {isLoggedIn ? (
                      <BluetoothKey
                        amount={selectedAmount}
                        onDeposit={handleAction}
                        label={activeTab === 'stake' ? `DEPOSIT ${stakeToken}` : 'WITHDRAW'}
                        token={activeTab === 'stake' ? stakeToken : 'XEGLD'}
                        accentColor={activeTab === 'stake' && stakeToken === 'EGLD' ? '#19E0C8' : '#AEFB50'}
                      />
                    ) : (
                      <button
                        onClick={handleLogin}
                        className="group relative w-32 h-32 rounded-3xl bg-neutral-900 border border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.1)] hover:shadow-[0_0_50px_rgba(249,115,22,0.3)] transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <FontAwesomeIcon icon={faWallet} className="text-3xl text-orange-500 mb-1 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">Connect</span>

                        {/* Animated Corners */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500 rounded-br-lg" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
