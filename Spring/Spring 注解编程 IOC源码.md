---
title: Spring 注解编程IOC源码
author: FelixFly
date: 2018-10-18
tags:
    - spring
categories: 
    - spring
archives: 2018bean
---

1.  Spring 注解编程`IOC`涉及的主要类
2.  Spring 注解编程`IOC`源码分析

<!-- more -->

# Spring 注解编程`IOC`涉及的主要类

## `AnnotationConfigApplicationContext`

> `org.springframework.context.annotation.AnnotationConfigApplicationContext`

注解的启动容器入口

## `AbstractApplicationContext`

> `org.springframework.context.support.AbstractApplicationContext`

容器的执行方法抽象类

## `AnnotatedBeanDefinitionReader`

> `org.springframework.context.annotation.AnnotatedBeanDefinitionReader`

注解`Bean`定义的读取器

## `ClassPathBeanDefinitionScanner`

> `org.springframework.context.annotation.ClassPathBeanDefinitionScanner`

类路径的`Bean`定义扫描

## `DefaultListableBeanFactory`

> `org.springframework.beans.factory.support.DefaultListableBeanFactory`

`BeanFactory`的工厂

## `PostProcessorRegistrationDelegate`

> org.springframework.context.support.PostProcessorRegistrationDelegate

后置处理的委派类

## `AnnotationConfigUtils`

> `org.springframework.context.annotation.AnnotationConfigUtils`

注解配置的工具类

# Spring 注解编程`IOC`源码分析

## 构造器 

### 创建`BeanFactory`--`DefaultListableBeanFactory`

### 创建`reader`--`AnnotatedBeanDefinitionReader`

#### `AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry)`

注册注解配置的后置处理器

1. 赋值`DependencyComparator` -- `AnnotationAwareOrderComparator`
2. 赋值`AutowireCandidateResolver` -- `ContextAnnotationAutowireCandidateResolver`
3. 注册`org.springframework.context.annotation.internalConfigurationAnnotationProcessor` -- `ConfigurationClassPostProcessor`
4. 注册`org.springframework.context.annotation.internalAutowiredAnnotationProcessor` -- `AutowiredAnnotationBeanPostProcessor`
5. 注册`org.springframework.context.annotation.internalCommonAnnotationProcessor` -- `CommonAnnotationBeanPostProcessor`
6. 注册`org.springframework.orm.jpa.support.PersistenceAnnotationBeanPostProcessor` -- `PersistenceAnnotationBeanPostProcessor`
7. 注册`org.springframework.context.event.internalEventListenerProcessor` -- `EventListenerMethodProcessor`
8. 注册`org.springframework.context.event.internalEventListenerFactory` -- `DefaultEventListenerFactory`

### 创建`scanner` --`ClassPathBeanDefinitionScanner`

## `register(annotatedClasses)`

注册方法的配置类

### `doRegisterBean()`

注册实际干活的方法

## `scan(basePackages)`

扫描包路径

## `refresh()`

据我们所知`IOC`容器的主要方法是通过refresh方法进行刷新启动，容器刷新创建

### `prepareRefresh()`

准备容器的刷新工作

1. 设置标志位`closed`、`active`

   ```java
   this.closed.set(false);
   this.active.set(true);
   ```

2. `initPropertySources()` 

   初始化属性配置文件，未进行实现，需要子类自行实现

3. `getEnvironment().validateRequiredProperties()` 

### `obtainFreshBeanFactory()`

告诉子类刷新内部的`BeanFactory`

1. `refreshBeanFactory()` 

   通过AtomicBoolean.compareAndSet(false, true)来控制一个`BeanFactory`,并设置一个序列化的ID值，若是需要的话，可以通过这个序列化ID来发序列化为`BeanFactory`

2. 返回构造器初始化的`BeanFactory`

### `prepareBeanFactory(beanFactory)`

上下文中准备使用的`BeanFactory`

1. 赋值`BeanClassLoader`

2. 赋值`BeanExpressionResolver` -- `StandardBeanExpressionResolver`

3. 添加`PropertyEditorRegistrar` -- `ResourceEditorRegistrar`

4. 添加`BeanPostProcessor` -- `ApplicationContextAwareProcessor`,实现`Aware`接口方法的赋值

   > `EnvironmentAware`、`EmbeddedValueResolverAware`、`ResourceLoaderAware`、`ApplicationEventPublisherAware`、`MessageSourceAware`、`ApplicationContextAware`

5. 去掉上面的依赖接口，避免重复调用

6. 注册依赖类`BeanFactory`、`ResourceLoader`、`ApplicationEventPublisher`、`ApplicationContext`

7. 添加`BeanPostProcessor` -- `ApplicationListenerDetector` 处理`ApplicationListener`事件监听

8. 如果包含`loadTimeWeaver`这个`Bean`，添加对应的`BeanPostProcessor` -- `LoadTimeWeaverAwareProcessor`以及赋值`TempClassLoader` -- `ContextTypeMatchClassLoader`

9. 注册环境信息的`Bean`

> `environment` -- `StandardEnvironment`
>
> `systemProperties` -- `getEnvironment().getSystemProperties()`
>
> `systemEnvironment` -- `getEnvironment().getSystemEnvironment()`

### `postProcessBeanFactory(beanFactory)`

子类在上下文中后置处理`BeanFactory`

### `invokeBeanFactoryPostProcessors(beanFactory)`

调用`BeanFactoryPostProcesser`

#### `PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors());`

后置处理器的委派处理类

