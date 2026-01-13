import { EnvironmentsEnum } from 'lib/sdkDapp/sdkDapp.types';

// ==========================================
// CONFIGURATION TOGGLE
// Set this to true for Mainnet, false for Devnet
// ==========================================
export const IS_MAINNET = true;

export * from './sharedConfig';

// ------------------------------------------
// MAINNET SETTINGS
// ------------------------------------------
const mainnet = {
  API_URL: 'https://api.multiversx.com',
  ID_API_URL: 'https://id-api.multiversx.com',
  USERS_API_URL: 'https://api.multiversx.com/users/',
  contractAddress: 'erd1qqqqqqqqqqqqqpgqzxs5jqkwp9mh3744h2ly9dw050tu5ad0u7zsjqmrmg',
  wEGLDTokenId: 'WEGLD-bd4d79',
  xeGLDTokenId: 'XEGLD-e413ed',
  lqrxTokenId: 'LQRX-eae13e',
  usdcTokenId: 'USDC-c76f1f',
  environment: EnvironmentsEnum.mainnet as EnvironmentsEnum,
  networkLabel: 'Mainnet',
  xLendImageBaseUrl: '/api-xoxno-mainnet/user/lending/image/',
  apyUrl: '/api-xoxno-mainnet/user/lending/summary/XLEND-18dc6f-0981',
  xoxnoSwapApiUrl: 'https://swap.xoxno.com/api/v1'
};

// ------------------------------------------
// DEVNET SETTINGS
// ------------------------------------------
const devnet = {
  API_URL: 'https://devnet-api.multiversx.com',
  ID_API_URL: 'https://devnet-id-api.multiversx.com',
  USERS_API_URL: 'https://devnet-api.multiversx.com/users/',
  contractAddress: 'erd1qqqqqqqqqqqqqpgq3nryh2uxnktf8whcvhhshktwfthl2ywju7zslwkvkc',
  wEGLDTokenId: 'WEGLD-a28c59',
  xeGLDTokenId: 'XEGLD-23b511',
  lqrxTokenId: 'LQRX-devnet-fix',
  usdcTokenId: 'USDC-350c4e',
  environment: EnvironmentsEnum.devnet as EnvironmentsEnum,
  networkLabel: 'Devnet',
  xLendImageBaseUrl: '/api-xoxno/user/lending/image/',
  apyUrl: '/api-xoxno/user/lending/summary/XOXNOLEND-0d9fce-f2',
  xoxnoSwapApiUrl: 'https://devnet-swap.xoxno.com/api/v1'
};

const activeConfig = IS_MAINNET ? mainnet : devnet;

export const API_URL = activeConfig.API_URL;
export const ID_API_URL = activeConfig.ID_API_URL;
export const USERS_API_URL = activeConfig.USERS_API_URL;
export const contractAddress = activeConfig.contractAddress;
export const wEGLDTokenId = activeConfig.wEGLDTokenId;
export const xeGLDTokenId = activeConfig.xeGLDTokenId;
export const lqrxTokenId = activeConfig.lqrxTokenId;
export const usdcTokenId = activeConfig.usdcTokenId;
export const environment = activeConfig.environment;
export const networkLabel = activeConfig.networkLabel;
export const xLendImageBaseUrl = activeConfig.xLendImageBaseUrl;
export const apyUrl = activeConfig.apyUrl;
export const xoxnoSwapApiUrl = activeConfig.xoxnoSwapApiUrl;
export const sampleAuthenticatedDomains = [API_URL];
