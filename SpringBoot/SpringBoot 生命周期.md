---
title: Spring Boot 生命周期
author: FelixFly
date: 2020-05-13
tags:
    - spring boot
categories: 
    - spring boot
archives: 2020
---

1. Spring Boot 事件
2. Spring Boot 扩展

<!--more -->

> 版本说明：`Spring Boot 2.1.4.RELEASE`

# Spring Boot 事件

## `ApplicationEvent` 应用事件抽象

`org.springframework.boot.context.event.SpringApplicationEvent` Spring应用事件

* `ApplicationStartingEvent` 应用上下文启动事件

   > 可以调整`SpringApplication`以及参数`args`

* `ApplicationEnvironmentPreparedEvent` Environment准备事件

   > 可以调整`org.springframework.core.env.ConfigurableEnvironment`

* `ApplicationContextInitializedEvent` 应用上下文初始化事件

   > 可以调整`org.springframework.context.ConfigurableApplicationContext`

* `ApplicationPreparedEvent` 应用准备事件

   > 最后可以调整`org.springframework.context.ConfigurableApplicationContext`

* `ContextRefreshedEvent` 上下文刷新事件
  
   > 参数：`org.springframework.context.ApplicationContext`
   
* `ServletWebServerInitializedEvent` `Web Servlet`初始化事件

   > 参数：`Servlet`应用上下文`org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext` 以及web服务`org.springframework.boot.web.server.WebServer`

* `ApplicationStartedEvent` 应用启动完成事件

   > 参数：`SpringApplication`、参数`args`以及`org.springframework.context.ConfigurableApplicationContext`

* `ApplicationReadyEvent` 应用预备事件

   > 参数：`org.springframework.context.ConfigurableApplicationContext`

* `ContextClosedEvent` 上下文关闭事件

   > 参数：`org.springframework.context.ApplicationContext`

## `SpringApplicationRunListener` Spring 应用事件监听

> 默认实现：`org.springframework.boot.context.event.EventPublishingRunListener`

* `org.springframework.context.event.ApplicationListener` 事件监听

* `org.springframework.context.event.SmartApplicationListener` 好用的事件监听

  > 实现方式：实现`ApplicationListener`或者`SmartApplicationListener`，在`META-INF\spring.factories`文件中`org.springframework.context.ApplicationListener`配置

## `Lifecycle` 生命周期，一般用于组件开启

* `org.springframework.context.SmartLifecycle` 好用的生命周期

> 只要申明为Bean就可以调用，在`ContextRefreshedEvent`事件之前调用，
>
> `org.springframework.context.support.AbstractApplicationContext#finishRefresh`方法调用
>
> `org.springframework.context.LifecycleProcessor#onRefresh`进行调用

# Spring Boot 扩展

## `ApplicationContextInitializer`应用上下文初始化器

> 在`ApplicationEnvironmentPreparedEvent`之后，`ApplicationContextInitializedEvent`之前
>
> 实现方式：实现`ApplicationContextInitializer`，在`META-INF\spring.factories`文件中`org.springframework.context.ApplicationContextInitializer`配置

