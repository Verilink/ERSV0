# ChipTable
This is an on-chain interim solution to ERS. It will provide a simple chip lookup table for vendors. 

## Design
### Owner
Privileges:
- Can register TSMs
- Can add chipIds without needing signature

Data: 
- address

### TSM
Privileges:
- Can add chips with signature
- Can approve an operator to add chips for TSM

Data:
- tsmId: hash of the name (keccak(name))
- address: address that owns tsm
- operator: approved operator for tsm
- name: name of the tsm
- uri: redirect uri of the tsm

### Chip
Data: 
 - tsmId: maps the chip to a tsm

# Scripts
## Deploy
Deploy `chipTable.sol`. Requires `owner`, `version` and `network` parameters.

### Usage
`node scripts/deploy-script.js -o OWNER_ADDRESS -v VERSION -n NETWORK`

## Register TSM
Add a new TSM. Can only be called by owner. Requires `contract-address`, `tsm`, `uri` and `network` parameters.

### Usage
`node scripts/register-tsm.js -c CHIP_TABLE_ADDRESS -t TSM_ADDRESS -u TSM_URI -n NETWORK`

## Register Chips
Add chips to `chipTable`. Expects a `.txt` file with one chip public key, `04` prepended, per line. See `publicKeySamples.txt`. Requires `contract-address`, `tsm`, `public-key-path` and `network` parameters.

### Usage
`node scripts/register-chips.js -c CHIP_TABLE_ADDRESS -t TSM_ADDRESS -p PUBLIC_KEY_LIST_FILE -n NETWORK` 

# .env
- PRIVATE_KEY="<your_private_key>": Used for deploying
- ALCHEMY_API_KEY="<your_alchemy_api_key>": Used for forking mainnet
- COINMARKETCAP_KEY="<your_coinmarketcap_key>": Used for tracking gas prices
- ETHERSCAN_API_KEY="<your_etherscan_key>": Used for verifying contracts on Etherscan
