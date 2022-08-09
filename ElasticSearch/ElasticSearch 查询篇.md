---

title: ElasticSearch 查询篇
author: FelixFly
date: 2021-08-08
tags:
    - ElasticSearch
categories: 
    - 中间件
archives: 2021
---

1. ElasticSearch 基础查询
2. ElasticSearch 参数查询
4. ElasticSearch DSL
4. ElasticSearch EQL
5. ElasticSearch 排序
6. ElasticSearch 分页查询
7. ElasticSearch 异步查询
8. 参考文献

<!-- more -->

> 版本信息：7.14.0

# ElasticSearch 查询

# ElasticSearch 基础查询

## ID查询

* `preference` 控制分片查询，默认是随机
  * `_local` 本分片优先
* `realtime` 实时查询，默认为true，ID是可以直接实时查询的，不受refresh限制
* `refresh` 刷新，刷新到分片上进行检索，默认是false
* `routing` 路由，默认是根据ID路由
* `stored_fields` 存储属性，默认为false，为true属性存储到索引
* `_source` 是否返回源数据，默认true
* `_source_excludes` 返回属性不包含配置属性
* `_source_includes` 只返回配置的属性
* `version` 匹配的数据版本
* `version_type` 版本类型，`external` 外部版本等于, `external_gte` 外部版本大于等于

```shell
# 根据ID进行查询所有数据
GET kibana_sample_data_flights/_doc/9EpGKnsB6C4-lZVb-nw8
# 根据ID查询源数据
GET kibana_sample_data_flights/_source/9EpGKnsB6C4-lZVb-nw8
```

## mget批量ID查询

* `preference` 控制分片查询，默认是随机
  * `_local` 本分片优先
* `realtime` 实时查询，默认为true，ID是可以直接实时查询的，不受refresh限制
* `refresh` 刷新，刷新到分片上进行检索，默认是false
* `routing` 路由，默认是根据ID路由
* `stored_fields` 存储属性，默认为false，为true属性存储到索引
* `_source` 是否返回源数据，默认true
* `_source_excludes` 返回属性不包含配置属性
* `_source_includes` 只返回配置的属性

```shell
# 根据多个索引的ID进行查询
GET _mget
{
  "docs": [
    {
      "_index":"kibana_sample_data_flights",
      "_id": "9EpGKnsB6C4-lZVb-nw8"
    }
  ]
}
# 根据某个索引下的ID进行查询
GET kibana_sample_data_flights/_mget
{
  "docs": [
    {
      "_id": "9EpGKnsB6C4-lZVb-nw8"
    }
  ]
}
# 根据某个索引下的ID进行查询
GET kibana_sample_data_flights/_mget
{
  "ids":["9EpGKnsB6C4-lZVb-nw8"]
}
```

## `mearch`查询

* `max_concurrent_search` 最大并发查询数，默认为max(1,数据节点 * min(查询线程池大小,10))
* `max_concurrent_shard_requests` 每个节点的并发分片数，默认为5
* `routing` 路由
* `search_type` 查询类型
  * `query_then_fetch` `local`分片的查询以及评分，默认值
  * `dfs_query_then_fetch` 全部分片的查询以及评分

```shell
# 多个索引查询
GET _msearch
{ "index":"kibana_sample_data_flights"}
{"query":{"match":{"_id":"9EpGKnsB6C4-lZVb-nw8"}}}
{ "index":"kibana_sample_data_flights"}
{"query":{"match":{"DestCountry":"CN"}}}
{ "index":"kibana_sample_data_ecommerce"}
{"query":{"match":{"_id":"n0pGKnsB6C4-lZVb72r1"}}}

# 某个索引查询，再加其他的索引查询
GET kibana_sample_data_flights/_msearch
{}
{"query":{"match":{"_id":"9EpGKnsB6C4-lZVb-nw8"}}}
{ "index":"kibana_sample_data_ecommerce"}
{"query":{"match":{"_id":"n0pGKnsB6C4-lZVb72r1"}}}
```

# ElasticSearch 查询参数查询

> 相当于query_string查询

```shell
# 根据ID查询
GET kibana_sample_data_flights/_search?q=_id:9EpGKnsB6C4-lZVb-nw8

# 根据时间段查询
GET kibana_sample_data_flights/_search?q=timestamp:"2021-08-02T00:00:00" to "2021-08-03T00:00:00"

# 根据目的地查询，由于Dest类型是keyword,可以精确查询
GET kibana_sample_data_flights/_search?q=Dest:"Melbourne International Airport"

# 根据目的地查询，这样会分词，导致查询不到结果
GET kibana_sample_data_flights/_search?q=Dest:Melbourne International Airport

# 索引重建，让Dest类型变成为text类型
POST _reindex
{
  "source": {
    "index": "kibana_sample_data_flights"
  },
  "dest": {
    "index": "kibana_sample_data_flights_0000002"
  }
}

# 查询条件是Melbourne OR Melbourne
GET kibana_sample_data_flights_0000002/_search?q=Dest:Melbourne Airport
# 查询条件是Melbourne AND Melbourne
GET kibana_sample_data_flights_0000002/_search?q=Dest:Melbourne AND International
# 查询条件是Melbourne AND Melbourne
GET kibana_sample_data_flights_0000002/_search?q=Dest:"Melbourne International"

```

# ElasticSearch DSL

> Domain Specific Language 领域查询语言

## Term 级别查询

### Term查询

### Terms查询





## 全文本查询

## 组合查询

## Span 查询

## 其他特殊查询









# ElasticSearch EQL

> Event Query Language 事件查询语言

# ElasticSearch 排序

## 默认排序

> 按_score排序

## `Sort`排序

## `Script`排序

# ElasticSearch 分页查询

## `form`与`size`查询

## `search after`查询

## `search after pit`查询

## `scroll`查询

# ElasticSearch 异步查询

# 参考文献

1. DSL 查询: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
2. Rest Domument API: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs.html
3. EQL 查询: https://www.elastic.co/guide/en/elasticsearch/reference/current/eql-apis.html

