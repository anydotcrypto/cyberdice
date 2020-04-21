# CyberDice Competition

We have put together a fun and provably fair competition to demonstrate the power of [any.sender - a non-custodial and skin-in-the-game relay as a service API](https://github.com/PISAresearch/docs.any.sender).

To enter the competition: 
- You must solve a small technical challenge in this code repository.
- Deposit ~$1 to pay the network gas fee. 

By solving the challenge and running the script, it will authorise a ticket entry to the competition which is sent via any.sender and you will have a chance to win 3 eth (more details on the game mechanics below). 

If you get stuck at all during the competition, then come join us in [Telegram](https://t.me/anydotsender).

## CyberDice 1.0 (2008)

It takes inspiration from [CyberDice](https://www.cl.cam.ac.uk/~fms27/papers/2008-StajanoCla-cyberdice.pdf), a 2008 paper that focused on peer-to-peer gambling in the presence of cheaters. 

The game has three roles: 

- Dealer - manages the game's progression.
- Gambler - submits tickets to the game by a deadline.
- Issuers (trusted party) - holds money in escrow and only pay out if the protocol is correctly followed.

While the paper has _a lot of steps_, in essence the gamblers must submit tickets by a deadline and afterwards all issuers will co-operatively derive a random beacon using a deterministic signature scheme (e.g. once the public key is fixed, the signature for a message is always the same). 

The winner is easy to compute:

```
winningTicket = hash(aggregated issuer signatures) mod tickets.length
```

Back in 2008, the core problem for Cyberdice was the lack of a "native money for the Internet" and the very strong trust assumption for the issuers. They had several responsibilities including 1) custody of deposits (awkward to set up in real life), 2) enforce the dealer adhered to the protocol & slash the dealer if misbehavior is detected and 3) to generate the random beacon. 

To us, what makes Ethereum special is that we can take this idea that was mostly designed for fun over ~10-20 years ago and demonstrate that in fact we can run it today. 

## CyberDice 2.0 (Smart contract edition)

This brings to the smart contract edition, [CyberDice.sol](https://etherscan.io/address/0x2542f9c01b9a1Dfb26aB56Bc246E67058F4A0d10), which is responsible for: 
- Custody of the prize deposit, 
- Enforcing the protocol (accepting tickets, enforcing game deadlines, computing winner)
- Sending the winner their prize. 

Just like CyberDice 1.0, the gambler still submits tickets to play the game. In our version, all tickets are sent to the smart contract and the gambler can submit more than one ticket. To make the game more fun, we have included certain time periods "bumps" which will mint the gambler extra (or less) tickets at time of submission. 

The core component of the game, the random beacon for computing the winner, will again rely on a deterministic signature scheme from a collection of entities. In fact, we leverage the League of Entropy which emits an aggregated BLS signature every 10 minutes. Every beacon has a "round number", so the contract simply expects to receive the beacon for round X. 

While our game is provably fair, there is one problem with the setup that stops it from being completely trust-free. While everyone can verify the game was run correctly and the submitted BLS signature is correct, the smart contract itself cannot verify the beacon's integrity (e.g. BLS12-381). As a result, we must rely on a trusted oracle to submit the correct BLS signature.  

Yes, it is a small hiccup. But we believe it is one step in the right direction towards a trustless peer-to-peer gambling protocol in the presence of cheaters. :) 

## How to enter - solve the technical challenge

This competition is to demonstrate the power and ease-of-use of any.sender - our non-custodial relay as a service API. 

We have included a **_technical challenge for developers_** that requires some technical skill to complete the script. Once finished, the script sends any.sender the pre-approved ticket entry (meta-transaction) and in turn any.sender will quickly deliver it to the blockchain. 

So in a way, our competition is not simply a "lottery", but it requires some technical skill and coding to submit a ticket! 

Our technical challenge has three files:

- **config.ts** - Default values for the competition contract, user's 12-word seed, Infura ID, etc. 
- **submitTicket.ts** - Deposits 0.01 eth into any.sender before sending a single ticket entry.  
- **utils.ts** - Handles crafting the meta-transaction and sending it up to any.sender. 

To submit a ticket, you will need to: 
- Modify config.ts with your credentials.
- Modify submitTicket.ts and fill in a single blank function.

