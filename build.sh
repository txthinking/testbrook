#!/bin/bash

if [ $# -ne 1 ]; then
    echo "./build.sh version"
    exit
fi

mkdir _

deno compile -A -r --unstable --target x86_64-unknown-linux-gnu -o _/testbrook_linux_amd64 https://raw.githubusercontent.com/txthinking/testbrook/master/testbrook.js
deno compile -A -r --unstable --target x86_64-apple-darwin -o _/testbrook_darwin_amd64 https://raw.githubusercontent.com/txthinking/testbrook/master/testbrook.js
deno compile -A -r --unstable --target aarch64-apple-darwin -o _/testbrook_darwin_arm64 https://raw.githubusercontent.com/txthinking/testbrook/master/testbrook.js
deno compile -A -r --unstable --target x86_64-pc-windows-msvc -o _/testbrook_windows_amd64 https://raw.githubusercontent.com/txthinking/testbrook/master/testbrook.js

nami release github.com/txthinking/testbrook $1 _

rm -rf _
