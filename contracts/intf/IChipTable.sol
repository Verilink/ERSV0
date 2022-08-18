/***
 * SPDX-License-Identifier: GPL-3.0
 * == Developer History (NAME, ORG, DATE, DESCR) ==
 * Isaac Dubuque, Verilink, 7/24/22, Initial Commit
 * ================================================
 * 
 * File: IChipTable.sol
 * Description: Chip Table Interface
 */

pragma solidity ^0.8.5;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";


/***
 * IChipTable
 * Provides the interface for the ERS interim on-chain chip resolution
 * The Chip Table allows the owner to register Trusted Service Managers (TSM)
 * TSMs can add chips allowing for a decentralized chip resolution
 * Chips can be look up their TSM for device information and redirect resolution
 */
interface IChipTable is IERC165
{
  /**
   * Registered TSM
   */
  event TSMRegistered(address tsmAddress, string tsmUri);
  
  /**
   * TSM approved operator
   */
  event TSMApproved(address tsmAddress, address operator);

  /**
   * Chip Registered with ERS
   */
  event ChipRegistered(bytes32 chipId, address tsmAddress);

  /**
   * TSM updated
   */
  event TSMUpdate(address tsmAddress, string tsmUri);

  /**
    Registry Version
   */
  function registryVersion() external returns (string memory);

  /**
   * Registers a TSM 
   * Permissions: Owner
   */
  function registerTSM(
    address tsmAddress, 
    string calldata uri) external;
  
  /**
   * Registers Chip Ids without signatures
   * Permissions: Owner
   */
  function registerChipIds(
    address tsmAddress,
    bytes32[] calldata chipIds
  ) external;

  /**
   * Registers Chip Ids with Signatures
   * Permissions: Owner
   */
  function safeRegisterChipIds(
    address tsmAddress,
    bytes32[] calldata chipIds,
    bytes[] calldata signatures
  ) external;

  /**
   * Returns the number of registered TSMs
   */
  function totalTSMs() 
    external view returns (uint256);

  /**
   * Returns the TSM Id by Index
   */
  function tsmByIndex(uint256 index) 
    external view returns (address);

  /**
   * Returns the TSM uri
   */
  function tsmUri(address tsmAddress) 
    external view returns (string memory);

  /**
   * Sets the TSM uri
   */
  function tsmSetUri(string calldata uri) external;

  /**
   * Returns the TSM operator
   */
  function tsmOperator(address tsmAddress) 
    external view returns (address);

  /**
   * Approves an operator for a TSM
   */
  function approve(address operator) external;

  /**
   * Adds a ChipId
   * requires a signature
   * Permissions: TSM
   */
  function addChipId(
    address tsmAddress, 
    bytes32 chipId, 
    bytes calldata signature) external;

  /**
   * Adds ChipIds
   * requires a signature
   * Permissions: TSM
   */
  function addChipIds(
    address tsmAddress,
    bytes32[] calldata chipIds,
    bytes[] calldata signatures
  ) external;

  /**
   * gets a Chip's TSM Id
   */
  function chipTSM(bytes32 chipId) 
    external view returns (address);

  /**
   * Gets the Chip Redirect Uri
   */
  function chipUri(bytes32 chipId) 
    external view returns (string memory);
  
  /**
   * Get whether chip exists
   */
  function chipExists(bytes32 chipId)
    external view returns (bool);
}