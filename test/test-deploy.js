/***
 * SPDX-License-Identifier: GPL-3.0
 * == Developer History (NAME, ORG, DATE, DESCR) ==
 * Isaac Dubuque, Verilink, 7/24/22, Initial Commit
 * ================================================
 * 
 * TEST CASE: Chip Table Deploy
 * Description: Tests deployment, ownership and interface
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

const CHIPTABLE_ABI = [
  "function registryVersion() external returns (string memory)",
  "function registerTSM(address tsmAddress, string calldata uri) external",
  "function registerChipIds(address tsmAddress, bytes32[] calldata chipIds) external",
  "function safeRegisterChipIds(address tsmAddress, bytes32[] calldata chipIds, bytes[] calldata signatures) external",
  "function totalTSMs() external view returns (uint256)",
  "function tsmByIndex(uint256 index) external view returns (address)",
  "function tsmUri(address tsmAddress) external view returns (string memory)",
  "function tsmSetUri(string calldata uri) external",
  "function tsmOperator(address tsmAddress) external view returns (address)",
  "function approve(address operator) external",
  "function addChipId(address tsmAddress, bytes32 chipId, bytes calldata signature) external",
  "function addChipIds(address tsmAddress, bytes32[] calldata chipIds, bytes[] calldata signatures) external",
  "function chipTSM(bytes32 chipId) external view returns (address)",
  "function chipUri(bytes32 chipId) external view returns (string memory)",
  "function chipExists(bytes32 chipId) external view returns (bool)"
];

const CHIPTABLE_FUNCS = [
  "registryVersion",
  "registerTSM",
  "registerChipIds",
  "safeRegisterChipIds",
  "totalTSMs",
  "tsmByIndex",
  "tsmUri",
  "tsmSetUri",
  "tsmOperator",
  "approve",
  "addChipId",
  "addChipIds",
  "chipTSM",
  "chipUri",
  "chipExists"
];

async function expectInterface(contract, abi, funcs)
{
    let bytes = ethers.utils.arrayify("0x00000000");
    let tmp;
    let iface = new ethers.utils.Interface(abi);

    for(let i = 0; i < abi.length; i++)
    {
        tmp = hre.ethers.utils.arrayify(
            iface.getSighash(funcs[i]));
        for(let j = 0; j < bytes.length; j++)
        {
            bytes[j] = bytes[j] ^ tmp[j];
        }
    }

    expect(await contract.supportsInterface(bytes)).to.equal(true);
}

describe("ChipTable: Deployment", function() {

  let contract;
  let chipTable;
  let deployer;
  let futureOwner;
  let signers;
  let version;

  beforeEach(async function () {

    [deployer, futureOwner, ...signers] = await ethers.getSigners();
    version = "0.1";

    contract = await ethers.getContractFactory("ChipTable");
    chipTable = await contract.deploy(deployer.address, version);
    await chipTable.deployed();

    expect(await chipTable.owner()).to.equal(deployer.address);
    expect(await chipTable.totalTSMs()).to.equal(0);
  });

  describe("Contract Ownership", function () {
    it("It should support contract ownership", async () => {
      await chipTable.connect(deployer).transferOwnership(futureOwner.address);
      expect(await chipTable.owner()).to.equal(futureOwner.address);
    });
  });

  describe("Contract Interface", function () {
    it("It should support the chiptable interface", async () => {
      await expectInterface(chipTable, CHIPTABLE_ABI, CHIPTABLE_FUNCS);
    });
  });

  describe("Registery Version", function () {
    it("Should return the registry version", async () => {
      expect(await chipTable.registryVersion()).to.equal(version);
    })
  });
}); 