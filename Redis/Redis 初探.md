---
title: Redis初探
author: FelixFly
date: 2021-11-28
tags:
    - redis
categories: 
    - 中间件
archives: 2021
---

-----------------

1. Redis 安装
2. Redis 基础配置
3. 通用的命令
4. 常用的数据类型

<!--more-->

# Redis 安装

> 本文采用6.2.6版本进行编写

1. 下载地址：https://download.redis.io/releases/redis-6.2.6.tar.gz

2. 进行解压

   ```shell
   tar -zxvf redis-6.2.6.tar.gz
   cd redis-6.2.6
   ```

3. 编译测试

   ```shell
   make test
   ```

   编译结果如下，才代表编译成功

   ```shell
    All tests passed without errors!
   ```

4. 执行安装

   ```shell
   # PREFIX = 文件路径，默认为/usr/local/bin下面
   make install PREFIX=/home/redis
   ```

5. 安装完成，上面的目录下的bin有如下内容

   >* redis-benchmark  性能测试
   >*  redis-check-aof -> redis-server aof文件校验
   >* redis-check-rdb -> redis-server rdb文件校验
   >* redis-cli 客户端应用
   >* redis-sentinel -> redis-server 哨兵应用
   >* redis-server 服务应用

6. 复制配置文件，配置文件放到conf文件夹下面

   ```shell
   # 安装目录
   cd /home/redis
   # 创建conf目录
   mkdir conf
   # 拷贝redis.conf
   cp redis-6.2.6/redis.conf ./conf/
   ```

7. 启动redis-server 服务应用

   ```shell
   # 此种采用当前窗口进行启动
   ./bin/redis-server ./conf/redis.conf
   ```

# Redis 基础配置

> 在此只介绍基础配置，其他配置在后续中介绍，redis.conf

```properties
## 网络配置
# 绑定IP
bind 127.0.0.1 -::1
# 端口
port 6379
# 保护模式，默认启用，当没有绑定IP和没有设置密码时生效，只能本地访问，限制外网访问
protected-mode yes

## 一般配置
# 后台运行
daemonize no
# 密码
requirepass xxxx
# 数据库，默认是16
databases 16
```

# 通用的命令

|                      命令                       |                             说明                             | 时间复杂度  |
| :---------------------------------------------: | :----------------------------------------------------------: | :---------: |
|                    TYPE key                     |                         获取key类型                          |    O(1)     |
|               OBJECT ENCODING key               |                    获取key的内部存储结构                     |    O(1)     |
|                  DEL key [key]                  |                           删除key                            | O(1)/O(N/M) |
|               EXPIRE key seconds                |               设置key的过期时间，时间单位为秒                |    O(1)     |
|                     TTL key                     |                      key的存活时间(秒)                       |    O(1)     |
|                    PTTL key                     |                     key的存活时间(毫秒)                      |    O(1)     |
|                   EXISTS key                    |                       判断key是否存在                        |    O(1)     |
| SCAN cusor MATCH  pattern COUNT count TYPE type | 根据游标遍历，cursor 初始值为0 ,match 匹配可能返回没有元素 TYPE key类型，等返回的游标为0就代表结束 |    O(1)     |

# 常用的数据类型

## String类型

### 常用命令

|                 命令                  |                             说明                             | 时间复杂度 |
| :-----------------------------------: | :----------------------------------------------------------: | :--------: |
|                GET key                |                            获取值                            |    O(1)    |
|              GETDEL key               |                         获取并删除值                         |    O(1)    |
|    GETEX key EX(AT)/PX(AX)/PERSIST    | 获取值并更新过期时间 EX为秒，PX为毫秒 AT 为具体时间对应的秒和毫秒 PERSIST 移除过期时间 |    O(1)    |
|        GETRANGE key start end         |                          截取值信息                          |    O(1)    |
|           GETSET key value            |                       获取旧值放入新值                       |    O(1)    |
|            MGET key [key]             |                          批量获取值                          |    O(N)    |
| SET key value EX(AT)/PX(AX) NX/XX GET | 放入值 EX为秒，PX为毫秒 AT 为具体时间对应的秒和毫秒 NX 不存在放入 XX 存在放入 GET 返回旧值 |    O(1)    |
|        SETEX key seconds value        |                    放入带过期时间(秒)的值                    |    O(1)    |
|            SETNX key value            |                      值不存在的时候放入                      |    O(1)    |
|       SETRANGE key offset value       |                      在位置offset放入值                      | O(1)/O(M)  |
|      MSET key value [key value]       |                        批量放入多个值                        |    O(N)    |
|     MSETNX key value [key value]      |     批量放入多个不存在的值，有一个值存在都不处理，返回0      |    O(N)    |
|     PSETEX key milliseconds value     |                   放入带过期时间(毫秒)的值                   |    O(1)    |
|              STRLEN key               |                           值的长度                           |    O(1)    |
|           APPEND key value            |                            值拼接                            |    O(1)    |
|               DECR key                |                        64位整数值 -1                         |    O(1)    |
|         DECRBY key decrement          |                    64位整数值 -decrement                     |    O(1)    |
|               INCR key                |                        64位整数值 +1                         |    O(1)    |
|         INCRBY key increment          |                    64位整数值 + increment                    |    O(1)    |
|       INCRBYFLOAT key increment       |                整数值 + increment/17位的小数                 |    O(1)    |

