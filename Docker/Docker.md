---
title: Docker初探
author: FelixFly
date: 2019-04-01
tags:
    - Docker
categories: 
    - 运维
archives: 2019
---

1. Docker 理念
2. 下载安装
3. 常用命令

<!-- more -->

> 版本说明
>
> 1. Win 10 
> 2. Docker CE 19.03.8

# 学习网址

[官方网站](https://www.docker.com)

[Docker仓库](https://hub.docker.com/)

# Docker 理念



![architecture](architecture-5032210.svg)



* Images 镜像，模板文件，相当于Java中的Class文件
* Containers 容器，运行镜像的容器，相当于Java中对象



![Container@2x](Container@2x-5032141.png)

Docker Engine运行在操作系统之上，应用层有基础层，用层的概念递增上去的。

# 下载安装(Linux)

> [官方地址](https://docs.docker.com/install/linux/docker-ce/centos/)

```shell
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install docker-ce docker-ce-cli containerd.io
systemctl start docker

```

```shell
# 使用阿里云加速器
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://xxxx.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```



# 常用命令

## 查看信息

* `docker --version` 版本 
* `docker version` 完整的版本信息
* `docker info` 完整信息

## 镜像命令

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
  * `-P` 随机映射端口
  * `-e` 设置环境变量
  * `--link` 链接不同的容器
  * `-v`  挂载磁盘卷(宿主目录：容器目录)
* `docker search [image_name]` 搜索镜像
* `docker rmi [image_id]`  删除镜像
  * `-f` 强制删除
  * `[image_id]:[image_tag][image_id]:[image_tag]` 删除多个
  * `$(docker images -q)` 删除所有

## 容器命令

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

  * `$(docker ps -a -q)` 删除所有容器

    > `docker ps -a -q|xargs docker rm`

* `docker logs` 查看日志

  * `--details` 显示所有日志详细
  * `-f`

    * `--follow` 跟随日志输出
    * `--tail` 显示文件的最后N行
  * `-t` 显示时间

  > docker logs -f --tail -t [container_id]

* `docker top [container_id]` 停止容器
* `docker inspect [container_id]` 容器的信息信息
* `docker cp [container_id]:[container_path] [desc_path]` 拷贝容器文件到宿主机地址

## 网络命令

* `docker network` 网络
  * `ls` 网络列表
  * `create` 创建网络
    * `-subnet=`  设置网络IP区段
    * `--driver` 设置网络驱动 , 简写 `-d`（通过ls查看默认支持哪些驱动）

> 启动应用配置网络 --net  [network_name] --ip xxx.xxx.xxx.xx



# 参考资料

* 官网安装教程：https://docs.docker.com/docker-for-windows/install/
* Docker 简介：https://docs.docker.com/get-started/overview/
* Docker与VM： https://docs.docker.com/get-started/
* Docker 命令：https://docs.docker.com/engine/reference/commandline/docker/
* 阿里云加速地址: https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors





