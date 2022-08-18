let hre;
const { program } = require("commander");
const readline = require("readline");
const assert = require("assert");
const fs = require('fs');
const { exit } = require("process");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

program
  .requiredOption("-c --contract-address <contractAddress>", "The contract address of the chip table")
  .requiredOption("-t --tsm <tsm>", "TSM to register")
  .requiredOption('-p, --public-key-path <public-key-path>', "The text file list of public keys for the event")
  .requiredOption("-n --network <network>", "{ maticMain, maticTest, hardhat}")
program.parse(process.argv);
const options = program.opts();

const formatHex = (bytes) => (bytes.slice(0, 2) == "0x") ? bytes : "0x" + bytes;
const chipIdFromPublicKey = (publicKey) => hre.ethers.utils.keccak256('0x' + hre.ethers.utils.computePublicKey(formatHex(publicKey)).slice(4));
const chipIdsFromPublicKeys = (publicKeys) => publicKeys.map(pk => chipIdFromPublicKey(pk));

async function chipIdsFromFile(path) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    output: null,
    console: false
  });

  let chipIds = [];

  for await (const publicKey of rl) {
    chipIds.push(chipIdFromPublicKey(publicKey));
  }

  return chipIds;
}

async function main()
{
  process.env.HARDHAT_NETWORK = options.network;
  hre = require("hardhat");

  /* await hre.run("compile"); */ /* attempt recent compile */

  if(!hre.ethers.utils.isAddress(options.contractAddress))
  {
    throw `Error: Invalid Contract Address: ${options.contractAddress}`;
  }

  if(!hre.ethers.utils.isAddress(options.tsm))
  {
    throw `Error: Invalid TSM Address: ${options.tsm}`;
  }

  let chipIds = await chipIdsFromFile(options.publicKeyPath);
  
  console.log(`
    === ERS Registry ===
    ContractAddress: ${options.contractAddress}
    TSM address: ${options.tsm}
    Number of Chips: ${chipIds.length}
  `);

  await new Promise((res) => rl.question("** Press enter to confirm **", res));

  const contract = await hre.ethers.getContractFactory("ChipTable");
  const chipTable = contract.attach(options.contractAddress);

  const receipt = await chipTable.registerChipIds(options.tsm, chipIds);
  await receipt.wait();

  console.log("Confirming chips added successfully...");
  for(let chipId of chipIds)
  {
    assert(await chipTable.chipExists(chipId));
  }

  console.log(`
    === Chips Registered Successfully ===
    TSM: ${options.tsm}
    Total Chips: ${chipIds.length}
  `);
} 

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});