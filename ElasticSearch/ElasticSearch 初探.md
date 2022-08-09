---

title: ElasticSearch 初探
author: FelixFly
date: 2021-07-26
tags:
    - ElasticSearch
categories: 
    - 中间件
archives: 2021
---

1. ElasticSearch 系统配置
2. ElasticSearch 配置
3. ElasticSearch 安装
4. Kibana安装
5. Docker 方式安装
6. ElasticSearch 集群
7. 参考文献

<!-- more -->

> 版本信息：7.13.4

# ElasticSearch 系统配置

## 关闭swap

> 配置文件：/etc/security/limits.conf

```shell
# allow user 'elasticsearch' mlockall
* soft memlock unlimited
* hard memlock unlimited
# 或者采用下述替换
* - memlock unlimited
```

> 配置文件：/etc/sysctl.conf，或者执行命令sudo swapoff -a(配置文件/etc/fstab)，

```shell
vm.swappiness=1
```

## 虚拟内存

> 配置文件：/etc/sysctl.conf，命令行sysctl -w vm.max_map_count=262144

```shell
vm.max_map_count=262144
```



## 文件句柄设置

> 配置文件：/etc/security/limits.conf，配置命令 ulimit -n(-a) 65536

```shell
*  -  nofile  65536
```

## 线程数

> 配置文件：/etc/security/limits.conf，配置命令ulimit -u 4096

```shell
*  -  nproc  4096
```

## 最大文件大小

>  配置文件：/etc/security/limits.conf

```shell
*  -  fsize  unlimited
```

## 最大虚拟内存(地址空间)
> 配置文件：/etc/security/limits.conf

```shell
* - as unlimited
```

# ElasticSearch 配置

> 配置文件：`elasticsearch.yml`

## 内存锁定

```yaml
bootstrap.memory_lock: true
```

## `elasticsearch.yml`常用配置说明

```yaml
# 节点配置
# 集群名称
cluster.name: logging-prod
# 节点名称
node.name: prod-data-2

# 数据配置
# 数据文件路径
path.data: /var/lib/elasticsearch
# 日志文件路径
path.logs: /var/log/elasticsearch

# 网路配置
# 访问IP地址，通用配置为0.0.0.0
network.host: 192.168.1.10
# http 访问端口，配置区间默认设置9200-9300
http.port: 9200
# transport 访问端口，配置区间默认设置9300-9400
transport.port: 9300

# 单节点配置，默认是集群
discovery.type: single-node
# 处理器数量，单机器多实例需要配置
node.processors: 2

# 显示的名称删除，避免批量删除
action.destructive_requires_name: true
# 集群配置
# 节点发现
discovery.seed_hosts: ["192.168.1.10:9300"]
# 初始化节点,若单节点配置的话，不可进行配置
cluster.initial_master_nodes: ["prod-data-2"]
```

## `jvm.options`常用配置说明

> 此配置文件不要进行修改，需要修改的话在jvm.options.d目录下创建配置文件

```shell
# 堆内存设置
-Xms2g -Xmx2g
# 临时目录
-Djava.io.tmpdir=/path/to/temp/dir
# JNA 临时目录
-Djna.tmpdir=/path/jna/temp/dir

#GC 相关设置
# jdk 14 以下使用CMS，当前还是CMS最好
8-13:-XX:+UseConcMarkSweepGC
# jdk 14 以上
14-:-XX:+UseG1GC
# GC日志
8:-Xloggc:logs/gc.log
```

# ElasticSearch 安装

