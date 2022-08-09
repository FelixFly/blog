---
title: InnoDB 引擎初探
author: FelixFly
date: 2021-11-09
tags:
    - MySQL
categories: 
    - 数据库
archives: 2021
---

1. InnoDB 引擎架构
2. InnoDB 索引
2. 执行计划分析
2. 索引失效的场景

<!--more-->

> 版本说明：
>
> * Mysql 版本:  mysql 5.7.36/35
> * Linux 版本: centos 7

# InnoDB 引擎架构

![innodb-architecture](/Users/xcl/study/Github/blog/Mysql/InnoDB 引擎初探/innodb-architecture.png)

## Buffer Pool

表跟索引数据被访问的主要内存缓存，使用LRU淘汰算法，被分为两个部分

* 头部分，5/8的经常使用的列表数据页(新的数据页 young/new pages)
* 尾部分，3/8的不经常使用的列表数据页(老的数据页 old pages)，即将被淘汰的数据

默认情况下，页数据的读取会进行缓存，表扫描比如mysqldump或者无条件的select语句受参数控制`innodb_old_blocks_pct` 老数据页的比例，默认是37(3/8)和`innodb_old_blocks_time`,默认值为1000

* 缓存区大小受`innodb_buffer_pool_size`限制，`innodb_buffer_pool_size` = `innodb_buffer_pool_chunk_size` * `innodb_buffer_pool_instances`,可以增加innodb_buffer_pool_chunk_size`大小，可以为1MB(1048576b)单位进行增减，默认是128MB
* 64位操作系统，在内存充足的情况下，增加innodb_buffer_pool_instances`，最大值为64，默认值为1
* 减少`innodb_old_blocks_pct` 老数据页的比例，值范围为5-95，默认是37(3/8)，增加`innodb_old_blocks_time`的时间,默认值为1000(针对表扫描，比如mysqldump和无条件查询的select)
* 减少`innodb_read_ahead_threshold`值，值范围为0-64，默认值为56。少于这个值的数据页才进入缓存(针对后台读的数据)
* 脏页的自动flush，高低水位，高水位参数`innodb_max_dirty_pages_pct`，默认值时75，低水位参数`innodb_max_dirty_pages_pct_lwm`，默认值为0，低水位必须小于高水位，8.0版本改为10-90。`innodb_flush_neighbors` 控制flush的范围，默认值时1，跟毗邻的脏页一起flush，2为flush的毗邻的所有页，0 值只flush自己的脏页，8.0版本默认值改为0了
* buffer pool 持久化，重启后直接生效，`innodb_buffer_pool_dump_pct` 持久化比例，默认值是25%，`innodb_buffer_pool_dump_at_shutdown` 服务停止的时候自动持久化，默认开启，`innodb_buffer_pool_load_at_startup` 启动的时候自动加载文件，默认开启

## Change Buffer

不在`buffer pool`中的二级索引修改页的缓存，由于通常二级索引的操作都是相对随机顺序，随机的读写会耗费时间。在唯一索引、递减类索引列或者主键包含递减索引列上`Change Buffer`会失效。

支持的类型受`innodb_change_buffering`参数控制，默认是all

* all  所有的类型，包含插入、标记删除操作、磁盘清除
* none 不支持任务类型缓冲
* inserts 数据插入缓冲
* deletes   标记删除的数据缓冲，严格来说，在物理磁盘清除的时候标记索引的延后清除
* changes 数据插入和标记删除的缓冲
* purges 后台物理磁盘删除操作的缓冲

大小受参数`innodb_change_buffer_max_size`控制，默认值时25，也就是`buffer pool`大小的1/4，最大值是50

## Adaptive Hash Index

`buffer pool`的hash 索引，开启参数`innodb_adaptive_hash_index`,默认开启。5.7版本自适应hash索引是分区管理的，分区数量参数`innodb_adaptive_hash_index_parts`,默认值为8，最大值是512

## Log Buffer

日志写磁盘文件的缓存区，大小参数`innodb_log_buffer_size`，默认值16777216(16MB)。

* `innodb_flush_log_at_trx_commit` 控制什么情况下write到操作系统的文件缓存和flush物理磁盘
  * 为0的时候，每次事务提交只write到操作系统的文件缓存
  * 为1的时候，每次事务提交write到操作系统的文件缓存和flush物理磁盘
  * 为N(N>1,100-10000)的，每次事务提交只write到操作系统的文件缓存，等到N个事务提交后一起flush物理磁盘
