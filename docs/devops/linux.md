---
title: "Linux"
sidebar_position: 4
tags:
  - Linux
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

