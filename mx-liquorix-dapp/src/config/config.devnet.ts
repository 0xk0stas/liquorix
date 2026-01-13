import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';

export * from './sharedConfig';

export const API_URL = 'https://devnet-api.multiversx.com';
export const contractAddress =
  'erd1qqqqqqqqqqqqqpgq3nryh2uxnktf8whcvhhshktwfthl2ywju7zslwkvkc';
export const environment = EnvironmentsEnum.devnet as EnvironmentsEnum;
export const networkLabel = 'Devnet' as string;
export const lqrxTokenId = 'LQRX-devnet-fix';
export const usdcTokenId = 'USDC-350c4e';
export const wEGLDTokenId = 'WEGLD-a28c59';
export const sampleAuthenticatedDomains = [API_URL];
export const USERS_API_URL = 'https://devnet-api.multiversx.com/users/';
export const ID_API_URL = 'https://devnet-id-api.multiversx.com';
export const xeGLDTokenId = 'XEGLD-23b511';
export const xLendImageBaseUrl = '/api-xoxno/user/lending/image/';
export const apyUrl = '/api-xoxno/user/lending/summary/XOXNOLEND-0d9fce-f2';
