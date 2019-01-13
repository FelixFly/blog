---
title: Spring 注解编程AOP
author: FelixFly
date: 2019-01-09
tags:
    - spring
categories: 
    - spring
archives: 2019
---

1.   `AOP`的常用注解
2.   `AOP`的源码分析
3.  事务的注解与源码分析

<!-- more -->

# `AOP`的常用注解

> Aspect-Oriented Programming 面向切面编程，主要包含切面`Aspect`，切入点`Pointcut`以及通知(切入时机)`Advice`,通知包含方法执行之前`Before`、方法执行之后`After`、方法环绕`Around`，通知方法参数有`JoinPoint`,`Around`方法参数有`ProceedingJoinPoint`
>
> * `JoinPoint`只能放在方法的第一个参数，主要方法如下
>   * `getArgs()` 返回方法的参数
>   * `getThis()` 返回代理对象
>   * `getTarget()` 返回目标对象
>   * `getSignature()` 返回通知方法的签名
>   * `toString()` 返回通知方法有用描述
> * `ProceedingJoinPoint`只能放在方法的第一个参数，主要方法如下
>   * `proceed(Object[] args)` 执行目标方法

## `@EnableAspectJAutoProxy`

启用切面，相当于`xml`中`aop:aspectj-autoproxy`

```xml
<aop:aspectj-autoproxy />
```

* `proxyTargetClass` 对应`xml`中属性`proxy-target-class`，是否启用`CGLIB`
* `exposeProxy` 对应`xml`中属性`expose-proxy` ，是否暴露代理，设置为true的时候，可以通过`AopContext.currentProxy()` 获取代理实例（通过`ThreadLocal`进行实现的）

## `@Aspect`

切面，横切多个类的关系的模块化

```java
@Aspect
@Component
public class LogAspect {
}
```

相当于`xml`中

```xml
<aop:config>
    <aop:aspect id="logAspect" ref="logAspectBean">
</aop:config>
    
<bean id="logAspectBean" class="top.felixfly.aop.apesct.LogAspect"></bean>
```

## `@Pointcut`

切点，执行方法的切点

```java
@Pointcut("execution(* top.felixfly.aop.service.*Service.*(..))")
public void servicePoint() {
}
```

相当于`xml`中

```xml
<aop:config>
     <aop:pointcut id="servicePoint"
            expression="execution(* top.felixfly.aop.service.*Service.*(..))"/>
</aop:config>
```

### 切入点表达式

* `execution` 切入表达式，这个Spring中最常用的

  `execution(modifiers-pattern? ret-type-pattern declaring-type-pattern?name-pattern(param-pattern) throws-pattern?)`

  * `execution(public * *(..))` 所有包下的public方法
  * `execution(* set*(..))` 所有已`set`开头的方法`*
  * `execution(* com.xyz.service.AccountService.*(..))AccountService`下的所有方法
  * `execution(* com.xyz.service.*.*(..))` `service`包下的所有类的方法
  * `execution(* com.xyz.service..*.*(..))` `service`包以及子包的所有类的方法

* `within` 
  * `within(com.xyz.service.*)` service包下的所有类的方法
  * `within(com.xyz.service.*)` service包以及子包所有类的方法

* `this` 指定代理实现的接口
  * `this(com.xyz.service.AccountService)` 指定`AccountService`接口下的所有方法

* `target` 执行目标对象实现的接口
  * `target(com.xyz.service.AccountService)` 指定`AccountService`接口下的所有方法

* `args` 执行目标方法的参数
  * `args(java.io.Serializable)` 有`Serializable`参数的所有方法

* `@target`
  * `@target(org.springframework.transaction.annotation.Transactional)` 目标对象有`@Transactional`注解的类所有方法

* `@within`
  * `@within(org.springframework.transaction.annotation.Transactional)` 目标对象有`@Transactional`注解申明的类所有方法

* `@annotation`
  * `@annotation(org.springframework.transaction.annotation.Transactional)` 有`@Transactional`注解的所有方法

* `@args`
  * `@args(com.xyz.security.Classified)` 有`@Classified`注解的单参数方法

* `bean`
  * b`ean(*ServiceImpl)` 所有以`ServiceImpl`结尾Bean的所有方法

## `@Before`

在切点的方法之前执行方法

```java
@Before("servicePoint()")
public void before(JoinPoint joinPoint) {
    System.out.println("before。。。。。");
}
```

相当于`xml`中

```xml
<aop:config>
    <aop:aspect id="logAspect" ref="logAspect">
      <aop:pointcut id="servicePoint"
            expression="execution(* top.felixfly.aop.service.*Service.*(..))"/>
        <aop:before pointcut-ref="servicePoint" method="before"/>
    </aop:aspect>
