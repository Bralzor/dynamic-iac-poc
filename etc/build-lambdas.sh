#!/bin/bash

# Check if the base directory is provided as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <base_directory>"
    exit 1
fi

base_dir=$1

# Traverse all directories starting from the given base directory
find "$base_dir" -type d | while read dir; do
    if [ -f "$dir/package.json" ]; then
        # Run npm run build in each directory containing package.json
        (cd "$dir" && npm run build)
    fi
done
