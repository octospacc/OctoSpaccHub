#!/bin/sh
npm update
npm install
yes | npx esbuild --help > /dev/null # Install esbuild
