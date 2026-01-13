import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';

export * from './sharedConfig';

export const API_URL = 'https://api.multiversx.com';
export const ID_API_URL = 'https://id-api.multiversx.com';
export const USERS_API_URL = 'https://api.multiversx.com/users/';
export const contractAddress =
  'erd1qqqqqqqqqqqqqpgqzxs5jqkwp9mh3744h2ly9dw050tu5ad0u7zsjqmrmg';
export const wEGLDTokenId = 'WEGLD-bd4d79';
export const xeGLDTokenId = 'XEGLD-e413ed';
export const lqrxTokenId = 'LQRX-eae13e';
export const usdcTokenId = 'USDC-c76f1f';
export const environment = EnvironmentsEnum.mainnet as EnvironmentsEnum;
export const networkLabel = 'Mainnet' as string;
export const sampleAuthenticatedDomains = [API_URL];
export const xLendImageBaseUrl = '/api-xoxno-mainnet/user/lending/image/';
export const apyUrl = '/api-xoxno-mainnet/user/lending/summary/XLEND-18dc6f-0981';
