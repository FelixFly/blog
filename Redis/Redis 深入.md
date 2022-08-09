---
title: Redis深入
author: FelixFly
date: 2021-11-22
tags:
    - redis
categories: 
    - 中间件
archives: 2021
---

-----------------

1. Redis 持久化
2. Redis 过期策略
3. Redis 淘汰策略
4. Redis 事务
4. 引发相关问题

<!--more-->

# Redis 持久化

包含RDB(Redis Database)和AOF(Append Only File )两种方式，两种方式可以共同使用，也可以单独使用

## RDB 数据库快照

## 相关配置

```properties
# rdb 文件名称
dbfilename dump.rdb
# 文件位置
dir ./
```

### 何时工作？

* 配置文件配置

  ```properties
  # save seconds changes 多少秒内多少次更新就执行
  save 3600 1
  save 300 100
  save 60 10000
  ```

* 执行save/bgsave命令

* 执行flushdb/flushall命令

* 主从同步的时候

### 如何工作？

> save 命令是同步执行，不需要fork，整个操作会堵塞主进程

1. Redis fork，此时存在父子进程，这个会阻塞主(父)进程
2. 子进程开始写数据到临时的rdb文件
3. 写完新的RDB文件，替换旧的RDB文件

## AOF 日志文件

```properties
# 开启aof日志，默认是关闭的
appendonly yes
# aof 日志文件名称
appendfilename "appendonly.aof"
```

### 何时工作？

```properties
# 每次执行都写文件，强一致性，性能比较差 
# appendfsync always 
# 每秒异步写文件，会丢失1s数据，性能比较中等
appendfsync everysec 
# 交给系统异步写文件，丢失数据会有几秒，性能比较高
# appendfsync no
```

### 日志文件过大怎么办？

日志过大文件进行日志重写，日志重写过程中，日志日志还会继续写么？同时新的改变命令会存储到buffer中，等新的文件生成会写到新的文件中

```properties
# 日志重写过程中，是否停止写日志文件，默认是写，设置yes就是不写，避免竞争磁盘IO
no-appendfsync-on-rewrite no
```

#### 什么时候进行重写

```properties
# 已经到达上次文件大小的100%
auto-aof-rewrite-percentage 100
# 已经到达64MB
auto-aof-rewrite-min-size 64mb
```

#### 如何进行重写

1. Redis fork，此时会有父子进程
2. 子进程开始写新的临时AOF文件
3. 父进程在内存缓冲区中存储新的改变命令，同时根据上面的配置写到旧的文件中
4. 当子进程完成文件的重写，父进程会获取到信号，子进程将内存缓存区命令追加到临时的AOF文件中
5. 最后修改文件名覆盖旧文件，开始新数据追加写到新文件中

# Redis 过期策略

过期策略包含被动策略和主动策略

## 被动策略

每次获取的时候判断key是否已过期，过期的话就进行删除

## 主动策略

每秒10次(每隔100ms)的定时任务，定时任务过程如下：

1. 每次随机20个过期key
2. 删除已经过期的key
3. 若是超过25%的key过期，重复上面步骤

# Redis淘汰策略

配置方式，使用淘汰策略必须设置最大内存，不然不启作用

```properties
# 设置最大内存
maxmemory <bytes>
# 默认是直接报错
maxmemory-policy noeviction
```

* allkeys-lru 针对所有key的lru
* volatile-lru 针对过期key的lru
* allkeys-lfu 针对所有key的lfu
* volatile-lfu 针对过期key的lfu
* allkeys-random 针对所有key的随机
* volatile-random 针对过期key的随机
* volatile-ttl 针对过期key的过期时间
* noeviction 默认的策略，直接报错

## LRU Less Recently Used 最近最少使用算法

淘汰最长时间未被使用的key

### 常规算法实现

> 基于map和双向链表来实现



### Redis中的实现

采用随机采样5个key，通过配置来配置采样的key

```properties
maxmemory-samples 5
```



## LFU  Least Frequently Used 最不常用算法

淘汰一定时间内被访问次数最小的key，也就是需要记录访问次数

### 常规算法实现

> 基于map和横向、纵向的双向链表实现，横向链表代表使用次数，纵向列表为使用的当前次数的key

### Redis中的实现

配置信息

```properties
# 计算次数的因子
lfu-log-factor 10
# 衰减时间
lfu-decay-time 1
```

**次数计算规则(非线性增长)**：

```c
uint8_t LFULogIncr(uint8_t counter) {
    // 若是为255直接返回255
    if (counter == 255) return 255;
    // 随机值/int最大值，随机的比例
    double r = (double)rand()/RAND_MAX;
    // 当前值 -5, LFU_INIT_VAL 初始值为5
    double baseval = counter - LFU_INIT_VAL;
    // 若是当前值小于5 的话，直接为0
    if (baseval < 0) baseval = 0;
    // (0或者-5后的正数值)*负载因子 + 1 取其倒数
    double p = 1.0/(baseval*server.lfu_log_factor+1);
    // 倒数 > 随机值，count 计算才 + 1,否则返回原值
    if (r < p) counter++;
    return counter;
}
```

