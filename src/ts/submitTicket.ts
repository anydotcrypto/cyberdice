//      ___      .__   __. ____    ____      _______. _______ .__   __.  _______   _______ .______
//     /   \     |  \ |  | \   \  /   /     /       ||   ____||  \ |  | |       \ |   ____||   _  \
//    /  ^  \    |   \|  |  \   \/   /     |   (----`|  |__   |   \|  | |  .--.  ||  |__   |  |_)  |
//   /  /_\  \   |  . `  |   \_    _/       \   \    |   __|  |  . `  | |  |  |  ||   __|  |      /
//  /  _____  \  |  |\   |     |  |  __ .----)   |   |  |____ |  |\   | |  '--'  ||  |____ |  |\  \----.
// /__/     \__\ |__| \__|     |__| (__)|_______/    |_______||__| \__| |_______/ |_______|| _| `._____|
//                          ______   ______   .___  ___. .______    __
//                         /      | /  __  \  |   \/   | |   _  \  |  |
//                        |  ,----'|  |  |  | |  \  /  | |  |_)  | |  |
//                        |  |     |  |  |  | |  |\/|  | |   ___/  |  |
//                        |  `----.|  `--'  | |  |  |  | |  |      |__|
//                         \______| \______/  |__|  |__| | _|      (__)

import { ethers, Wallet } from "ethers";
import { Provider } from "ethers/providers";

import {
  sendToAnySender,
  watchRelayTx,
  onchainDepositFor,
  getAnySenderBalance,
} from "./utils";
import { CyberDiceFactory } from "../typedContracts/CyberDiceFactory";
import {
  INFURA_PROJECT_ID,
  USER_MNEMONIC,
  NETWORK_NAME,
  DEPOSIT_CONFIRMATIONS,
  CYBERDICE_CONTRACT_ADDRESS,
  PRIVATE_KEY,
} from "./config";
import { parseEther } from "ethers/utils";

/**
 * Set up the provider and wallet
 */
async function setup() {
  const infuraProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAME,
    INFURA_PROJECT_ID
  );

  if (USER_MNEMONIC.length > 0 && PRIVATE_KEY.length > 0) {
    console.log(
      "Both 12-word seed and private key is filled in. Please only use one option!"
    );
    process.exit(0); // thanks to Sascha for pointing this out.
  }

  if (USER_MNEMONIC.length > 0) {
    const userMnemonicWallet = ethers.Wallet.fromMnemonic(USER_MNEMONIC);
    const user = userMnemonicWallet.connect(infuraProvider);

    return {
      user,
      provider: infuraProvider,
    };
  }

  if (PRIVATE_KEY.length > 0) {
    const userMnemonicWallet = new Wallet(PRIVATE_KEY);
    const user = userMnemonicWallet.connect(infuraProvider);

    return {
      user,
      provider: infuraProvider,
    };
  }

  console.log(
    "No user credentials in config.ts. \nRun 'npm run generateSeed' to compute a new wallet for the competition."
  );
  process.exit(0);
}

/**
 * Sends tickets to the CyberDice contract via any.sender
 * @param message Message to submit
 * @param user User's wallet
 * @param provider InfuraProvider
 * @param cyberDiceCon CyberDice Contract
 */
