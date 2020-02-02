---
title: Spring IOC源码解析
author: FelixFly
date: 2019-11-08
tags:
    - spring
categories: 
    - spring
archives: 2019
---

1. 工厂的抽象
2. 初始化过程的抽象
3. 资源的抽象
4. 调用流程

<!-- more -->

# 工厂的抽象

## `BeanDefinition`

> `AttributeAccessor`和`BeanMetadataElement`

### `AnnotatedBeanDefinition`



## `BeanFactory`

基础的实现类`DefaultListableBeanFactory`

### `AutowireCapableBeanFactory`

### `ListableBeanFactory`

### `HierarchicalBeanFactory`

#### `ConfigurableBeanFactory`

##### ``ConfigurableListableBeanFactory``



## `ApplicationContext`

基础实现类

* `ClassPathXmlApplicationContext`
* `FileSystemXmlApplicationContext`
* `AnnotationConfigApplicationContext`

### `WebApplicationContext`

### `ConfigurableApplicationContext`

#### `ConfigurableWebApplicationContext`

# 初始化过程的抽象

## `Lifecycle`

### `LifecycleProcessor`

### `SmartLifecycle`

#### `MessageListenerContainer`



## `BeanFactoryPostProcessor`

### `BeanDefinitionRegistryPostProcessor`



## `BeanPostProcessor`

### `InstantiationAwareBeanPostProcessor`

#### `SmartInstantiationAwareBeanPostProcessor`

### `DestructionAwareBeanPostProcessor`

### `MergedBeanDefinitionPostProcessor`



## `ApplicationEvent`

### `ApplicationContextEvent`

#### `ContextRefreshedEvent`

#### `ContextStartedEvent`

#### `ContextStoppedEvent`

#### `ContextClosedEvent`



## `ApplicationListener`

### `GenericApplicationListener`



# 资源的抽象

## `InputStreamSource`

### `Resource`

#### `WritableResource`

#### `ContextResource`

#### `HttpResource`



## `PropertySource`

## `PropertySources`



## `PropertyResolver`

### `Environment`

基础实现类：`StandardEnvironment`

#### `ConfigurableEnvironment`

##### `ConfigurableWebEnvironment`





# 调用流程

1. 创建`Environment`（`StandardEnvironment`）
2. 创建`BeanFactory`（`DefaultListableBeanFactory`）
3. 注册`BeanPostProcessor`以及注册环境的Bean
4. 执行基础的`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry`
5. 排序自定义`BeanDefinitionRegistryPostProcessor`，`PriorityOrdered`这个优先级先排
6. 执行的`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry`
7. 排序自定义`BeanDefinitionRegistryPostProcessor`，`Ordered`这个优先级
8. 执行的`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry`
9. 排序其他自定义`BeanDefinitionRegistryPostProcessor`
10. 执行的`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry`
11. 执行自定义的`BeanDefinitionRegistryPostProcessor#postProcessBeanFactory`
12. 执行基础的`BeanDefinitionRegistryPostProcessor#postProcessBeanFactory`
13. 根据`PriorityOrdered`、`Ordered`排序以及其他执行`BeanFactoryPostProcessor#postProcessBeanFactory`
14. 根据`PriorityOrdered`、`Ordered`排序以及其他注册`BeanPostProcessor`
15. 根据`PriorityOrdered`、`Ordered`排序以及其他注册`MergedBeanDefinitionPostProcessor`
16. 





