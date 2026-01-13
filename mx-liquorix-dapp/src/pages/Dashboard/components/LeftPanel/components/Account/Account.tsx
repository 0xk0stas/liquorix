import {
  faChevronUp,
  faWallet,
  faChartLine,
  faShieldHalved,
  faServer
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { ReactNode, useState, useEffect } from 'react';
import { ReactComponent as XLogo } from 'assets/img/x-logo.svg';
import { Label } from 'components/Label';
import { FormatAmount, MvxTrim, useGetAccount } from 'lib';
import { useLiquorixInfo } from '@/hooks/useLiquorixInfo';
import { apyUrl } from '@/config';
import axios from 'axios';
import styles from './account.styles';

interface AccountDetailsType {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export const Account = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { address, balance } = useGetAccount();
  const { lendingInfo, finalBalanceUsd, finalBalanceEgld, sharePriceUsd, totalUserShares, xegldToken, pnl, pnlPercentage } = useLiquorixInfo();
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

  // Use hook from lib (imported above) or context if available. 
  // Since we can't easily add import at top right now without risk, let's use the address presence as proxy
  const isLoggedIn = Boolean(address);

  const toggleCollapse = () => {
    setIsCollapsed((isCollapsed) => !isCollapsed);
  };

  const accountDetails: AccountDetailsType[] = [
    {
      icon: (
        <FontAwesomeIcon
          icon={faWallet}
          className={styles.connectedAccountDetailsIcon}
        />
      ),
      label: 'Address',
      value: (
        <MvxTrim
          dataTestId='accountAddress'
          text={isLoggedIn ? address : 'Not Connected'}
          className={classNames(styles.connectedAccountDetailsTrimAddress, { 'opacity-50 italic': !isLoggedIn })}
        />
      )
    },
    {
      icon: <XLogo className={styles.connectedAccountDetailsXLogo} />,
      label: 'Balance',
      value: (
        isLoggedIn ? (
          <FormatAmount
            value={balance}
            data-testid='balance'
            decimalClass='text-neutral-500'
            labelClass='text-neutral-500'
            showLabel={true}
          />
        ) : <span className="text-neutral-500">---</span>
      )
    },
    {
      icon: <XLogo className={styles.connectedAccountDetailsXLogo} />,
      label: 'XEGLD Balance',
      value: (
        isLoggedIn ? (
          <span className="text-white font-mono text-sm font-bold flex items-center gap-1">
            {xegldToken ? (parseFloat(xegldToken.balance) / 10 ** 18).toFixed(4) : "0.0000"}
            <span className="text-neutral-500 text-xs font-normal">XEGLD</span>
          </span>
        ) : <span className="text-neutral-500">---</span>
      )
    }
  ];

  const userShares = (isLoggedIn && totalUserShares) ? (Number(totalUserShares) / 1e18).toFixed(4) : '---';


  // Calculate LTV for the progress bar
  const supply = lendingInfo ? parseFloat(lendingInfo.total_supply_in_egld) : 0;
  const debt = lendingInfo ? parseFloat(lendingInfo.total_debt_in_egld) : 0;
  const ltv = supply > 0 ? (debt / supply) * 100 : 0;

  // Use healthFactor from API if available, otherwise fallback to calculated LTV
  const displayRiskFactor = healthFactor !== null ? healthFactor : ltv;

  const isHealthy = displayRiskFactor < 70;
  const isWarning = displayRiskFactor >= 70 && displayRiskFactor < 80;
  const isDanger = displayRiskFactor >= 80;

  return (
    <div className={styles.connectedAccountContainer}>
      <div className={styles.connectedAccountHeader}>
        <h2 className={styles.connectedAccountHeaderTitle}>
          Identity & Metrics
        </h2>

        <FontAwesomeIcon
          icon={faChevronUp}
          onClick={toggleCollapse}
          className={classNames(styles.connectedAccountHeaderIcon, {
            [styles.connectedAccountHeaderIconRotated]: isCollapsed
          })}
        />
      </div>

      <div
        data-testid='topInfo'
        className={classNames(styles.connectedAccountDetails, {
          [styles.connectedAccountDetailsHidden]: isCollapsed
        })}
      >
        {/* Reactor Online Indicator */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-orange-500/5 border border-orange-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,1)]" />
            <span className="text-[9px] font-mono text-orange-500/80 uppercase tracking-widest">Reactor Online</span>
          </div>
        </div>

        {/* Connection Section */}
        <div className="flex flex-col gap-1.5 mb-2">
          {accountDetails.map((accountDetail, index) => (
            <div key={index} className={styles.connectedAccountInfo}>
              <div className={styles.connectedAccountInfoIcon}>
                {accountDetail.icon}
              </div>

              <div className={styles.connectedAccountInfoText}>
                <span className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold mb-0.5">{accountDetail.label}</span>
                <span className={styles.connectedAccountInfoTextValue}>
                  {accountDetail.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* User Vault Section */}
        <div className="mb-1 mt-2">
          <div className={styles.sectionTitle}>
            <FontAwesomeIcon icon={faChartLine} className="text-orange-500/40 text-[10px]" />
            Portfolio
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Shares Card */}
          <div className={classNames(styles.statCard, 'p-2')}>
            <span className={styles.statLabel}>Share Holding</span>
            <div className="flex flex-col mt-0.5">
              <span className="text-lg font-bold text-white">{userShares}</span>
              <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">LQRX</span>
            </div>
          </div>

          {/* Value Card */}
          <div className={classNames(styles.statCard, 'p-2')}>
            <span className={styles.statLabel}>My Position</span>
            <div className="flex flex-col mt-0.5">
              <span className="text-lg font-bold text-white">{isLoggedIn ? `${finalBalanceEgld} EGLD` : '---'}</span>
              <span className="text-xs text-neutral-500">{isLoggedIn ? `≈ $${finalBalanceUsd}` : ''}</span>
            </div>
          </div>

          {/* PNL Card - span col 2 */}
          <div className={classNames(styles.statCard, 'p-2 col-span-2')}>
            <div className="flex justify-between items-center">
              <span className={styles.statLabel}>Unrealized PNL</span>
              <span className={classNames("text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40", {
                "text-green-500": pnl >= 0,
                "text-red-500": pnl < 0
              })}>
                {pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(3)}%
              </span>
            </div>
            <div className="flex flex-col mt-0.5">
              <span className={classNames("text-lg font-bold", {
                "text-green-500": pnl >= 0 && isLoggedIn,
                "text-red-500": pnl < 0 && isLoggedIn,
                "text-white": !isLoggedIn
              })}>
                {isLoggedIn ? `$${pnl.toFixed(3)}` : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* Lending Snapshot Section */}
        <div className="mb-1 mt-2">
          <div className={styles.sectionTitle}>
            <FontAwesomeIcon icon={faShieldHalved} className="text-orange-500/40 text-[10px]" />
            Vault Health
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statRowSmall}>
            <span className={styles.statLabel}>Risk Factor</span>
            <span className={classNames(
              "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
              isHealthy ? "bg-green-500/10 text-green-500" :
                isWarning ? "bg-orange-500/10 text-orange-500" :
                  "bg-red-500/10 text-red-500"
            )}>
              {isHealthy ? 'Safe' :
                isWarning ? 'Warning' : 'Danger'}
            </span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <span className={classNames(
              "text-xl font-black tabular-nums tracking-tighter",
              isDanger ? "text-red-500" : "text-white"
            )}>
              {displayRiskFactor.toFixed(2)}%
            </span>
          </div>
          <div className={styles.healthBar}>
            {/* Visualizing Risk Factor: 0% -> 0%, 100% -> 100% */}
            <div
              className={classNames(styles.healthProgress, {
                "!bg-red-500": isDanger,
                "!bg-orange-500": isWarning,
                "!bg-green-500": isHealthy
              })}
              style={{ width: `${Math.min(displayRiskFactor, 100)}%` }}
            />
          </div>
        </div>



      </div>
    </div>
  );
};
