#!/bin/sh
SourceApps="$(ls ./source/)"
HubSdkApps="${SourceApps} MatrixStickerHelper"
HtmlHeadInject='<script src="../../shared/OctoHub-Global.js"></script>'

quoteVar(){ echo '"'"$1"'"' ;}

getMetaAttr(){
	file="$1"
	name="$2"
	key="$([ -n "$3" ] && echo "$3" || echo property)"
	grep '<meta '"$key"'="'"$name"'"' "$file" | grep '>' | cut -d '"' -f4
}

################################################################################

npm update
npm install
cd ./node_modules/SpaccDotWeb
npm install
npm run build:lib
cd ../..

rm -vrf ./public || true
cp -vr ./static ./public
cp -vr ./shared ./public/shared

for App in ${SourceApps}
do
	mkdir -p "./public/${App}"
	cd "./source/${App}"
	if [ -f ./Requirements.sh ]
		then sh ./Requirements.sh
	elif [ -f ./package.json ]
		then (npm update; npm install)
	fi
	copyfiles="$(sh ./Build.sh)"
	cp -vr $copyfiles "../../public/${App}/"
	for file in $copyfiles
	do
		path="../../public/${App}/${file}"
		if [ ! -e "${path}" ]
		then mkdir -p "${path}" && rm -rf "${path}" && cp "${file}" "${path}"
		fi
	done
	cd ../..
done

cd ./public
node ../WriteRedirectPages.js

for App in ${HubSdkApps}
do
	htmlfile="./${App}/index.html"
	jsonfile="./${App}/WebManifest.json"
	if [ -f "${jsonfile}" ]
	then continue
	fi
	name="$(       getMetaAttr "${htmlfile}" og:title)"
	description="$(getMetaAttr "${htmlfile}" og:description)"
	url="$(        getMetaAttr "${htmlfile}" OctoSpaccHubSdk:Url)"
	cat << [OctoSpaccHubSdk-WebManifest-EOF] > "${jsonfile}"
	{
		$(getMetaAttr "${htmlfile}" OctoSpaccHubSdk:WebManifestExtra | sed s/\'/\"/g)
		$([ -n "${description}" ] && echo "$(quoteVar description): $(quoteVar "${description}"),")
		"start_url": "${url}",
		"scope": "${url}",
		"name": "${name}"
	}
[OctoSpaccHubSdk-WebManifest-EOF]
	htmltitle='<title>'"${name}"'</title>'
	htmlcanonical='<link rel="canonical" href="'"${url}"'"/>'
	sed -i 's|</head>|<link rel="manifest" href="./WebManifest.json"/>'"${htmltitle}${htmlcanonical}${htmlmanifest}${HtmlHeadInject}"'</head>|' "${htmlfile}"
done
