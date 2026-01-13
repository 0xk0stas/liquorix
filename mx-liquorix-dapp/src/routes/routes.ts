import { RouteNamesEnum } from 'localConstants';
import { Dashboard } from 'pages/Dashboard/Dashboard';
import { Disclaimer } from 'pages/Disclaimer/Disclaimer';
import { Home } from 'pages/Home/Home';
import { Reactor } from 'pages/Reactor/Reactor';
import { Unlock } from 'pages/Unlock/Unlock';
import { RouteType } from 'types';

interface RouteWithTitleType extends RouteType {
  title: string;
  authenticatedRoute?: boolean;
  children?: RouteWithTitleType[];
}

export const routes: RouteWithTitleType[] = [
  {
    path: RouteNamesEnum.home,
    title: 'Home',
    component: Home,
    children: [
      {
        path: RouteNamesEnum.unlock,
        title: 'Unlock',
        component: Unlock
      }
    ]
  },
  {
    path: RouteNamesEnum.dashboard,
    title: 'Dashboard',
    component: Dashboard,
    authenticatedRoute: false
  },
  {
    path: RouteNamesEnum.disclaimer,
    title: 'Disclaimer',
    component: Disclaimer
  },
  {
    path: RouteNamesEnum.reactor,
    title: 'Reactor',
    component: Reactor,
    authenticatedRoute: false
  }
];
