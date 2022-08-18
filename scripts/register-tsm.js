let hre;
const { program } = require("commander");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

program
  .requiredOption("-c --contract-address <contractAddress>", "The contract address of the chip table")
  .requiredOption("-t --tsm <tsm>", "TSM to register")
  .requiredOption("-u --uri <uri>", "URI for the TSM")
  .requiredOption("-n --network <network>", "{ maticMain, maticTest, hardhat}")
program.parse(process.argv);
const options = program.opts();

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

  console.log(`
    === ERS Registry ===
    ContractAddress: ${options.contractAddress}
    TSM address: ${options.tsm}
    TSM uri: ${options.uri}
  `);

  await new Promise((res) => rl.question("** Press enter to confirm **", res));

  const contract = await hre.ethers.getContractFactory("ChipTable");
  const chipTable = contract.attach(options.contractAddress);

  const receipt = await chipTable.registerTSM(options.tsm, options.uri);
  await receipt.wait();

  console.log(`
    === TSM Registered Successfully ===
    TSM: ${options.tsm}
    URI: ${await chipTable.tsmUri(options.tsm)}
    Total TSMs: ${await chipTable.totalTSMs()}
  `);
} 

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});