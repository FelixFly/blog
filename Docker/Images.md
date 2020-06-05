---
title: Docker 镜像
author: FelixFly
date: 2020-06-05
tags:
    - Docker
categories: 
    - 运维
archives: 2020
---

1. Dockerfiles

<!-- more -->

> 版本说明
>
> 1. Win 10 
> 2. Docker CE 19.03.8

# Dockerfiles

## 常用命令

* `ARG` 参数申明

  ```dockerfile
  ARG VERSION=latest
  ARG <name>[=<default value>]
  ```

* `FROM` 基础镜像

  ```dockerfile
  ARG  CODE_VERSION=latest
  FROM base:${CODE_VERSION}
  ```

* `LABEL`标签

  * `version` 版本
  * `description` 描述

  ```dockerfile
  # 多行
  LABEL multi.label1="value1" \
        multi.label2="value2" \
        other="value3"
  # 单行
  LABEL "com.example.vendor"="ACME Incorporated"
  LABEL com.example.label-with-value="foo"
  LABEL version="1.0"
  LABEL description="This text illustrates \
  ```

* `RUN` shell 格式（shell 相关命令）和执行(命令，参数)格式，创建镜像执行命令

  ```dockerfile
  # shell 格式
  RUN /bin/bash -c 'source $HOME/.bashrc; \
  echo $HOME'
  # 执行格式
  RUN ["/bin/bash", "-c", "echo hello"]
  ```

* `CMD` 执行格式、ENTRYPOINT参数和shell格式，创建镜像不执行命令，申明镜像内的命令

  ```dockerfile
  # shell 格式
  CMD echo "This is a test." | wc -
  # 执行格式
  CMD ["/usr/bin/wc","--help"]
  ```

* `EXPOSE` 暴露容器运行时的监听端口

  ```dockerfile
  EXPOSE 80/tcp
  ```

* `ENV` 环境参数

  ```dockerfile
  # 多行
  ENV myName="John Doe" myDog=Rex\ The\ Dog \
      myCat=fluffy
  # 单行    
  ENV myName John Doe
  ENV myDog Rex The Dog
  ENV myCat fluffy
  ```

* `ADD` 复制文件、文件夹、远程的文件到镜像的文件路径，若是压缩文件的话会进行解压

  ```dockerfile
  # --chown=<user>:<group> 只使用于linux容器
  ADD [--chown=<user>:<group>] <src>... <dest>
  ADD [--chown=<user>:<group>] ["<src>",... "<dest>"]
  ```

* `COPY` 复制新文件或者目录到镜像的文件路径，文件夹本身不进行复制，仅仅是内容

  ```dockerfile
  # --chown=<user>:<group> 只使用于linux容器
  COPY [--chown=<user>:<group>] <src>... <dest>
  COPY [--chown=<user>:<group>] ["<src>",... "<dest>"]
  ```

* `ENTRYPOINT` 配置容器运行时的配置

  ```dockerfile
  # 运行格式
  ENTRYPOINT ["executable", "param1", "param2"]
  # shell 格式
  ENTRYPOINT command param1 param2
  # demo
  FROM ubuntu
  ENTRYPOINT ["top", "-b"]
  CMD ["-c"]
  # 运行时参数进行替换
  docker run -it --rm --name test  top -H
  ```

* `VOLUME` 挂载文件目录

  ```dockerfile
  VOLUME /myvol
  ```

* `USER` 执行命令的用户

  ```dockerfile
  USER <user>[:<group>]
  USER <UID>[:<GID>]
  ```

* `WORKDIR` 执行命令的工作目录

  ```dockerfile
  WORKDIR /a
  WORKDIR b
  WORKDIR c
  # 执行命令路径 /a/b/c
  RUN pwd
  ```

* `ONBUILD`  最后添加触发执行

  ```dockerfile
  ONBUILD ADD . /app/src
  ONBUILD RUN /usr/local/bin/python-build --dir /app/src
  ```

## 自定义一个镜像



# 参考资料

* Dockerfile 引用：https://docs.docker.com/engine/reference/builder
* Dockerfiles 最佳实践：https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
* 官方镜像地址：https://github.com/docker-library
* images 私库：https://github.com/goharbor/harbor
* docker 监控：https://github.com/weaveworks/scope





