import { Outlet, useLocation } from 'react-router-dom';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { RouteNamesEnum } from 'localConstants';

// prettier-ignore
const styles = {
  homeContainer: 'home-container flex flex-col items-center bg-transparent min-h-screen w-full rounded-3xl overflow-x-hidden'
} satisfies Record<string, string>;

export const Home = () => {
  const { pathname } = useLocation();
  const isLanding = pathname === RouteNamesEnum.home;

  return (
    <div className={styles.homeContainer}>
      <BackgroundPaths title="Liquorix" renderBackground={true} />

      {!isLanding && (
        <div className="w-full flex justify-center pb-20">
          <Outlet />
        </div>
      )}
    </div>
  );
};