</aop:config>
```

## `@AfterReturning`

在切点的方法执行返回执行

```java
@AfterReturning(value="servicePoint()",returing="object")
public void afterReturning(JoinPoint joinPoint,Object object) {
    System.out.println("afterReturning。。。。。");
}
```

相当于`xml`中

```xml
<aop:config>
    <aop:aspect id="logAspect" ref="logAspect">
      <aop:pointcut id="servicePoint"
            expression="execution(* top.felixfly.aop.service.*Service.*(..))"/>
        <aop:after-returning pointcut-ref="servicePoint" method="afterReturning" returning="object" />
    </aop:aspect>
</aop:config>
```

## `@AfterThrowing`

在切点的方法执行抛出异常执行

```java
@AfterThrowing(value = "servicePoint()", throwing = "ex")
public void afterThrowing(JoinPoint joinPoint, Exception ex) {
    System.out.println("afterThrowing。。。。。" + ex);
}
```

相对于`xml`中

```xml
<aop:config>
    <aop:aspect id="logAspect" ref="logAspect">
      <aop:pointcut id="servicePoint"
            expression="execution(* top.felixfly.aop.service.*Service.*(..))"/>
        <aop:after-throwing pointcut-ref="servicePoint" method="afterThrowing" throwing="ex" />
    </aop:aspect>
</aop:config>
```

## `@After`

在切点方法执行之后执行，也就是在`@AfterReturning`或者`@AfterThrowing`之前执行

```java
@After("servicePoint()")
public void after(JoinPoint joinPoint) {
    System.out.println("after。。。。。");
}
```

相当于`xml`中

```xml
<aop:config>
    <aop:aspect id="logAspect" ref="logAspect">
      <aop:pointcut id="servicePoint"
            expression="execution(* top.felixfly.aop.service.*Service.*(..))"/>
        <aop:after pointcut-ref="servicePoint" method="after" />
    </aop:aspect>
</aop:config>
```

## `@Around`

在切点方法执行前后执行

```java
@Around(value = "servicePoint()")
public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
    // 执行目标方法之前,在@Before方法之前执行
    System.out.println("around before。。。。。" );
    // 执行目标方法
    Object retVal = joinPoint.proceed(joinPoint.getArgs());
    // 执行目标方法之后,@After之前执行
    System.out.println("around after。。。。。" );
    return retVal;
}
```

相当于`xml`中

```xml
<aop:config>
    <aop:aspect id="logAspect" ref="logAspect">
      <aop:pointcut id="servicePoint"
            expression="execution(* top.felixfly.aop.service.*Service.*(..))"/>
        <aop:around pointcut-ref="servicePoint" method="around" />
    </aop:aspect>
</aop:config>
```

# `AOP`的源码分析

## `@EnableAspectJAutoProxy`

注解通过`@Import(AspectJAutoProxyRegistrar.class)`注册

* 实现`ImportBeanDefinitionRegistrar`
* `AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry)`
  * 注册`org.springframework.aop.config.internalAutoProxyCreator` ——`AnnotationAwareAspectJAutoProxyCreator`,最高优先级

## `AnnotationAwareAspectJAutoProxyCreator`

类结构

* `AspectJAwareAdvisorAutoProxyCreator`
  * `AbstractAdvisorAutoProxyCreator`
    * `AbstractAutoProxyCreator`
      * `ProxyProcessorSupport` 
        * `ProxyConfig`
        * `Ordered` 接口
        * `BeanClassLoaderAware` 接口
        * `AopInfrastructureBean` 接口
      * `SmartInstantiationAwareBeanPostProcessor` 接口
        * `InstantiationAwareBeanPostProcessor` 接口
          * `BeanPostProcessor` 接口
      * `BeanFactoryAware` 接口

> `BeanPostProcessor` 
>
> * `postProcessBeforeInitialization` 初始化之前执行方法
> * `postProcessAfterInitialization` 初始化之后执行方法



> `InstantiationAwareBeanPostProcessor` 
>
> * `postProcessBeforeInstantiation` 实例化之前执行方法
> * `postProcessAfterInstantiation` 实例化之后执行方法
> * `postProcessProperties` 使用属性之前执行方法
> * `postProcessPropertyValues`  使用属性之前执行方法，允许检查依赖
>
> `SmartInstantiationAwareBeanPostProcessor` 
>
> * `predictBeanType`  预知最后返回bean的类型，`postProcessBeforeInstantiation` 回调
> * `determineCandidateConstructors` 决断获取Bean的预选构造器
> * `getEarlyBeanReference` 获取早期的Bean引用，解决循环引用

### 实例化`createBean`

* `resolveBeforeInstantiation` 给`BeanPostFrocessor`一个返回代理对象实例的一个机会

  * `applyBeanPostProcessorsBeforeInstantiation`

    * `InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation`

      `AbstractAutoProxyCreator#postProcessBeforeInstantiation`

      * 判断是否是通知Bean
        * `Advice`、`Pointcut`、`Advisor`、`AopInfrastructureBean` 这几个类的子类
        * `@Aspect`注解的类
        * bean的名词是否以bean的Class名称开头并且以`.ORIGINAL`结束
      * 是否需要跳过
        * 获取`Advisor`通知器列表
      * 是否自定义`TargetSourceCreator`，若是有直接执行`createProxy`

  * `applyBeanPostProcessorsAfterInitialization` 上述bean返回不为空的时候才执行，也就是自定义了`TargetSourceCreator`的时候才会如下方法

    * `BeanProcessor#postProcessAfterInitialization`

      `AbstractAutoProxyCreator#postProcessAfterInitialization`

      * `wrapIfNecessary`  
        * 判断是否是通知Bean
        * 是否需要跳过
        * 判断是否有`Advice`通知的Bean创建代理
          * `createProxy`
            * `DefaultAopProxyFactory#createAopProxy`
              * `config.isProxyTargetClass()`
                * 接口或者是Proxy的子类，使用`JdkDynamicAopProxy`
                * 其他使用`ObjenesisCglibAopProxy`
              * 创建`JdkDynamicAopProxy`

