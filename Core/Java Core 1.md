---
title: Java Core 基础
author: FelixFly
date: 2019-01-21
tags:
    - Java Core
categories: 
    - 基础
archives: 2019
---

1. 类型
2. 操作符
3. 控制流程
4. 关键字

<!-- more -->

# 类型

## 原生(基础)类型

* byte 1字节 -128 ~ 127  2<sup>-8</sup> ~ 2<sup>8</sup>-1
* short 2字节 2<sup>-16</sup> ~ 2<sup>16</sup>-1
* int  4字节 2<sup>-32</sup> ~ 2<sup>32</sup>-1
* long  8字节 2<sup>-64</sup> ~ 2<sup>64</sup>-1
* char 2字节 
* float 4字节
* double 8字节
* boolean  true和false

原生类型之间的转换

1. byte——>short——>int ——>long
2. float ——>double
3. char ——>int ——>double
4. int ——float  long——float long——double 会有精度丢失

> * 两个操作数有个是double类型，另一个也会转换为double类型
> * 否则，两个操作数有个是float类型，另一个也会转换为float类型
> * 否则，两个操作数有个是long类型，另一个也会转换为long类型
> * 否则，都会转换为int类型
>
> 说明：结合运算符(+=，-=，*=，/=以及%=)，运算的值类型与左侧操作数的类型不同，会发生强制转换，是合法的。

原生类型对应的封装类型

* Byte
* Short
* Integer
* Long

* Float
* Double

> 上面四个都是Number的子类型

* Character
* Boolean

### Integer



## 对象类型

### Object 

所有类(除原生类型外)的超类

Object 工具类Objects

### `String`

# 操作符

## 一元操作符

* !
* ++
* --

## 二元操作符

## 三元操作符

# 控制流程

## 循环

* for
* while
* do while
* `foreach`

## 循环退出

* continue
* break

## 判断

* if
  * else if
  * else
* switch
  * case

# 关键字

## final

## static

## this

## super





