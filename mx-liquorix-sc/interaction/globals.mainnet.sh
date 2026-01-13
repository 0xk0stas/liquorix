PROXY="https://gateway.multiversx.com"
CHAIN_ID="1"

SC_PATH="../"
SC_NAME=$(grep -oP 'name = "\K[^"]+' $SC_PATH"Cargo.toml")
SC_BYTECODE=$SC_PATH"output/$SC_NAME.wasm"

source $SC_PATH".env.mainnet"

# Validate that PEM file exists and is readable
if [ -z "$PEM" ]; then
    echo "Error: PEM variable is not set in .env.mainnet file"
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

XEGLD=XEGLD-e413ed
USDC=USDC-c76f1f
XLEND=XLEND-18dc6f
LIQUID_STAKING_ADDRESS=erd1qqqqqqqqqqqqqpgq6uzdzy54wnesfnlaycxwymrn9texlnmyah0ssrfvk6
LENDING_ADDRESS=erd1qqqqqqqqqqqqqpgqyq9mwxkq7zelkupafta5ah95pw6362j745qsk5mdzw
SWAP_ROUTER_ADDRESS=erd1qqqqqqqqqqqqqpgq5rf2sppxk2xu4m0pkmugw2es4gak3rgjah0sxvajva
BOT_ADDRESS=erd1jtyr84q6h2h8a848nllrsyggalpyuql7udxrk07feenjzld48qasrdjpap
SHARE_TOKEN_NAME=LiquorixEGLD
SHARE_TOKEN_TICKER=LQRX
SHARE_TOKEN=LQRX-eae13e
