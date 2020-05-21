---
title: Spring Bean生命周期
author: FelixFly
date: 2020-05-17
tags:
    - spring
categories: 
    - spring
archives: 2018bean
---

1.  Spring Bean生命周期涉及的主要类
2.  Spring Bean生命周期

<!-- more -->

# Spring Bean生命周期涉及的主要类

## `BeanPostProcessor` Bean后置处理器

* `postProcessBeforeInitialization` 初始化之前调用的方法
* `postProcessAfterInitialization` 初始化之后的方法

### `MergedBeanDefinitionPostProcessor` 合并Bean定义的后置处理器

* `postProcessMergedBeanDefinition` Bean合并定义信息

### `InstantiationAwareBeanPostProcessor` 初始化Bean后置处理器

* `postProcessBeforeInstantiation` 实例化之前的方法

* `postProcessProperties` 处理Bean的属性信息（`postProcessPropertyValues` 5.1 之前的方法）
* `postProcessAfterInstantiation` 实例化之后的方法

### `DestructionAwareBeanPostProcessor` 销毁Bean后置处理器

* `postProcessBeforeDestruction` 销毁之前的方法

> 内置的`BeanPostProcessor` Bean后置处理器
>
> * `ApplicationContextAwareProcessor` 处理Aware(`EnvironmentAware ` `EmbeddedValueResolverAware` `ResourceLoaderAware` `ApplicationEventPublisherAware` `MessageSourceAware` `ApplicationContextAware`)回调方法
> * `CommonAnnotationBeanPostProcessor` 公共注解(`@PostConstruct` `@PreDestroy` `@Resource`、`@WebServiceRef`以及`@EJB` )处理
> * `AutowiredAnnotationBeanPostProcessor` 注入注解(`@Autowired`、`@Value`、`@Inject` )处理
> * `ConfigurationClassPostProcessor` 配置类(@Configuration)处理

## `Aware`接口 

* `BeanNameAware` `BeanClassLoaderAware` `BeanFactoryAware` Aware方法的回调
* `EnvironmentAware` `EmbeddedValueResolverAware` `ResourceLoaderAware` `ApplicationEventPublisherAware` `MessageSourceAware` `ApplicationContextAware` Bean后置处理器的初始化之前的方法

## `InitializingBean` 初始化

* `afterPropertiesSet` 属性赋值之后的方法

## `SmartInitializingSingleton` 初始化单例的接口

* `afterSingletonsInstantiated` 单例实例化之后的方法

# Spring Bean生命周期

> 生命周期的代码：`org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#doCreateBean`
>
> 完成的代码：`org.springframework.beans.factory.config.ConfigurableListableBeanFactory#preInstantiateSingletons`

## 实例化

* InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation 实例话之前的调用方法
* 实例化（new方法）
* MergedBeanDefinitionPostProcessor#postProcessMergedBeanDefinition Bean合并定义信息
* InstantiationAwareBeanPostProcessor#postProcessAfterInstantiation

## 初始化

* InstantiationAwareBeanPostProcessor#postProcessProperties 属性赋值

* Aware方法的回调（`BeanNameAware` `BeanClassLoaderAware` `BeanFactoryAware` ）

* BeanPostProcessor#postProcessBeforeInitialization 初始化之前的调用方法

  > 有个顺序的问题
  >
  > * **ApplicationContextAware**#setApplicationContext 其他Aware方法的回调（通过BeanPostProcessor#postProcessBeforeInitialization进行调用）内置的，优先级第一
  > * BeanPostProcessor#postProcessBeforeInitialization 初始化之前的调用方法，第二调用，按照`PriorityOrdered`、`Ordered`、其他进行排序
  > * MergedBeanDefinitionPostProcessor#postProcessBeforeInitialization 最后调用，按照`PriorityOrdered`、`Ordered`、其他进行排序

* InitializingBean#afterPropertiesSet InitializingBean的属性后置

* 自定义的init-method

* BeanPostProcessor#postProcessAfterInitialization 初始化之后的方法

  > 顺序跟上面的一致

## 完成

* SmartInitializingSingleton#afterSingletonsInstantiated 单例实例化之后的方法

## 销毁

* `DestructionAwareBeanPostProcessor#postProcessBeforeDestruction` 销毁的后置处理
* DisposableBean#destroy
* 自定义的destroy-method

# Import 导入Bean

* Aware方法的回调 `BeanClassLoaderAware` `BeanFactoryAware` `EnvironmentAware` `ResourceLoaderAware`
* 调用对应的方法

