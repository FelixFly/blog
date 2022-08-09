---

title: ElasticSearch 弹性设计
author: FelixFly
date: 2021-08-05
tags:
    - ElasticSearch
categories: 
    - 中间件
archives: 2021
---

1. ElasticSearch 索引别名
2. ElasticSearch 属性别名
4. ElasticSearch ingest
7. 参考文献

<!-- more -->

> 版本信息：7.13.4

# ElasticSearch 索引别名

## 索引别名

* 根据索引api创建别名

  ```shell
  # 删除索引
  DELETE my-index-000001
  # 索引别名
  PUT my-index-0000001
  {
    "aliases": {
      "my-index": {}
    }
  }
  # 创建索引
  POST my-index/_doc
  {
    "name":"my-index"
  }
  # 根据索引查询数据
  GET my-index/_search
  # 原索引创建索引
  POST my-index-0000001/_doc
  {
    "name":"mymy-index-0000001"
  }
  # 原索引查询
  GET my-index-0000001/_search
  # 索引别名信息查询
  GET my-index-0000001/_alias
  # 删除索引别名
  DELETE my-index-0000001/_alias/my-index
  
  # 添加索引别名
  POST my-index-0000001/_alias/my-index
  ```

* `_alias`创建别名

  * `is_write_index` 控制是否可以写数据，默认是true
  * `routing` 路由配置别名(分片别名)，可以分为`search_routing`和`index_routing`
  * `filter` 条件别名，根据条件设置对应的别名查询

  ```shell
  # 别名是否存在
  HEAD _alias/my-index
  # 查询别名使用的索引
  GET _alias/my-index
  # 别名api添加
  POST _aliases
  {
    "actions": [
      {
        "add": {
          "index": "my-index-0000001",
          "alias": "my-index-01"
        }
      }
    ]
  }
  # 别名上的别名是不可以的，报错
  POST _aliases
  {
    "actions": [
      {
        "add": {
          "index": "my-index-01",
          "alias": "my-index-02"
        }
      }
    ]
  }
  # 删除别名
  POST _aliases
  {
    "actions": [
      {
        "remove": {
          "index": "my-index-0000001",
          "alias": "my-index-01"
        }
      }
    ]
  }
  # 读索引别名，不支持写索引操作
  POST _aliases
  {
    "actions": [
      {
        "add": {
          "index": "my-index-0000001",
          "alias": "my-read-index",
          "is_write_index":false
        }
      }
    ]
  }
  
  # 只读，不可以写数据
  POST my-read-index/_doc
  {
    "name":"my-read-index"
  }
  
  # 可以查询
  GET my-read-index/_search
  
  # 根据路由创建分片别名
  POST _aliases
  {
    "actions": [
      {
        "add": {
          "index": "my-index-0000001",
          "alias": "my-routing-index",
          "routing": "1"
        }
      }
    ]
  }
  
  # 查询数据
  GET my-routing-index/_search
  # 根据filter 条件创建别名
  POST _aliases
  {
    "actions": [
      {
        "add": {
          "index": "my-index-0000001",
          "alias": "my-filter-index",
          "filter": {
            "match": {
              "name": "0000001"
            }
          }
        }
      }
    ]
  }
  # 查询数据
  GET my-filter-index/_search
  ```

  

## 滚动别名

> 索引名称为6位数字结尾并用0左填充，比如`my-index-000001`

### 查询参数

* `dry_run` 检查是否已经触发条件了但是没有滚动，默认为false
* `wait_for_active_shards` 操作的分片数，默认为1

### 请求体参数

* `aliases` 支持多个别名，路由、条件过滤、是否读写
* `conditions ` 条件判断滚动
  * `max_age` 最大时间
  * `max_doc` 最大文档
  * `max_size` 最大大小
  * `max_primary_shard_size` 主分片大小
* `mappings` 属性设置
* `settings` 索引设置

```shell
# 创建索引别名
PUT my-index-0000001
{
  "aliases": {
    "my-index-alias": {}
  }
}
# 创建滚动，3个文档的时候就开始滚动
POST my-index-alias/_rollover
{
  "conditions": {
    "max_docs": 3
  }
}
# 索引
POST my-index-alias/_doc
{
  "name":"test3"
}
# 获取索引别名关联的索引 // my-index-000002
GET _alias/my-index-alias
# 查询
GET my-index-alias/_search
```