**次数衰减机制：**

```c
unsigned long LFUDecrAndReturn(robj *o) {
    // 访问的时间
    unsigned long ldt = o->lru >> 8;
    // 访问次数
    unsigned long counter = o->lru & 255;
    // 没有配置衰减时间值的时候为0，有值的话采用当前时间 - 访问时间/衰减时间
    unsigned long num_periods = server.lfu_decay_time ? LFUTimeElapsed(ldt) / server.lfu_decay_time : 0;
    // 若是为正整数，并判断是否大于访问次数，大于的话直接为0，否则衰减当前值
    if (num_periods)
        counter = (num_periods > counter) ? 0 : counter - num_periods;
    return counter;
}
```

# Redis 事务

## 原子指令

默认提供的指令都是原子性的，不会产生不一致的数据，若是想组合多个指令只能采用下面的方法

## 事务指令

* `MULTI` 开启事务
* `EXEC` 执行事务
* `DISCARD` 回滚事务

**注意事项**：

1. 开启事务后，提交执行命令会进行一定的检查(无法提交到队列中)，检查错误，无法执行事务(事务会自行回滚）
2. 事务过程中碰到执行过程中碰到运行时异常，其他的命令会正常执行

**CAS机制指令**

* `WATCH` 监听指令，获取当前key的值，后续事务操作的时候会判断值是否一致，不一致不进行处理
* `UNWATCH` 取消监听

## Lua 脚本

```lua
-- 模拟一个账户间进行转账操作，第一个key为出账，第二个key为入账
local balance = redis.call('get',KEYS[1]);
local amount = tonumber(ARGV[1]);
if not balance then 
  return 0;
end;
if tonumber(balance) < amount then 
  return 0;
end;
redis.call('decrby',KEYS[1],amount);
redis.call('incrby',KEYS[2],amount);
return 1;
```

使用`eval`执行shell脚本

```shell
eval "local balance = redis.call('get',KEYS[1]);local amount = tonumber(ARGV[1])if not balance then return 0;end;if tonumber(balance) < amount then return 0;end;redis.call('decrby',KEYS[1],amount);redis.call('incrby',KEYS[2],amount);return 1;" 2 account:3 account:2 10
```

推荐使用`script load`进行加载后，再用`evalsha`执行

```shell
# 加载脚本
127.0.0.1:6379> script load "local balance = redis.call('get',KEYS[1]);local amount = tonumber(ARGV[1])if not balance then return 0;end;if tonumber(balance) < amount then return 0;end;redis.call('decrby',KEYS[1],amount);redis.call('incrby',KEYS[2],amount);return 1;"
# 返回的sha
"83be2ce07ad6d4d28fcc13ce6c58015c4d3fdf6c"
# 使用evalsha sha执行
127.0.0.1:6379> evalsha 83be2ce07ad6d4d28fcc13ce6c58015c4d3fdf6c 2 account:1 account:2 10
(integer) 1
```

# 引发相关的问题

## 缓存一致性

缓存中的数据与数据库中的数据不一致，采用的方式一般都是先操作数据库后删除缓存

Cache Aside 旁路缓存策略

若是先删除缓存的话，会导致一个读线程的值读到没有提交前的值(也就是旧值)，后面会一直存在这个值，需要再删除一次，也叫延迟双删。

先操作数据库，提交事务后删除缓存，这个基本能保证一致性。若删除缓存失败，利用重试达到最终的一致性。

## 缓存雪崩

是指同一时间过多的key失效导致全部打穿到数据库，可以打散key的失效时间，避免同一时间过多的key过期

## 缓存穿透

是指有缓存的数据，但缓存失效穿透到数据库，上面的缓存雪崩也会导致缓存穿透，针对热值不设置失效时间

## 缓存击穿

是指数据库压根没有这个值，所有的操作都会先经过redis后击穿到数据库。可以使用如下的方式进行解决：

1. 空值也进行缓存，代价是占用空间，也不知会有多少这样的值
2. 布隆过滤器，通过位图来实现，对数据进行多次hash来生成位图，针对不存在的数据直接返回，但是有误判的概率会击穿

# 参考文献

1. Redis 持久化：https://redis.io/topics/persistence
1. Redis 过期策略：https://redis.io/commands/expire
2. Redis 淘汰策略：https://redis.io/topics/lru-cache
3. Redis 事务 ：https://redis.io/topics/transactions
4. Redis lua 脚本：https://redis.io/commands/eval
4. 缓存更新的套路：https://coolshell.cn/articles/17416.html
4. 极客时间Redis专栏：https://time.geekbang.org/column/intro/100056701?tab=catalog