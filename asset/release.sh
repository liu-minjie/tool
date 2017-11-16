#!/bin/bash

LOG_FILE=hook.release.log
exec > >(tee -a ${LOG_FILE} )
exec 2> >(tee -a ${LOG_FILE} >&2)

#name是项目名 rep是项目的git地址  branch表示分支名 group表示组名


echo -e "\n\n"
echo "--------------Start deployment-------------------"
date "+%Y-%m-%d %H:%M:%S.%N"
repDirPre="/home/admin/gitlab_code/"
server="root@120.55.83.27"
pubDirPre="/home/admin/assets/"
arg=$1
arr=(${arg//,/ })
name=${arr[0]}
rep=${arr[1]}
branch=${arr[2]}
group=${arr[3]}
dirName=$repDirPre$group
gitlabDataDir="git@gitlab.xxx.com:"


if [ "$group" = "widget"  ]; then
  pubDirPre="/home/admin/${group}/"
fi

copyFile() {
    curDir=$(pwd);
    projectDir=${curDir#*$repDirPre}
    pubDir=$pubDirPre$projectDir

    distDir="${curDir}/build"

    if [ ! -d "$distDir" ]; then
      distDir="${curDir}/dist"
      if [ ! -d "$distDir" ]; then
        exit
      fi
    fi

    ssh -i /root/.ssh/id_root_rsa "${server}" "mkdir -p ${pubDir}"
    scp -rqCi /root/.ssh/id_root_rsa  "$distDir/." "${server}:${pubDir}"
}

checkoutBranch() {
  curBranch=$(git branch | sed -n -e "s/^\* \(.*\)/\1/p")
  echo "curBranch: ${curBranch}"
  git checkout  .
  branch=$1
  hasBranch=`git branch | grep $branch`
  echo "checkoutBranch: hasBranch ${hasBranch}"
  if [ "${hasBranch}" ]; then
      echo "git checkout ${branch}"
      git checkout $branch
      ret=$?
      echo "op result: ${ret}"
  else
      echo "git checkout -b ${branch}"
      git checkout -b $branch
      ret=$?
      echo "op result: ${ret}"
  fi
}


merge(){
  echo "------ start to merge ${branch} ----"
  branch=$1
  cd ..

  if [ ! -d "./.git" ]; then
    git clone "${gitlabDataDir}${group}/${name}.git" tmp && mv tmp/.git . && rm -rf tmp && git reset --mixed
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
  cd $repDirPre
  mkdir "$group"
  cd  $group;
fi

#进入项目目录 
dirName="${dirName}/${name}"
if [ -d "$dirName" ]; then
  cd $name
else
  mkdir "$name"
  cd  $name;
fi

pwd

if [ $branch = "master" ]; then #推master就相当于覆盖发布
  dirName="${dirName}/.git"
  if [ -d "$dirName" ]; then
    git checkout "master"
    echo "pull master in ${name}"
    git pull origin master
    copyFile
  else
    echo "clone master ${name}"
    git clone "${gitlabDataDir}${group}/${name}.git" .
    copyFile
  fi
else
  dirName="${dirName}/${branch}"
  if [ -d "$dirName" ]; then
    echo "there is branch ${branch}"
    cd $branch
    checkoutBranch $branch
    echo "pull branch ${branch} in project ${name}"
    git pull origin "$branch"
    copyFile
    merge $branch
  else
    echo "clone projetc ${name} as ${branch}"
    git clone  "${gitlabDataDir}${group}/${name}.git" "$branch"
    cd $branch
    checkoutBranch $branch
    copyFile
    merge $branch
  fi
fi

date "+%Y-%m-%d %H:%M:%S.%N"
echo "----------------End deployment-------------------"