1. `BeanDefinitionRegistry`的处理
   * 处理上面添加的`BeanFactoryPostProcessor`的`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry(registry)`
   * 获取`BeanFatory`中所有的`BeanDefinitionRegistryPostProcessor`
   * 实现`PriorityOrdered`的接口的`BeanDefinitionRegistryPostProcessor`排序并执行`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry(registry）`
   * 实现`Ordered`的接口的`BeanDefinitionRegistryPostProcessor`排序并执行`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry(registry）`
   * 剩下的`BeanDefinitionRegistryPostProcessor`排序并执行`BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry(registry）`
   * 执行所有的`BeanDefinitionRegistryPostProcessor#postProcessBeanFactory(beanFactory)`
   * 执行除`BeanDefinitionRegistryPostProcessor`的`BeanDefinitionRegistry#postProcessBeanFactory(beanFactory)`
2. 直接执行除`BeanDefinitionRegistryPostProcessor`的`BeanDefinitionRegistry#postProcessBeanFactory(beanFactory)`，与上述1互斥
3. `BeanFactoryPostProcessor`的处理
   * 实现`PriorityOrdered`的`BeanFactoryPostProcessor`排序并执行`BeanFactoryPostProcessor.postProcessBeanFactory(beanFactory)`
   * 实现`Ordered`的`BeanFactoryPostProcessor`排序并执行`BeanFactoryPostProcessor.postProcessBeanFactory(beanFactory)`
   * 剩下的`BeanFactoryPostProcessor`执行`BeanFactoryPostProcessor.postProcessBeanFactory(beanFactory)`
   * 清除后置处理器可能改变的原元数据信息

> 重置了添加对应的`BeanPostProcessor` -- `LoadTimeWeaverAwareProcessor`以及赋值`TempClassLoader` -- `ContextTypeMatchClassLoader`

### `registerBeanPostProcessors(beanFactory)`

注册拦截`Bean`创建的`BeanPostProcessor`

#### `PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this);`

1. 添加`BeanPostProcessor` -- `BeanPostProcessorChecker`
2. 实现`PriorityOrdered`的除掉`MergedBeanDefinitionPostProcessor`的`BeanPostProcessor`排序并进行注册
3. 实现`Ordered`的除掉`MergedBeanDefinitionPostProcessor`的`BeanPostProcessor`排序并进行注册
4. 剩下的除掉`MergedBeanDefinitionPostProcessor`的`BeanPostProcessor`进行注册
5. `MergedBeanDefinitionPostProcessor`排序并注册
6. 添加了一个`BeanPostProcessor` -- `ApplicationListenerDetector`

### `initMessageSource()`

初始化`MessageSource`

1. 判断可有`messageSource`的`Bean`
   * 有，判断当前`messageSource`是否是`HierarchicalMessageSource`,是的话赋值ParentMessageSource
   * 没有，注册`messageSource` -- `DelegatingMessageSource`,并赋值ParentMessageSource

### `initApplicationEventMulticaster()`

初始化`ApplicationEvent`派发器，注册`applicationEventMulticaster` -- `SimpleApplicationEventMulticaster`

### `onRefresh()`

模板方法来添加上下文刷新工作，子类进行实现

### `registerListeners()`

注册监听器

1. `ApplicationEvent`派发器添加事件
2. `ApplicationEvent`派发器添加事件`Bean`
3. 派发早期处理事件

### `finishBeanFactoryInitialization(beanFactory)`

完成`BeanFactory`的实例化

1. 初始化`ConversionService`
2. 注册`EmbeddedValueResolver`
3. 初始化`LoadTimeWeaverAware`接口的`Bean`
4. 完成非惰性加载的单实例`Bean`初始化
   * 触发非惰性加载的单实例`Bean`初始化`getBean()`
   * 若是`SmartInitializingSingleton`触发回调`smartSingleton.afterSingletonsInstantiated()`

#### getBean(beanName) -- doGetBean()

获取`Bean`的实例

1. 从`FactoryBean`中获取`Bean`

2. 判断`parentBeanFactory`以及`parentBeanFactory`包含当前`Bean`，从`parentBeanFactory`进行获取

3. 循环获取DependsOn的`Bean`

4. 创建`Bean` -- `createBean(beanName, mbd, args)`

   * 准备方法的覆盖重写 -- `prepareMethodOverrides()`

   * 尝试让`BeanPostProcessor`返回一个代理`Bean`-- `resolveBeforeInstantiation(beanName, mbdToUse)`

   * 真正创建`Bean`实例 -- `doCreateBean(beanName, mbdToUse, args)`,`Bean`的整个生命周期

     * `createBeanInstance(beanName, mbd, args)` 实例化

     * `applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName)`

       `MergedBeanDefinitionPostProcessor.postProcessMergedBeanDefinition(mbd, beanType, beanName)`方法处理

     * `populateBean(beanName, mbd, instanceWrapper)` 属性赋值，包含自动注入

     * `initializeBean(beanName, exposedObject, mbd)` 初始化`Bean`

       * `invokeAwareMethods(beanName, bean)` 调用aware接口方法

       * `applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName)`

         `BeanPostProcessor.postProcessBeforeInitialization()`前置方法

       * `invokeInitMethods(beanName, wrappedBean, mbd)`

         * 先调用`InitializingBean.afterPropertiesSet()`
         *  反射调用init-method的方法

       * `applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName)`

         `BeanPostProcessor.postProcessAfterInitialization` 后置方法

     * `registerDisposableBeanIfNecessary(beanName, bean, mbd)` 注册`Bean`的销毁方法

       > `org.springframework.beans.factory.support.DisposableBeanAdapter`

### `finishRefresh()`

### `destroyBeans()`

### `cancelRefresh(ex)`

### `resetCommonCaches()`

