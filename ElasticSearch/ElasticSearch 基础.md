---

title: ElasticSearch 基础
author: FelixFly
date: 2021-07-26
tags:
    - ElasticSearch
categories: 
    - 中间件
archives: 2021
---

1. ElasticSearch 基本概念
2. ElasticSearch Setting
3. ElasticSearch Mapping
4. ElasticSearch 基础操作
5. ElasticSearch 数据类型
7. 参考文献

<!-- more -->

> 版本信息：7.13.4

# ElasticSearch 基本概念

> 是文档型数据库，不是一个java应用，需要数据库相当的硬件配置，不具有事务(ACID)特性

* 集群(cluster) 多个节点构成集群
* 节点/实例(node) 相当于关系数据库(Database)
* 路由(routing) 用于控制文档是在哪个分片上，默认路由为其标识ID
* 索引(Index) 相当于关系型数据库中的表(Table)
* 文档(Document) 相当于关系型数据库中表的一行数据(Row)
* 属性(Field) 相当于关系型数量库中表的列(Column)
* DSL(查询语句) 相当于关系型数量库中的查询语句(SQL)

# ElasticSearch Setting

> 每个索引的配置信息

## 基础设置

* `index.number_of_shards` 主分片的数量，一般设置不能超过节点数
* `index.number_of_replicas` 副本分片的数量，一般设置小于节点数
* `index.refresh_interval` 刷新的时间，默认为1s
* `index.default_pipeline` 默认pipeline，没有pipeline的时候执行
* `index.final_pipeline` 最终的pipeline，都会进行执行

## 限制设置

* `index.mapping.total_fields.limit` 一个索引的属性总数限制，默认值是1000

  > `properties`以及`fields`下的字段统计数量

* `index.mapping.depth.limit` 一个索引属性深度限制，默认是20

* `index.mapping.nested_fields.limit` 一个索引中`nested`类型属性次数限制，默认是50

* `index.mapping.nested_objects.limit` 一个文档中`nested`类型所有属性对象的长度限制，默认是10000

* `index.mapping.field_name_length.limit` 索引属性名称长度限制，默认是`Long.MAX_VALUE` (相当于无限制)

* `index.max_result_window` 查询的最大数，避免深度分页，默认是10000

```shell
# 查询setting
GET my-index-0000001/_settings
# 参数，flat_settings，json扁平化
GET my-index-0000001/_settings?flat_settings=true
# 参数，默认的参数，include_defaults
GET my-index-0000001/_settings?flat_settings=true&include_defaults=true

# 修改setting
PUT xxx_index_name/_settings
{
   "index.mapping.total_fields.limit":3
}
```

# ElasticSearch Mapping

> 每个索引的属性信息

## Mapping配置

`dynamic` 参数配置，可以在`mapping`下控制全局，也可以在属性下配置控制单个属性，单个属性的配置高于全局设置

* `true` 自动添加
* `runtime` 只可在属性下进行配置，配置的属性不可检索，只在查询的时候在`_source`中显示
* `false` 新增属性忽略(不添加mapping)，不可进行检索，只在查询的时候在`_source`中显示
* `strict` 新增属性异常报错

### 字段动态Mapping

| JSON数据类型         | `dynamic`:`true`      | `dynamic`:`runtime`   |
| -------------------- | --------------------- | --------------------- |
| `null`               | 不处理                | 不处理                |
| `true`/`false`       | `boolean`             | `boolean`             |
| `double`             | `float`               | `double`              |
| `integer`            | `long`                | `long`                |
| `object`             | `object`              | `object`              |
| `array`              | `array`中第一个非空值 | `array`中第一个非空值 |
| 日期类型推断`String` | `date`                | `date`                |
| 数字类型推断`String` | `float`/`long`        | `double`/`long`       |
| 剩下的`String`       | `text`与`.keyword`    | `keyword`             |

* 日期类型推断参数`date_detection`，默认为true
  * 日期类型格式化参数`dynamic_date_formats`,默认为`[ yyyy/MM/dd HH:mm:ss||yyyy/MM/dd||epoch_millis]`，**自动转换类型只有`yyyy/MM/dd HH:mm:ss||yyyy/MM/dd`**，`epoch_millis`可以作为date类型的值，设置了类型的话后面创建数据必须符合该格式
* 数字类型推断参数`numeric_detection`，默认为false

```shell
# 删除索引，确保是自动映射
DELETE date-demo-001
# 第一次保存插入，动态mapping
POST date-demo-001/_doc
{
  "createAt1":"2021/07/28",  # date
  "createAt2":"21/07/28", # text与.keyword
  "createAt3":"2021/07/28 00:00:00", # date
  "createAt4":1627462203 # long
}

# 数据可以正常插入
POST date-demo-001/_doc
{
  "createAt1":1627462203,
  "createAt2":"21/7/8",
  "createAt3":1627462203
}

# 删除索引，确保是自动映射
DELETE date-demo-001
# 设置mapping中的动态日期格式
PUT date-demo-001
{
  "mappings": {
    "dynamic_date_formats":["yyyy/MM/dd HH:mm:ss||yyyy/MM/dd","MM/dd/yyyy"]
  } 
}
# 第一次保存插入，动态mapping
POST date-demo-001/_doc
{
  "createAt1":"2021/07/28", # date
  "createAt2":"2021/07/28 00:00:00", # date
  "createAt3":"07/28/2021" # date
}
# 设置mapping中的数字类型推断
PUT number-demo-001
{
  "mappings": {
    "numeric_detection": true
  }
}
# 第一次保存插入，动态mapping
POST number-demo-001/_doc
{
  "number1":"1.0", # float
  "number2":"2" # long
}
```

### 模板动态Mapping

> 分两种类型：某个具体索引级别的模板和索引模板

* 类型匹配 `match_mapping_type`
* 名称匹配/不匹配 `match`/`unmatch`
* 路径匹配/不匹配 `path_match`/`path_unmatch`

#### 具体索引下的模板(优先级高)

