#!/bin/bash



#name是项目名 rep是项目的git地址  branch表示分支名 group是组名
dirPre="/home/admin/apps/"
arg=$1
arr=(${arg//,/ })
name=${arr[0]}
rep=${arr[1]}
branch=${arr[2]}
group=${arr[3]}
dirName=$dirPre$group
LOG_FILE="${name}.log"
if [ ! -f "$LOG_FILE"]; then
  touch $LOG_FILE
fi
cat /dev/null > $LOG_FILE
exec > >(tee -a ${LOG_FILE} )
exec 2> >(tee -a ${LOG_FILE} >&2)

echo -e "\n\n"
echo "--------------Start deployment-------------------"
date "+%Y-%m-%d %H:%M:%S.%N"


startProcess() {
  echo "cnpm install ..."
  cnpm install
  name=$1
  pm2 stop $name
  echo "pm2 start ${name} ..."

  if [ -f "./postrun.sh" ]; then
    ./postrun.sh
  fi

  NODE_ENV=development pm2 start ./bin/www --merge-logs --name="${name}"
  sleep 5s
  tail -n 20 "/root/.pm2/logs/${name}-out.log"

  cd "/home/admin/tool/apps-daily-publish"
  filecontent=`cat  $LOG_FILE`
  filecontent=${filecontent//\'/}
  mysql -uzyz -ppassw0rd -e "
  use publish_log; 
  insert into log (name, description) values ('${name}', '${filecontent}');
  quit"
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
else
  echo "git clone $rep ..."
  git clone  "$rep";
  cd ${name}
  switchBranchAndPull $branch
  startProcess $name
fi

date "+%Y-%m-%d %H:%M:%S.%N"
echo "----------------End deployment-------------------"
