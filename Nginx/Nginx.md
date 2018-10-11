---
title: Nginx初体验
author: FelixFly
tags:
    - nginx
categories: 
    - 工具使用
archives: 2018
---



# windows



# linux

<!--more-->

## 安装

1. 解压文件`tar -zxvf nginx-${version}.tar.gz`

2. 到解压文件夹进行配置`./configigure --prefix=path`

> --prefix=path 配置安装路径，默认/usr/local/nginx
>
> 可能会出现错误，缺少相应的library,执行命名`yum -y install library library-devel`进行安装

3. 执行安装make && make install

## 执行命令

* 启动 `./nginx`

* 立即停止 `./nginx -s stop`

* 体面停止 `./nginx -s quit`

* 生效配置文件 `./nginx -s reload`

* 校验配置文件 `./nginx -t`

## 系统服务

### [centos7以下采用init脚本](https://www.nginx.com/resources/wiki/start/topics/examples/initscripts/)

```conf
#!/bin/sh
#
# nginx - this script starts and stops the nginx daemon
#
# chkconfig:   - 85 15
# description:  NGINX is an HTTP(S) server, HTTP(S) reverse \
#               proxy and IMAP/POP3 proxy server
# processname: nginx
# config:      /etc/nginx/nginx.conf
# config:      /etc/sysconfig/nginx
# pidfile:     /var/run/nginx.pid

# Source function library.
. /etc/rc.d/init.d/functions

# Source networking configuration.
. /etc/sysconfig/network

# Check that networking is up.
[ "$NETWORKING" = "no" ] && exit 0

nginx="/usr/sbin/nginx"
prog=$(basename $nginx)

NGINX_CONF_FILE="/etc/nginx/nginx.conf"

[ -f /etc/sysconfig/nginx ] && . /etc/sysconfig/nginx

lockfile=/var/lock/subsys/nginx

make_dirs() {
   # make required directories
   user=`$nginx -V 2>&1 | grep "configure arguments:.*--user=" | sed 's/[^*]*--user=\([^ ]*\).*/\1/g' -`
   if [ -n "$user" ]; then
      if [ -z "`grep $user /etc/passwd`" ]; then
         useradd -M -s /bin/nologin $user
      fi
      options=`$nginx -V 2>&1 | grep 'configure arguments:'`
      for opt in $options; do
          if [ `echo $opt | grep '.*-temp-path'` ]; then
              value=`echo $opt | cut -d "=" -f 2`
              if [ ! -d "$value" ]; then
                  # echo "creating" $value
                  mkdir -p $value && chown -R $user $value
              fi
          fi
       done
    fi
}

start() {
    [ -x $nginx ] || exit 5
    [ -f $NGINX_CONF_FILE ] || exit 6
    make_dirs
    echo -n $"Starting $prog: "
    daemon $nginx -c $NGINX_CONF_FILE
    retval=$?
    echo
    [ $retval -eq 0 ] && touch $lockfile
    return $retval
}

stop() {
    echo -n $"Stopping $prog: "
    killproc $prog -QUIT
    retval=$?
    echo
    [ $retval -eq 0 ] && rm -f $lockfile
    return $retval
}

restart() {
    configtest || return $?
    stop
    sleep 1
    start
}

reload() {
    configtest || return $?
    echo -n $"Reloading $prog: "
    killproc $nginx -HUP
    RETVAL=$?
    echo
}

force_reload() {
    restart
}

configtest() {
  $nginx -t -c $NGINX_CONF_FILE
}

rh_status() {
    status $prog
}

rh_status_q() {
    rh_status >/dev/null 2>&1
}

case "$1" in
    start)
        rh_status_q && exit 0
        $1
        ;;
    stop)
        rh_status_q || exit 0
        $1
        ;;
    restart|configtest)
        $1
        ;;
    reload)
        rh_status_q || exit 7
        $1
        ;;
    force-reload)
        force_reload
        ;;
    status)
        rh_status
        ;;
    condrestart|try-restart)
        rh_status_q || exit 0
            ;;
    *)
        echo $"Usage: $0 {start|stop|status|restart|condrestart|try-restart|reload|force-reload|configtest}"
        exit 2
esac
```

1. 修改脚本中nginx以及NGINX_CONF_FILE

2. 赋予运行权限 `chmod +x nginx`

3. 运行`service`相关命令`service nginx start|stop|reload|status|restart`



----

###  [centos7 安装nginx](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-centos-7)

1. 添加nginx资源`yum -y install epel-release`

2. 安装nginx `yum -y install nginx`

3. 运行`service`相关命令`service nginx start|stop|reload|status|restart`

> `service`命令相当于`systemctl`，`systemctl start|stop|reload|status|restart nginx`

####  防火墙相关知识

* 启动  ``systemctl start firewalld` `
* 关闭  `systemctl stop firewalld`
* 查看状态  `systemctl status firewalld`
* 开机禁用  `systemctl disable firewalld`
* 开机启动  `systemctl enable firewalld` 
* 添加  `firewall-cmd --zone=public --add-port=80/tcp --permanent`

> （--permanent永久生效，没有此参数重启后失效）

* 重新载入  `firewall-cmd --reload `
* 查看  `firewall-cmd --zone= public --query-port=80/tcp `
* 删除  `firewall-cmd --zone= public --remove-port=80/tcp --permanent`

#### 问题

cento7中按脚本方式安装过后，启动会报错，报错如下：

查找各种资料，没找到解决办法，采用[centos7 安装nginx](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-centos-7)