```shell
# 具体的某个索引下的模板
# 删除索引，确保是自动映射
DELETE dynamic-demo-001
# 设置索引模板
# 1. 不以test开头且以List结尾的object类型转换为nested类型
# 2. name路径下除了middle全部设置为keyword类型
PUT dynamic-demo-001
{
  "mappings": {
    "dynamic_templates": [
      {
        "list_as_nested": {
          "match_mapping_type": "object",
          "match": "*List",
          "unmatch":"test*",
          "mapping": {
            "type": "nested"
          }
        }
      },
      {
        "full_name": {
          "path_match": "name.*",
          "path_unmatch":"*.middle",
          "mapping": {
            "type": "keyword"
          }
        }
      }
    ]
  }
}

# 第一次保存插入，动态mapping
POST dynamic-demo-001/_doc
{
  "doctorList": [ # nested
    {
      "doctorId": 1, # long
      "count": 2 # long 
    }
  ],
  "testList": [ # object
    {
      "test1": 1 # long
    }
  ],
  "arrayList": [  #long
    1,
    2,
    3,
    4
  ],
  "name": { # object 
    "first": "xu", # keyword
    "middle": "cheng",# test 与 .keyword
    "last": "lin" # keyword
  }
}
```

#### 索引模板

```shell
# 创建索引模板
# 删除索引模板
DELETE _index_template/dynamic-demo-01
# 创建索引模板
# 1. 以test开头的object类型转换为nested类型
# 2. name路径下middle设置为keyword类型
PUT _index_template/dynamic-demo-01
{
  "index_patterns": [
    "dynamic-*"
  ],
  "priority": 1, # 多个模板的话，数值越大，优先级越高
  "template": {
    "mappings": {
      "dynamic_templates": [
        {
          "list_as_nested": {
            "match_mapping_type": "object",
            "match": "test*",
            "mapping": {
              "type": "nested"
            }
          }
        },
        {
          "full_name": {
            "path_match": "*.middle",
            "mapping": {
              "type": "keyword"
            }
          }
        }
      ]
    }
  }
}
# 删除索引，确保是自动映射
DELETE dynamic-demo-002
# 第一次保存插入，动态mapping
POST dynamic-demo-002/_doc
{
  "doctorList": [ # object
    {
      "doctorId": 1, # long
      "count": 2 # long
    }
  ],
  "testList": [ # nested
    {
      "test1": 1 # long
    }
  ],
  "arrayList": [ # long
    1,
    2,
    3,
    4
  ],
  "name": {
    "first": "xu", # text 与 .keyword
    "middle": "cheng", # keyword
    "last": "lin" # text 与 .keyword
  }
}
```

### 组件模板动态Mapping

```shell
# 删除组件模板
DELETE _component_template/component_template_001
# 创建组件模板，test开头的object类型转为为nested类型
PUT _component_template/component_template_001
{
  "template": {
    "mappings": {
      "dynamic_templates": [
        {
          "list_as_nested": {
            "match_mapping_type": "object",
            "match": "test*",
            "mapping": {
              "type": "nested"
            }
          }
        }
      ]
    }
  }
}
# 删除组件模板
DELETE _component_template/component_template_002
# 创建组件模板，middle为keyword类型
PUT _component_template/component_template_002
{
  "template": {
    "mappings": {
      "dynamic_templates": [
        {
          "full_name": {
            "path_match": "*.middle",
            "mapping": {
              "type": "keyword"
            }
          }
        }
      ]
    }
  }
}

# 删除索引模板
DELETE _index_template/component_template_compose_001
# 利用组合组件模板创建索引模板
PUT _index_template/component_template_compose_001
{
  "index_patterns": [
    "template-compose-*"
  ],
  "priority": 1,
  "composed_of":["component_template_001","component_template_002"]
}

# 删除索引
DELETE template-compose-001
# 创建索引
POST template-compose-001/_doc
{
  "doctorList": [ # object
    {
      "doctorId": 1, # long 
      "count": 2 # long
    }
  ],
  "testList": [ # nested
    {
      "test1": 1 # long
    }
  ],
  "arrayList": [  # long
    1,
    2,
    3,
    4
  ],
  "name": {
    "first": "xu", # test 与 .keyword
    "middle": "cheng", # keyword
    "last": "lin" # test 与 .keyword
  }
}

# 获取mapping数据
GET template-compose-001/_mapping
```

## 元数据信息

* `_index` 索引的名称
* `_type` 索引类型，7版本只有`_doc`，8版本可能会进行删除
* `_id` 文档的ID
* `_score` 相关度评分
* `_source` 文档的原始数据
* `_meta` 元数据的其他元数据信息
* `_routing` 路由信息
* `_version` 文档的版本信息，可以外置
* `_seq_no` 文档的序号，与`_primary_term`一起构成内部版本控制
* `_primary_term` 分片的序号，与`_seq_no`一起构成内部版本控制
* `_ingored` 索引的时候忽略的字段，参数配置`ignore_malformed`

## Mapping参数

### `dynamic` 动态匹配配置

>  优先级高于mapping中的配置，默认值为true

```shell
# 删除创建
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "dynamic": false,
    "properties": {
      "name": {
        "type": "text"
      },
      "area": {
        "type": "object", 
        "dynamic": true
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name": "张三", # text
  "area": {
    "prod": "AH", # text 与 .keyword
    "city": "HF" # text 与 .keyword
  },
  "age": 30 # 无
}
# 获取mapping信息
GET dynamic-demo-001/_mapping
```

### `index` 是否索引

> 默认值为true

```shell
# 删除索引
DELETE dynamic-demo-001

# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "dynamic": false,
    "properties": {
      "name": {
        "type": "text",
        "index": false
      },
      "area": {
        "type": "object", 
        "dynamic": true
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name": "张三",
  "area": {
    "prod": "AH",
    "city": "HF"
  },
  "age": 30
}

# 查询索引数据，查询报错 Cannot search on field [name] since it is not indexed
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "name": "张三"
    }
  }
}
```

### `enabled` 属性启用

> 控制索引和mapping，类型为`object`或者`nested`类型
>
> 与index的区别是查询的时候不报错，mapping也不会变化，默认值为true

