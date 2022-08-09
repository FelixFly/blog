---
title: InnoDB 事务与锁
author: FelixFly
date: 2021-11-09
tags:
    - MySQL
categories: 
    - 数据库
archives: 2021
---

1. InnoDB 事务特性
1. InnoDB 多版本控制
2. InnoDB 锁
2. InnoDB 死锁

<!--more-->

> 版本说明：
>
> * Mysql 版本:  mysql 5.7.36/35
> * Linux 版本: centos 7

# InnoDB 事务特性

## Atomicity 原子性

* `autocommit` 自动提交设置
* `begin/start transaction` 开启事务
* `commit` 提交事务
* `rollback` 回滚事务

## Consistency 一致性

* `doublewrite buffer` 双写缓冲，`buffer pool`写磁盘文件前的另一块存储区域，虽说要写两次，但不会耗费大量的IO，大量的顺序写。为什么需要双写缓存？那是由于InnoDB的page页大小是16k(参数innodb_page_size，默认值为16384)，而操作系统每次操作页大小是4K，一次性写不是原子写，会导致页缺失。参数`innodb_doublewrite`控制，默认是开启的，关闭的话设置为0
* `crash recovery` 故障恢复
  * bin log 恢复
  * redo log 恢复


## Isolation 隔离性

> 为什么需要隔离性，主要是针对以下问题
>
> * 脏读：一个事务读取到了另一个事务未提交的数据
> * 不可重复读：一个事务多次读取的数据不一致，发生了更改和删除操作
> * 幻读：一个事务多次读取数据，会出现多行的数据，多行的数据称为幻行，发生了插入操作，与不可重复读的区别在于一个是修改的数据，另一个是多出来了行数据。

### 事务的隔离级别

* READ UNCOMMITTED  读未提交，会发生脏读
* READ COMMITTED 读已提交，会发生不可重复读
* REAPTABLE READ 可重复读，默认的事务隔离级别，会发生幻读，但InnoDB不会出现幻读
* SERIALAZABLE 串行化，读锁实现的

### 隔离实现

* 多版本并发控制(MVCC)
* 锁的并发控制(LBCC)

## Durability 持久性

* `doublewrite buffer` 双写缓冲，避免页缺失
* `innodb_flush_log_at_trx_commit` 写redo log日志文件
* `sync_binlog` 写binlog日志
* `innodb_file_per_table` 一个表一个idb文件
* 存储设备上的写缓冲区 

# InnoDB 多版本控制(MVCC)

> READ COMMITTED 读已提交，是每次执行查询创建视图
>
> REAPTABLE READ 可重复读，是每次事务开始执行创建视图

InnoDB 引擎会在每一行数据添加三个字段

* `DB_TRX_ID` 6个字节，最后操作(插入和更新)的事务标识，删除其实是更新一个特需的标记作为已删除
* `DB_ROLL_PTR` 7个字节，回滚指针，执行操作之前的undo log 
* `DB_ROW_ID` 6个字节，每行新增的时候自动递增的行标识，InnoDB 聚集索引会包含row id，否则不存在于任何索引

## 规则

①一个事务可以看到的版本：

* 第一次查询之前已经提交的事务版本
* 本事务的修改

② 一个事务不可以看到的版本：

* 在本事务第一次查询之后创建的事务(事务ID比本事务ID大)
* 活跃的(未提交的)事务的修改

每个事务都会维护一个ReadView：

* m_ids{}  活跃的事务列表
* min_trx_id 活跃的事务列表最小的事务标识
* max_trx_id 系统分配给下一个事务的id
* creator_trx_id 当前的事务ID

# InnoDB 锁

## 锁的类型

* 共享锁(shared lock s)，读数据加入的锁
* 排他锁 (exclusive lock x)，更新或者删除加入的锁
* 意向共享锁(intention shared lock is)，主要是针对表级别的读锁
* 意向排他锁(intention exclusive lock ix)，主要是针对表级别的更新或者删除的锁

|      |  X   |   IX   |   S    |   IS   |
| :--: | :--: | :----: | :----: | :----: |
|  X   | 冲突 |  冲突  |  冲突  |  冲突  |
|  IX  | 冲突 | 不冲突 |  冲突  | 不冲突 |
|  S   | 冲突 |  冲突  | 不冲突 | 不冲突 |
|  IS  | 冲突 | 不冲突 | 不冲突 | 不冲突 |

