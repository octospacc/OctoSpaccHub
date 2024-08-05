#!/bin/sh
npm update
npm install
cd ./node_modules/vlitejs/dist
[ ! -f ./vlite.js.old ] && mv ./vlite.js ./vlite.js.old
> ./vlite.js
echo '(function(){' >> ./vlite.js
cat ./vlite.js.old  >> ./vlite.js
echo '})();'        >> ./vlite.js
sed -i -e 's|;export{|;window.Vlitejs=|' ./vlite.js
sed -i -e 's|as default};|;|'            ./vlite.js
