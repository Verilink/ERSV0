# Solidity API

## IChipTable

### TSMRegistered

```solidity
event TSMRegistered(address tsmAddress, string tsmUri)
```

Registered TSM

### TSMApproved

```solidity
event TSMApproved(address tsmAddress, address operator)
```

TSM approved operator

### ChipRegistered

```solidity
event ChipRegistered(bytes32 chipId, address tsmAddress)
```

Chip Registered with ERS

### TSMUpdate

```solidity
event TSMUpdate(address tsmAddress, string tsmUri)
```

TSM updated

### registryVersion

```solidity
function registryVersion() external returns (string)
```

Registry Version

### registerTSM

```solidity
function registerTSM(address tsmAddress, string uri) external
```

Registers a TSM 
Permissions: Owner

### registerChipIds

```solidity
function registerChipIds(address tsmAddress, bytes32[] chipIds) external
```

Registers Chip Ids without signatures
Permissions: Owner

### safeRegisterChipIds

```solidity
function safeRegisterChipIds(address tsmAddress, bytes32[] chipIds, bytes[] signatures) external
```

Registers Chip Ids with Signatures
Permissions: Owner

### totalTSMs

```solidity
function totalTSMs() external view returns (uint256)
```

Returns the number of registered TSMs

### tsmByIndex

```solidity
function tsmByIndex(uint256 index) external view returns (address)
```

Returns the TSM Id by Index

### tsmUri

```solidity
function tsmUri(address tsmAddress) external view returns (string)
```

Returns the TSM uri

### tsmSetUri

```solidity
function tsmSetUri(string uri) external
```

Sets the TSM uri

### tsmOperator

```solidity
function tsmOperator(address tsmAddress) external view returns (address)
```

Returns the TSM operator

### approve

```solidity
function approve(address operator) external
```

Approves an operator for a TSM

### addChipId

```solidity
function addChipId(address tsmAddress, bytes32 chipId, bytes signature) external
```

Adds a ChipId
requires a signature
Permissions: TSM

### addChipIds

```solidity
function addChipIds(address tsmAddress, bytes32[] chipIds, bytes[] signatures) external
```

Adds ChipIds
requires a signature
Permissions: TSM

### chipTSM

```solidity
function chipTSM(bytes32 chipId) external view returns (address)
```

gets a Chip's TSM Id

### chipUri

```solidity
function chipUri(bytes32 chipId) external view returns (string)
```

Gets the Chip Redirect Uri

### chipExists

```solidity
function chipExists(bytes32 chipId) external view returns (bool)
```

Get whether chip exists

## ChipTable

### TSM

```solidity
struct TSM {
  bool _isRegistered;
  address _operator;
  string _uri;
}
```

### ChipInfo

```solidity
struct ChipInfo {
  address _tsmAddress;
}
```

### _tsms

```solidity
mapping(address => struct ChipTable.TSM) _tsms
```

### _chipIds

```solidity
mapping(bytes32 => struct ChipTable.ChipInfo) _chipIds
```

### _tsmIndex

```solidity
mapping(uint256 => address) _tsmIndex
```

### _tsmCount

```solidity
uint256 _tsmCount
```

### VERSION

```solidity
string VERSION
```

### constructor

```solidity
constructor(address _contractOwner, string _registryVersion) public
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external pure returns (bool)
```

_Returns true if this contract implements the interface defined by
`interfaceId`. See the corresponding
https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
to learn more about how these ids are created.

This function call must use less than 30 000 gas._

### registryVersion

```solidity
function registryVersion() external view returns (string)
```

Registry Version

### registerTSM

```solidity
function registerTSM(address tsmAddress, string uri) external
```

Registers a TSM 
Permissions: Owner

### registerChipIds

```solidity
function registerChipIds(address tsmAddress, bytes32[] chipIds) external
```

Registers Chip Ids without signatures
Permissions: Owner

### safeRegisterChipIds

```solidity
function safeRegisterChipIds(address tsmAddress, bytes32[] chipIds, bytes[] signatures) external
```

Registers Chip Ids with Signatures
Permissions: Owner

### onlyTSM

```solidity
modifier onlyTSM(address tsmAddress)
```

### _checkTSM

```solidity
function _checkTSM(address tsmAddress) internal view
```

### onlyTSMOrApproved

```solidity
modifier onlyTSMOrApproved(address tsmAddress)
```

### _checkTSMOrApproved

```solidity
function _checkTSMOrApproved(address tsmAddress) internal view
```

### _registerTSM

```solidity
function _registerTSM(address tsmAddress, string uri) internal
```

### _tsmExists

```solidity
function _tsmExists(address tsmAddress) internal view returns (bool)
```

### totalTSMs

```solidity
function totalTSMs() external view returns (uint256)
```

Returns the number of registered TSMs

### tsmByIndex

```solidity
function tsmByIndex(uint256 index) external view returns (address)
```

Returns the TSM Id by Index

### tsmUri

```solidity
function tsmUri(address tsmAddress) public view returns (string)
```

Returns the TSM uri

### tsmSetUri

```solidity
function tsmSetUri(string uri) public
```

Sets the TSM uri

### tsmOperator

```solidity
function tsmOperator(address tsmAddress) public view returns (address)
```

Returns the TSM operator

### approve

```solidity
function approve(address operator) external
```

Approves an operator for a TSM

### addChipId

```solidity
function addChipId(address tsmAddress, bytes32 chipId, bytes signature) external
```

Adds a ChipId
requires a signature
Permissions: TSM

### addChipIds

```solidity
function addChipIds(address tsmAddress, bytes32[] chipIds, bytes[] signatures) external
```

Adds ChipIds
requires a signature
Permissions: TSM

### _chipExists

```solidity
function _chipExists(bytes32 chipId) internal view returns (bool)
```

### _isValidChipSignature

```solidity
function _isValidChipSignature(address tsmAddress, bytes32 chipId, bytes signature) internal pure returns (bool)
```

### _addChipSafe

```solidity
function _addChipSafe(address tsmAddress, bytes32 chipId, bytes signature) internal
```

### _addChip

```solidity
function _addChip(address tsmAddress, bytes32 chipId) internal
```

### chipTSM

```solidity
function chipTSM(bytes32 chipId) public view returns (address)
```

gets a Chip's TSM Id

### chipUri

```solidity
function chipUri(bytes32 chipId) external view returns (string)
```

Gets the Chip Redirect Uri

### chipExists

```solidity
function chipExists(bytes32 chipId) public view returns (bool)
```

Get whether chip exists

