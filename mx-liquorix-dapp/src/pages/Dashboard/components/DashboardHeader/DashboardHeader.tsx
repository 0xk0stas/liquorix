import {
  REACT_LINK,
  SDK_DAPP_PACKAGE_LINK,
  TYPESCRIPT_LINK
} from 'localConstants';

import { DashboardHeaderTextLink } from './components/DashboardHeaderTextLink';

// prettier-ignore
const styles = {
  dashboardHeaderContainer: 'dashboard-header-container flex flex-col pt-4 pb-4 lg:pt-6 lg:pb-6 justify-center items-center gap-4 self-stretch',
  dashboardHeaderTitle: 'dashboard-header-title text-primary transition-all duration-300 text-center text-2xl xs:text-4xl lg:text-5xl font-medium',
  dashboardHeaderDescription: 'dashboard-header-description text-secondary transition-all duration-300 text-center text-sm xs:text-base lg:text-lg font-medium max-w-2xl mx-auto',
  dashboardHeaderDescriptionText: 'dashboard-header-description-text mx-1'
} satisfies Record<string, string>;

export const DashboardHeader = () => (
  <div className={styles.dashboardHeaderContainer}>
    <div className="flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter text-white">
        Liquorix <span className="text-orange-500">|</span> AI Yield Reactor
      </h1>
      <p className="text-sm md:text-base text-neutral-400 mb-0 max-w-2xl leading-relaxed">
        AI-driven EGLD yield optimizer built on xLend.
        Automatically allocates liquidity across staking, lending, and compounding to maximize APY.
      </p>
    </div>
  </div>
);