### 使用场景

1. 通用的缓存(比如session等)
2. 分布式锁(NX)
3. 计数/限流/唯一序列

## List类型

### 常用命令

|                           命令                            |                             说明                             | 时间复杂度 |
| :-------------------------------------------------------: | :----------------------------------------------------------: | :--------: |
|                LPUSH key element [element]                |                         左边入对元素                         |    O(N)    |
|               LPUSHX key element [element]                |                  key存在的时候左边入队元素                   |    O(N)    |
|                   LRANGE key start stop                   |                  获取范围的元素，-1表示最大                  |   O(S+N)   |
|                  LREM key count element                   | 删除元素(count = 0 删除所有等于element的元素,整数是从头到尾删除，负数是从尾到头删除) |   O(N+M)   |
|                  LSET key index element                   |                     改变index位置的元素                      |    O(N)    |
|                   LTRIM key start stop                    |                       保留范围内的元素                       |    O(N)    |
|            LPOS key element RANK COUNT MAXLEN             | 查找元素的位置，RANK 表示查第几个元素，COUNT 元素的个数，MAXLEN 检索队列的长度 |    O(N)    |
|                      LPOP key count                       |                      左边出队count元素                       |    O(N)    |
|    LMOVE source destination LEFT\| RIGHT LEFT\| RIGHT     |             从源左边/右边出队到目标左边/右边入队             |    O(1)    |
|                         LLEN key                          |                           元素个数                           |    O(1)    |
|          LINSERT key BEFORE/AFTER pivot element           |                  在pivot 之前/之后插入元素                   |    O(N)    |
|                     LINDEX key index                      |                     index位置的元素出队                      |    O(N)    |
| BLMOVE source destination LEFT\|RIGHT LEFT\|RIGHT timeout |           阻塞从源左边/右边出队到目标左边/右边入队           |    O(1)    |
|                  BLPOP key [key] timeout                  |                         阻塞左边出队                         |    O(N)    |
|                  BRPOP key [key] timeout                  |                         阻塞右边出队                         |    O(N)    |
|          BRPOPLPUSH  source destination timeout           |                 阻塞从源右边出队目标左边入队                 |    O(1)    |
|                      RPOP key count                       |                      右边出队count元素                       |    O(N)    |
|               RPOPLPUSH  source destination               |                   从源右边出队目标左边入队                   |    O(1)    |
|                RPUSH key element [element]                |                         右边入对元素                         |    O(N)    |
|               RPUSHX key element [element]                |                  key存在的时候右边入队元素                   |    O(N)    |

### 使用场景

* 消息队列
* 限制数量的列表(比如100条的慢日志)

## Stream类型

### 常用命令

