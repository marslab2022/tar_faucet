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
const faucetContractAddress = 'gp9ElQmOf0tCy-tIUPaftAXzi0jtroQTmlYUMwqoDo0';
const ownerWalletAdrress = 'g-HsAODsIOoTG4MgvmeOTmqyA_RKMupujUuok-nrmkg';
export const tarAddress = "-0pqJNz8YeOcffdf4DSiauthfWiGcOKzs61sI2-xF7E";
export const tarSymbol = "TAR";
export const tarDecimals = 5;

// const warp = WarpFactory.forLocal(1984);
// const warp = WarpFactory.forTestnet();
const warp = WarpFactory.forMainnet();
const arweave = warp.arweave;
let walletAddress = undefined;
export let isConnectWallet = false;

let faucetContract = undefined;
let tarContract = undefined;

export async function connectWallet(walletJwk) {
  faucetContract.connectWallet(walletJwk);
  tarContract.connectWallet(walletJwk);
  isConnectWallet = true;
  walletAddress = await arweave.wallets.jwkToAddress(walletJwk);
}

export async function connectContract() {
  faucetContract = new intelliContract(warp);
  faucetContract.connectContract(faucetContractAddress);

  tarContract = new intelliContract(warp);
  tarContract.connectContract(tarAddress);

  return {status: true, result: 'Connect contract success!'};
}

export function getWalletAddress() {
  return walletAddress;
}

export function arLessThan(a, b) {
  return arweave.ar.isLessThan(arweave.ar.arToWinston(a), arweave.ar.arToWinston(b));
}

export const swap = async () => {
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
      }
    );
    console.log('faucet swap: ', tx);
    result = 'Succeed!';
  } catch (err) {
    status = false;
    result = err;
  }
  return {status: true, result: result};
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
  if (!faucetContract) {
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
      const tokenContract = new intelliContract(warp);
      tokenContract.connectContract(tokenAddress);
      result = await (await tokenContract.viewState({
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