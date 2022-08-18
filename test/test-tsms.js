/***
 * SPDX-License-Identifier: GPL-3.0
 * == Developer History (NAME, ORG, DATE, DESCR) ==
 * Isaac Dubuque, Verilink, 7/24/22, Initial Commit
 * ================================================
 * 
 * TEST CASE: TSM Functionality
 * Description: Tests adding TSMs from Owner and validates TSM functionality
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

const expectTSMRegistration = async (chipTable, owner, tsmAddress) =>
{
  const numTSMs = await chipTable.totalTSMs();
  const tsmUri = `uri_tsm_${numTSMs.toString()}`;

  /* register TSM */
  await chipTable.connect(owner).registerTSM(tsmAddress, tsmUri);

  /* confirm TSM details */
  expect(await chipTable.totalTSMs()).to.equal(numTSMs.add(1));
  expect(await chipTable.tsmByIndex(numTSMs)).to.equal(tsmAddress);
  expect(await chipTable.tsmUri(tsmAddress)).to.equal(tsmUri);
  expect(await chipTable.tsmOperator(tsmAddress)).to.equal(ethers.constants.AddressZero);
}

describe("ChipTable: TSM", function ()
{

  let contract;
  let chipTable;
  let owner;
  let tsm1, tsm2, tsm3;
  let signers;

  beforeEach(async function () {

    [owner, tsm1, tsm2, tsm3, ...signers] = await ethers.getSigners();
    const version = "0.1";
    contract = await ethers.getContractFactory("ChipTable");
    chipTable = await contract.deploy(owner.address, version);
    await chipTable.deployed();

    expect(await chipTable.owner()).to.equal(owner.address);
    expect(await chipTable.totalTSMs()).to.equal(0);
  });

  describe("Register TSM", function () {

    it("Should register a TSM", async function () {
      await expectTSMRegistration(chipTable, owner, tsm1.address);
    });

    it("Should register multiple TSMs", async function () {
      await expectTSMRegistration(chipTable, owner, tsm1.address);
      await expectTSMRegistration(chipTable, owner, tsm2.address);
      await expectTSMRegistration(chipTable, owner, tsm3.address);
    });

    it("Should fail to register TSM for non-owner", async function ()
    {
      await expect(
        chipTable.connect(tsm1).registerTSM(tsm1.address, "")
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail to register TSM already registered", async function ()
    {
      await expectTSMRegistration(chipTable, owner, tsm1.address);
      await expect(
        chipTable.connect(owner).registerTSM(tsm1.address, "")
      ).to.be.revertedWith("Owner: TSM already registered");
    });
  });

  describe("TSM functionality", function () {

    it("Should approve an operator for the TSM", async function ()
    {
      await expectTSMRegistration(chipTable, owner, tsm1.address);
      await chipTable.connect(tsm1).approve(tsm2.address);

      expect(await chipTable.tsmOperator(tsm1.address)).to.equal(tsm2.address);
    });

    it("Should fail to approve an operator for unregistered TSM", async function ()
    {
      await expect(chipTable.connect(tsm1).approve(tsm2.address))
        .to.be.revertedWith("TSM: tsm does not exist");
    });

    it("Should change the TSM uri", async function () {
      const newUri = "https://verilink.io";
      await expectTSMRegistration(chipTable, owner, tsm1.address);
      await chipTable.connect(tsm1).tsmSetUri(newUri);
      expect(await chipTable.tsmUri(tsm1.address)).to.equal(newUri);
    });

    it("Should fail to change TSM uri for non-TSM", async function () {
      const newUri = "https://verilink.io";
      await expect(chipTable.connect(tsm1).tsmSetUri(newUri))
        .to.be.revertedWith("TSM: tsm does not exist");
    });
  });
});