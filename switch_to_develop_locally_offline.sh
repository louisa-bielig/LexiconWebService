#!/bin/bash

echo ""
echo "Put the Node server to act as the localhost server"
sed 's/nodeconfig_[^)]*)/nodeconfig_local")/' lexicon-service.js  > output
mv output lexicon-service.js
sed 's/couchkeys_[^)]*)/couchkeys_local")/' lexicon-service.js  > output
mv output lexicon-service.js

echo "Now running in local/offline developer mode using the localhost."

