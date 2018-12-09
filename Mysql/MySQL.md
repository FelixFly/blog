---
title: MySQL
author: FelixFly
date: 2018-12-09
tags:
    - MySQL
categories: 
    - 数据库
archives: 2018
---

# 环境

* Centos7
* MySQL 5.7.24

# 安装

## [yum安装](https://dev.mysql.com/doc/mysql-yum-repo-quick-guide/en/#repo-qg-yum-fresh-install)

1. 获取rpm文件

   ```shell
   wget https://repo.mysql.com/yum/mysql-5.7-community/el/7/x86_64/mysql57-community-release-el7-10.noarch.rpm
   ```

2. 生成yum资源文件

   ```shell
   rpm -Uvh mysql57-community-release-el7-10.noarch.rpm
   ```

3. 下载安装

   ```she
   yum install mysql-community-server
   ```

4.  启动mysql以及查看mysql的状态

   ```shell
   # 启动命令
   systemctl start mysqld.service
   # 查看状态命令
   systemctl status mysqld.service
   ```

5. 查看mysql的root的用户名以及修改密码

   ```shell
   grep 'temporary password' /var/log/mysqld.log
   # 显示出mysql的root用户默认密码
   mysql -uroot -p
   # 输入上述的密码
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNewPass4!';
   # 新密码为至少8位，必须包含大写、小写、数据以及特需字符
   ```