```shell
# 删除索引
DELETE dynamic-demo-001

# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "dynamic": false,
    "properties": {
      "name": {
        "type": "object", 
        "enabled": false
      },
      "area": {
        "type": "object", 
        "dynamic": true
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name": "张三",
  "area": {
    "prod": "AH",
    "city": "HF"
  },
  "age": 30
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name": {
    "first": "张",
    "last": "三"
  },
  "area": {
    "prod": "AH",
    "city": "HF"
  },
  "age": 30
}


GET dynamic-demo-001/_mapping

# 查询索引数据，无法检索到数据
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "name.first": "张"
    }
  }
}
```

### `format` 格式化匹配

> 主要是针对日期类型的格式化匹配

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建索引mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name":{
        "type": "text"
      },
      "birth":{
        "type":"date",
        "format": ["yyyy/MM/dd"]
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张三",
  "birth":"1991/02/27"
}

# 创建索引报错，格式不匹配
POST dynamic-demo-001/_doc
{
  "name":"李四",
  "birth":"1991 02 27"
}

# 获取mapping
GET dynamic-demo-001/_mapping

# 范围查询
GET dynamic-demo-001/_search
{
  "query": {
    "range": {
      "birth": {
        "gte": "1991/02/27",
        "lte": "2021/02/27"
      }
    }
  }
}
```

### `store` 存储

> 默认是只索引，不存储，只会出现在_source里面，索引文档会存放ES和Lucence，store会存储到Lucence上，默认值为false

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name":{
        "type": "text",
        "store": true
      },
      "birth":{
        "type":"date",
        "format": ["yyyy/MM/dd"],
        "store": true
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张三",
  "birth":"1991/02/27"
}

# 查询数据
GET dynamic-demo-001/_search
{
  "stored_fields": ["name"],  # 只返回name字段的值
  "query": {
    "range": {
      "birth": {
        "gte": "1991/02/27",
        "lte": "2021/02/27"
      }
    }
  }
}
```

### `fields` 多属性

> 文本类型会自动mapping出一个keyword属性

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name":{
        "type": "text",
        "store": true,
        "fields": {
          "raw":{
            "type":"keyword"
          }
        }
      },
      "birth":{
        "type":"date",
        "format": ["yyyy/MM/dd"],
        "store": true
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张三",
  "birth":"1991/02/27"
}
# 查询数据
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "name.raw": "张三"
    }
  }
}
```

### `ignore_malformed` 忽略格式检查

> 错误的格式字段在_ingored属性中体现，默认为false

```shell
# 创建索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name":{
        "type": "text"
      },
      "birth":{
        "type":"date",
        "format": ["yyyy/MM/dd"],
        "ignore_malformed": true
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张三",
  "birth":"1991/02/27"
}
# 创建索引，可以正常存入
POST dynamic-demo-001/_doc
{
  "name":"李四",
  "birth":"1991 02 27"
}
# 查询数据，错误的数据会在_ignored中体现
GET dynamic-demo-001/_search

{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "dynamic-demo-001",
        "_type" : "_doc",
        "_id" : "-MjIBXsBsXY_v_247cx2",
        "_score" : 1.0,
        "_source" : {
          "name" : "张三",
          "birth" : "1991/02/27"
        }
      },
      {
        "_index" : "dynamic-demo-001",
        "_type" : "_doc",
        "_id" : "-cjIBXsBsXY_v_24-MzM",
        "_score" : 1.0,
        "_ignored" : [
          "birth"
        ],
        "_source" : {
          "name" : "李四",
          "birth" : "1991 02 27"
        }
      }
    ]
  }
}
```

### `ingore_above` 超过不检索

> 字符长度，不是字节长度，只针对keyword类型，默认为Int最大值

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "fields": {
          "first": {
            "type": "keyword",
            "ignore_above": 2
          }
        }
      },
      "birth": {
        "type": "date",
        "format": [
          "yyyy/MM/dd"
        ],
        "ignore_malformed": true
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张三",
  "birth":"1991/02/27"
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"李四王五",
  "birth":"1991 02 27"
}

# 数据查询，张三可以进行查询出来，但是李四王五无法进行查询
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "name.first": "张三"
    }
  }
}
```

### `doc_values` 文档值

> 关闭后该属性不支持排序、聚合、脚本中使用，默认值为true

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "keyword",
        "doc_values": false
      },
      "birth": {
        "type": "date",
        "format": [
          "yyyy/MM/dd"
        ],
        "ignore_malformed": true
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张三",
  "birth":"1991/02/27"
}

# 查询排序，报错Can't load fielddata on [name] because fielddata is unsupported on fields of type [keyword]. Use doc values instead
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "name": "张三"
    }
  },
  "sort": [
    {
      "name": {
        "order": "desc"
      }
    }
  ]
}
```

### `fielddata` text类型排序

> 默认值为false，排序是按分词进行排序的

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "fielddata": true
      },
      "birth": {
        "type": "date",
        "format": ["yyyy/MM/dd"]
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张物三",
  "birth":"1991/02/27",
  "height":175
}

# 查询排序
GET dynamic-demo-001/_search
{
  "query": {
    "match_all": {
    }
  },
  "sort": [
    {
      "name": {
        "order": "desc"
      }
    }
  ]
}
```

### `eager_global_ordinals` 全局序号

> 默认值为false

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "fielddata": true,
        "eager_global_ordinals": true
      },
      "birth": {
        "type": "date",
        "format": ["yyyy/MM/dd"]
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name":"张物三",
  "birth":"1991/02/27",
  "height":175
}

# 查询排序
GET dynamic-demo-001/_search
{
  "query": {
    "match_all": {
    }
  },
  "sort": [
    {
      "name": {
        "order": "desc"
      }
    }
  ]
}
```

### `properties`子属性

> 针对`object`类型和`nested`类型

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "object",
        "properties": {
          "first":{
            "type":"keyword"
          },
          "last":{
            "type": "keyword"
          }
        }
      },
      "birth": {
        "type": "date",
        "format": ["yyyy/MM/dd"]
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name": {
    "first": "张",
    "last": "三峰"
  },
  "birth": "1991/02/27",
  "height": 175
}
```

### `copy_to` 复制

