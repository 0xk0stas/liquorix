import { PropsWithChildren } from 'react';
import { AuthRedirectWrapper } from 'wrappers';
import { Footer } from '../Footer';
import { Header } from '../Header';
import { FloatingPaths } from '@/components/ui/background-paths';

// prettier-ignore
const styles = {
  layoutContainer: 'layout-container flex min-h-screen flex-col bg-accent transition-all duration-200 ease-out',
  mainContainer: 'main-container flex flex-grow items-stretch justify-center'
} satisfies Record<string, string>;

export const Layout = ({ children }: PropsWithChildren) => (
  <div className={styles.layoutContainer}>
    <div className="fixed inset-0 z-0 pointer-events-none">
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
    <Header />

    <main className={styles.mainContainer}>
      <AuthRedirectWrapper>{children}</AuthRedirectWrapper>
    </main>

    <Footer />
  </div>
);
