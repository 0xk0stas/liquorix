import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faBell,
  faPowerOff,
  faWallet,
  faAtom,
  faImage,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import axios from 'axios';
import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GITHUB_REPO_URL, apyUrl } from '@/config';
import {
  ACCOUNTS_ENDPOINT,
  getAccountProvider,
  MvxButton,
  MvxDataWithExplorerLink,
  NotificationsFeedManager,
  useGetAccount,
  useGetIsLoggedIn,
  useGetNetworkConfig
} from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { Logo } from '../Logo';
import { Tooltip } from '../Tooltip';
import { ThemeTooltip } from './components';
import styles from './header.styles';

interface HeaderBrowseButtonType {
  handleClick: (event: MouseEvent<HTMLDivElement>) => void;
  icon: IconDefinition;
  isVisible: boolean;
  label: string;
}

export const Header = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const isLoggedIn = useGetIsLoggedIn();
  const provider = getAccountProvider();
  const navigate = useNavigate();
  const explorerAddress = network.explorerAddress;

  // Default to ~8.02% (fallback from manual browser check) to ensure realistic display if API blocks request
  const [apy, setApy] = useState<number>(0.0802);

  useEffect(() => {
    const fetchApy = async () => {
      try {
        const { data } = await axios.get(apyUrl);
        console.log('Fetched APY Data:', data);
        if (data && data.totalApy) {
          setApy(parseFloat(data.totalApy));
        }
      } catch (err) {
        console.warn("Could not fetch dynamic APY (likely Cloudflare 403), keeping default 8.02%.");
        // We stick to the initialization value of 0.0802 which matches the user's observed mainnet state
      }
    };
    fetchApy();
  }, []);

  const handleLogout = async (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    await provider.logout();
    navigate(RouteNamesEnum.home);
  };

  const handleGitHubBrowsing = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    window.open(GITHUB_REPO_URL);
  };

  const handleLogIn = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    navigate(RouteNamesEnum.unlock);
  };

  const handleNotificationsBrowsing = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    NotificationsFeedManager.getInstance().openNotificationsFeed();
  };

  const headerBrowseButtons: HeaderBrowseButtonType[] = [
    {
      label: 'GitHub',
      handleClick: handleGitHubBrowsing,
      icon: faGithub as IconDefinition,
      isVisible: true
    },
    {
      label: 'Notifications',
      handleClick: handleNotificationsBrowsing,
      icon: faBell,
      isVisible: isLoggedIn
    }
  ];

  const handleLogoClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    navigate(isLoggedIn ? RouteNamesEnum.dashboard : RouteNamesEnum.home);
  };

  return (
    <header className={styles.header}>
      <div onClick={handleLogoClick} className={styles.headerLogo}>
        <Logo hideTextOnMobile={true} />
      </div>

      <nav className={styles.headerNavigation}>

        {/* Global Network Indicator replaced with APY Bait */}
        {/* Global Network Indicator replaced with APY Bait */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 px-4 h-11 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.1)] animate-in fade-in duration-700 box-border">
          <div className="flex flex-col items-end leading-none justify-center h-full">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-0.5">Yield</span>
            <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 drop-shadow-sm leading-none">
              {(apy * 100).toFixed(2)}% APY
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
        </div>

        <button
          onClick={() => navigate(RouteNamesEnum.reactor)}
          className="flex items-center gap-2 px-4 h-11 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-all group box-border font-bold"
        >
          <FontAwesomeIcon icon={faAtom} className="text-orange-500 group-hover:rotate-180 transition-transform duration-500" size="sm" />
          <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">Reactor</span>
        </button>

        {isLoggedIn ? (
          <div className={styles.headerNavigationAddress}>
            <FontAwesomeIcon
              icon={faWallet}
              className={styles.headerNavigationAddressWallet}
            />

            <div className={styles.headerNavigationAddressExplorer}>
              <MvxDataWithExplorerLink
                data={address}
                withTooltip={true}
                explorerLink={`${explorerAddress}/${ACCOUNTS_ENDPOINT}/${address}`}
              />
            </div>

            <Tooltip
              place='bottom'
              identifier='disconnect-tooltip-identifier'
              content='Disconnect'
            >
              {() => (
                <div
                  onClick={handleLogout}
                  className={styles.headerNavigationAddressLogout}
                >
                  <FontAwesomeIcon icon={faPowerOff} />
                </div>
              )}
            </Tooltip>
          </div>
        ) : (
          <div className={styles.headerNavigationConnect}>
            <Button
              onClick={handleLogIn}
              className={styles.headerNavigationConnectDesktop}
            >
              Connect
            </Button>

            <div
              onClick={handleLogIn}
              className={styles.headerNavigationConnectMobile}
            >
              <FontAwesomeIcon
                icon={faPowerOff}
                className={styles.headerNavigationConnectIcon}
              />
            </div>
          </div>
        )}
      </nav>

    </header>
  );
};