```shell

# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "object",
        "properties": {
          "first":{
            "type":"keyword",
            "copy_to":"full_name"
          },
          "last":{
            "type": "keyword",
            "copy_to":"full_name"
          }
        }
      },
      "birth": {
        "type": "date",
        "format": ["yyyy/MM/dd"]
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "name": {
    "first": "张",
    "last": "三峰"
  },
  "birth": "1991/02/27",
  "height": 175
}

# 可以根据full_name进行查询
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "full_name": "张三峰"
    }
  }
}
```

### `null_value` `null`值处理

> 相同类型的值处理

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text"
      },
      "sex":{
        "type": "integer",
        "null_value": -1
      },
      "birth": {
        "type": "date",
        "format": ["yyyy/MM/dd"]
      }
    }
  }
}
# 创建索引，没有这个sex节点
POST dynamic-demo-001/_doc
{
  "name": "张三峰",
  "birth": "1991/02/27",
  "height": 175
}
# 创建索引，有sex节点，并且值为null
POST dynamic-demo-001/_doc
{
  "name": "张三",
  "birth": "1991/02/27",
  "height": 175,
  "sex": null
}
# 查询为-1的数据，能查到张三
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "sex": -1
    }
  }
}
```

### `analyzer` 分词器

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping 
PUT dynamic-demo-001
{
  "settings": {
    "analysis": {
      "analyzer": {
        "english_stop": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "stop"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "remark": {
        "type": "text",
        "analyzer": "english_stop"
      }
    }
  }
}

# 创建索引
POST dynamic-demo-001/_doc
{
  "text":"I have a appple."
}

# term 查询，根据"I" 查询无法进行查询，只能根据"i"查询
GET dynamic-demo-001/_search
{
  "query": {
    "term": {
      "text": "i"
    }
  }
}

```

### `search_analyzer` 查询分词器

> 默认情况下，查询分词器和分词器一致

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_analyzer": {
          "char_filter": [
            "quote"
          ],
          "tokenizer": "pattern",
          "filter": [
            "lowercase",
            "stop"
          ]
        }
      },
      "char_filter": {
        "quote": {
          "type": "mapping",
          "mappings": [
            ":) => happy",
            ":( => sad"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "remark": {
        "type": "text",
        "analyzer": "my_analyzer",
        "search_analyzer": "standard"
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "remark":"I hava a apple. I am felling :), Feeling :( today"
}

# 根据":)"无法查询，只能根据"happy"进行查询
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "remark": ":)"
    }
  }
}
```

### `normalizer` 单一分词处理

> 针对keyword类型

```shell
# 删除索引
DELETE dynamic-demo-001
# 创建mapping
PUT dynamic-demo-001
{
  "settings": {
    "analysis": {
      "normalizer": {
        "my_normalizer": {
          "filter": [
            "lowercase"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "keyword",
        "normalizer": "my_normalizer"
      }
    }
  }
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name": "BAR"
}
# 创建索引
POST dynamic-demo-001/_doc
{
  "name": "bar"
}
# 查询数据，都可以进行查询到
GET dynamic-demo-001/_search
{
  "query": {
    "match": {
      "name": "BAR"
    }
  }
}
```



# ElasticSearch 基础操作

* 除了查询操作以外的操作都是使用_bulk批量处理的

* 文档的操作需要检索和存储，检索需要refresh，默认配置是1s(准实时)，存储是flush

  ```shell
  # refresh
  POST dynamic-demo-001/_refresh
  # flush
  POST dynamic-demo-001/_flush
  ```

  

* 删除文档只是标记删除，不是物理删除，后台会定时进行处理，需要物理删除的话需要强制合并

  ```shell
  # 强制合并
  POST dynamic-demo-001/_forcemerge
  ```

  

## 新增

> POST 与 PUT区别，PUT必须要指定ID

```shell
# 新增索引,自动创建ID
POST dynamic-demo-001/_doc
{
  "name": "BAR"
}
# 新增索引，ID为1，若是存在的话会进行更新
POST dynamic-demo-001/_doc/1
{
  "name": "BAR"
}
# 新增索引，ID为1，若是存在的话会进行更新
PUT dynamic-demo-001/_doc/1
{
  "name": "BAR"
}
# 新增索引，ID为1，若是存在的话会报错
POST/PUT dynamic-demo-001/_doc/1?op_type=create
{
  "name": "BAR"
}
# 新增索引，ID为2，若是存在的话会报错
POST/PUT dynamic-demo-001/_create/2
{
  "name":"bar"
}
```

## 修改

> 修改并不是真正意义上的修改，而是更新了删除标识，再创建了一个文档

```shell
# 全量修改
PUT/POST dynamic-demo-001/_doc/1
{
  "name": "bar",
  "sex":1
}
# 增量修改
POST dynamic-demo-001/_update/1
{
  "doc":{
    "sex":2
  }
}
```

### 条件修改

> 利用脚本script和ingest pipeline进行更新

```shell
# 脚本script 更新性别为2的改为1
POST dynamic-demo-001/_update_by_query
{
  "script": {
    "source": """
     ctx._source.sex = 1
    """,
    "lang": "painless"
  },
  "query": {
    "match": {
      "sex": 2
    }
  }
}
# ingest pipeline 更新性别为1的改为2
# 创建一个修改数据的pipeline
PUT _ingest/pipeline/sex001
{
  "description": "性别为2",
  "processors": [
    {
      "set": {
        "field": "sex",
        "value": "2"
      }
    }
  ]
}
# 利用pipeline 批量修改数据
POST dynamic-demo-001/_update_by_query?pipeline=sex001
{
  "query": {
    "match": {
      "sex": 1
    }
  }
}
```

## 删除

> 删除并不是真正意义上的删除，而是更新删除标识，再创建了一个文档

```shell
# 根据文档进行删除
DELETE dynamic-demo-001/_doc/1
```

### 条件删除

```shell
# 根据条件批量进行删除
POST dynamic-demo-001/_delete_by_query
{
  "query": {
    "match": {
      "name": "bar"
    }
  }
}
```

## 查询

```shell
# 根据标识进行查询
GET dynamic-demo-001/_doc/1
# QSL查询
GET dynamic-demo-001/_search
```

## 批量操作

### _bulk操作

* `version` 与 `version_type` 版本控制
* `refresh` 是否立即刷新，默认为false
* `routing` 路由，根据路由选择分片
* `pineline` 管道处理器
* `wait_for_active_shards` 操作的分片数，默认为1

```shell
# index 索引 update 需改  delete 删除 create 新建
PUT _bulk
{"index":{"_index":"dynamic-demo-001","_id":1}}
{"name":"bar","sex":2}
{"index":{"_index":"dynamic-demo-001","_id":2}}
{"name":"bob","sex":1}
{"update":{"_index":"dynamic-demo-001","_id":1}}
{"doc":{"age":20}}
{"delete":{"_index":"dynamic-demo-001","_id":2}}
{"delete":{"_index":"dynamic-demo-001","_id":3}}
{"create":{"_index":"dynamic-demo-001","_id":4}}
{"name":"bar","sex":2}
```

### _mget操作

```shell
# 多个查询
GET _mget
{
  "docs": [
    {
      "_index": "dynamic-demo-001",
      "_id": 1
    },
    {
      "_index": "dynamic-demo-001",
      "_id": 4
    }
  ]
}
# 多个查询
GET dynamic-demo-001/_mget
{
  "docs": [
    {
      "_id": 1
    },
    {
      "_id": 4
    }
  ]
}
# 某个索引下的多个查询
GET dynamic-demo-001/_mget
{
  "ids":[1,4]
}
```

# ElasticSearch 数据类型

## 基础类型

### binary

> base64的字符串，不存储不索引

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping 
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text"
      },
      "blob": {
        "type": "binary"
      }
    }
  }
}
# 索引数据
PUT my-index-000001/_doc/1
{
  "name": "Some binary blob",
  "blob": "U29tZSBiaW5hcnkgYmxvYg==" 
}
```

### boolean

> 只有两个值，true 和 false

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "is_published": {
        "type": "boolean"
      }
    }
  }
}
# 创建索引，字符串会自动解析为boolean
POST my-index-000001/_doc/1
{
  "is_published": "true" 
}
# 创建索引
POST my-index-000001/_doc/2
{
  "is_published": true
}
# 查询可以查询全部
GET my-index-000001/_search
{
  "query": {
    "term": {
      "is_published": true 
    }
  }
}
```

### keywords

> 当数值类型满足下面的条件的时候，用keyword类型更好
>
> 1. 不需要范围查询
> 2. 快速检索，term下的keyword效率高于number类型

* `keyword` 一个词项
* `constant_keyword` 常量词项，固定值，文档的值没有或者必须为该固定值，版本7.7.0
* `wildcard` 通配词项，版本7.9.0

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "tags":{
        "type": "keyword"
      },
      "level":{
        "type":"constant_keyword",
        "value":1
      },
      "name":{
        "type":"text"
      },
      "pinyin":{
        "type": "wildcard"
      }
    }
  }
}
# 索引
POST my-index-0000001/_doc
{
  "name":"测试",
  "pinyin":"cs",
  "level":1,
  "tags":"cs"
}
# 索引
POST my-index-0000001/_doc
{
  "name":"环境",
  "pinyin":"hj",
  "tags":"hj"
}
# 查询索引
GET my-index-0000001/_search
```

