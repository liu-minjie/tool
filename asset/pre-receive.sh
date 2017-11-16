#!/bin/sh

read oldrev newrev refname
echo "${oldrev}  ${newrev} ${refname}" 


checkPushMaster() {
  branch=$1
  committer_email=$(git show --pretty=oneline --pretty=format:%ce | head -n1)
  if [ "$branch" = "master" ]; then
    if [ "$GL_ID" != "key-21" -a "$GL_ID" != "key-3" ]; then
      echo "do not push commit to master"
      exit 1;
    fi
  fi
}

checkBranchHasReleased() {
  releaseBranch=$1
  list=`git tag --list`
  for s in $list
  do
    if [ "${s}" = "${releaseBranch}" ]; then
      echo "${releaseBranch} has released!"
      exit 1;
    fi
  done
}

checkRevlist(){
  oldrev=$1
  newrev=$2
  lastMaster=$3

  if [ "${oldrev}" = "0000000000000000000000000000000000000000" ]; then
    list=`git rev-list  "${newrev}"`
  else
    list=`git rev-list  "${oldrev}...${newrev}"`
  fi

  for s in $list
  do
    if [ "${s}" = "${lastMaster}" ]; then
      return 1
    fi
  done
}

checkMasterHasUpdated() {
  branch=$1
  oldrev=$2
  newrev=$3
  isTag=$4
  lastMaster=`git rev-parse master`
  echo "last: ${lastMaster}"

  if [ "${oldrev}" =  "0000000000000000000000000000000000000000" ]; then
    checkRevlist $oldrev $newrev $lastMaster
    ret=$?
    if [ $ret != 1 ]; then
      if [ "${isTag}" = "1" ]; then
        echo "master has updated or master is ahead of tag"
      else
        echo "master has updated"
      fi
      exit 1
    fi
    return
  fi

  if ! git merge-base --is-ancestor $lastMaster $branch; then
    checkRevlist $oldrev $newrev $lastMaster
    ret=$?
    if [ $ret != 1 ]; then
      echo "master has updated"
      exit 1
    fi
  fi
}

checkDevBranch(){
  branch=$1
  exists=`git show-ref refs/heads/$branch`
  if [ -z "$exists" ]; then
      echo "no dev branch ${branch}"
      exit 1;
  fi
}

beginWith() { 
  case $2 in "$1"*) 
    true;; 
  *) 
    false;; 
  esac; 
}


if [ "${newrev}" =  "0000000000000000000000000000000000000000" ]; then
  exit 0;
fi

hasMaster=`git branch | grep "master"`;
if [  "${hasMaster}" = "" ]; then
  exit 0
fi


if beginWith "refs/tags/release" "$refname"; then
  branch=${refname#refs/tags/release/}
  echo "tag branch: ${branch}"
  checkPushMaster $branch

  releaseBranch="release/${branch}"
  checkBranchHasReleased $releaseBranch
        
  checkDevBranch $branch
  checkMasterHasUpdated $branch $oldrev $newrev 1
else

  if beginWith "refs/tags/" "$refname"; then
    echo "tag name must be start width release"
    exit 1
  fi

  branch=${refname#refs/heads/}
  echo "branch: ${branch}"
  checkPushMaster $branch

  releaseBranch="release/${branch}"
  checkBranchHasReleased $releaseBranch

  checkMasterHasUpdated $branch $oldrev $newrev
fi