* `innodb_flush_log_at_timeout` 控制flush的频率，默认值为1，也就是每隔1秒进行`log buffer`刷新到磁盘

# InnoDB 索引

## 索引类型

* Clustered Index 聚集索引

  跟数据存放顺序一直的索引叫聚集索引，通常而已，主键索引就是聚集索引。

  * 表上存在主键(PRIMARY KEY)，主键索引就是聚集索引
  * 若是没有主键(PRIMARY KEY)，找第一个非空值的唯一索引(UNIQUE)作为聚集索引
  * 若是没有主键(PRIMARY KEY)和非空的唯一索引(UNIQUE)，会自动生成一个隐藏的聚集索引(GEN_CLUST_INDEX)，值包含row id(6个字节并且自增)

* Secondary Index 二级索引

  不是聚集索引的其他索引都称为二级索引，二级索引会关联聚集索引，若是聚合索引的值很大，会浪费使用空间，建议聚集索引越小越好。

## 索引使用

* 多个索引，选择匹配行最少的索引
* 联合索引，会根据最左匹配原则使用检索，比如(col1,col2,col3)支持根据(col1)、(col1,col2)、(col1,col2,col3)进行检索
* join类型关联，需要列的同类型、同长度，字符串的话还需要同编码。VARCHAR和CHAR可认为是同一类型
* 排序或者分组使用联合索引的最左匹配原则
* 查询索引中数据列，这种情况称为覆盖索引，避免根据聚集索引进行回表操作

## B+ Tree 与Hash 索引的区别

* B+ Tree 支持范围类型的检索，比如>，>=,<=,<以及BETWEEN，Hash 索引仅仅检索相等条件，比如 = 或者 <>
* B+ Tree 支持匹配LIKE的常量字符串匹配，前缀匹配，Hash 索引只能支持完整的key进行匹配
* Hash 索引不支持排序
* Hash 索引无法决断出两个值之间有多少行(决断是否走哪个索引)

## B+ Tree 的特点

* 是个多叉树(控制深度-层数)，数据全在叶子节点，叶子节点存在链表指向
* 能够更好的配合磁盘的读写特性，减少单次查询的磁盘访问次数(要求聚集索引是有序递增的)
* 查询效率更加稳定，数据都在叶子节点
* 提高范围查询的效率，叶子节点指向下一个叶子节点

## 索引页分裂与合并

### 页分裂
① 索引不连续递增，插入间隙的值会导致页分裂，形成空洞
② 插入数据导致页慢，会导致页分裂，形成空洞

### 页合并

由于删除操作会导致记录删除，数据页标记为可复用，磁盘文件大小不会变，形成空洞，只有插入和删除操作，修改操作可以理解为删除一个旧的值，插入了一个新的值

由于形成了空洞，导致数据不紧凑，浪费空间（索引之间会存在一定的间隙，来一定程度的避免页分裂），如何进行页合并，只能重建索引：

① alter table e engine=InnoDB 相当于重建
② analyze table t 对表的索引信息重新统计，没有修改数据，MDL读锁(元数据读锁)
③ optimize table t 相当于recreate + analyze

## Index Condition Pushdown 索引下推(ICP)

没有ICP的时候，存储引擎通过索引检索出数据就直接访问，Server端再根据where条件过了对应的数据。有ICP的话，存储引擎根据索引匹配数据后，server端将where条件匹配下推到存储引擎。

什么情况下会进行索引下推？

* ICP 在使用`range`、`ref`、`eq_ref`和`ref_or_null`返回所有表行数据的时候
* ICP可以使用在`InnoDB`和`MyISAM`引擎中以及分区表
* 在`InnoDB`引擎中，ICP仅支持二级索引。ICP的目标是减少所有行的读取和IO操作。聚集索引整个数据在缓冲区中，无法减少IO操作
* ICP不支持虚拟列的二级索引，InnoDB支持虚拟列的二级索引
* 子查询的条件无法下推
* 存储函数条件无法下推，存储引擎无法调用存储函数
* 触发条件无法下推

没有索引下推的执行逻辑：

* 拿下一行数据，首选获取索引信息，根据索引检索获取整个表数据行
* 根据where 条件判断整个表的数据行

有索引下推的执行逻辑：