### numbers

> 有精度要求首选`scaled_float` ，无精度要求首选适合的

* `byte` 8字节，-128到127
* `short` 16字节，-32768到32767
* `integer` 32字节，-2^31 到 2^31 -1
* `long` 64字节，-2^63 到 2^63 -1
* `float` 32字节的小数
* `double` 64字节的小数
* `half_float` 16字节的小数
* `scaled_float` 精度的小数，后台使用`long`存储
* `unsigned_long` 无符号的整数， 0 到 2^64-1，版本7.10.0

```shell
# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "age": {
        "type": "short"
      },
      "income": {
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "name": {
        "type": "text"
      },
      "id": {
        "type": "long"
      },
      "sex":{
        "type": "byte"
      }
    }
  }
}
# 创建索引
POST my-index-0000001/_doc
{
  "id":4300221305,
  "name":"张三",
  "age":35,
  "income":15617.43,
  "sex":1
}
# 查询数据
GET my-index-0000001/_search
```

### dates

> 日期最好有个格式，格式默认为`strict_date_optional_time_nanos||epoch_millis`，参考`format`

* `date` 日期类型
* `date_nacos` 毫秒的日期类型

```shell
# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "createDate":{
        "type": "date"
      },
      "traceDate":{
        "type": "date_nanos"
      }
    }
  }
}
# 索引
POST my-index-0000001/_doc
{
  "createDate":"2021-08-03",
  "traceDate":"2021-08-03"
}
# 索引
POST my-index-0000001/_doc
{
  "createDate":"2021-08-03T12:10:30Z",
  "traceDate":"2021-08-03T12:10:30Z"
}
# 索引
POST my-index-0000001/_doc
{
  "createDate":"1420070400001",
  "traceDate":"1420070400001"
}
# 索引
POST my-index-0000001/_doc
{
  "createDate":1420070400001,
  "traceDate":1420070400001
}
# 排序查询
GET my-index-0000001/_search
{
  "sort": [
    {
      "createDate": {
        "order": "desc"
      }
    }
  ]
}
# 获取createDate数据
GET my-index-0000001/_search
{
  "fields": [ {"field": "createDate"}],
  "_source": false
}
# 获取traceDate数据
GET my-index-0000001/_search
{
  "fields": [ {"field": "traceDate"}],
  "_source": false
}
# 格式化输出createDate数据
GET my-index-0000001/_search
{
  "fields": [ {"field": "createDate","format": "yyyy/MM/dd HH:mm:ss"}],
  "_source": false
}

```

### alias

```shell
# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text"
      },
      "aliasName": {
        "type": "alias",
        "path": "name"
      }
    }
  }
}
# 索引
POST my-index-0000001/_doc
{
  "name":"Mike"
}
# 根据别名进行查询
GET my-index-0000001/_search
{
  "query": {
    "match": {
      "aliasName": "Mike"
    }
  }
}
```

## 对象以及关系类型

### object

> 复杂类型默认都是对象，单个类型的数组为单类型，对象类型的数组为object类型

