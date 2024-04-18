#!/bin/sh
SourceApps="SpiderADB WuppiMini"
HubSdkApps="$(SourceApps) Ecoji MatrixStickerHelper"

rm -vrf ./public || true
cp -vr ./static ./public
cp -vr ./shared ./public/shared

for App in $(SourceApps)
do
	mkdir -p ./public/${App}
	cd ./source/${App}
	sh ./Requirements.sh
	cp -r $(sh ./Build.sh) ../../public/${App}/
	cd ../..
done

cd ./public
node ../WriteRedirectPages.js

for App in $(HubSdkApps)
do
	echo # TODO write manifest.json files
done