* 那下一行的索引数据
* 在索引列上匹配where调价，若是条件不匹配，开始下一行数据
* 若是条件匹配，使用索引数据取读取整个表行数据
* 判断剩下的where条件判断整个表的数据行

# 执行计划分析(EXPLAIN)

## 执行计划显示的字段

* `id`  每次查询的标识
* `select_type` 查询的类型
* `table` 输出行对应的表
* `partitions` 匹配的分区
* `type` 索引类型(join type)
* `possible_keys` 可能使用的索引
* `key` 实际使用的索引
* `key_len` 索引的长度
* `ref` 比较的索引列
* `rows` 估计被检查的行数
* `filtered` 表条件被检索的行百分比
* `Extra` 额外的信息

## `type` 索引类型(Join Type)

* `system` 表里面仅有一条数据(系统表)，是一种特殊的const类型
* **`const`** 主键索引或者唯一索引常数值的查询
* **`eq_ref`** 多表关联检索一条数据，索引关联必须是主键索引或者非空的唯一键索引
* **`ref`** 多表关联检索多条数据，前缀索引或者非主键索引或者非唯一键索引，换句话，根据key值检索到多于1条数据
* `fulltext` 全文检索索引
* `ref_or_null` 跟`ref`相似，但需要额外处理`NULL`值 ，一般伴随 `or index_column is null `
* `index_merge` 多个索引一起使用，key列包含索引列表，`Extra`额外信息会显示如下
  * `Using intersect(...)`  and条件多索引的查询或者主键索引的范围查询
  * `Using union(...)` or 条件多索引的查询或者主键索引的范围查询
  * `Using sort_union(...)` or 条件多索引的查询或者主键索引的范围查询，唯一不同是返回数据之前拿到所有的数据并且排序???
* `unique_subquery` `eq_ref`类型的`in`子查询
* `index_subquery` 类似`unique_subquery` ，只不过子查询中是非唯一索引
* `range` 给定范围查询返回1条数据或者使用使用返回多条数据，比如 <>, >, >=, <, <=, IS NULL, <=>, BETWEEN, LIKE, or IN() 操作
* `index` 与`ALL`相同，只不过是索引的全部扫描，发生在两种方式
  * 覆盖索引数据的全表查询，`Extra`描述为`Using index`
  * 全表扫描的唯一索引排序，`Extra`没有`Using index`
* `ALL` 全表扫描

## `Extra` 额外的信息

* `Using filesort`(`using_filesort`)  排序
* `Using index`(`using_index`) 覆盖索引
* `Using index condition`(`using_index_condition`) 索引下推
* `Using temporary`(`using_temporary_table`) 使用临时表
* `Using intersect(...)`  and条件多索引的查询或者主键索引的范围查询
* `Using union(...)` or 条件多索引的查询或者主键索引的范围查询
* `Using sort_union(...)` or 条件多索引的查询或者主键索引的范围查询，唯一不同是返回数据之前拿到所有的数据并且排序???
* `Using where`(`attached_condition`) 索引条件限制返回行数

# 索引失效的场景

1. like条件的前%匹配
2. 索引列使用函数表达式
3. 类型隐式转换，比如整数类型跟字符串类型
4. 编码隐式转换，比如一个是用utf8编码，一个使用utf8mb4编码

> 其他的条件视具体情况分析，特别是否定查询，比如<>，not in 等等

# 参考文献

1. InnoDB 架构：https://dev.mysql.com/doc/refman/5.7/en/innodb-architecture.html
1. InnoDB 内存区域：https://dev.mysql.com/doc/refman/5.7/en/innodb-in-memory-structures.html
1. InnoDB 磁盘区域：https://dev.mysql.com/doc/refman/5.7/en/innodb-in-memory-structures.html
1. InnoDB 索引：https://dev.mysql.com/doc/refman/5.7/en/innodb-indexes.html
1. 索引优化：https://dev.mysql.com/doc/refman/5.7/en/optimization-indexes.html
1. 索引下推：https://dev.mysql.com/doc/refman/5.7/en/index-condition-pushdown-optimization.html
1. 执行计划分析：https://dev.mysql.com/doc/refman/5.7/en/execution-plan-information.html
1. 数据结构可视化：https://www.cs.usfca.edu/~galles/visualization/Algorithms.html
2. MySQL 实战45讲：https://time.geekbang.org/column/article/77427