# ElasticSearch 属性别名

## `alias`别名

```shell
# 删除索引
DELETE my-index-*
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "name":{
        "type": "text"
      },
      "aliasName":{
        "type": "alias",
        "path":"name"
      }
    }
  }
}

# 创建索引
POST my-index-000001/_doc
{
  "name":"test"
}
# 查询数据，源数据只有name字段，没有alias类型的字段
GET my-index-000001/_search
# 查询alias类型的字段
GET my-index-000001/_search
{
  "fields": [
    "name","aliasName","aliasName2"
  ]
}
# 查询数据
GET my-index-000001/_search
{
  "query": {
    "match": {
      "aliasName": "test"
    }
  }
}
# 添加另一个别名
PUT my-index-000001/_mapping
{
  "properties": {
      "aliasName2":{
        "type": "alias",
        "path":"name"
      }
    }
}
# 根据第二个别名进行搜索
GET my-index-000001/_search
{
  "query": {
    "match": {
      "aliasName2": "test"
    }
  }
}
```

## `runtime`类型

> 使用emit方法进行执行，只支持`boolean`、`date`、`double`、`geo_point`、`ip`、`keyword`、`long`

```shell
# 删除索引
DELETE my-index-000001

# 创建mapping的runtime属性，格式化日期显示
PUT my-index-000001/
{
  "mappings": {
    "runtime": {
      "createAtShow": {
        "type": "keyword",
        "script": {
          "source": "emit(doc['createAt'].value.toLocalDateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))"
        }
      }
    },
    "properties": {
      "createAt": {"type": "date"}
    }
  }
}
# 插入数据
POST my-index-000001/_doc
{
  "createAt": 1628166995000
}


# 查询runtime 类型数据
GET my-index-000001/_search
{
  "fields": [
    "createAtShow"
  ]
}

# 查询的时候编写runtime类型字段
GET my-index-000001/_search
{
  "runtime_mappings": {
    "show_create_at": {
      "type": "keyword",
      "script": {
        "source": "emit(doc['createAt'].value.toLocalDateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))"
      }
    }
  },
  "fields": [
    "show_create_at"
  ]
}
```

# ElasticSearch ingest

> 1. 可以设置`_source`里面的数据，
> 2. 可以设置`_index`、`_id`、`_routing`、`_dynamic_templates`，注意要是自动创建ID的话，会失败(由于pipeline执行在创建索引ID之前)
> 3. 可以设置ingest里面的数据，目前只有`_ingest.timestamp`

* `set` 设置值
* `remove` 删除某个属性
* `drop` 根据条件删除文档
* `rename` 重命名
* `date` 时间转换

## 利用pipeline参数执行

