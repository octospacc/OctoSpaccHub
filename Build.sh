#!/bin/sh
for App in WuppiMini
do
	mkdir -p ./public/${App}
	cd ./src/${App}
	npm update
	npm install
	node ./index.js html
	cp ./index.js ./index.html ./node_modules/SpaccDotWeb/SpaccDotWeb.Server.js ../../public/${App}/
	cd ../..
done
for App in SpiderADB
do
	mkdir -p ./public/${App}
	cd ./src/${App}
	sh ./Prepare.sh
	cp -r $(sh ./Build.sh) ../../public/${App}/
	cd ../..
done
cd ./public
node ../WriteRedirectPages.js