async function sendTicket(
  message: string,
  user: Wallet,
  provider: Provider,
  cyberDiceCon: ethers.Contract
) {
  /**
   * We need to compute the calldata which is the function name and its arguments.
   * As you can see below, it is super-straight forward to encode the calldata
   * using etherjs.
   */
  const callData = cyberDiceCon.interface.functions.submit.encode([message]);

  /**
   * TECHNICAL CHALLENGE IN COMPETITION - FILL IN THE BLANK FUNCTION
   *
   * There are four tasks happening under the hood:
   * -> Prepare the user's on-chain replay protection using multinonce (RelayHub.sol)
   * -> User signs the meta-transaction that includes the replay protection, target contract and function to call.
   * -> User prepares and sends the any.sender relay transaction. If you look closely, it specifies a deadline (400 blocks)
   *    and not a gas price. Our service takes the relay transaction and continuously bumps the fee until it gets in Ethereum.
   * -> It returns the signed relay transaction and signed receipt that any.sender has accepted the job.
   *
   * What is really cool about the competition contract implementation is that we are using the _msgSender()
   * standard so CyberDice.sol can simply replace msg.sender with _msgSender(). As a result, all replay
   * protection is handled by an intermediary contract Relay.sol which simply forwards the signer's address
   * to the competition (if the signature + replay protection checks out).
   *
   * Hopefully in the future, Relay.sol will simply become a new opcode, to natively support meta-transactions.
   *
   * Anyway, back to the competition. Fill in the blanks!
   */
  // const { relayTx, anySenderReceipt } = await sendToAnySender(
  //   // fill in the blanks
  // );

  /* *********************************************
   * Do not forget to uncomment the code below!
   *********************************************** */

  // console.log(anySenderReceipt);

  // /**
  //  * We simply watch for an event in the any.sender relay contract to verify
  //  * when the relay transaction gets mined.
  //  */
  // const totalWait = await watchRelayTx(relayTx, user, provider);

  // console.log("Relay transaction confirmed after " + totalWait + " blocks");
  // const totalUserTickets = await cyberDiceCon.userTickets(user.address);

  // // Print results on-screen
  // console.log("Tickets for " + user.address + ": " + totalUserTickets);
}

/**
 * The main program for the competition.
 * - Checks if the user has filled in their INFURA / 12-word seed credentials
 * - Checks the user has sufficient balance in any.sender
 * - Checks if the user has enough coins to top up any.sender
 * - Deposits coins into any.sender and waits ~40 confirmations
 * - Sends ticket off to any.sender
 */
(async () => {
  // ricmoo this is ur fault
  var log = console.log;
  console.log = (messages: string) => {
    if (messages === "WARNING: unsupported ABI type - receive") return;
    else log(messages);
  };

  if (INFURA_PROJECT_ID.length === 0) {
    console.log("Please open config.ts and fill in INFURA_PROJECT_ID");
    return;
  }
  // Set up wallets & provider
  const { user, provider } = await setup();

  // Get CyberDice contract
  const cyberDiceCon = new CyberDiceFactory(user).attach(
    CYBERDICE_CONTRACT_ADDRESS
  );

  console.log(
    "*** You are running the any.sender competition script on " +
      NETWORK_NAME +
      " ***"
  );

  console.log("Your wallet address: " + user.address);

  // Sanity check minimum balance.
  let anySenderBalance = await getAnySenderBalance(user);
  const ethereumBalance = await provider.getBalance(user.address);

  // Checks on-chain balance and any.sender balance
  if (anySenderBalance.lt(parseEther("0.009"))) {
    if (ethereumBalance.gte(parseEther("0.01"))) {
      // We need to wait for on-chain confirmations before any.sender
      // accepts the deposit.
      console.log(
        "Sending on-chain deposit - wait ~" +
          DEPOSIT_CONFIRMATIONS +
          " confirmations. (Click link to check confirmations so far)"
      );
      await onchainDepositFor(parseEther("0.009"), user);
    } else {
      console.log("Your ethereum wallet lacks the funds to top up any.sender.");
      console.log(
        "Your ethereum balance is " + anySenderBalance.toString() + " wei"
      );
      console.log("Please top up to at least 0.01 eth");
      return;
    }
  }

  // What is the user's any.sender balance?
  anySenderBalance = await getAnySenderBalance(user);
  console.log("Balance on any.sender: " + anySenderBalance.toString() + " wei");

  const deadline = await cyberDiceCon.deadline();

  // Confirm the competition has not finished.
  if (Date.now() / 1000 > deadline.toNumber()) {
    console.log("Competition has finished!");
    return;
  }
  const time = new Date(deadline.mul(1000).toNumber());
  console.log("Competition deadline: " + time.toLocaleString());

  // Send ticket to any.sender
  await sendTicket(
    "any.sender API is super-easy to use",
    user,
    provider,
    cyberDiceCon
  );
})().catch((e) => {
  console.log(e);
  // Deal with the fact the chain failed
});
