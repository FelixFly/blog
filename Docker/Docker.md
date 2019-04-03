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
3. Dockerfile

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
  * `-a` 显示所有
  * `-q` 只显示镜像ID
  * `--digests` 显示摘要信息
  * `--no-trunc` 显示完整的镜像ID
* `docker pull [image_name]` 下载镜像
* `docker run [image_id]`  运行镜像
  * `-d` 后台运行
  * `-p ` 指定映射端口(宿主机端口：容器端口)
  * `--name` 容器名称
  * `-i`  交互方式运行
  * `-t` 启动一个伪终端
  * `-P`  随机映射端口
* `docker search [image_name]` 搜索镜像
* `docker rmi [image_id]`  删除镜像
  * `-f` 强制删除
  * `[image_id]:[image_tag][image_id]:[image_tag]` 删除多个
  * `${docker images -q}` 删除所有

### 容器命令

* `docker ps` 查看所有容器 `docker container ls`
  * `-a` 列出所有的容器(包含历史运行过的）
  * `-l` 显示最近创建的容器
  * `-n` 显示最后N个创建的容器
  * `-q` 只显示容器ID
  * `-s` 显示文件大小
* `docker stop [container_id/contrainer_name]` 停止容器
* `docker kill [container_id/contrainer_name]` 强制停止容器
* `docker attach [container_id]` 进入容器(不产生新的进程）
* `docker exec -it [container_id] [bashshell]` 进入容器(产生新的进程),[bashshell]为`/bin/bash`
* `exit` 退出并停止容器
* `ctrl+p+q` 退出容器，并不停止容器

* `docker restart [container_id/contrainer_name]` 重启容器

* `docker rm [container_id]` 删除容器

  * `-f` 强制删除

  * `${docker ps -a -q}` 删除所有容器

    > `docker ps -a -q|xargs docker rm`

* `docker logs` 查看日志

  * `--details` 显示所有日志详细
  * `-f`

    * `--follow` 跟随日志输出
    * `--tail` 显示文件的最后N行
  * `-t` 显示时间

  > docker logs -f --tail -t [container_id]

* `docker top [container_id]` 容器内的进程
* `docker inspect [container_id]` 容器的信息信息
* `docker cp [container_id]:[container_path] [desc_path]` 拷贝容器文件到宿主机地址

## Dockerfile

> 用来构建docker镜像的文件



