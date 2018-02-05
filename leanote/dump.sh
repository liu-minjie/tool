#!/bin/bash

password=$(node ./password.js)
dumpDate=$(date "+%Y-%m-%d_%H_%M_%S")
archiveName="leanote.${dumpDate}.tar.gz"

mongodump --db leanote -o "./leanote/"
tar -czvf - "./leanote/leanote" | openssl des3 -salt -k "${password}" -out "./leanote/${archiveName}"
rm -rf "./leanote/leanote"
cp "./leanote/${archiveName}" "/Users/liuminjie/Documents/leanote/"

exec node "./index.js" "${archiveName}"
#openssl des3 -d -k "${password}" -salt -in "./leanote/${archiveName}" | tar xzf -