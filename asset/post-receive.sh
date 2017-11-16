#!/bin/bash

read oldrev newrev refname
#oldrev="6b5de894ac0c8635e2d142afd157a3561b430bd8"
#newrev="f5ea136738e7d200ea796d0313342a95f7632d65"
#refname="refs/heads/0.0.1"
#cd ..

echo "post receive"
path=`pwd`
bname=`basename "${path}"`
repDirPre="/home/repository/gitlab_code/"
arr=(${path//\// })
group=${arr[${#arr[*]} - 2]}
dirName=$repDirPre$group
SUFFIX=.git
name=${bname%$SUFFIX}
#gitlabDataDir="git@gitlab.enhancer.cc:"



beginWith() { 
  case $2 in "$1"*) 
    true;; 
  *) 
    false;; 
  esac; 
}

merge(){
  branch=$1
  cd ..

  if [ ! -d "./.git" ]; then
    git clone -l "${path}" tmp > /dev/null
    mv tmp/.git . > /dev/null
    rm -rf tmp > /dev/null
    git reset --mixed > /dev/null
  fi

  hasBranch=`git branch | grep $branch`

  if [ "${hasBranch}" ]; then 
    git checkout $branch > /dev/null
  else
    git checkout -b $branch > /dev/null
  fi
  
  git pull origin $branch > /dev/null

  hasMaster=`git branch | grep "master"`;
  if [  "${hasMaster}" = "" ]; then
    git checkout -b master > /dev/null
  else
    git checkout master > /dev/null
    git merge $branch > /dev/null
  fi

  git push origin master > /dev/null
}

checkoutBranch() {
  git checkout  .
  branch=$1
  hasBranch=`git branch | grep $branch`
  if [ "${hasBranch}" ]; then
      git checkout $branch > /dev/null
  else
      git checkout -b $branch > /dev/null
  fi
}


if [ "${newrev}" =  "0000000000000000000000000000000000000000" ]; then
  exit 0;
fi

if beginWith "refs/tags/release" "$refname"; then
  if beginWith "example" "${bname}"; then
    branch=${refname#refs/tags/release/}
    if [ "$branch" = "master" ]; then
      exit 0;
    fi

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

    
    dirName="${dirName}/${branch}"
    
    unset GIT_DIR

    if [ -d "$dirName" ]; then
      cd $branch
      checkoutBranch $branch
      git pull origin "$branch" > /dev/null
      merge $branch
    else
      git clone -l  "${path}" "$branch" > /dev/null
      cd $branch
      checkoutBranch $branch
      merge $branch
    fi
  fi
fi
exit 0;