## 锁的算法

* `record lock` 记录锁，是基于索引实现的
* `gap lock` 间隙锁，锁住间隙防止插入导致幻读，开区间，只有在`Repeatable Read`隔离级别下存在
* `next-key lock` 邻键锁 等于`gap lock` + `record lock`，开闭区间

## 查看锁的类型

1. 开启标准监控`innodb_status_output`和锁监控`innodb_status_output_locks`
2. 查询锁情况`show engine innodb status`
3. 对应的锁类型
   * locks gap before rec 间隙锁
   * locks gap before rec insert intention 插入意向锁（特殊的间隙锁）
   * locks rec but not gap 记录锁

## 加锁原则

> 分为两个原则，两个优化，一个bug

* 原则1：`Repeatable Read`隔离级别下，加锁基本单位是临键锁(next-key lock)
* 原则2：查找过程中访问到的对象才会加锁，访问的时候才进行加锁
* 优化1：索引上等值查询的时候，给唯一索引加锁的时候，退化为记录锁(record lock)
* 优化2：索引上等值查询的时候，向右遍历时且最后一个值不满足等值条件的时候，退化为间隙锁(gap lock)
* bug1：唯一索引上的范围查询会访问到不满足条件的第一个值为止

## 示例

> 示例数据：
>
> CREATE TABLE `t` (
>   `id` int(11) NOT NULL,
>   `c` int(11) DEFAULT NULL,
>   `d` int(11) DEFAULT NULL,
>   PRIMARY KEY (`id`),
>   KEY `c` (`c`)
> ) ENGINE=InnoDB;
>
> insert into t values(0,0,0),(5,5,5),
> (10,10,10),(15,15,15),(20,20,20),(25,25,25);

1. 语句1：`begin; select * from t where id > 9 and id < 12 for update`;

   这个锁的范围是(5,10]和(10,15]

   * `id > 9` 先找到9 这个值，没有找到，找到了(5,10)的间隙，优化②
   * 向右遍历，找到10这个值，这个时候加(5,10]，判断条件id <12 成立，原则①和原则②
   * 向右遍历，找到15这个值，这个时候加(10,15]，判断条件id <12 不成立了，结束加锁，原则①和Bug①

2. 语句2：`begin; select * from t where id > 9 and id < 12 order by id desc for update`;

   这个锁的范围是(0,5]、(5,10]和(10,15)

   * 由于存在`order by id desc`存在，索引先从`id < 12`开始查找12的位置，没有找到，找到了(10,15)的间隙，优化②
   * 向左遍历，查询到10这个值，这个时候加(5,10]，判断条件id > 9 成立，继续向左遍历，原则①和原则②
   * 向左遍历，查询到5这个值，这个时候加(0,5]，判断条件id > 9 不成立了，结束加锁，原则①和Bug①

3. 语句3：`begin; select * from t where id > 11 and id < 22 order by id desc for update`;

   根据语句2的原则，推导这个锁的范围是(5,10]、(10,15]、(15,20]和(20,25)

   * 由于存在`order by id desc`存在，索引先从`id < 22`开始查找22的位置，没有找到，找到了(20,25)的间隙，优化②
   * 向左遍历，查询到20这个值，这个时候加(15,20]，判断条件id >11 成立，继续向左遍历，原则①和原则②
   * 向左遍历，查询到15这个值，这个时候加(10,25]，判断条件id >11 成立，继续向左遍历，原则①和原则②
   * 向左遍历，查询到10这个值，这个时候加(5,10]，判断条件id > 11 不成立了，结束加锁，原则①和Bug①

4. 语句4：`begin; select * from t where id > 11 and id < 22 for update`;

   根据语句1的原则，推导这个锁的范围是(10,15]、(15,20]和(20,25]

   * `id > 11` 先找到11 这个值，没有找到，找到了(10,15)的间隙，优化②
   * 向右遍历，找到15这个值，这个时候加(10,15]，判断条件id <22 成立，原则①和原则②
   * 向右遍历，找到20这个值，这个时候加(15,20]，判断条件id <22 成立，原则①和原则②
   * 向右遍历，找到25这个值，这个时候加(10,25]，判断条件id <22 不成立了，结束加锁，原则①和Bug①

