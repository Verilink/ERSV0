/***
 * SPDX-License-Identifier: GPL-3.0
 * == Developer History (NAME, ORG, DATE, DESCR) ==
 * Isaac Dubuque, Verilink, 7/24/22, Initial Commit
 * ================================================
 * 
 * TEST CASE: Chip Functionality
 * Description: Tests adding chips from Owner and TSMs and chip functionality
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

const createDevices = (n) => Array(n).fill(0).map(() => {
  const wallet = ethers.Wallet.createRandom();
  wallet.chipId = ethers.utils.keccak256('0x' + wallet.publicKey.slice(4));
  return wallet;
});

function formatSignature(r, s, v)
{
    return ethers.utils.concat([
        ethers.utils.arrayify(r),
        ethers.utils.arrayify(s),
        ethers.utils.arrayify(v)
    ]);
}

async function getDeviceSignature(device, tsmAddress)
{
  /* encode ABI */
  let hash = ethers.utils.keccak256(ethers.utils.solidityPack(
      ["address"], 
      [tsmAddress]));
  hash = ethers.utils.arrayify(hash);

  /* personal_sign the message */
  const deviceSig = await device.signMessage(hash);
  
  /* Check for test framework failure */
  const prefixedHash = ethers.utils.hashMessage(hash);
  const address = ethers.utils.recoverAddress(prefixedHash , deviceSig);
  expect(address).to.equal(device.address, `Test Framework Failure: recovered address: ${address} != device address: ${device.address}`);
  
  /* split sig to r, s, v */
  const sig = ethers.utils.splitSignature(deviceSig);
  return formatSignature(sig.r, sig.s, sig.v);
}

const registerTSM = async (chipTable, owner, tsm) => {
  const numTSMs = await chipTable.totalTSMs();
  const tsmUri = `uri_tsm_${numTSMs.toString()}`;
  await chipTable.connect(owner).registerTSM(tsm.address, tsmUri);
  return tsmUri;
}

const expectOwnerRegisterChips = async (chipTable, owner, tsm, devices, revertStr="") => {

  const chipIds = devices.map(device => device.chipId);

  if(revertStr)
  {
    await expect(chipTable.connect(owner).registerChipIds(tsm.address, chipIds))
      .to.be.revertedWith(revertStr);
  }
  else
  {
    await chipTable.connect(owner).registerChipIds(tsm.address, chipIds);
    for(let chipId of chipIds)
    {
      expect(await chipTable.chipTSM(chipId)).to.equal(tsm.address);
      expect(await chipTable.chipUri(chipId)).to.equal(tsm.uri);
    }
  }
}

const expectOwnerSafeRegisterChips = async (chipTable, owner, tsm, devices, revertStr="", fakeSignature=false) => {
  const chipIds = devices.map(device => device.chipId);

  var signatures = devices.map(async device => (await getDeviceSignature(device, tsm.address)));

  if(fakeSignature)
  {
    signatures[devices.length-1] = await getDeviceSignature(tsm, tsm.address);
  }

  if(revertStr)
  {
    await expect(chipTable.connect(owner).safeRegisterChipIds(tsm.address, chipIds, signatures))
      .to.be.revertedWith(revertStr);
  }
  else
  {
    await chipTable.connect(owner).safeRegisterChipIds(tsm.address, chipIds, signatures);
    for(let chipId of chipIds)
    {
      expect(await chipTable.chipTSM(chipId)).to.equal(tsm.address);
      expect(await chipTable.chipUri(chipId)).to.equal(tsm.uri);
    }
  }
}

const expectTSMAddChip = async (chipTable, signer, tsm, device, revertStr="", fakeSignature=false) =>
{
  const chipId = device.chipId;
  var signature = await getDeviceSignature(device, tsm.address);
  
  if(fakeSignature)
  {
    signature = await getDeviceSignature(tsm, tsm.address);
  }

  if(revertStr)
  {
    await expect(chipTable.connect(signer).addChipId(tsm.address, chipId, signature))
      .to.be.revertedWith(revertStr);
  }
  else
  {
    await chipTable.connect(signer).addChipId(tsm.address, chipId, signature);
    expect(await chipTable.chipTSM(chipId)).to.equal(tsm.address);
    expect(await chipTable.chipUri(chipId)).to.equal(tsm.uri);
  }
}

const expectTSMAddChips = async (chipTable, signer, tsm, devices, revertStr="", fakeSignature=false) =>
{
  const chipIds = devices.map(device => device.chipId);
  var signatures = devices.map(async device => (await getDeviceSignature(device, tsm.address)));

  if(fakeSignature)
  {
    signatures[devices.length-1] = await getDeviceSignature(tsm, tsm.address);
  }

  if(revertStr)
  {
    await expect(chipTable.connect(signer).addChipIds(tsm.address, chipIds, signatures))
      .to.be.revertedWith(revertStr);
  }
  else
  {
    await chipTable.connect(signer).addChipIds(tsm.address, chipIds, signatures);
    for(let chipId of chipIds)
    {
      expect(await chipTable.chipTSM(chipId)).to.equal(tsm.address);
      expect(await chipTable.chipUri(chipId)).to.equal(tsm.uri);
    }
  }
}

