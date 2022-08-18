/***
 * SPDX-License-Identifier: GPL-3.0
 * == Developer History (NAME, ORG, DATE, DESCR) ==
 * Isaac Dubuque, Verilink, 7/24/22, Initial Commit
 * ================================================
 * 
 * File: ChipTable.sol
 * Description: Chip Table Implementation
 */

pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "../intf/IChipTable.sol";

/***
 * ChipTable
 * Provides the implementation for the ERS interim on-chain chip resolution
 * The Chip Table allows the owner to register Trusted Service Managers (TSM)
 * TSMs can add chips allowing for a decentralized chip resolution
 * Chips can be look up their TSM for device information and redirect resolution
 */
contract ChipTable is IChipTable, Context, Ownable
{
  struct TSM 
  {
    bool _isRegistered;
    address _operator;
    string _uri;
  }

  struct ChipInfo
  {
    address _tsmAddress;
  }

  mapping(address => TSM) private _tsms; /* mapping tsmAddress => TSM */
  mapping(bytes32 => ChipInfo) private _chipIds; /* mapping from chipId => ChipInfo */
  mapping(uint256 => address) private _tsmIndex; /* mapping from TSM index => tsmAddress */
  uint256 private _tsmCount;

  string private VERSION;

  constructor(address _contractOwner, string memory _registryVersion)
  {
    transferOwnership(_contractOwner);
    _tsmCount = 0;
    VERSION = _registryVersion;
  }

  function supportsInterface(bytes4 interfaceId)
    external pure override returns (bool)
  {
    return interfaceId == type(IChipTable).interfaceId;
  }

  function registryVersion() external view override returns (string memory)
  {
    return VERSION;
  }

  /*=== OWNER ===*/
  function registerTSM(
    address tsmAddress, 
    string calldata uri) external override onlyOwner 
  {
    _registerTSM(tsmAddress, uri);

    /* update indexing */
    _tsmIndex[_tsmCount] = tsmAddress;
    _tsmCount = _tsmCount + 1;
  }

  function registerChipIds(
    address tsmAddress,
    bytes32[] calldata chipIds
  ) external override onlyOwner
  { 
    require(_tsmExists(tsmAddress), "Owner: TSM does not exist");
    for(uint256 i = 0; i < chipIds.length; i++)
    {
      _addChip(tsmAddress, chipIds[i]);
    }
  }

  function safeRegisterChipIds(
    address tsmAddress,
    bytes32[] calldata chipIds,
    bytes[] calldata signatures
  ) external override onlyOwner
  { 
    require(_tsmExists(tsmAddress), "Owner: TSM does not exist");
    require(chipIds.length == signatures.length, "Owner: chipIds and signatures length mismatch");
    for(uint256 i = 0; i < chipIds.length; i++)
    {
      _addChipSafe(tsmAddress, chipIds[i], signatures[i]);
    }
  }


  /*=== END OWNER ===*/

  /*=== TSM ===*/
  modifier onlyTSM(address tsmAddress) 
  {
    _checkTSM(tsmAddress);
    _;
  }

  function _checkTSM(address tsmAddress) internal view
  {
    require(_tsmExists(tsmAddress), "TSM: tsm does not exist");
  }

  modifier onlyTSMOrApproved(address tsmAddress)
  {
    _checkTSMOrApproved(tsmAddress);
    _;
  }

  function _checkTSMOrApproved(address tsmAddress) internal view
  {
    require(_tsmExists(tsmAddress) && (
      (_msgSender() == tsmOperator(tsmAddress)) ||
      (_msgSender() == tsmAddress)),
      "TSM: caller is not TSM or approved");
  }

  function _registerTSM(
    address tsmAddress, 
    string calldata uri) internal
  {
    require(!_tsmExists(tsmAddress), "Owner: TSM already registered");
    _tsms[tsmAddress]._isRegistered = true;
    _tsms[tsmAddress]._operator = address(0);
    _tsms[tsmAddress]._uri = uri;
    emit TSMRegistered(tsmAddress, uri);
  }

  function _tsmExists(address tsmAddress) internal view returns (bool)
  {
    return _tsms[tsmAddress]._isRegistered != false;
  }


  function totalTSMs() external override view returns (uint256)
  {
    return _tsmCount;
  }

  function tsmByIndex(uint256 index) external override view returns (address)
  {
    require(index < _tsmCount, "TSM: index out of bounds");
    return _tsmIndex[index];
  }

  function tsmUri(address tsmAddress) 
    public override view onlyTSM(tsmAddress) returns (string memory) 
  {
    return _tsms[tsmAddress]._uri;
  }

  function tsmSetUri(string calldata uri) 
    public override onlyTSM(_msgSender())
  {
    _tsms[_msgSender()]._uri = uri;
    emit TSMUpdate(_msgSender(), uri);
  }
  
  function tsmOperator(address tsmAddress) 
    public override view onlyTSM(tsmAddress) returns (address)
  {
    return _tsms[tsmAddress]._operator;
  }

  function approve(address operator) external override onlyTSM(_msgSender())
  {
    _tsms[_msgSender()]._operator = operator;
    emit TSMApproved(_msgSender(), operator);
  }

  function addChipId(
    address tsmAddress, 
    bytes32 chipId, 
    bytes calldata signature) external override onlyTSMOrApproved(tsmAddress)
  {
    _addChipSafe(tsmAddress, chipId, signature);
  }

  function addChipIds(
    address tsmAddress,
    bytes32[] calldata chipIds,
    bytes[] calldata signatures
  ) external override onlyTSMOrApproved(tsmAddress)
  { 
    require(chipIds.length == signatures.length, "TSM: chipIds and signatures length mismatch");
    for(uint256 i = 0; i < chipIds.length; i++)
    {
      _addChipSafe(tsmAddress, chipIds[i], signatures[i]);
    }
  }

  /*=== END TSM ===*/

  /*=== CHIP ===*/
  function _chipExists(bytes32 chipId) internal view returns (bool)
  {
    return _chipIds[chipId]._tsmAddress != address(0);
  }

  function _isValidChipSignature(address tsmAddress, bytes32 chipId, bytes calldata signature) internal pure returns (bool)
  {
    address _signer;
    bytes32 msgHash;
    bytes32 _r;
    bytes32 _s;
    uint8 _v;

    /* Implementation for Kong Halo Chip 2021 Edition */
    require(signature.length == 65, "Chip: invalid sig length");

      /* unpack v, s, r */
    _r = bytes32(signature[0:32]);
    _s = bytes32(signature[32:64]);
    _v = uint8(signature[64]);

    if(uint256(_s) > 
      0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0)
    {
      revert("Chip: invalid sig `s`");
    }

    if(_v != 27 && _v != 28)
    {
      revert("Chip: invalid sig `v`");
    }

    msgHash = keccak256(
      abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        keccak256(abi.encodePacked(tsmAddress))
      )
    );

    _signer = ecrecover(msgHash, _v, _r, _s);
    
    require(_signer != address(0x0), "Chip: invalid signer");

    return _signer == address(uint160(uint256(chipId)));
  }

  function _addChipSafe(address tsmAddress, bytes32 chipId, bytes calldata signature) internal
  {
    require(_isValidChipSignature(tsmAddress, chipId, signature), "Chip: chip signature invalid");
    _addChip(tsmAddress, chipId);
  }

  function _addChip(address tsmAddress, bytes32 chipId) internal
  {
    require(!_chipExists(chipId), "Chip: chip already exists");
    _chipIds[chipId]._tsmAddress = tsmAddress;
    emit ChipRegistered(chipId, tsmAddress);
  }

  function chipTSM(bytes32 chipId) public override view returns (address)
  {
    require(_chipExists(chipId), "Chip: chip doesn't exist");
    return _chipIds[chipId]._tsmAddress;
  }
  
  function chipUri(bytes32 chipId) external override view returns (string memory)
  {
    return tsmUri(chipTSM(chipId));
  }

  function chipExists(bytes32 chipId) public override view returns (bool)
  {
    return _chipExists(chipId);
  }

  /*=== END CHIP ===*/
}