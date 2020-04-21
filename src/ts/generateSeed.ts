import { Wallet } from "ethers";
import * as fs from "fs";

/**
 * Helper library to generate a wallet for the competition
 */
(async () => {
  let configFile = fs.readFileSync("src/ts/config.ts", "utf8");

  const match = configFile.match(
    `export const USER_MNEMONIC = ""; // Fill in a 12-word seed. Easy to generate on MyCrypto or MetaMask.`
  );

  if (match !== null && match!.length > 0) {
    let wallet = Wallet.createRandom();
    let randomMnemonic = wallet.mnemonic;

    console.log("Please keep both safe for the competition");
    console.log("Wallet address: " + wallet.address);
    console.log("12-word seed: " + randomMnemonic);

    configFile = configFile.replace(
      `export const USER_MNEMONIC = ""; // Fill in a 12-word seed. Easy to generate on MyCrypto or MetaMask.`,
      `export const USER_MNEMONIC = "` +
        randomMnemonic +
        `"; // Filled in by our competition script.`
    );

    fs.writeFile("src/ts/config.ts", configFile, function(err: any) {
      if (err) {
        return console.error(err);
      }
    });
  } else {
    console.log(
      `config.ts is missing: \n\n  export const USER_MNEMONIC = ""; \n\nYou may have already generated the 12-word seed.`
    );
  }
})().catch((e) => {
  console.log(e);
  // Deal with the fact the chain failed
});
