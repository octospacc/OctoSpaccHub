#!/bin/sh
npm update
npm install
yes | npx esbuild
