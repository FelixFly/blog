---
title: XXL-JOB初探
author: FelixFly
date: 2020-04-22
tags:
    - XXL-JOB
categories: 
    - 定时任务
archives: 2020
---

1. 安装`xxl-job`
2. 调用定时任务

<!-- more -->

# 安装`xxl-job`

> 采用`docker`方法的进行安装，需要依赖`mysql`数据
>
> 版本信息：
>
> * `mysql`  5.7.27
> * `xxl-job` 2.2.0

## 安装`mysql`

1. 下载镜像

   ```shell
   docker pull mysql:5.7.27
   ```

2. 创建启动`docker` 容器，需要指定`ip`，不然`xxl-job`无法连接

   ```shell
   # 创建lan名称的网络，不然无法指定ip
   docker network create --driver nat --subnet=172.29.212.0/23 lan
   docker run --name mysql -e MYSQL_ROOT_PASSWORD=password@227 --net lan -d mysql:5.7.27 
   ```

## 安装`xxl-job`

1. 下载镜像

   ```shell
   docker pull xuxueli/xxl-job-admin:2.2.0
   ```

2. 创建启动`docker`容器

   ```shell
   docker run --net lan -e PARAMS="--spring.datasource.url=jdbc:mysql://mysql:3306/xxl_job?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai  --spring.datasource.username=root  --spring.datasource.password=password@227" -p 8080:8080 --name xxl-job-admin  -d xuxueli/xxl-job-admin:2.2.0
   ```
   
3. 访问地址：http://127.0.0.1:8080/xxl-job-admin/，用户名/密码：admin/123456

# 调用定时任务

1. 创建`Spring Boot`项目，直接创建

2. 在启动类中添加`XxlJobSpringExecutor`

   ```java
   @Bean
   public XxlJobSpringExecutor xxlJobExecutor() {
       log.info(">>>>>>>>>>> xxl-job config init.");
       XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();
       // xxl-job的地址
       xxlJobSpringExecutor.setAdminAddresses("http://127.0.0.1:8080/xxl-job-admin");
       // xxl-job的应用名称
       xxlJobSpringExecutor.setAppname("xxl-job-executor-sample");
       // xxl-job的端口
       xxlJobSpringExecutor.setPort(9999);
       return xxlJobSpringExecutor;
   }
   ```

3. 在启动类中添加任务的执行方法

   ```java
   @XxlJob("demoJobHandler")
   public ReturnT<String> execute(String param){
       log.info("调用成功");
       XxlJobLogger.log("调用成功");
       return ReturnT.SUCCESS;
   }
   ```

   

