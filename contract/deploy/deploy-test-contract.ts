import fs from 'fs';
import path from 'path';
import { addFunds } from '../utils/_helpers';
import {
  WarpFactory,
  LoggerFactory,
} from 'warp-contracts';

const warp = WarpFactory.forLocal(1984);
const arweave = warp.arweave;
LoggerFactory.INST.logLevel('error');

(async () => {
  console.log('running...');
  const tarTxId = 'jxB_n6cJo4s-a66oMIGACUjERJXQfc3IoIMV3_QK-1w';

  const walletJwk = await arweave.wallets.generate();
  await addFunds(arweave, walletJwk);
  const walletAddress = await arweave.wallets.jwkToAddress(walletJwk);

  // deploy faucet contract
  const faucetSrc = fs.readFileSync(path.join(__dirname, '../dist/faucet/contract.js'), 'utf8');
  const faucetInitFromFile = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../dist/faucet/initial-state.json'), 'utf8')
  );
  const faucetContractInit = {
    ...faucetInitFromFile,
    owner: walletAddress,
    tokenAddress: tarTxId,
    price: 0.0000002
  };
  const faucetContractTxId = (await warp.createContract.deploy({
    wallet: walletJwk,
    initState: JSON.stringify(faucetContractInit),
    src: faucetSrc,
  })).contractTxId;

  // add funds to faucet
  const tarContract = warp.contract(tarTxId);
  tarContract.connect(walletJwk);
  await tarContract.writeInteraction(
    {
      function: 'approve',
      spender: faucetContractTxId,
      amount: 1500000000000
    }
  );
  
  console.log('wallet address: ', walletAddress);
  console.log('faucet txid: ', faucetContractTxId);
  fs.writeFileSync(path.join(__dirname, 'key-file-for-test.json'), JSON.stringify(walletJwk));
  fs.writeFileSync(path.join(__dirname, 'faucet-txid-for-test.json'), tarContract);
})();
