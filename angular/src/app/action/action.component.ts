import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActionService } from 'src/app/services/action.service';
// import * as browser from 'webextension-polyfill';
import { AccountState, AccountStateStore, ActionMessageResponse, Permission } from 'src/shared';
import { PermissionStore } from 'src/shared/store/permission-store';
import { Actions, PERMISSIONS } from 'src/app/shared/constants';
import { AppManager, NetworksService, UIState, WalletManager } from '../services';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css'],
})
export class ActionComponent {
  contentToSign: string;
  accountState: AccountState;
  addresses: any[];
  accounts: any[];
  subscription: any;
  requestedKey: string;
  keySelectionDisabled = false;

  constructor(public uiState: UIState, private accountStateStore: AccountStateStore, private permissionStore: PermissionStore, public action: ActionService, public networkService: NetworksService, public walletManager: WalletManager, private manager: AppManager, private cd: ChangeDetectorRef) {
    this.uiState.title = 'Action: ' + this.uiState.action?.action;

    this.contentToSign = uiState.action.args;

    // this.action.content = this.uiState.action?.document;
    this.action.content = this.contentToSign;
    this.action.app = this.uiState.action?.app;
    this.accounts = this.walletManager.activeWallet.accounts;
    this.action.accountId = this.walletManager.activeAccountId;

    // Improve this logic, just quickly select the key:
    const parsedContent = JSON.parse(this.contentToSign);
    console.log('PARSED CONTENT:', parsedContent);
    const requestedKey = parsedContent[0].key;

    if (requestedKey) {
      this.requestedKey = requestedKey;
    }

    // Make sure we listen to active account changes to perform updated list of keys.
    // TODO: Figure out why subscribing to this on the prompt makes it trigger twice. Perhaps there is some code elsewhere that
    // needs fixing to avoid running the operation twice.
    this.subscription = this.walletManager.activeAccount$.subscribe((a) => {
      this.update();
    });
  }

  verifyStatus = {
    icon: 'new_releases', // verified, new_releases, report_gmailerrorred, dangerous
    status: 'Verification Status Unavailable', // Verified App, Verification Status Unavailable, Reported and suspected app, Dangerous app. Proceed with extreme caution.
    color: 'other-color', // negative-color, positive-color, other-color
  };

  actionStatus = {
    icon: 'verified_user',
    title: 'Permission Request',
    description: '"Sign data using your private key"',
  };

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  update() {
    const account = this.walletManager.activeAccount;
    this.accountState = this.accountStateStore.get(account.identifier);

    if (account.singleAddress || account.type === 'identity') {
      const addressEntry = this.accountState.receive[0];
      let address = '';

      if (account.type === 'identity') {
        const network = this.networkService.getNetwork(account.networkType);
        address = `${network.symbol}:${addressEntry.address.substring(0, 4)}...${addressEntry.address.substring(addressEntry.address.length - 4)}`;
      } else {
        address = addressEntry.address;
      }

      this.addresses = [{ address: address, keyId: '0/0' }];
    } else {
      const array1 = this.accountState.receive.map((r) => {
        return { address: `${r.address} (Receive: ${r.index})`, keyId: '0/' + r.index, key: r.address };
      });
      const array2 = this.accountState.change.map((r) => {
        return { address: `${r.address} (Change: ${r.index})`, keyId: '1/' + r.index, key: r.address };
      });
      this.addresses = [...array1, ...array2];
    }

    console.log('REQUESTED KEY', this.requestedKey);

    let keyIndex = 0;

    if (this.requestedKey) {
      keyIndex = this.addresses.findIndex((a) => a.key == this.requestedKey);

      console.log('REQUESTED KEY INDEX:', keyIndex);

      if (keyIndex == -1) {
        keyIndex = 0;
      }

      this.keySelectionDisabled = true;
    }

    this.action.keyId = this.addresses[keyIndex].keyId;
    this.action.key = this.addresses[keyIndex].key;

    console.log('ACTION.KEYID', this.action.keyId);
    console.log('ACTION.KEY', this.action.key);
  }

  async onAccountChanged() {
    await this.walletManager.setActiveAccount(this.action.accountId);

    // this.selectedNetwork = this.networkService.getNetwork(this.network);
    // this.derivationPath = this.getDerivationPath();
    // this.purposeAddress = this.selectedNetwork.purposeAddress ?? 44;
  }

  onKeyChanged() {
    console.log('ON KEY CHANGED:', this.action.keyId);
    const address = this.addresses.find((a) => a.keyId == this.action.keyId);
    this.action.key = address.key;
  }
}
