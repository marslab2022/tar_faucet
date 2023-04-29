import { getPoured } from './actions/read/getPoured';
import { swap } from './actions/write/swap';
import * as type from './types/types';

declare const ContractError;

export async function handle(state: type.State, action: type.Action): Promise<type.ContractResult> {
  const func = action.input.function;

  switch (func) {
    case 'swap':
      return await swap(state, action);
    case 'getPoured':
      return await getPoured(state, action);
    default:
      throw new ContractError(`No function supplied or function not recognised: "${func}"`);
  }
}
