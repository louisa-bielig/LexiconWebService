#!/bin/bash

echo ""
echo "Put the Node server to act as the development server"
sed 's/nodeconfig_[^)]*)/nodeconfig_devserver")/' lexicon-service.js  > output
mv output lexicon-service.js
sed 's/couchkeys_[^)]*)/couchkeys_devserver")/' lexicon-service.js  > output
mv output lexicon-service.js

echo "Now running in developer mode."

