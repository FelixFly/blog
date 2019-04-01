---
title: Docker
author: FelixFly
date: 2019-04-01
tags:
    - Docker
categories: 
    - 运维
archives: 2019
---

# Docker

> 版本说明
>
> 1. Centos 7
> 2. Docker CE 18.09.4

## 学习网址

[官方网站](https://www.docker.com)

[Docker仓库](https://hub.docker.com/)

## 下载安装

> [官方地址](https://docs.docker.com/install/linux/docker-ce/centos/)

```shell
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install docker-ce docker-ce-cli containerd.io
systemctl start docker
```

## 常用命令

### 查看信息

* docker --version 版本
* docker info 完整信息

