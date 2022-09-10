import { BackgroundManager } from '../background-manager';
import { ActionPrepareResult, ActionResponse, Permission } from '../interfaces';
import { ActionHandler, ActionState } from './action-handler';

export class PaymentHandler implements ActionHandler {
  action = ['payment'];

  constructor() {}

  async prepare(state: ActionState): Promise<ActionPrepareResult> {
    return {
      content: null,
    };
  }

  async execute(state: ActionState, permission: Permission): Promise<ActionResponse> {
    // Get the private key
    // const { network, node } = await this.backgroundManager.getKey(permission.walletId, permission.accountId, permission.keyId);
    return { content: null, request: state.message.request };
  }
}