### 初始化`initializeBean`

- `invokeAwareMethods` —— `BeanFactoryAware` `的方法

  - `AbstractAdvisorAutoProxyCreator#setBeanFactory`

  - `AnnotationAwareAspectJAutoProxyCreator#initBeanFactory`

    - `ReflectiveAspectJAdvisorFactory`

      处理`Advice`通知注解`@Around`、`@Before`、`@After`、`@AfterReturning`、`@AfterThrowing`

    - `BeanFactoryAspectJAdvisorsBuilderAdapter`

## 初始化其他Bean`initializeBean`

- `applyBeanPostProcessorsAfterInitialization`

  调用`BeanPostProcessor#postProcessAfterInitialization`

  ——`AbstractAutoProxyCreator#postProcessAfterInitialization`

  - `wrapIfNecessary`  
    - 判断是否是通知Bean
    - 是否需要跳过
    - 判断是否有`Advice`通知的Bean创建代理
      - `createProxy`
        - `DefaultAopProxyFactory#createAopProxy`
          - `config.isProxyTargetClass()`
            - 接口或者是Proxy的子类，使用`JdkDynamicAopProxy`
            - 其他使用`ObjenesisCglibAopProxy`
          - 创建`JdkDynamicAopProxy`

# 事务的注解与源码分析

> 事务的解决问题
>
> * 脏读
>
>   一个线程在处理数据，事务还未提交；另一个线程可以读到此数据
>
> * 重复读
>
>   一个线程读数据
>
> * 幻读
>
> 事务的隔离级别`Connection`
>
> * `READ_UNCOMMITTED`
> * `READ_COMMITTED`
> * `REPEATABLE_READ`
> * `SERIALIZABLE`
>
> 事务的传播机制`TransactionDefinition`
>
> * `REQUIRED`
> * `SUPPORTS`
> * `MANDATORY`
> * `REQUIRES_NEW`
> * `NOT_SUPPORTED`
> * `NEVER`
> * `NESTED`

## 常用注解

### `@EnableTransactionManagement`

开启事务的注解

### `@Transactional`

启用事务的注解

## 源码分析

### `@EnableTransactionManagement`

通过`@Import(TransactionManagementConfigurationSelector.class)`注册

* `PROXY` `JDK`代理通知

  * `AutoProxyRegistrar`

    * `AopConfigUtils.registerAutoProxyCreatorIfNecessary(registry)`

      注册`org.springframework.aop.config.internalAutoProxyCreator` ——`InfrastructureAdvisorAutoProxyCreator`

      优先级判断

    * `AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry)`

      `org.springframework.aop.config.internalAutoProxyCreator`设置属性`proxyTargetClass`

  * `ProxyTransactionManagementConfiguration`

    注册如下的Bean

    * `transactionAdvisor`——`BeanFactoryTransactionAttributeSourceAdvisor`
      * `TransactionAttributeSource`
      * `Advice`——`TransactionInterceptor` 
    * `transactionAttributeSource`——`AnnotationTransactionAttributeSource`
    * `transactionInterceptor`——`TransactionInterceptor`
      * `TransactionAttributeSource`
      * `TransactionManager`

* `ASPECTJ` `AspectJ`代理通知

  * `AspectJJtaTransactionManagementConfiguration`
  * `AspectJTransactionManagementConfiguration`



