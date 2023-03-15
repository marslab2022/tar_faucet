import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';
import { selectWeightedPstHolder } from 'smartweave';
import { mul, pow } from './math';
import { intelliContract } from './intelliContract';
import { stat } from 'fs';

LoggerFactory.INST.logLevel('error');

// addresses
const thetARContractAddress = 'Yqm4ienHJuhtrox36YdmPKxGTDYNRKHgNK2JzcxrweQ';
const faucetContractAddress = 'XR6cAhdiR_H7Hr8iPpCaSXWwpTl5yPG3ziNr7DP8qAk';
const ownerWalletAdrress = 'g-HsAODsIOoTG4MgvmeOTmqyA_RKMupujUuok-nrmkg';
const polarisContractAddress = 'tU5g9rDKAQJwYgi_leautnj52qxlqjyWhENO0tSQjq8';
export const tarAddress = "0IdGAPaSVNzo-zVjyZ7BvYJC88tkwbi8tebSA-1OWcM";
export const tarSymbol = "TAR";
export const tarDecimals = 5;

// const warp = WarpFactory.forLocal(1984);
// const warp = WarpFactory.forTestnet();
const warp = WarpFactory.forMainnet({
  dbLocation: './cache/warp'+(new Date().getTime()).toString(), 
  inMemory: false
});
const arweave = warp.arweave;
let walletAddress = undefined;
export let isConnectWallet = false;

let thetARContract = undefined;
let faucetContract = undefined;
let tarContract = undefined;
let polarisContract = undefined;

export async function connectWallet(walletJwk) {
  thetARContract.connectWallet(walletJwk);
  faucetContract.connectWallet(walletJwk);
  tarContract.connectWallet(walletJwk);
  polarisContract.connectWallet(walletJwk);
  isConnectWallet = true;
  walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
}

export async function connectContract() {
  thetARContract = new intelliContract(warp);
  thetARContract.connectContract(thetARContractAddress);

  faucetContract = new intelliContract(warp);
  faucetContract.connectContract(faucetContractAddress);

  tarContract = new intelliContract(warp);
  tarContract.connectContract(tarAddress);

  polarisContract = new intelliContract(warp);
  polarisContract.connectContract(polarisContractAddress);

  return {status: true, result: 'Connect contract success!'};
}

export function getWalletAddress() {
  return walletAddress;
}

export function arLessThan(a, b) {
  return arweave.ar.isLessThan(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export const swap = async (ar) => {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!faucetContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  let status = true;
  let result;
  try {
    const tx = await faucetContract.writeInteraction(
      {
        function: 'swap',
      },
      // { 
      //   transfer: {
      //     target: ownerWalletAdrress,
      //     winstonQty: await arweave.ar.arToWinston(ar),
      //   },
      //   disableBundling: true
      // },
    );
    console.log('faucet swap: ', tx);
    result = 'Succeed. Please wait for block to be mined.';
  } catch (err) {
    status = false;
    result = err;
  }
  return {status: true, result: result};
}

export const getPrice = async () => {
  if (!faucetContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  const ret = (await faucetContract.viewState({
    function: 'getPrice',
  })).result['price'];
  return {status: true, result: ret};
}

export const getPoured = async () => {
  if (!faucetContract) {
    return {status: false, result: 'Please connect contract first!'};
  }
  
  const ret = (await faucetContract.viewState({
    function: 'getPoured',
  })).result['amount'];
  
  return {status: true, result: ret};
}

export const getAllowance = async () => {
  const allowance = (await tarContract.viewState({
    function: 'allowance', 
    owner: ownerWalletAdrress, 
    spender: faucetContractAddress
  })).result['allowance'];

  return {status: true, result: allowance};
}

export async function getBalance(tokenAddress) {
  if (!isConnectWallet) {
    return {status: false, result: 'Please connect your wallet first!'};
  }
  if (!thetARContract) {
    return {status: false, result: 'Please connect contract first!'};
  }

  if (!isWellFormattedAddress(tokenAddress) && tokenAddress !== 'ar') {
    return {status: false, result: 'Pst address not valid!'};
  }

  let result = "";
  let status = true;
  try {
    if (tokenAddress === 'ar') {
      result = arweave.ar.winstonToAr(await arweave.wallets.getBalance(getWalletAddress()));
    } else {
      result = await (await warp.contract(tokenAddress).viewState({
        function: 'balanceOf',
        target: getWalletAddress(),
      })).result.balance;
    }
  } catch (error) {
    status = false;
    result = error.message;
  }

  return {status: status, result: result};
}

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_-]{43}$/;
  return re.test(input);
}