---
title: Linux
author: FelixFly
date: 2019-04-01
tags:
    - Linux
categories: 
    - 操作系统
archives: 2019
---

# Linux

> 本文以`Centos7`系统为例

## 开启网络

```she
cd /etc/sysconfig/network-scripts
// 修改对应的ifcfg-ensXX ONBOOT = yes
// 重启network
service network restart
```

