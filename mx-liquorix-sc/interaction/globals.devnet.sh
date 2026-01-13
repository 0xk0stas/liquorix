PROXY="https://devnet-gateway.multiversx.com"
CHAIN_ID="D"

SC_PATH="../"
SC_NAME=$(grep -oP 'name = "\K[^"]+' $SC_PATH"Cargo.toml")
SC_BYTECODE=$SC_PATH"output/$SC_NAME.wasm"

source $SC_PATH".env.devnet"

# Validate that PEM file exists and is readable
if [ -z "$PEM" ]; then
    echo "Error: PEM variable is not set in .env.devnet file"
    exit 1
fi

if [ ! -f "$PEM" ]; then
    echo "Error: PEM file '$PEM' does not exist"
    exit 1
fi

if [ ! -r "$PEM" ]; then
    echo "Error: PEM file '$PEM' is not readable"
    exit 1
fi

# Warn if SC_ADDRESS is not set
if [ -z "$SC_ADDRESS" ]; then
    echo "⚠️  SC_ADDRESS variable is not set."
else
    SC_ADDRESS_HEX=$(mxpy wallet bech32 --decode $SC_ADDRESS)
fi

OWNER_PEM=$PEM
OWNER_ADDRESS=$(mxpy wallet convert --infile $OWNER_PEM --in-format pem --out-format address-bech32 | sed -n '3p')

# Validate that owner address was successfully extracted
if [ -z "$OWNER_ADDRESS" ]; then
    echo "Error: Failed to extract owner address from PEM file '$OWNER_PEM'"
    echo "Please verify the PEM file is valid and properly formatted"
    exit 1
fi

OWNER_ADDRESS_HEX=$(mxpy wallet bech32 --decode $OWNER_ADDRESS)

# === Constants ===

XEGLD=XEGLD-23b511
USDC=USDC-350c4e
XLEND=XOXNOLEND-0d9fce
LIQUID_STAKING_ADDRESS=erd1qqqqqqqqqqqqqpgqc2d2z4atpxpk7xgucfkc7nrrp5ynscjrah0scsqc35
LENDING_ADDRESS=erd1qqqqqqqqqqqqqpgq4jah0u2hcgem33c0q8lwwlv2au6x2ck3ah0sh00d8w
SWAP_ROUTER_ADDRESS=erd1qqqqqqqqqqqqqpgqgvg27qrmtqslcn9jfrpsyw8j8r5e5lrjah0stwuckk
BOT_ADDRESS=erd1s5ufsgtmzwtp6wrlwtmaqzs24t0p9evmp58p33xmukxwetl8u76sa2p9rv
SHARE_TOKEN_NAME=Liquorix
SHARE_TOKEN_TICKER=LQRX
SHARE_TOKEN=LQRX-1e1926