```shell
# 删除索引
DELETE my-index-0000001
# 索引
POST my-index-0000001/_doc
{
  "tags": [  # text 与 .keyword
    "cs",
    "hj"
  ],
  "location": [ # long
    11111,
    2222
  ],
  "area": { # object
    "pro": "AH", # text 与 .keyword
    "city": "HF" # text 与 .keyword
  },
  "cities": [ # object
    {
      "aliasName": "HF", # text 与 .keyword
      "name": "合肥" # text 与 .keyword
    }
  ]
}
# 获取mapping
GET my-index-0000001/_mapping
```

### flatetened

> 避免属性过多，但使用内部字段进行排序的话需要注意是按照字符串的进行排序的，7.3.0版本的特性

```shell
# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "area":{
        "type": "flattened"
      }
    }
  }
}

# 索引
POST my-index-0000001/_doc
{
  "area": {
    "pro": "AH",
    "city": "HF"
  }
}
# 索引
POST my-index-0000001/_doc
{
  "area": {
    "pro": "AH",
    "city": "HF",
    "location": [
      11111,
      2222
    ]
  }
}
# 索引
POST my-index-0000001/_doc
{
  "area": {
    "pro": "AH",
    "city": "HF",
    "location": [
      11111,
      2222
    ],
    "cities": [
      {
        "aliasName": "HF",
        "name": "合肥"
      }
    ]
  }
}
# 索引
POST my-index-0000001/_doc
{
  "area": {
    "pro": "AH",
    "city": "HF",
    "source":1,
    "location": [
      11111,
      2222
    ],
    "cities": [
      {
        "aliasName": "HF",
        "name": "合肥"
      }
    ]
  }
}
# 索引
POST my-index-0000001/_doc
{
  "area": {
    "pro": "AH",
    "city": "HF",
    "source":11,
    "location": [
      11111,
      2222
    ],
    "cities": [
      {
        "aliasName": "HF",
        "name": "合肥"
      }
    ]
  }
}
# 索引
POST my-index-0000001/_doc
{
  "area": {
    "pro": "AH",
    "city": "HF",
    "source":7,
    "location": [
      11111,
      2222
    ],
    "cities": [
      {
        "aliasName": "HF",
        "name": "合肥"
      }
    ]
  }
}

# 查询数据
GET my-index-0000001/_search
{
  "fields": [{"field": "area"},{"field": "area.city"},{"field": "area.location"},{"field": "area.cities"},{"field": "area.source"}],
  "_source": false
}
# 排序，需要注意是按字符串的排序，会导致7在11之前
GET my-index-0000001/_search
{
  "sort": [
    {
      "area.source": {
        "order": "desc"
      }
    }
  ]
}
```

### nested

> 针对子文档需要精确检索(需要数组中多个条件)的时候，需要使用该内容

```shell
# 删除索引
DELETE my-index-0000001
# 索引
POST my-index-0000001/_doc
{
  "group" : "fans",
  "user" : [ 
    {
      "first" : "John",
      "last" :  "Smith"
    },
    {
      "first" : "Alice",
      "last" :  "White"
    }
  ]
}
# 查询，可以查询到数据，不应该查到数据
GET my-index-0000001/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "user.first": "John"
          }
        },
        {
          "match": {
            "user.last": "White"
          }
        }
      ]
    }
  }
}

# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "user":{
        "type": "nested"
      }
    }
  }
}
# 索引
POST my-index-0000001/_doc
{
  "group" : "fans",
  "user" : [ 
    {
      "first" : "John",
      "last" :  "Smith"
    },
    {
      "first" : "Alice",
      "last" :  "White"
    }
  ]
}
# 查询，查询不到数据，正常
GET my-index-0000001/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "user.first": "John"
          }
        },
        {
          "match": {
            "user.last": "White"
          }
        }
      ]
    }
  }
}
```

### join

> 父子文档必须要在同一个分片上

```shell
# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "id": {
        "type": "keyword"
      },
      "join_field": {
        "type": "join",
        "relations": {
          "question": "answer"
        }
      }
    }
  }
}
# 索引父文档
POST my-index-0000001/_doc/1
{
  "id": "1",
  "text": "This is a question",
  "join_field": {
    "name": "question" 
  }
}
# 索引子文档，必须指定父文档标识ID的路由
POST my-index-0000001/_doc?routing=1
{
  "id": "2",
  "text": "This is a answer2",
  "join_field": {
    "name": "answer",
    "parent":"1"
  }
}
# 索引子文档，必须指定父文档标识ID的路由
POST my-index-0000001/_doc?routing=1
{
  "id": "3",
  "text": "This is a answer1",
  "join_field": {
    "name": "answer",
    "parent":"1"
  }
}

# 根据parent_id查询子文档
GET my-index-0000001/_search
{
  "query": {
    "parent_id":{
      "type":"answer",
      "id":"1"
    }
  }
}

# 根据子文档查询父文档
GET my-index-0000001/_search
{
  "query": {
    "has_child": {
      "type": "answer",
      "query": {
        "match": {
          "id": "2"
        }
      }
    }
  }
}

# 根据父文档查询子文档
GET my-index-0000001/_search
{
  "query": {
    "has_parent": {
      "parent_type": "question",
      "query": {
        "match": {
          "id": "1"
        }
      }
    }
  }
}
```

## 结构数据类型

### range

* `integer_range`  32位整数范围，-2^31 到 2^31 -1
* `float_range` 32位小数范围
* `long_range` 64位整数范围，-2^63 到 2^63 -1
* `double_range` 64位小数范围
* `date_range` 日期范围
* `ip_range` ip范围

```shell
# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-0000001
{
  "mappings": {
    "properties": {
      "hight":{
        "type": "integer_range"
      },
      "validateDate":{
        "type":"date_range",
        "format": ["yyyy/MM/dd HH:mm:ss"]
      }
    }
  }
}
# 索引
POST my-index-0000001/_doc
{
  "hight" : { 
    "gte" : 10,
    "lt" : 20
  },
  "validateDate" : {
    "gte" : "2015/10/31 12:00:00", 
    "lte" : "2015/11/01 00:00:00"
  }
}
# 具体值进行查询
GET my-index-0000001/_search
{
  "query": {
    "match": {
      "hight": 15
    }
  }
}
# 范围查询，默认是intersects
GET my-index-0000001/_search
{
  "query": {
    "range": {
      "hight": {
        "gte": 19,
        "lt": 35
      }
    }
  }
}
# 范围查询，查询范围之内的数据
GET my-index-0000001/_search
{
  "query": {
    "range": {
      "hight": {
        "gte": 5,
        "lt": 30,
        "relation": "within"
      }
    }
  }
}
# 范围查询，查询范围被完全包含的数据
GET my-index-0000001/_search
{
  "query": {
    "range": {
      "hight": {
        "gte": 18,
        "lt": 19,
        "relation": "contains"
      }
    }
  }
}
```

