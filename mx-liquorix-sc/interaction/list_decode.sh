#!/bin/bash

# Decode multiple nested MultiversX encoded strings from a JSON array
# Usage: ./decode_list.sh '[
#     "0000000901468ba9bb82032a1800000012",
#     "00000008b6dad6d7377f3f3400000012",
#     ...
# ]'
#
# Or from stdin: echo '[...]' | ./decode_list.sh

python3 - "$@" << 'EOF'
import sys
import subprocess
import json

def decode_simple(x):
    """Fallback to simple decoding like decode.sh"""
    if len(x) == 64:
        result = subprocess.run(['mxpy', 'wallet', 'bech32', '--encode', x], capture_output=True, text=True)
        return result.stdout.strip()
    else:
        try:
            decoded = bytes.fromhex(x).decode('utf-8')
            if decoded.isdigit():
                return '"' + decoded + '"'
            return decoded
        except:
            if x[0:2] != '0x':
                x = '0x' + x
            return int(x, base=0)

def decode_nested(hex_string):
    """
    Decode nested MultiversX encoding.
    Format: 8-char length prefix (number of byte pairs) + actual hex value + 8-char raw value (e.g., decimals)
    Example: "0000000901468ba9bb82032a1800000012"
             ^^^^^^^^ = 9 bytes for the first number
                     ^^^^^^^^^^^^^^^^^^ = 9 bytes (18 hex chars) = the actual value
                                       ^^^^^^^^ = raw 4-byte value (e.g., decimals = 18)
    """
    try:
        # Check minimum length for nested encoding (8 + at least 2 + 8 = 18 chars minimum)
        if len(hex_string) < 18:
            return decode_simple(hex_string)
        
        # Read 8-char length prefix (number of byte pairs for first value)
        length_hex = hex_string[0:8]
        try:
            num_bytes = int(length_hex, 16)
        except ValueError:
            return decode_simple(hex_string)
        
        # Sanity check
        if num_bytes <= 0 or num_bytes > 32:
            return decode_simple(hex_string)
        
        # Check if we have enough data: 8 (length) + num_bytes*2 (value) + 8 (second value)
        expected_len = 8 + num_bytes * 2 + 8
        if len(hex_string) != expected_len:
            # Try fallback or alternative parsing
            return decode_simple(hex_string)
        
        # Extract first value (length-prefixed big integer)
        value1_hex = hex_string[8:8 + num_bytes * 2]
        value1 = int(value1_hex, 16)
        
        # Extract second value (raw 4-byte integer, e.g., decimals)
        value2_hex = hex_string[8 + num_bytes * 2:]
        value2 = int(value2_hex, 16)
        
        return [value1, value2]
    
    except Exception as e:
        # Any error, fallback to simple decoding
        return decode_simple(hex_string)

def main():
    # Get input from argument or stdin
    if len(sys.argv) > 1:
        input_data = ' '.join(sys.argv[1:])
    else:
        input_data = sys.stdin.read()
    
    # Parse JSON array
    try:
        encoded_list = json.loads(input_data)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        sys.exit(1)
    
    if not isinstance(encoded_list, list):
        print("Error: Input must be a JSON array", file=sys.stderr)
        sys.exit(1)
    
    # Decode each string
    results = []
    for i, encoded_str in enumerate(encoded_list):
        if not isinstance(encoded_str, str):
            print(f"Warning: Item {i} is not a string, skipping", file=sys.stderr)
            results.append(None)
            continue
        
        decoded = decode_nested(encoded_str)
        results.append(decoded)
    
    # Print results
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
EOF
