#!/bin/bash



#name是项目名 rep是项目的git地址  branch表示分支名 group是组名
dirPre="/home/admin/release/apps/"
arg=$1
arr=(${arg//,/ })
name=${arr[0]}
rep=${arr[1]}
branch=${arr[2]}
group=${arr[3]}
ip=${arr[4]}
dirName=$dirPre$group
server="root@${ip}"
LOG_FILE="${name}.release.log"
pubDirPre="/home/admin/apps/"
repDirPre="/home/admin/release/apps"
if [ ! -f "$LOG_FILE"]; then
  touch $LOG_FILE
fi
cat /dev/null > $LOG_FILE
exec > >(tee -a ${LOG_FILE} )
exec 2> >(tee -a ${LOG_FILE} >&2)

if [ -z "$ip" ]; then 
  exit 1
fi

echo -e "\n\n"
echo "--------------Start deployment-------------------"
date "+%Y-%m-%d %H:%M:%S.%N"



startProcess() {

  name=$1
  curDir=$(pwd);

  projectDir=${curDir#*$repDirPre}
  pubDir=$pubDirPre$projectDir

  echo "copy to:  ${server}"

  ssh -i /root/.ssh/id_root_rsa "${server}" "mkdir -p ${pubDir}; pm2 stop ${name};"
  scp -rqCi /root/.ssh/id_root_rsa  "$curDir/." "${server}:${pubDir}"
  ssh -i /root/.ssh/id_root_rsa "${server}" "cd ${pubDir}; cnpm install; NODE_ENV=production pm2 start ./bin/start --merge-logs --name=${name}"
}

switchBranchAndPull() {
  curBranch=$(git branch | sed -n -e "s/^\* \(.*\)/\1/p")
  branch=$1
  git checkout .
  if [ $branch != $curBranch ]; then
    if [ `git branch | grep $branch` ]; then
        echo "git checkout $branch"
        git checkout $branch
    else
        echo "git checkout -b $branch"
        git checkout -b $branch
    fi
  fi
  echo "git pull origin $branch"
  git pull origin $branch
}


merge(){
  echo "------ start to merge ${branch} ----"
  branch=$1

  if [ ! -d "./.git" ]; then
    git init
    git remote add origin  "${rep}"
    git pull origin master
  fi

  hasBranch=`git branch | grep $branch`
  echo "merge: hasBranch ${hasBranch}"

  if [ "${hasBranch}" ]; then 
    git checkout $branch
  else
    git checkout -b $branch
  fi
  
  git pull origin $branch

  hasMaster=`git branch | grep "master"`;
  if [  "${hasMaster}" = "" ]; then
    git checkout -b master
  else
    git checkout master
    git merge $branch
  fi

  git push origin master
  echo "------ end merge ${branch} ----"
}




#进入group目录
if [ -d "$dirName" ]; then
  cd $dirName
else
  cd $dirPre
  mkdir "$group"
  cd  $group;
fi

#进入项目目录 
dirName="${dirName}/${name}"
if [ -d "$dirName" ]; then
  cd $dirName
  echo "project $dirName exist"
  switchBranchAndPull $branch
  startProcess $name
  merge $branch
else
  echo "git clone $rep ..."
  git clone  "$rep";
  cd ${name}
  switchBranchAndPull $branch
  startProcess $name
  merge $branch
fi


date "+%Y-%m-%d %H:%M:%S.%N"
echo "----------------End deployment-------------------"
