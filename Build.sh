#!/bin/sh
for App in SpiderADB WuppiMini
do
	mkdir -p ./public/${App}
	cd ./src/${App}
	sh ./Requirements.sh
	cp -r $(sh ./Build.sh) ../../public/${App}/
	cd ../..
done
cp -r ./shared ./public/shared
cd ./public
node ../WriteRedirectPages.js
