import * as type from '../../types/types';
import { contractAssert, isAddress } from '../common';

declare const ContractError;

export const swap = async (
  state: type.State,
  action: type.Action,
): Promise<type.ContractResult> => {
  let tokenNum = 10000000;

  const tokenState = await SmartWeave.contracts.readContractState(state.tokenAddress);
  const allowance: number = tokenState.allowances[state.owner][SmartWeave.contract.id];

  tokenNum = Math.min(tokenNum, allowance);

  await SmartWeave.contracts.write(
    state.tokenAddress, 
    { function: 'transferFrom', from: state.owner, to: action.caller, amount: tokenNum},
  );

  state.poured += tokenNum;

  return { state };
};