5. 语句5：`begin;select id from t where c in(5,20,10) lock in share mode;`

   这个锁的范围索引c是(0,5],(5,10],(10,15),(15,20]和(20,25)，读锁不会锁定主键锁

   * 首先查询5的数据，锁定的范围是(0,5]，由于不是唯一索引，需要往右遍历10，不等于退化为间隙锁(5,10) 原则①、原则②和优化②
   * 同理查询10的数据，锁定的范围是(5,10]和(10,15) 原则①、原则②和优化②
   * 同理查询20的数据，锁定的范围是(15,20]和(20,25) 原则①、原则②和优化②

6. 语句6：`begin;select id from t where c in(5,20,10) for update;`

   这个锁的范围索引c是(0,5],(5,10],(10,15),(15,20]和(20,25)，同时会锁主键锁 (0,5],(5,10],(10,15),(15,20]和(20,25)

   分析同语句5，主键索引的锁也是一样的

7. 语句7：一个事务执行`begin; select * from t where id > 10 and id <= 15 for update`，另一个事务执行`delete form id = 10;insert into t(id,c,d) value (10,10,10)`

   第一个事务加锁的范围是(10,15]和(15,20]，第二个事务执行delete是可以的，但是第二个事务执行过后，第一个事务的加锁范围变成(5,15]和(15,20]了，所有无法插入数据，锁是动态的

   * 事务1首先是找10，没有找到，找到(10,15）间隙，第二个值时15不满足条件，结束 原则①、原则②和优化②
   * 再找到15的值，找到了，(10,15]，需要再往后找一个值20，加锁范围是(15,20] 原则①、原则②和Bug①
   * 事务2 先删除了10，导致原来的(5,10)和(10,15)合并成(5,15)的间隙了(事务1此时的锁)，导致插入10这条数据堵塞

8. 语句8：一个事务执行`begin; select * from t where c > 5 lock in share mode;`另一个事务执行`update t set c = 1 where c = 5;update t set c = 5 where c = 1`

   第一个事务加索引c的范围是(5,10]，(10,15]，(15,20)，(20,25] 和(25,+)

   第二个事务语句①，相当于插入(c=1,id=5）的记录和删除(c=5,id =5)的记录，导致(5,10]这个区间变成(1,10]

   语句②相当于插入(c = 5,id =5)的记录，删除(c=1,id =5)的记录，插入数据被(1,10]阻塞了

9. 语句9：`begin; select * from t where id > 10 and id <= 15 order by id desc for update`

   加锁范围是(5,10], (10,15] 和 (15,20)

   * `order by id desc`，从id = 15 开始找，找到15的记录，加锁15，再往后找一个20，间隙锁(15,20) 优化① 和优化 ②
   * 向左遍历，第一个15，加锁(10,15]，条件id > 10 成立，继续向左遍历 原则①和原则②
   * 再向左遍历，第二个值是10 ，加锁(5,10]，条件id > 10 不成立了，结束加锁 原则①和Bug①

# InnoDB 死锁

## 死锁条件

* 互斥条件
* 不可剥夺条件
* 请求和保持条件
* 循环等待条件

## 死锁说明

> CREATE TABLE t1 (i INT, PRIMARY KEY (i)) ENGINE = InnoDB;

### 场景①

事务1：

```sql
START TRANSACTION;
INSERT INTO t1 VALUES(1);
```

事务2：

```sql
START TRANSACTION;
INSERT INTO t1 VALUES(1);
```

事务3：

```sql
START TRANSACTION;
INSERT INTO t1 VALUES(1);
```

当事务1发生rollback的时候，会发生死锁，而commit则不会发生死锁

**分析**

*  session 1 首先会抢到排他锁
*  session 2 和 session 3 由于 `duplicate-key` 都获取到了共享锁。
* 当 session 1 回滚的时候，会释放排他锁，同时这条数据没有插入进去，导致session 2 和 session 3 唤醒，都来抢到排他锁，但由于都要等待对方释放共享锁，这就构成了死锁条件，从而发生死锁。

为啥session 1 回滚就会发生死锁，而commit就不会呢？
commit会导入数据插入成功，导致session 2 与 session 3 唤醒的时候发现已经存在有主键为1的数据了，会直接报主键冲突从而不会导致去尝试获取排他锁。
同理可以推断官网中第二个示例，在session 1 进行rollback的时候也不会发生死锁

### 场景②

事务1：

```sql
START TRANSACTION;
NSERT INTO t1 VALUES(1,'123') ON duplicate key update name='123';
```

事务2：

```sql
START TRANSACTION;
NSERT INTO t1 VALUES(1,'456') ON duplicate key update name='456';
```

事务3：

```sql
START TRANSACTION;
NSERT INTO t1 VALUES(1,'789') ON duplicate key update name='789';
```

当事务1发生rollback的时候，会发生死锁，而commit则不会发生死锁

**分析**

* 当使用`INSERT ... ON DUPLICATE KEY UPDATE`与简单的`INSERT`不同的是用独占锁替换了共享锁
*  重复主键的时候是`index-record lock`
* 重复唯一建的时候是`next-key lock`

rollback的时候，本质是一样的，由于没有数据，`index-record lock`锁是gap lock，会堵塞插入，但由于都要等待对方释放锁，这就构成了死锁条件，从而发生死锁。

commit的时候，这时候就有数据了，`index-record lock`锁是record lock，只会有一个事务可以抢到锁，`DUPLICATE KEY UPDATE`就表示有值执行更新，所以不会报duplicate-key error，因为是执行更新而不是插入

## 查询死锁

> 只会记录最后一次的锁状态

锁情况`show engine innodb status`

```
------------------------
LATEST DETECTED DEADLOCK
------------------------
2021-12-07 09:20:03 0x40d64b1700
*** (1) TRANSACTION:
TRANSACTION 19207, ACTIVE 10 sec inserting
mysql tables in use 1, locked 1
LOCK WAIT 4 lock struct(s), heap size 1136, 2 row lock(s)
MySQL thread id 3, OS thread handle 278338664192, query id 31 localhost root update
insert into t value (30,30,30)
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 86 page no 3 n bits 80 index PRIMARY of table `xxx`.`t` trx id 19207 lock_mode X insert intention waiting
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0
 0: len 8; hex 73757072656d756d; asc supremum;;

*** (2) TRANSACTION:
TRANSACTION 19208, ACTIVE 5 sec inserting
mysql tables in use 1, locked 1
4 lock struct(s), heap size 1136, 2 row lock(s)
MySQL thread id 4, OS thread handle 278473152256, query id 33 localhost root update
insert into t value (30,30,30)
*** (2) HOLDS THE LOCK(S):
RECORD LOCKS space id 86 page no 3 n bits 80 index PRIMARY of table `xxx`.`t` trx id 19208 lock mode S
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0
 0: len 8; hex 73757072656d756d; asc supremum;;

*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 86 page no 3 n bits 80 index PRIMARY of table `xxx`.`t` trx id 19208 lock_mode X insert intention waiting
Record lock, heap no 1 PHYSICAL RECORD: n_fields 1; compact format; info bits 0
 0: len 8; hex 73757072656d756d; asc supremum;;

*** WE ROLL BACK TRANSACTION (2)
```

# 参考文献

1. InnoDB 事务特性：https://dev.mysql.com/doc/refman/5.7/en/mysql-acid.html
1. InnoDB 事务与锁：https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-transaction-model.html
1. InnoDB 双写缓冲：https://dev.mysql.com/doc/refman/5.7/en/innodb-doublewrite-buffer.html
1. InnoDB 多版本控制：https://dev.mysql.com/doc/refman/5.7/en/innodb-multi-versioning.html
1. InnoDB 故障恢复：https://dev.mysql.com/doc/refman/5.7/en/innodb-recovery.html#innodb-crash-recovery
1. InnoDB 死锁：https://dev.mysql.com/doc/refman/5.7/en/innodb-deadlocks.html
1. InnoDB 死锁示例：https://dev.mysql.com/doc/refman/5.7/en/innodb-locks-set.html
2. MySQL 实战45讲：https://time.geekbang.org/column/article/77427
