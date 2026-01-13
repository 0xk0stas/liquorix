import { useGetAccount } from 'lib';
import { DataTestIdsEnum } from 'localConstants';

const styles = {
  usernameContainer: 'username-container flex gap-0.5',
  herotag: 'herotag text-accent transition-all duration-200 ease-out'
} satisfies Record<string, string>;

export const Username = () => {
  const { address } = useGetAccount();

  return (
    <div className={styles.usernameContainer}>
      <span data-testid={DataTestIdsEnum.heroTag}>
        {address ? `${address.slice(0, 6)}...${address.slice(-6)}` : ''}
      </span>
    </div>
  );
};
