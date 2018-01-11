#!/bin/bash
dumpDate=$(date "+%Y-%m-%d_%H_%M_%S")
archiveName="leanote.${dumpDate}.gz"
mongodump --archive="./leanote/${archiveName}" --gzip --db leanote
cp "./leanote/${archiveName}" "/Users/liuminjie/Documents/leanote/"

exec node "./index.js" "${archiveName}"