|                             命令                             |                             说明                             | 时间复杂度 |
| :----------------------------------------------------------: | :----------------------------------------------------------: | :--------: |
| XADD key NOMKSTREAM MAXLEN\|MINID =/~ threshold LIMIT count *\|id field value [field value] | 添加队列消息信息 NOMKSTREAM 不自动创建key MAXLEN 最大长度 MINID 最小ID |    O(N)    |
| XREAD COUNT count BLOCK milliseconds STREAMS key [key] id [id] | 读取消息，id表示从哪个消息读取，从头读取为0-0，从当前读取为$ |    O(N)    |
|              XINFO STREAM key FULL COUNT count               |          队列的信息，默认值显示第一条和最后一条消息          |    O(1)    |
|                       XDEL key id [id]                       |                       删除对应id的信息                       |    O(1)    |
|                           XLEN key                           |                          消息的长度                          |    O(1)    |
|               XRANGE key start end COUNT count               |               范围内的消息，- 最小值 + 最大值                |    O(N)    |
|             XREVRANGE key end start COUNT count              |             范围内的消息逆序，- 最小值 + 最大值              |    O(N)    |
|      XTRIM key MAXLEN\|MINID =\|~ threshold LIMIT count      |                           截断消息                           |    O(N)    |
|          XGROUP CREATE key groupname id\|$ MKSTREAM          |                        消息队列创建组                        |    O(1)    |
|       XGROUP CREATECONSUMER key groupname consumername       |                        创建组的消费者                        |    O(1)    |
|        XGROUP DELCONSUMER key groupname consumername         |                        删除组的消费者                        |    O(1)    |
|                 XGROUP DESTROY key groupname                 |                        消息队列删除组                        |    O(1)    |
|               XGROUP SETID key groupname id\|$               |               设置组的起始消息ID，0为从头开始                |    O(1)    |
|                       XINFO GROUPS key                       |                        显示所有消费组                        |    O(1)    |
|                XINFO CONSUMERS key groupname                 |                      消费组的所有消费者                      |    O(1)    |
| XREADGROUP GROUP group consumer COUNT count BLOCK milliseconds NOACK STREAMS key [key] id [id] |           消费组内读取消息，NOACK 不确认,>为起始id           |    O(M)    |
|                    XACK key group id [id]                    |                           消息确认                           |    O(N)    |
| XPENDING key group IDLE min-idle-time start end count consumer |                        获取未确认消息                        |    O(N)    |

### 使用场景

* 消息队列

## Set类型

### 常用命令

|               命令                |             说明             | 时间复杂度 |
| :-------------------------------: | :--------------------------: | :--------: |
|     SADD key member [member]      |           添加元素           |    O(N)    |
|             SCARD key             |           元素个数           |    O(1)    |
|          SDIFF key [key]          | 获取key在后面key中不同的元素 |    O(N)    |
| SDIFFSTORE destination key [key]  |   获取不同的元素并存入集合   |    O(N)    |
|         SINTER key [key]          |           获取交集           |  O(N * M)  |
| SINTERSTORE destination key [key] |      获取交集并存入结合      |  O(N * M)  |
|       SISMEMBER key member        |       判断元素是否存在       |    O(1)    |
|           SMEMBERS key            |         返回所有元素         |    O(N)    |
|  MSISMEMBER key member [member]   |     判断多个元素是否存在     |    O(N)    |
|  SMOVE source destination member  |      从源移动元素到目标      |    O(1)    |
|         SPOP key [count]          |        随机出队多元素        |    O(N)    |
|      SRANDMEMBER key [count]      |     随机获取元素，不出队     |    O(N)    |
|     SREM key member [member]      |           移除元素           |    O(N)    |
| SSCAN key curson [pattern] COUNT  |           遍历元素           |    O(1)    |
|         SUNION key [key]          |           获取并集           |    O(N)    |
| SUNIONSTORE destination key [key] |      获取并集并存入集合      |    O(N)    |

### 使用场景

* 标签
* 不重复的集合信息

## SortedSet类型

### 常用命令