```shell
# 删除索引
DELETE my-index-000001
# 创建pipeline,利用_source里面的信息
PUT _ingest/pipeline/pipeline-myindex-001
{
  "description": "名字添加别名",
  "processors": [
    {
      "set": {
        "field": "aliasName",
        "value": "{{{name}}}"
      }
    }
  ]
}
# 获取pipeline数据
GET _ingest/pipeline/pipeline-myindex-001
# 利用pipeline处理数据
POST my-index-000001/_doc?pipeline=pipeline-myindex-001
{
  "name":"张三",
  "age":1
}
# 删除pipeline
DELETE _ingest/pipeline/pipeline-myindex-002
# 创建pipeline,利用_ingest里面的信息
PUT _ingest/pipeline/pipeline-myindex-002
{
  "description": "添加操作时间",
  "processors": [
    {
      "set": {
        "field": "@timestap",
        "value": "{{{_ingest.timestamp}}}"
      }
    }
  ]
}
# 利用pipeline处理数据
POST my-index-000001/_doc?pipeline=pipeline-myindex-002
{
  "name":"张三",
  "age":1
}

# 创建pipeline,利用_id里面的信息
PUT _ingest/pipeline/pipeline-myindex-003
{
  "description": "添加ID",
  "processors": [
    {
      "set": {
        "field": "id",
        "value": "{{{_id}}}"
      }
    }
  ]
}
# 无法生成id，由于index自动创建ID是在pipeline执行之后
POST my-index-000001/_doc?pipeline=pipeline-myindex-003
{
  "name":"王五",
  "age":1
}

# 利用pipeline处理数据
POST my-index-000001/_doc/1?pipeline=pipeline-myindex-003
{
  "name":"王五",
  "age":1
}

# 模拟数据数据
GET _ingest/pipeline/pipeline-myindex-003/_simulate
{
  "docs": [
    {
      "_source": {
        "name": "1"
      }
    }
  ]
}

# 组合pipeline信息
PUT _ingest/pipeline/pipeline-myindex
{
  "description": "处理myidnex",
  "processors": [
   {
     "pipeline": {
       "name": "pipeline-myindex-001"
     }
   },
   {
     "pipeline": {
       "name": "pipeline-myindex-002"
     }
   },
   {
     "pipeline": {
       "name": "pipeline-myindex-003"
     }
   },
   {
     "date": {
       "field": "@timestap",
       "target_field" : "create_at",
       "formats": ["ISO8601"],
       "output_format":"yyyy/MM/dd hh:mm:ss"
     }
   }
  ]
}

# 利用pipeline处理数据
POST my-index-000001/_doc/2?pipeline=pipeline-myindex
{
  "name":"王五",
  "age":1
}

# 查询数据
GET my-index-000001/_search

# 利用pipeline删除属性
PUT _ingest/pipeline/pipeline-myindex-004
{
  "description": "remove name",
  "processors": [
    {
      "remove": {
        "field": "name"
      }
    }
  ]
}

# 利用pipeline删除文档
PUT _ingest/pipeline/pipeline-myindex-005
{
  "description": "drop name",
  "processors": [
    {
     "drop": {
       "if": "ctx.name == '王五'"
     }
    }
  ]
}

# 利用pipeline重命名属性
PUT _ingest/pipeline/pipeline-myindex-006
{
  "description": "re name",
  "processors": [
    {
     "rename": {
       "field": "name",
       "target_field": "aliasName"
     }
    }
  ]
}
```

## 设置索引pipeline

* `default_pipeline` 默认的pipeline，没有pipeline的时候执行
* `final_pipeline` 最后执行的pipeline

```shell
# 索引设置，默认设置，没有pipeline参数的时候执行
PUT my-index-000001/_settings
{
  "index.default_pipeline":"pipeline-myindex-001"
}

# 没有pipeline参数执行pipeline-myindex-001
POST my-index-000001/_doc/3
{
  "name":"王五",
  "age":1
}
# 有pipeline参数执行，不执行default_pipeline，执行pipeline参数
POST my-index-000001/_doc/4?pipeline=pipeline-myindex-002
{
  "name":"王五",
  "age":1
}
# 索引设置，最终设置，最后都会执行pipeline参数的时候执行
PUT my-index-000001/_settings
{
  "index.final_pipeline":"pipeline-myindex-004"
}

# 没有pipeline参数执行pipeline-myindex-001,pipeline-myindex-004
POST my-index-000001/_doc/3
{
  "name":"王五",
  "age":1
}
# 有pipeline参数执行，不执行default_pipeline，执行pipeline参数和pipeline-myindex-004
POST my-index-000001/_doc/4?pipeline=pipeline-myindex-002
{
  "name":"王五",
  "age":1
}
# 查询数据
GET my-index-000001/_search
```

# 参考文献

1. [索引别名](https://www.elastic.co/guide/en/elasticsearch/reference/current/alias.html)
2. [滚动别名](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-rollover-index.html)
3. [单位说明](https://www.elastic.co/guide/en/elasticsearch/reference/current/common-options.html#time-units)
4. [列别名](https://www.elastic.co/guide/en/elasticsearch/reference/current/field-alias.html)
5. [runtime类型](https://www.elastic.co/guide/en/elasticsearch/reference/current/runtime.html)
6. [ingest pipeline](https://www.elastic.co/guide/en/elasticsearch/reference/current/ingest.html)

