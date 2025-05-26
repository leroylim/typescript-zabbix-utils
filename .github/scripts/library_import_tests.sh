#!/bin/bash

mode=$1
class=$2
error=$3

if [ "$mode" == "sync" ]; then
    cmd="const { $class } = require('./dist'); try { new $class(); } catch (e) { console.error(e.message); }"
elif [ "$mode" == "async" ]; then
    cmd="const { $class } = require('./dist'); (async () => { try { new $class(); } catch (e) { console.error(e.message); } })();"
else
    echo "Unknown mode: $mode"
    exit 1
fi

result=$(node -e "$cmd" 2>&1)
echo "$result" | grep "$error" >/dev/null || echo "$result" | (node "./.github/scripts/telegram_msg.js" && echo "Error")
