#!/bin/bash

mode=$1
class=$2
error=$3

if [ "$mode" == "sync" ]; then
    cmd="const { $class } = require('./dist'); console.log('Import successful: ' + typeof $class);"
elif [ "$mode" == "async" ]; then
    cmd="const { $class } = require('./dist'); console.log('Import successful: ' + typeof $class);"
else
    echo "Unknown mode: $mode"
    exit 1
fi

result=$(node -e "$cmd" 2>&1)

# Check if import was successful
if echo "$result" | grep -q "Import successful: function"; then
    # Import was successful, no output (test passes)
    exit 0
elif echo "$result" | grep -q "$error"; then
    # Expected error occurred (like "Cannot find module"), no output (test passes)
    exit 0
else
    # Unexpected error occurred, output it for debugging
    echo "$result" | (node "./.github/scripts/telegram_msg.js" && echo "Error")
fi
