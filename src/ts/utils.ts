import { Wallet, Contract, ethers } from "ethers";
import { BigNumber, arrayify, parseEther } from "ethers/utils";
import { Provider, Log } from "ethers/providers";
import { RelayFactory } from "@any-sender/contracts";
import AnySenderClient from "@any-sender/client";
import { RelayTransaction } from "@any-sender/data-entities";
import {
  ANYSENDER_RELAY_CONTRACT,
  DEPOSIT_CONFIRMATIONS,
  ANYSENDER_API,
  RECEIPT_KEY,
  MINIMUM_ANYSENDER_DEADLINE,
  NETWORK_NAME,
} from "./config";
import { HubReplayProtection } from "@anydotcrypto/metatransactions/dist";

// Prepare the meta-transaction
let hubReplayProtection: HubReplayProtection;

/**
 * Deposit coins into any.sender contract.
 * @param toDeposit Denominated in wei
 * @param wallet Transaction signer
 */
export async function onchainDepositFor(toDeposit: BigNumber, wallet: Wallet) {
  const relayFactory = new RelayFactory(wallet);
  const relay = relayFactory.attach(ANYSENDER_RELAY_CONTRACT);

  const tx = await relay.depositFor(wallet.address, {
    value: toDeposit,
  });

  etherscanLink(tx.hash as string);

  const receipt = await tx.wait(DEPOSIT_CONFIRMATIONS);
  return receipt;
}

/**
 * Etherscan link
 * @param txhash Transaction hash
 */
function etherscanLink(txhash: string) {
  if (NETWORK_NAME !== "mainnet") {
    console.log("https://" + NETWORK_NAME + ".etherscan.io/tx/" + txhash);
  } else {
    console.log("https://etherscan.io/tx/" + txhash);
  }
}
export async function getAnySenderBalance(wallet: Wallet) {
  const anySenderClient = await getAnySenderClient();
  return await anySenderClient.balance(wallet.address);
}
/**
 * Fetch an any.sender client instance
 */
async function getAnySenderClient() {
  return new AnySenderClient(ANYSENDER_API, RECEIPT_KEY);
}

/**
 * An easy function to craft the meta-transaction, sign it
 * and send it to any.sender.
 *
 * Under the hood, the replay protection is handled by
 * the RelayHub.sol and assumes the target contract
 * supports _msgSender().
 *
 * @param target Target contract
 * @param callData Encoded function and data
 * @param user User's wallet
 * @param provider Infura Provider
 */
export async function sendToAnySender(
  target: Contract,
  callData: string,
  user: Wallet,
  provider: Provider
) {
  // Prepare the meta-transaction
  if (!hubReplayProtection) {
    hubReplayProtection = HubReplayProtection.multinoncePreset(
      user,
      NETWORK_NAME + "-relay",
      100
    );
  }
  const params = await hubReplayProtection.signMetaTransaction(
    user,
    target.address,
    new BigNumber("0"),
    callData
  );
  const metaTxCallData = await hubReplayProtection.encodeForwardParams(
    user,
    params
  );

  // Wrap it for any.sender
  const relayTx = await signedRelayTx(
    user,
    HubReplayProtection.getHubAddress(NETWORK_NAME + "-relay"),
    250000,
    metaTxCallData,
    parseEther("0"),
    provider
  );

  // Relay transaction via any.sender
  const anySenderClient = await getAnySenderClient();
  const anySenderReceipt = await anySenderClient.relay(relayTx);
  return { relayTx, anySenderReceipt };
}

/**
 * Fetches a signed relay transaction
 * @param wallet Signer
 * @param to Contract
 * @param gas Gas limit
 * @param data Calldata to be executed in the contract
 * @param compensation Requested compensation (if fails)
 * @param provider InfuraProvider
 */
async function signedRelayTx(
  wallet: Wallet,
  to: string,
  gas: number,
  data: string,
  compensation: BigNumber,
  provider: Provider
) {
  const blockNo =
    (await provider.getBlockNumber()) + MINIMUM_ANYSENDER_DEADLINE;

  const unsignedRelayTx = {
    from: wallet.address,
    to: to,
    gas: gas,
    data: data,
    deadlineBlockNumber: blockNo,
    compensation: compensation.toString(),
    relayContractAddress: ANYSENDER_RELAY_CONTRACT,
  };

  const relayTxId = AnySenderClient.relayTxId(unsignedRelayTx);
  const signature = await wallet.signMessage(arrayify(relayTxId));

  const signedRelayTx: RelayTransaction = {
    ...unsignedRelayTx,
    signature: signature,
  };

  return signedRelayTx;
}

/**
 * Returns a Promise that resolves when the RelayTxID is detected in the Relay.sol contract.
 * @param relayTxId Relay Transaction ID
 * @param wallet Signer
 * @param provider InfuraProvider
 */
export async function watchRelayTx(
  relayTx: RelayTransaction,
  wallet: Wallet,
  provider: Provider
) {
  const blockNo = await provider.getBlockNumber();
  const topics = AnySenderClient.getRelayExecutedEventTopics(relayTx);

  const filter = {
    address: ANYSENDER_RELAY_CONTRACT,
    fromBlock: blockNo - 10,
    toBlock: blockNo + 10000,
    topics: topics,
  };

  return new Promise(async (resolve) => {
    let found = false;
    const relay = new RelayFactory(wallet).attach(ANYSENDER_RELAY_CONTRACT);
    const relayTxId = AnySenderClient.relayTxId(relayTx);

    console.log("Checking for relayed transaction...");
    while (!found) {
      await wait(5000); // Try again every 5 seconds.
      console.log("...");
      await provider.getLogs(filter).then((result) => {
        const length = lookupLog(relayTxId, blockNo, result, relay);

        if (length > 0) {
          found = true;
          resolve(length);
        }
      });
    }
  });
}

/**
 * Go through log to find relay transaction id
 * @param relayTxId Relay Transaction ID
 * @param blockNo Starting block number
 * @param result Logs
 * @param relay Relay contract
 */
function lookupLog(
  relayTxId: string,
  blockNo: number,
  result: Log[],
  relay: ethers.Contract
) {
  for (let i = 0; i < result.length; i++) {
    const recordedRelayTxId = relay.interface.events.RelayExecuted.decode(
      result[i].data,
      result[i].topics
    ).relayTxId;

    if (NETWORK_NAME !== "mainnet") {
    }

    // Did we find it?
    if (relayTxId == recordedRelayTxId) {
      etherscanLink(result[i]["transactionHash"] as string);

      const confirmedBlockNumber = result[i]["blockNumber"] as number;
      const length = confirmedBlockNumber - blockNo;
      return length;
    }
  }

  return 0;
}
/**
 * Simple function to wait
 * @param ms Milliseconds
 */
async function wait(ms: number) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