### ip

```shell
# 删除索引
DELETE my-index-0000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "ip_addr": {
        "type": "ip"
      }
    }
  }
}

# 索引
PUT my-index-000001/_doc/1
{
  "ip_addr": "192.168.1.1"
}
# 查询
GET my-index-000001/_search
{
  "query": {
    "term": {
      "ip_addr": "192.168.0.0/1"
    }
  }
}
```

## 文本搜索类型

### text   

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "full_name": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      }
    }  
  }
}
# 索引
POST my-index-000001/_doc
{
  "full_name":"张三"
}

# 索引
POST my-index-000001/_doc
{
  "full_name":"张三峰"
}
# 查询
GET my-index-000001/_search
{
  "query": {
    "match": {
      "full_name": "张"
    }
  }
}
```

### `match_only_text` 

> 特殊的text类型，不提供评分和高性能，适用日志信息领域，版本7.14.0

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "message": {
        "type": "match_only_text"
      }
    }
  }
}
# 索引
POST my-index-000001/_doc
{
  "message":"I have a apple."
}

# 索引
POST my-index-000001/_doc
{
  "message":"I have a apple two."
}
# 查询，_score 都为1.0
GET my-index-000001/_search
{
  "query": {
    "match": {
      "message": "apple"
    }
  }
}
```

### token_count

> 必须要指定分词器analyzer

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "full_name": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          },
          "length":{
            "type":"token_count",
            "analyzer":"standard"
          }
        }
      }
    }  
  }
}

# 索引
POST my-index-000001/_doc
{
  "full_name":"张三"
}

# 索引
POST my-index-000001/_doc
{
  "full_name":"张三峰"
}
# 查询
GET my-index-000001/_search
{
  "query": {
    "match": {
      "full_name.length": 2
    }
  }
}
```

## 特殊的数据类型

### geo_point

> 经纬度点

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "location":{
        "type": "geo_point"
      }
    }
  }
}
# 索引
POST my-index-000001/_doc
{
  "location":{
    "lat": 41.12,
    "lon": -71.34
  }
}
# 索引 维度在前，经度在后
POST my-index-000001/_doc
{
  "location":"41.12,-71.34"
}
# 索引，经纬度
POST my-index-000001/_doc
{
  "location": [
    -71.34,
    41.12
  ]
}
# 索引，经纬度
POST my-index-000001/_doc
{
  "location": "POINT (-71.34 41.12)" 
}
# 查询
GET my-index-000001/_search
{
  "query": {
    "geo_bounding_box": { 
      "location": {
        "top_left": {
          "lat": 42,
          "lon": -72
        },
        "bottom_right": {
          "lat": 40,
          "lon": -74
        }
      }
    }
  }
}
```

### geo_shape

* `point` 点
* `linestring` 线
* `polygon` 面
* `multipoint` 多点
* `multilinestring` 多线
* `multipolygon` 多面
* `geometrycollection` 多种类型集合
* `envelope` 范围
* `circle` 圆，默认单位是meters，必须要指定`"strategy": "recursive"`

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "location":{
        "type": "geo_shape"
      },
      "circle":{
        "type": "geo_shape",
        "strategy": "recursive"
      }
    }
  }
}
# 点
POST my-index-000001/_doc
{
  "location": {
    "type": "point",
    "coordinates": [
      -71.34,
      41.12
    ]
  }
}
# 点
POST /example/_doc
{
  "location" : "POINT (-71.34 41.12)"
}
# 线
POST my-index-000001/_doc
{
  "location": {
    "type": "linestring",
    "coordinates": [
      [
        -77.03653,
        38.897676
      ],
      [
        -77.009051,
        38.889939
      ]
    ]
  }
}
# 线
POST my-index-000001/_doc
{
  "location" : "LINESTRING (-77.03653 38.897676, -77.009051 38.889939)"
}
# 面
POST my-index-000001/_doc
{
  "location" : {
    "type" : "polygon",
    "coordinates" : [
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
    ]
  }
}
# 面
POST my-index-000001/_doc
{
  "location" : "POLYGON ((100.0 0.0, 101.0 0.0, 101.0 1.0, 100.0 1.0, 100.0 0.0))"
}
# 多点
POST my-index-000001/_doc
{
  "location" : {
    "type" : "multipoint",
    "coordinates" : [
      [102.0, 2.0], [103.0, 2.0]
    ]
  }
}
# 多点
POST my-index-000001/_doc
{
  "location" : "MULTIPOINT (102.0 2.0, 103.0 2.0)"
}
# 多线
POST my-index-000001/_doc
{
  "location" : {
    "type" : "multilinestring",
    "coordinates" : [
      [ [102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0] ],
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0] ],
      [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8] ]
    ]
  }
}
# 多线
POST my-index-000001/_doc
{
  "location" : "MULTILINESTRING ((102.0 2.0, 103.0 2.0, 103.0 3.0, 102.0 3.0), (100.0 0.0, 101.0 0.0, 101.0 1.0, 100.0 1.0), (100.2 0.2, 100.8 0.2, 100.8 0.8, 100.2 0.8))"
}
# 多面
POST my-index-000001/_doc
{
  "location" : {
    "type" : "multipolygon",
    "coordinates" : [
      [ [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]] ],
      [ [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
        [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]] ]
    ]
  }
}
# 多面
POST my-index-000001/_doc
{
  "location" : "MULTIPOLYGON (((102.0 2.0, 103.0 2.0, 103.0 3.0, 102.0 3.0, 102.0 2.0)), ((100.0 0.0, 101.0 0.0, 101.0 1.0, 100.0 1.0, 100.0 0.0), (100.2 0.2, 100.8 0.2, 100.8 0.8, 100.2 0.8, 100.2 0.2)))"
}

