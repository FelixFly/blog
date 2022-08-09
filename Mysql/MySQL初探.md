---
title: MySQL初探
author: FelixFly
date: 2021-11-09
tags:
    - MySQL
categories: 
    - 数据库
archives: 2021
---

1. MySQL 安装
2. MySQL 架构
2. MySQL 查询流程
2. MySQL 操作流程

<!--more-->

> 版本说明：
>
> * Mysql 版本:  mysql 5.7.36/35
> * Linux 版本: centos 7

# MySQL 安装

## yum 安装

> 通过此种方式安装的版本是mysql 5.7.36，是某个大版本的最新版本，无法安装对应的小版本
>
> 官方下载单独的版本但是没有5.7.36，最高为5.7.35版本

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
   
5. 若是之前的版本，需要更新为5.7的最新版本

   ```shell
   # 更新版本
   yum update mysql-server
   # 重启服务
   systemctl restart mysqld.service
   ```

## rpm 方式安装

1. 下载rpm对应的压缩包文件

   ```shell
   wget https://cdn.mysql.com/archives/mysql-5.7/mysql-5.7.35-1.el7.x86_64.rpm-bundle.tar
   ```

2. 解压对应的压缩包

   ```shell
   tar -xvf mysql-5.7.35-1.el7.x86_64.rpm-bundle.tar
   ```

3. 由于centos7中默认存在`mariadb`会有冲突，需要进行相应删除

   ```shell
   yum remove -y mariadb-libs
   ```

4. 按照顺序common -> libs -> client -> server顺序进行安装，碰到报错就是缺少包xxx，执行`yum install -y xxx`

   ```shell
   # 安装 common
   rpm -ivh mysql-community-common-5.7.35-1.el7.x86_64.rpm
   # 安装 libs
   rpm -ivh mysql-community-libs-5.7.35-1.el7.x86_64.rpm
   # 安装 client
   rpm -ivh  mysql-community-client-5.7.35-1.el7.x86_64.rpm
   # 安装 server
   rpm -ivh mysql-community-server-5.7.35-1.el7.x86_64.rpm
   ```

5. 启动并修改密码

   ```shell
   # 启动mysql
   systemctl start mysqld
   # 查看原始的密码
   grep password /var/log/mysqld.log
   # 登陆mysql
   mysql -uroot -p
   # 修改密码
   set password=password('MyNewPass4!');
   flush privileges;
   ```


# MySQL 架构

![MySQL 架构](/Users/xcl/study/Github/blog/Mysql/MySQL初探/MySQL 架构.png)

* Connector 连接器，负责跟客户端建立连接、获取权限、维持和管理连接
* Query Cache 查询缓存，默认关闭，由配置参数`query_cache_type`控制，这个是全表的缓存，8.0版本废弃
* Parser 分析器，词法分析(识别出字符串都有什么，代码标识)，语法分析(是否满足MySQL语法)，形成解析树
* Optimizer 优化器，基于成本分析规则，判断该怎么做
* Executor 执行器，执行对应的语句，需要判断表权限
* Storage Engine 存储引擎，包含各种存储引擎，比较常用的是MyISAM与InnoDB引擎

> MyISAM与InnoDB引擎有啥不同点
>
> 1. MyISAM不支持事务，InnoDB支持事务并支持MVCC(Multi-version concurrent control) 多版本并发控制(read view)
> 2. MyISAM只支持表级锁，InnoDB支持行级锁
> 3. MyISAM不支持聚集索引，InnoDB支持聚集索引
> 4. MyISAM不支持外键，InnoDB支持外键
> 5. MyISAM不支持数据缓存，InnoDB支持数据缓存

# MySQL 查询操作

1. Query Cache 查询缓存，判断是否命中缓存，命中直接返回，不命中执行下面步骤
2. Parser 分析器，词法分析(识别出字符串都有什么，代码标识)，语法分析(是否满足MySQL语法)，形成解析树
3. Optimizer 优化器，基于成本分析规则，判断该怎么做
4. Executor 执行器，执行对应的语句，需要判断表权限

# MySQL 更新操作

> 针对innodb引擎，redo log采用二阶段提交

1. 取行数据，判断数据页是否在内存中，若不再从磁盘中读入内存，返回行数据
2. 写入新行，新行更新到内存，并写日志到undo log(memory)
3. 写入redo log，处于prepare阶段
4. 写入bin log 
5. 写入 redo log，处于commit阶段

 由于IO性能与内存更新性能不是同一个级别，所以写文件都有buffer缓存作为缓冲

1. *`redo log buffer`* 共有的缓冲,受`innodb_flush_log_at_trx_commit`参数控制，默认为1，缓冲区大小受`innodb_log_buffer_size`限制，默认为16777216(16mb)

* 为0的时候，表示每次提交事务都只是把redo log 留在redo log buffer 中
* 为1的时候，表示每次提交事务都将redo log 持久化磁盘中
* 为2的时候，表示每次事务提交都将redo log 写到page cache中，可能会丢失1秒的数据