> [elasticsearch下载地址](https://www.elastic.co/cn/downloads/elasticsearch)

## 修改配置

> 按照`elasticsearch.yml`常用配置说明调整对应的配置

## 启动

```shell
# -d 为后台启动
./bin/elasticsearch -d
```

## 验证启动成功

```json
http://127.0.0.1:9200/
# 访问此地址返回信息
{
    "name": "node-1",
    "cluster_name": "elasticsearch",
    "cluster_uuid": "0--VFiGwQF-r72vLFEufuQ",
    "version": {
        "number": "7.13.4",
        "build_flavor": "default",
        "build_type": "tar",
        "build_hash": "c5f60e894ca0c61cdbae4f5a686d9f08bcefc942",
        "build_date": "2021-07-14T18:33:36.673943207Z",
        "build_snapshot": false,
        "lucene_version": "8.8.2",
        "minimum_wire_compatibility_version": "6.8.0",
        "minimum_index_compatibility_version": "6.0.0-beta1"
    },
    "tagline": "You Know, for Search"
}
```

# Kibana安装

> [Kibana下载地址](https://www.elastic.co/cn/downloads/kibana)

## 修改配置

```yaml
# 服务端口
server.port: 5601
# 服务地址，0.0.0.0 为通用配置
server.host: "0.0.0.0"
# 连接elasticsearch地址
elasticsearch.hosts: ["http://127.0.0.1:9200"]
# kibana 索引
kibana.index: ".kibana"
```

## 启动

```shell
nohup ./bin/kibana &
```

验证启动成功：http://127.0.0.1:5601

# Docker 方式安装

```shell
# 下载对应的版本
docker pull elasticsearch:7.13.4
docker pull kibana:7.13.4
# 创建网络
docker network create group
# 启动elasticsearch
docker run -d --name elasticsearch --net group -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" elasticsearch:7.13.4
# 启动kibana
docker run -d --name kibana --net group -p 5601:5601 kibana:7.13.4

```

## ElasticSearch 集群

## docker-compose

```dockerfile
version: '3'
services:
  cerebro:
    image: lmenezes/cerebro:latest
    container_name: cerebro
    ports:
      - "9000:9000"
    command:
      - -Dhosts.0.host=http://elasticsearch:9200
    networks:
      - es7net
  kibana:
    image: kibana:7.13.4
    container_name: kibana7
    environment:
      - I18N_LOCALE=zh-CN
      - XPACK_GRAPH_ENABLED=true
      - TIMELION_ENABLED=true
      - XPACK_MONITORING_COLLECTION_ENABLED="true"
    ports:
      - "5601:5601"
    networks:
      - es7net
  elasticsearch:
    image: elasticsearch:7.13.4
    container_name: es7_01
    environment:
      - cluster.name=es_cluster
      - node.name=es7_01
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.seed_hosts=es7_01,es7_02,es7_03
      - cluster.initial_master_nodes=es7_01,es7_02,es7_03
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es7data1:/usr/share/elasticsearch/data
    ports:
      - 9200:9200
    networks:
      - es7net
  elasticsearch2:
    image: elasticsearch:7.13.4
    container_name: es7_02
    environment:
      - cluster.name=es_cluster
      - node.name=es7_02
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.seed_hosts=es7_01,es7_02,es7_03
      - cluster.initial_master_nodes=es7_01,es7_02,es7_03
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es7data2:/usr/share/elasticsearch/data
    networks:
      - es7net
  elasticsearch3:
    image: elasticsearch:7.13.2
    container_name: es7_03
    environment:
      - cluster.name=es_cluster
      - node.name=es7_03
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.seed_hosts=es7_01,es7_02,es7_03
      - cluster.initial_master_nodes=es7_01,es7_02,es7_03
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es7data3:/usr/share/elasticsearch/data
    networks:
      - es7net


volumes:
  es7data1:
    driver: local
  es7data2:
    driver: local
  es7data3:
    driver: local

networks:
  es7net:
    driver: bridge

```

执行命令`docker-compose up`

# 参考文献

1. [系统配置参数](https://www.elastic.co/guide/en/elasticsearch/reference/current/system-config.html)
2. [应用配置参数](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)
3. [主要检查项](https://www.elastic.co/guide/en/elasticsearch/reference/current/bootstrap-checks.html)
