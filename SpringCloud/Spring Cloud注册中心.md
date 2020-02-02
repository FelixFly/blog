---
title: Spring Cloud注册中心与发现
author: FelixFly
date: 2020-01-29
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. 核心api
2. 基于Euraka的注册中心

<!-- more -->

# Spring Cloud注册中心与发现

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE

## 核心api

* `org.springframework.cloud.client.serviceregistry.ServiceRegistry`  服务注册
  * `org.springframework.cloud.client.serviceregistry.Registration` 注册信息
    * `org.springframework.cloud.client.ServiceInstance` 服务实例信息
* `org.springframework.cloud.client.discovery.DiscoveryClient` 服务发现
  * `org.springframework.cloud.client.ServiceInstance` 服务实例信息

## 基于Euraka的注册中心以及服务发现

## 服务端