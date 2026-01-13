#!/bin/bash

mkdir -p reports

use_devnet() {
    source globals.devnet.sh
}

use_mainnet() {
    source globals.mainnet.sh
}

fetch_address_from_token() {
    local NETWORK=$1
    local LABEL=$2
    
    # Get the address from deployments.json using jq
    FETCHED_ADDRESS=$(jq -r --arg network "$NETWORK" --arg label "$LABEL" \
        '.[$network][] | select(.label == $label) | .address' ../deployments.json)
    
    # Export SC_ADDRESS so it's available when sourcing globals
    export SC_ADDRESS="$FETCHED_ADDRESS"
    if [ -n "$SC_ADDRESS" ] && [ "$SC_ADDRESS" != "null" ]; then
        echo "Using $LABEL address: $SC_ADDRESS"
    fi

}

# Select env and fetch address from label (defaults to "SC" if not provided)
case $1 in
    "D")
        echo "Using Devnet"
        NETWORK="devnet"
        LABEL="${2:-SC}"
        fetch_address_from_token "$NETWORK" "$LABEL"
        use_devnet
        ;;
    "1")
        echo "Using Mainnet"
        NETWORK="mainnet"
        LABEL="${2:-SC}"
        fetch_address_from_token "$NETWORK" "$LABEL"
        use_mainnet
        ;;
    *)
        echo "Require MultiversX chain id (D, 1). Ex $0 D [LABEL]" && exit
        ;;
esac

source snippets.sh

# Add your custom smart contract interactions below this line
# Available functions: deploy, upgrade, changeOwnerAddress, claimDeveloperRewards, runTx
# Example: deploy "$(./encode.sh arg1)@$(./encode.sh arg2)"

issueShareToken() {        
    runTx '' 50000000000000000 issueShareToken @$(./encode.sh $1)@$(./encode.sh $2) 80000000
}

createLendingPosition() {
    runTx '' '' ESDTTransfer @$(./encode.sh $XEGLD)@$(./encode.sh 10000000000000000)@$(./encode.sh createLendingPosition) 100000000
}

depositXEGLD() {
    runTx '' '' ESDTTransfer @$(./encode.sh $XEGLD)@$(./encode.sh $1)@$(./encode.sh deposit) 90000000
}

depositEGLD() {
    runTx '' $1 deposit '' 90000000
}

withdraw() {
    runTx $OWNER_ADDRESS '' ESDTNFTTransfer @$(./encode.sh $SHARE_TOKEN)@$(./encode.sh $1)@$(./encode.sh $2)@$SC_ADDRESS_HEX@$(./encode.sh withdraw) 100000000
}

setRiskThresholds() {
    runTx '' '' setRiskThresholds @$(./encode.sh $1)@$(./encode.sh $2) 10000000
}

######################## START ########################

# deploy "0x$(./encode.sh $XEGLD) 0x$(./encode.sh $USDC) 0x$(./encode.sh $XLEND) 0x$(./encode.sh $LIQUID_STAKING_ADDRESS) 0x$(./encode.sh $LENDING_ADDRESS) 0x$(./encode.sh $SWAP_ROUTER_ADDRESS) 0x$(./encode.sh $BOT_ADDRESS)" 120000000
# upgrade '' 120000000
# sleep 6

# issueShareToken $SHARE_TOKEN_NAME $SHARE_TOKEN_TICKER