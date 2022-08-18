let hre;
const { program } = require("commander");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`script invoked.`)

program
  .requiredOption("-o --owner <owner>", "Owner Address of the ChipTable")
  .requiredOption("-v --version <version>", "Version of the ChipTable")
  .requiredOption("-n --network <network>", "{ maticMain, maticTest, optimismKovan, optimismGoerli, optimism, hardhat }")
program.parse(process.argv);
const options = program.opts();

console.log(options)

async function main()
{
  process.env.HARDHAT_NETWORK = options.network;
  hre = require("hardhat");

  /* await hre.run("compile"); */ /* attempt recent compile */
  
  if(!hre.ethers.utils.isAddress(options.owner))
  {
    throw `Error: Invalid Address: ${options.owner}`;
  }

  console.log(`
    === ERS Registry ===
    Owner: ${options.owner}
    Version: ${options.version}
  `);

  await new Promise((res) => rl.question("** Press enter to confirm **", res));

  const contract = await hre.ethers.getContractFactory("ChipTable");
  const chipTable = await contract.deploy(options.owner, options.version);

  await chipTable.deployed();

  console.log(`
    === Deployed Successfully ===
    Address: ${chipTable.address}
    Owner: ${await chipTable.owner()}
    Version: ${await chipTable.registryVersion()}
  `);
} 

main().then(() => process.exit(0)).catch(error => {
  console.error({error});
  process.exit(1);
});