describe("ChipTable: Chip", function ()
{

  let contract;
  let chipTable;
  let owner;
  let tsm1, tsm2, tsm3;
  let signers;
  let devices;

  beforeEach(async function () {

    [owner, 
      tsm1, tsm2, tsm3,
      ...signers ] = await ethers.getSigners();
    
    devices = createDevices(20);
    const version = "0.1";

    contract = await ethers.getContractFactory("ChipTable");
    chipTable = await contract.deploy(owner.address, version);
    await chipTable.deployed();

    expect(await chipTable.owner()).to.equal(owner.address);
    expect(await chipTable.totalTSMs()).to.equal(0);
  });


  describe("Owner Chip Registration", function () {

    describe("Registration", function () {
      it("Should register chips for a TSM", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectOwnerRegisterChips(chipTable, owner, tsm1, 
          [devices[0], devices[1], devices[2]]);
      });

      it("Should fail to register chips already registered", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectOwnerRegisterChips(chipTable, owner, tsm1, 
          [devices[0], devices[1], devices[2]]);

        await expectOwnerRegisterChips(chipTable, owner, tsm1, 
            [devices[3], devices[4], devices[0]], "Chip: chip already exists");
      });

      it("Should fail to register chips for non-registered TSM", async function () {
        await expectOwnerRegisterChips(chipTable, owner, tsm1, 
          [devices[0], devices[1], devices[2]], "Owner: TSM does not exist");
      });

      it("Should fail to register chips for non-owner", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectOwnerRegisterChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]], "Ownable: caller is not the owner");
      });
    });

    describe("Safe Registration", function () {

      it("Should safe register chips for a TSM", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        expectOwnerSafeRegisterChips(chipTable, owner, tsm1, 
          [devices[0], devices[1], devices[2]]);

      });

      it("Should fail to safe register chips already registered", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        expectOwnerSafeRegisterChips(chipTable, owner, tsm1, 
          [devices[0], devices[1], devices[2]]);
        expectOwnerSafeRegisterChips(chipTable, owner, tsm1, 
          [devices[3], devices[4], devices[0]], "Chip: chip already exists");
      });

      it("Should fail to safe register chips for non-registered TSM", async function () {
        expectOwnerSafeRegisterChips(chipTable, owner, tsm1, 
          [devices[0], devices[1], devices[2]], "Owner: TSM does not exist");
      });

      it("Should fail to safe register chips for invalid signature", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        expectOwnerSafeRegisterChips(chipTable, owner, tsm1, 
          [devices[0], devices[1], devices[2]], "Chip: chip signature invalid", true);
      });

      it("Should fail to safe register chips for invalid signature", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        expectOwnerSafeRegisterChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]], "Ownable: caller is not the owner");
      });
    })
  });

  describe("TSM Chip Registration", function () {

    describe("Single Registration", function ()
    {
      it("Should add a chip for a TSM", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChip(chipTable, tsm1, tsm1, devices[0]);
      });

      it("Should add a chip with operator", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await chipTable.connect(tsm1).approve(tsm2.address);
        await expectTSMAddChip(chipTable, tsm2, tsm1, devices[0]);
      });

      it("Should fail to add a chip with invalid signature", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChip(chipTable, tsm1, tsm1, devices[0], 
          revertStr="Chip: chip signature invalid", true);
      });

      it("Should fail to add a chip already registered", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChip(chipTable, tsm1, tsm1, devices[0]);
        await expectTSMAddChip(chipTable, tsm1, tsm1, devices[0], 
          revertStr="Chip: chip already exists");
      });

      it("Should fail to add a chip with un-registered TSM", async function ()
      {
        await expectTSMAddChip(chipTable, tsm1, tsm1, devices[0], 
          revertStr="TSM: caller is not TSM or approved");

      });

      it("Should fail to add a chip for non-tsm or approved", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChip(chipTable, tsm2, tsm1, devices[0], 
          revertStr="TSM: caller is not TSM or approved");
      }); 
    });

    describe("Batch Registration", function () {

      it("Should add chips for a TSM", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]]);
      });

      it("Should add chips for a TSM with operator", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await chipTable.connect(tsm1).approve(tsm2.address);
        await expectTSMAddChips(chipTable, tsm2, tsm1, 
          [devices[0], devices[1], devices[2]]);
      });

      it("Should fail to add chips with invalid signature", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]], 
          revertStr="Chip: chip signature invalid", true);
      });

      it("Should fail to add chips already registered", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]]);
        await expectTSMAddChips(chipTable, tsm1, tsm1, 
          [devices[3], devices[0], devices[4]], revertStr="Chip: chip already exists");
      });

      it("Should fail to add chips with un-registered TSM", async function ()
      {
        await expectTSMAddChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]], revertStr="TSM: caller is not TSM or approved");
      });

      it("Should fail to add chips for non-tsm or approved", async function ()
      {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChips(chipTable, tsm2, tsm1, 
          [devices[0], devices[1], devices[2]], revertStr="TSM: caller is not TSM or approved");
      });

      it("Should indicate valid chip exists", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]]);
        expect(await chipTable.chipExists(devices[0].chipId)).to.equal(true);
      });

      it("Should indicate valid chip does not exist", async function () {
        tsm1.uri = await registerTSM(chipTable, owner, tsm1);
        await expectTSMAddChips(chipTable, tsm1, tsm1, 
          [devices[0], devices[1], devices[2]]);
        expect(await chipTable.chipExists(devices[3].chipId)).to.equal(false);
      });
    });
  });
})