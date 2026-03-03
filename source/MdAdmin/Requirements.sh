#!/bin/sh
npm install
yes | npx esbuild --help > /dev/null # Install esbuild
