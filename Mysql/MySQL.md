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

1. 环境
2. 安装

<!--more-->

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

# 创建数据库并赋予用户权限

```shell
# 创建数据库 设置默认编码default character set utf8 collate utf8_bin
# DEFAULT CHARACTER SET utf8: 代表的是将该库的默认编码格式设置为utf8格式。
# COLLATE utf8_general_ci: 代表的是数据库校对规则
# utf8_bin将字符串中的每一个字符用二进制数据存储，区分大小写
# utf8_genera_ci不区分大小写，ci为case insensitive的缩写，即大小写不敏感
# utf8_general_cs区分大小写，cs为case sensitive的缩写，即大小写敏感。
create database schema_name;
# 创建用户 ‘%’为所有
create user 'jira'@'%' identified by 'Jira123$%^';
# 赋予用户权限
grant all on jira.* to 'jira';
```



