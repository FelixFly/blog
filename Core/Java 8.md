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

# Lambda

# Stream

# Default Method

接口可以有默认实现，用`default`进行申明方法，接口中也可以使用静态方法。

1. 何时使用
   * 可选方法
   * 多层继承行为
2. 同一个方法签名多层使用规则
   * 优先类中方法
   * 再次子类接口方法
   * 最后使用申明的方法，一般是指父接口的默认方法

# Optional

为了解决null问题，引进了`Optional`，这个一定程度了上是参考了`Guava`的实现。