那什么时候其他的配置会进行相应的处理？

* 存在后台线程每个1秒执行redo log buffer 调用write写到文件系统的page cache中，然后再调用fsync持久化到磁盘中
* redo log buffer 占用的空间到`innodb_log_buffer_size`一半的时候，主动写盘到文件系统的page cache
* 并行事务提交的时候，会顺带这个事务的redo log buffer 一起持久化磁盘

2. `binlog cache` 私有的缓冲区(保证不可中断)，受`sync_binlog`参数控制，默认为1，缓冲区大小受`binlog_cache_size`控制，默认32768(32kb)，必须是4096的倍数

* 为0的时候，每次提交事务都只write，写到文件系统的page cache中，不进行持久化
* 为1的时候，每次提交事务都持久化磁盘
* 为N(N>1,100~10000)的值，每次提交事务都只write，写到文件系统的page cache中，等到N个事务提交的时候持久化

binlog如何提高持久化效率？使用组提交机制(group commit)，两个参数是或者的关系

* `binlog_group_commit_sync_delay` 延迟多少秒调用fsync持久化磁盘，默认为0
* `binlog_group_commit_sync_no_delay_count` 累积多少次以后调用fsync持久化磁盘，默认为0

> 当binlog_group_commit_sync_delay设置为0的时候，会一直调用fsync持久化磁盘，第二个参数设置无效

# 常见问题

1. 只能本地访问mysql数据库，无法进行远程访问

   > 默认的数据库权限只有localhost本地连接，需要修改对应的权限

   ```shell
   grant all privileges on *.* to 'root'@'%' identified by 'MyNewPass4!';
   flush privileges;
   ```

2. 如何创建新的数据库并创建单独的用户进行授权访问

   ```shell
   create database schema_name;
   # 创建用户 ‘%’为所有都可以访问
   create user 'jira'@'%' identified by 'Jira123!';
   # 赋予用户权限
   grant all on jira.* to 'jira';
   ```

3. 如何修改数据库的数据集编码

   * 首先需要查看对应的默认编码集

     ```shell
     # 查看默认的编码集
     show variables like '%character%';
     # 显示的结果
     #| character_set_client     | utf8                       |
     #| character_set_connection | utf8                       |
     #| character_set_database   | latin1                     |
     #| character_set_filesystem | binary                     |
     #| character_set_results    | utf8                       |
     #| character_set_server     | latin1                     |
     #| character_set_system     | utf8                       |
     #| character_sets_dir       | /usr/share/mysql/charsets/ |
     ```

   * 临时修改编码集，重启过后会失效

     ```shell
     set character_set_database = utf8mb4;
     set character_set_server = utf8mb4;
     ```

   * 修改配置文件，配置文件位置`/etc/my.cnf`

     ```shell
     [mysqld]
     character-set-server=utf8mb4
     [client]
     default-character-set=utf8mb4
     ```

4. 如何修改存放的数据文件位置

   * 查看对应的默认数据文件存储地址

     ```shell
      # 查看数据文件目录
      show variables like 'datadir';
      # 显示的结果
      #| datadir       | /var/lib/mysql/ |
     ```

   * 修改默认的数据文件存储地址，配置文件位置`/etc/my.cnf`

     ```shell
     # 数据文件路径，需要拷贝当前目前下的所有文件，并赋予权限mysql:mysql
     datadir=/var/lib/mysql
     # 连接文件
     socket=/var/lib/mysql/mysql.sock
     ```

   * 修改的路径需要赋予mysql权限

     ```shell
     chown -R mysql:mysql 新的文件路径
     ```

   * 通讯连接有时间会间歇性的连接不上，创建一个软连接

     ```shell
     ln -s 新文件路径/mysql.sock /var/lib/mysql/mysql.sock
     ```

5. redo log 与bin log有啥不同

   ① redo log 是innodb引擎特有的，bin log 是server 层实现的，所有引擎都可以使用

   ② redo log 是物理日志，记录的是在某个数据页上做了什么修改，bin log 是逻辑日志，记录的是这个语句的原始逻辑

   ③ redo log 循环写的日志，空间固定会用完，bin log 追加写入的，写到一定的大小会切换到下一个文件，并不会覆盖之前的文件

6. bin log 有哪些格式

   * statement  SQL语句原逻辑，执行了什么SQL，就记录什么日志
   * row  数据行日志，记录了操作的表和数据，数据量比较大，恢复方便，默认格式
   * mixed 混合模式，不影响主从复制就statement格式，影响就row格式

# 参考文献

1. yum资源安装：https://dev.mysql.com/doc/mysql-yum-repo-quick-guide/en/
2. 下载地址：https://downloads.mysql.com/archives/community/
2. 安装以及升级：https://dev.mysql.com/doc/refman/5.7/en/installing.html
2. MySQL 实战45讲：https://time.geekbang.org/column/article/77427
2. 存储引擎：https://dev.mysql.com/doc/refman/5.7/en/storage-engines.html