Just follow along and hopefully by the end you will have submitted a ticket into CyberDice 2.0! 

### Install NPM 

You will need to have node and npm installed. Instructions can be found at https://www.npmjs.com/get-npm. To check if you already have it installed:

```
node -v
npm -v
```

Assuming the command works, then **make sure you install the node_modules**:

```
git clone https://github.com/anydotcrypto/cyberdice.git
npm i
```

### Modify config.ts

The configuration file has some default values like the anysender API, receipt signing key, and the competition contract address. It is simply missing your credentials:

```   
export const INFURA_PROJECT_ID = "a3b26b2802f44d9caec977a00c08c01b2c"; // dummy value 
export const USER_MNEMONIC =
  "anysender non custodial relay as a service no more sunk cost yay";
export const PRIVATE_KEY = "182318...";
```

You need to visit [Infura](https://infura.io/) to obtain a project ID. It is free and quick to register.

For importing the wallet credentials, you can use a 12-word seed (USER_MNEMONIC) or a private key (PRIVATE_KEY). Both can be easily exported from wallets such as MetaMask, MyCrypto, etc. 

As well, you can simply just run this script to generate a new wallet: 

```
npm run generateSeed
```

To confirm everything is set up just run: 

```
npm run submitTicket 

*** You are running the any.sender competition script on mainnet ***
Your wallet address: 0xDAE7c65D3d5D86A8963a0D56677Cdd1d11334454
Your balance is 0. Please top it up to 0.01 eth or more.
```
Please make sure that whatever option you use to import a wallet - that the address has a balance of at least ~0.01 eth. 

### THE CHALLENGE - Fill in the blanks 

Now that everything is configured (and you have topped up the wallet address), it is time to get standard with the challenge. 

In submitTicket.ts, you will need to fill in the blanks for [sendToAnySender()](https://github.com/anydotcrypto/cyberdice/blob/master/src/ts/submitTicket.ts#L114). 

```
sendToAnySender(target: Contract, callData: string, user: Wallet, provider: Provider)
```

It requires 4 arguments which includes the competition contract, the calldata, the user's wallet and the infura provider. We don't want to give any more clues, but it is pretty straightforward if you look at the surrounding code :) 

Once you have finished... don't forget to [update the message](https://github.com/anydotcrypto/cyberdice/blob/master/src/ts/submitTicket.ts#L215) that will posted to the [bullet board](https://www.anydot.dev/competition/) to something fun before running the code: 


``` 
npm run submitTicket 
```

Hopefully, you will see output that resembles: 

```
*** You are running the any.sender competition script on ropsten ***
Your wallet address: 0xDAE7c65D3d5D86A8963a0D56677Cdd1d11334454
Sending on-chain deposit - wait ~20 confirmations
https://ropsten.etherscan.io/tx/0x69ea020b8f4fcaab99521ee4fc8a09c8e483438c05d579aad3dc175ff2e48494
Balance on any.sender: 29000000000000000 wei
<a long print-out of the any.sender signed receipt>
Checking for relayed transaction...
...
...
...
...
...
...
https://ropsten.etherscan.io/tx/0xb8a6c017864e33f505e801173252a43a3a8d44fadd9c34e620bd1b41bffb6e2a
Relay transaction confirmed after 4 blocks
Tickets for 0xDAE7c65D3d5D86A8963a0D56677Cdd1d11334454: 1
```

You've submitted one ticket. yay!

### What to do next?

Check out the competition contracts:
- [CyberDice.sol](https://etherscan.io/address/0x3521f13ff6c0315d7c749081e848ff4a89667ae7)
- [CommunityBeacon.sol](https://etherscan.io/address/0x277aee1ecba0034d24b9dfac5c866ff696fec087)

We have included a twist in CyberDice, so check out the getNoTickets() function. You'll notice that more tickets are minted during certain periods of the day. Why not take advantage of that to earn more tickets? 

You can also check out the [metatransaction repo](https://github.com/anydotcrypto/relayhub) to better understand how the replay protection (multinonce) works under the hood. For the competition, we have used the RelayHub and the \_msgSender() standard. Together, it can detach who has paid the transaction fee (gas.payer) and who authorised the command (msg.sender). 