|                             命令                             |                             说明                             |    时间复杂度    |
| :----------------------------------------------------------: | :----------------------------------------------------------: | :--------------: |
|  ZADD key  NX/XX GT/LT CH INCR score member [score member]   | 添加排序元素 NX 只新增 XX 只更新 GT 更新大于得分 LT 更新小于得分 CH 添加和修改总数(默认值返回添加的总数) INCR 递增得分 |    O(log(N))     |
|                          ZCARD key                           |                          元素的个数                          |       O(1)       |
|                      ZCOUNT key min max                      |                     得分在区间的元素个数                     |    O(log(N))     |
|            ZDIFF numberkeys key [key] WITHSCORES             |                    比较多个key不同的元素                     | O(L+(N-K)log(N)) |
|         ZDIFFSTORE destination numberkeys key [key]          |               比较多个key不同的元素并存入集合                | O(L+(N-K)log(N)) |
|                ZINCREBY key increment member                 |                    元素得分递增increment                     |    O(log(N))     |
| ZINTER numberkeys key [key] WEIGHTS AGGREGATE SUM\|MIN\|MAX WITHSCORES |   多个key的交集 WEIGHT 得分权重 AGGREGATE 聚合，默认是SUM    | O(NK)+O(Mlog(M)) |
| ZINTERSTORE destination numberkeys key [key] WEIGHTS AGGREGATE SUM |                   多个key的交集并存入集合                    | O(NK)+O(Mlog(M)) |
|                    ZLEXCOUNT key min max                     | 根据元素范围(得分排序后)获取元素个数，min 最小值 - ，max 最大值 + , 其他字符必须以( [开头，表示不包含和包含 |    O(log(N))     |
|                 ZMSCORE key member [member]                  |                       批量获取元素得分                       |       O(N)       |
|                      ZPOPMAX key count                       |               出队最大得分元素 count 默认值 1                |    O(Mlog(N)     |
|                      ZPOPMIN key count                       |               出队最晓得分元素 count 默认值 1                |    O(Mlog(N)     |
|               ZRANDMEMBER key count WITHSCORES               |          随机获取count元素，正数会去重，负数会重复           |       O(N)       |
| ZRANGE key min max BYSCORE\|BYLEX REV LIMIT offset count WITHSCORES |    根据得分排序，得分一样根据元素排序 REV 倒排序 获取元素    |   O(log(N)+M)    |
|          ZRANGBYLEX key min max LIMIT offset count           | (根据得分排序，得分一样根据元素排序)根据元素范围获取元素 min 最小值 - ，max 最大值 + , 其他字符必须以( [开头，表示不包含和包含 |   O(log(N)+M)    |
|    ZRANGBYSCORE key min max WITHSCORES LIMIT offset count    | 根据元素的得分范围获取元素 -inf 最小 +inf 最大，默认是包含得分，不包含是使用(前缀 |   O(log(N)+M)    |
| ZRANGESTORE dst src min max BYSCORE\|BYLEX REV LIMIT offset count WITHSCORES | 根据得分排序，得分一样根据元素排序 REV 倒排序 获取元素并存入集合 |   O(log(N)+M)    |
|                       ZRANK key member                       |                   元素的排名，最低排名为0                    |    O(log(N))     |
|                   ZREM key member [member]                   |                           元素出队                           |    O(Mlog(N)     |
|                  ZREMRANGEBYLEX key min max                  |                      根据元素范围出队，                      |   O(log(N)+M)    |
|                 ZREMRANGEBYRANK key min max                  |                根据元素排名出队，-1 最高排名                 |   O(log(N)+M)    |
|                 ZREMRANGEBYSCORE key min max                 |                        根据得分名出队                        |   O(log(N)+M)    |
|              ZREVRANGE key start top WITHSCORES              |                    得分反排序，-1 最大值                     |   O(log(N)+M)    |
|        ZREVRANGEBYLEX key max min LIMIT offset count         |        元素反排序，- 最小值 + 最大值 ( 不包含 [ 包含         |   O(log(N)+M)    |
|  ZREVRANGEBYSOCRE key max min WITHSCORES LIMIT offset count  |     元素反排序，-inf 最小值 +inf 最大值 ( 不包含 [ 包含      |   O(log(N)+M)    |
|                     ZREVRANK key member                      |                      获取元素的倒序排名                      |    O(log(N))     |
|          ZSCAN key cursor MATCH pattern COUNT count          |                       游标方式遍历元素                       |       O(1)       |
|                      ZSCORE key member                       |                         获取元素得分                         |       O(1)       |
| ZUNION numberkeys key [key] WEIGHTS AGGREGATE SUM\|MIN\|MAX WITHSCORES |   多个key的并集 WEIGHT 得分权重 AGGREGATE 聚合，默认是SUM    | O(N)+O(Mlog(M))  |
| ZUNIONSTORE destination numberkeys key [key] WEIGHTS AGGREGATE SUM\|MIN\|MAX |                   多个key的并集并存入集合                    | O(N)+O(Mlog(M))  |

### 使用场景

* 排序的列表(日排行、月排行)

## Hash类型

### 常用命令

|                   命令                    |                       说明                       | 时间复杂度 |
| :---------------------------------------: | :----------------------------------------------: | :--------: |
|          HDEL key field [field]           |                     删除属性                     |    O(N)    |
|             HEXISTS key field             |                 判断属性是否存在                 |    O(1)    |
|              HGET key field               |                 获取某个属性的值                 |    O(1)    |
|                HGETALL key                |                 获取所有属性和值                 |    O(N)    |
|        HINCRBY key field increment        |             属性递增increment(整数)              |    O(1)    |
|     HINCRBYFLOAT key field increment      |             属性递增increment(小数)              |    O(1)    |
|                 HKEYS key                 |                     所有属性                     |    O(N)    |
|                 HLEN key                  |                    属性的数量                    |    O(1)    |
|          HMGET key field [field]          |                 批量获取多个属性                 |    O(N)    |
|    HMSET key field value [field value]    |      批量设置多个属性值(4.0.0之后标记废弃)       |    O(N)    |
|      HRANDFIELD key count WITHVALUES      | 随机获取属性和值，count 正数不会重复，负数会重复 |    O(N)    |
| HSCAN key cusor MATCH pattern COUNT count |             游标方式遍历获取属性和值             |    O(1)    |
|    HSET key field value [field value]     |       批量放入多个值(4.0.0之前只可以单个)        |    O(1)    |
|          HSETNX key field value           |       没属性的时候进行创建，有不做任何处理       |    O(1)    |
|             HSTRLEN key field             |                   属性值的长度                   |    O(1)    |
|                 HVALS key                 |                   获取所有的值                   |    O(1)    |

### 使用场景

* 多个对象信息

## Bitmap类型

## 常用命令

|               命令                |                            说明                            | 时间复杂度 |
| :-------------------------------: | :--------------------------------------------------------: | :--------: |
|      BITCOUNT key start end       |                       值bit位的数量                        |    O(N)    |
| BITTOP operation deskey key [key] |         多个key操作并存入另一个key AND/OR/XOR/NOT          |    O(N)    |
|     BITPOS key bit start end      |                 范围内检索第一个bit的位置                  |    O(N)    |
|         GETBIT key offset         |                     offset位置的bit值                      |    O(1)    |
|      SETBIT key offset value      | offset位置存入bit位，value 只能为0和1，offset 为0 - 2^32-1 |    O(1)    |

## 使用场景

* 位图
* 布隆过滤器

## hybridloglog类型

## 常用命令

|                 命令                  |           说明           | 时间复杂度 |
| :-----------------------------------: | :----------------------: | :--------: |
|      PFADD key element [element]      |       添加多个元素       |    O(N)    |
|           PFCOUNT key [key]           |        元素的个数        |    O(N)    |
| PFMERGE destkey sourcekey [sourcekey] | 多个key合并存入另一个key |    O(N)    |

## 使用场景

* 大数据量的统计

# QA问题

1. Redis安装编译报错，提示版本低了

   ```shell
   You need tcl 8.5 or newer in order to run the Redis test
   make[1]: *** [test] Error 1
   make[1]: Leaving directory `/home/redis/redis-6.2.6/src'
   make: *** [test] Error 2
   ```

   处理tcl后，再进行编译测试`make test`

   ```shell
   # 先查看是否已进行安装其他版本
   yum list installed | grep tcl
   # 没有的话进行
   yum install -y tcl
   make test
   ```

2. List与Stream实现消息队列的有啥不同？

   | 比较元素/实现方式 |           List方式            |                         Stream 方式                          |
   | :---------------: | :---------------------------: | :----------------------------------------------------------: |
   |   消息保存顺序    |        使用LPUSH/RPOP         |                        使用XADD/XREAD                        |
   |     阻塞读取      |           使用BRPOP           |                       使用XREAD BLOCK                        |
   |   重复消息处理    |   生产者自行实现全局唯一ID    |                      自动生成全局唯一ID                      |
   |    消息可靠性     | 使用BRPOPLPUSH,多维护一个队列 | 使用PENDING List自动留存消息，使用XPENDING查看，使用XACK确认消息 |
   |     使用场景      |  Redis 5.0前版本，消息总量小  |     Redis 5.0后版本，消息总量大，需要消费组形式读取数据      |

# 参考文献

1. Redis 快速启动：https://redis.io/topics/quickstart
2. Redis 配置：https://redis.io/topics/config
3. 数据类型汇总：https://redis.io/topics/data-types
4. 数据类型介绍：https://redis.io/topics/data-types-intro
5. 所有命令：https://redis.io/commands
5. 极客时间Redis专栏：https://time.geekbang.org/column/intro/100056701?tab=catalog