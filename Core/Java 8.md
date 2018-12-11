---
title: Java 8
author: FelixFly
date: 2018-12-09
tags:
    - Java 8
categories: 
    - 基础
archives: 2018
---

1. `Lambda`
2. `Stream`
3. `Default Method`
4. `Optional`
5. `CompletableFuture`
6. `Date And Time`

<!-- more -->

# `Lambda`

# `Stream`

# `Default Method`

接口可以有默认实现，用`default`进行申明方法，接口中也可以使用静态方法。

1. 何时使用
   * 可选方法
   * 多层继承行为
2. 同一个方法签名多层使用规则
   * 优先类中方法
   * 再次子类接口方法
   * 最后使用申明的方法，一般是指父接口的默认方法

# `Optional`

为了解决null问题，引进了`Optional`，这个一定程度了上是参考了`Guava`的实现。主要方法如下

| `empty`       | 返回一个空的`Optional`实例                                 |
| ------------- | ---------------------------------------------------------- |
| `filter`      | 不为空并且匹配，返回当前`Optional`,否则返回空的`Optional`  |
| `flatMap`     | 不为空，转换为方法转换的`Optional`,否则返回空的`Optional`  |
| `get`         | 不为空返回值，否则抛出`NoSuchElementException`             |
| `ifPresent`   | 不为空执行值消费，否则不处理                               |
| `isPresent`   | 不为空返回`true`，否则`false`                              |
| `map`         | 不为空应用提供的方法                                       |
| `of`          | 值为空抛出`NullPointerException`，否则返回`Optional`的实例 |
| `ofNullable`  | 返回`Optional`的实例，值为空时返回空的`Optional`           |
| `orElse`      | 不为空返回值，否则返回参数默认值                           |
| `orElseGet`   | 不为空返回值，否则返回参数方法创建值                       |
| `orElseThrow` | 不为空返回值，否则抛出方法创建的异常                       |

# `CompletableFuture`

# `Date And Time`