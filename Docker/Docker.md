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

1. 下载安装
2. 常用命令

<!-- more -->

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

> [阿里云加速地址](<https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors>)

## 常用命令

### 查看信息

* `docker --version` 版本 
* `docker version` 完整的版本信息
* `docker info` 完整信息

### 镜像命令

* `docker images` 显示所有镜像
* `docker pull [image_name]` 下载镜像
* `docker run [image_id]`  运行镜像
  * `-d` 后台运行
  * `-p 主机端口：容器端口` 映射端口
  * `--name 容器别名` 容器名称
* `docker search [image_name]` 搜索镜像
* `docker rmi [image_id]`  删除镜像
  * `-f` 强制删除

### 容器命令

* `docker ps` 查看所有容器 `docker container ls`
* `docker stop [container_id]` 停止容器