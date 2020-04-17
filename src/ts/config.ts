// any.sender API configuration
export const MINIMUM_ANYSENDER_DEADLINE = 410; // It is 400, but this provides some wiggle room.
export const ANYSENDER_RELAY_CONTRACT =
  "0xa404d1219Ed6Fe3cF2496534de2Af3ca17114b06"; // On-chain relay contract
export const ANYSENDER_API = "https://api.anydot.dev/any.sender.mainnet"; // API Link
export const RECEIPT_KEY = "0x02111c619c5b7e2aa5c1f5e09815be264d925422"; // Any.sender operator signing key
export const DEPOSIT_CONFIRMATIONS = 40; // Must wait this long before any.sender recognises deposit

// Please fill in your Infura ID and 12-word seed mnemonic
export const INFURA_PROJECT_ID = "";
export const NETWORK_NAME: string = "mainnet";
export const USER_MNEMONIC = ""; // Fill in a 12-word seed. Easy to generate on MyCrypto or MetaMask.
export const CYBERDICE_CONTRACT_ADDRESS =
  "0xDD39cCF9Dc21FDF2A009edf5C3df70fa1da7ef56";