# 多种集合
POST my-index-000001/_doc
{
  "location" : {
    "type": "geometrycollection",
    "geometries": [
      {
        "type": "point",
        "coordinates": [100.0, 0.0]
      },
      {
        "type": "linestring",
        "coordinates": [ [101.0, 0.0], [102.0, 1.0] ]
      }
    ]
  }
}
# 多种集合
POST my-index-000001/_doc
{
  "location" : "GEOMETRYCOLLECTION (POINT (100.0 0.0), LINESTRING (101.0 0.0, 102.0 1.0))"
}
# 范围
POST my-index-000001/_doc
{
  "location" : {
    "type" : "envelope",
    "coordinates" : [ [100.0, 1.0], [101.0, 0.0] ]
  }
}
# 范围
POST my-index-000001/_doc
{
  "location" : "BBOX (100.0, 102.0, 2.0, 0.0)"
}
# 圆
POST my-index-000001/_doc
{
  "circle" : {
    "type" : "circle",
    "coordinates" : [101.0, 1.0],
    "radius" : "100m"
  }
}
```

### point

> x,y坐标

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "location":{
        "type": "point"
      }
    }
  }
}
# 索引
POST my-index-000001/_doc
{
  "location":{
    "x": 41.12,
    "y": -71.34
  }
}
# 索引,(x,y)
POST my-index-000001/_doc
{
  "location":"41.12,-71.34"
}
# 索引,[x,y]
POST my-index-000001/_doc
{
  "location": [
    41.12,
    -71.34
  ]
}
# 索引，POINT(x,y)
POST my-index-000001/_doc
{
  "location": "POINT (41.12,-71.34)" 
}
# 查询
GET my-index-000001/_search
{
  "query": {
    "geo_bounding_box": { 
      "location": {
        "top_left": {
          "lat": 42,
          "lon": -72
        },
        "bottom_right": {
          "lat": 40,
          "lon": -74
        }
      }
    }
  }
}
```

### shape

* `point` 点
* `linestring` 线
* `polygon` 面
* `multipoint` 多点
* `multilinestring` 多线
* `multipolygon` 多面
* `geometrycollection` 多种类型集合
* `envelope` 范围

```shell
# 删除索引
DELETE my-index-000001
# 创建mapping
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "location":{
        "type": "shape"
      }
    }
  }
}
# 点
POST my-index-000001/_doc
{
  "location": {
    "type": "point",
    "coordinates": [
      -71.34,
      41.12
    ]
  }
}
# 点
POST /example/_doc
{
  "location" : "POINT (-71.34 41.12)"
}
# 线
POST my-index-000001/_doc
{
  "location": {
    "type": "linestring",
    "coordinates": [
      [
        -77.03653,
        38.897676
      ],
      [
        -77.009051,
        38.889939
      ]
    ]
  }
}
# 线
POST my-index-000001/_doc
{
  "location" : "LINESTRING (-77.03653 38.897676, -77.009051 38.889939)"
}
# 面
POST my-index-000001/_doc
{
  "location" : {
    "type" : "polygon",
    "coordinates" : [
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
    ]
  }
}
# 面
POST my-index-000001/_doc
{
  "location" : "POLYGON ((100.0 0.0, 101.0 0.0, 101.0 1.0, 100.0 1.0, 100.0 0.0))"
}
# 多点
POST my-index-000001/_doc
{
  "location" : {
    "type" : "multipoint",
    "coordinates" : [
      [102.0, 2.0], [103.0, 2.0]
    ]
  }
}
# 多点
POST my-index-000001/_doc
{
  "location" : "MULTIPOINT (102.0 2.0, 103.0 2.0)"
}
# 多线
POST my-index-000001/_doc
{
  "location" : {
    "type" : "multilinestring",
    "coordinates" : [
      [ [102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0] ],
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0] ],
      [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8] ]
    ]
  }
}
# 多线
POST my-index-000001/_doc
{
  "location" : "MULTILINESTRING ((102.0 2.0, 103.0 2.0, 103.0 3.0, 102.0 3.0), (100.0 0.0, 101.0 0.0, 101.0 1.0, 100.0 1.0), (100.2 0.2, 100.8 0.2, 100.8 0.8, 100.2 0.8))"
}
# 多面
POST my-index-000001/_doc
{
  "location" : {
    "type" : "multipolygon",
    "coordinates" : [
      [ [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]] ],
      [ [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
        [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]] ]
    ]
  }
}
# 多面
POST my-index-000001/_doc
{
  "location" : "MULTIPOLYGON (((102.0 2.0, 103.0 2.0, 103.0 3.0, 102.0 3.0, 102.0 2.0)), ((100.0 0.0, 101.0 0.0, 101.0 1.0, 100.0 1.0, 100.0 0.0), (100.2 0.2, 100.8 0.2, 100.8 0.8, 100.2 0.8, 100.2 0.2)))"
}

# 多种集合
POST my-index-000001/_doc
{
  "location" : {
    "type": "geometrycollection",
    "geometries": [
      {
        "type": "point",
        "coordinates": [100.0, 0.0]
      },
      {
        "type": "linestring",
        "coordinates": [ [101.0, 0.0], [102.0, 1.0] ]
      }
    ]
  }
}
# 多种集合
POST my-index-000001/_doc
{
  "location" : "GEOMETRYCOLLECTION (POINT (100.0 0.0), LINESTRING (101.0 0.0, 102.0 1.0))"
}
# 范围
POST my-index-000001/_doc
{
  "location" : {
    "type" : "envelope",
    "coordinates" : [ [100.0, 1.0], [101.0, 0.0] ]
  }
}
# 范围
POST my-index-000001/_doc
{
  "location" : "BBOX (100.0, 102.0, 2.0, 0.0)"
}
```

# 参考文献

1. [索引配置](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html)
2. [Mapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)
3. [属性类型](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html)
4. [创建模板组件](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-component-template.html)
5. [创建索引模板](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-put-template.html)
6. [文档操作](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs.html)
