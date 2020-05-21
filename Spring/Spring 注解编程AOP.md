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

# `AOP`的执行顺序

正常执行流程：`@Around` -> `@Before` -> `@After` -> `@AfterReturning`

异常执行流程：`@Around` -> `@Before` -> `@After` -> `@AfterThrowing`

# 切面的主要接口

## `PointCut` 切入点

> * `ClassFilter` 类的过滤器
> * `MethodMatcher` 方法的匹配器

## `Advice`  通知

* `BeforeAdvice` 前置通知
* `AfterAdvice` 后置通知
* `AfterReturningAdvice` 执行返回通知
* `ThrowsAdvice` 异常通知

## `MethodInterceptor` 方法的拦截器（继承Advice）

* `MethodBeforeAdviceInterceptor` 方法前置拦截器
* `AspectJAroundAdvice` `ApectJ`环绕拦截器
* `AspectJAfterAdvice` `ApectJ`后置拦截器
* `AfterReturningAdviceInterceptor` 后置返回拦截器
* `AspectJAfterThrowingAdvice` 后置异常拦截器

## `Advisor` 通知器

> * `Advice` 通知

## `PointcutAdvisor` 切入点通知器（继承Advisor）

> * `Pointcut` 切入点

# 动态代理的主要接口

## `AopProxy` `Aop`动态代理

* `JdkDynamicAopProxy` `Jdk`动态代理
* `CglibAopProxy` `Cglib`动态代理
  * `ObjenesisCglibAopProxy` 扩展的 `Cglib`动态代理

> 这个是通过`org.springframework.aop.framework.DefaultAopProxyFactory`进行动态匹配生成，构建执行链`org.springframework.aop.framework.DefaultAdvisorChainFactory#getInterceptorsAndDynamicInterceptionAdvice`关联了`Advisor`

# `AOP`的源码分析

## `@EnableAspectJAutoProxy`

注解通过`@Import(AspectJAutoProxyRegistrar.class)`注册

* 实现`ImportBeanDefinitionRegistrar`
* `AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(registry)`
  * 注册`org.springframework.aop.config.internalAutoProxyCreator` ——`AnnotationAwareAspectJAutoProxyCreator`,最高优先级

## `AnnotationAwareAspectJAutoProxyCreator`

实现主要接口

* `BeanFactoryAware`  `BeanFactory`回调接口
* `InstantiationAwareBeanPostProcessor` 实例化执行的接口
* `BeanPostProcessor` Bean后置处理器

### `BeanFactoryAware`  `BeanFactory`回调接口

- `AbstractAdvisorAutoProxyCreator#setBeanFactory`

- `AnnotationAwareAspectJAutoProxyCreator#initBeanFactory`

  - `ReflectiveAspectJAdvisorFactory`

    > 处理`Advice`通知注解`@Around`、`@Before`、`@After`、`@AfterReturning`、`@AfterThrowing`

    构建了一个`PointcutAdvisor`(`InstantiationModelAwarePointcutAdvisorImpl`)

    * `AspectJExpressionPointcut` `PointCut`切点表达式
    * `Advice`  通知

  - `BeanFactoryAspectJAdvisorsBuilderAdapter`

### `InstantiationAwareBeanPostProcessor` 实例化执行的接口

#### `InstantiationAwareBeanPostProcessor#postProcessBeforeInstantiation` 实例化执行的方法

`AbstractAutoProxyCreator#postProcessBeforeInstantiation`

* 判断是否是通知Bean
  * `Advice`、`Pointcut`、`Advisor`、`AopInfrastructureBean` 这几个类的子类
  * `@Aspect`注解的类
  * bean的名词是否以bean的Class名称开头并且以`.ORIGINAL`结束
* 是否需要跳过
  * 获取`Advisor`通知器列表(获取到了`InstantiationModelAwarePointcutAdvisorImpl`)
* 是否自定义`TargetSourceCreator`，若是有直接执行`createProxy`

### `BeanPostProcessor` Bean后置处理器

#### `BeanPostProcessor#postProcessAfterInitialization` 初始化执行的方法

`AbstractAutoProxyCreator#postProcessAfterInitialization`

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

# 通过代码实现切面

## 实现一个`PointAdvisor`

```java
/**
 * 日志通知器
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/5/18
 */
public class TraceBeanFactoryPointcutAdvisor extends AbstractBeanFactoryPointcutAdvisor {


    @Override
    public Pointcut getPointcut() {
        // 所有的方法
        return Pointcut.TRUE;
    }
}
```

## 实现一个`MethodInterceptor`

```java
/**
 * 日志拦截器
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/5/18
 */
public class TraceInterceptor extends SimpleTraceInterceptor {


    private final AtomicInteger count = new AtomicInteger();

    @Override
    protected boolean isLogEnabled(Log logger) {
        // 调整日志级别
        return logger.isInfoEnabled();
    }


    @Override
    protected void writeToLog(Log logger, String message, Throwable ex) {
        // 打印日志方式
        if (Objects.nonNull(ex)) {
            logger.error(message, ex);
            return;
        }
        logger.info(message);
    }


    @Override
    protected Object invokeUnderTrace(MethodInvocation invocation, Log logger) throws Throwable {
        // 这地方有个并发的问题
        // 可以构建个上下文用ThreadLocal处理，ThreadLocal什么时候进行移除？
        int num = count.incrementAndGet();
        long start = System.currentTimeMillis();
        try {
            Object proceed = invocation.proceed();
            // 执行序号|执行方法名|执行时间|入参|出参|错误信息
            writeToLog(logger, getDescription(invocation, num, proceed, System.currentTimeMillis() - start));
            return proceed;

        } catch (Throwable ex) {
            writeToLog(logger, getDescription(invocation, num, null, System.currentTimeMillis() - start), ex);
            throw ex;
        }
    }

    private String getDescription(MethodInvocation invocation, int num, Object returnObject, long time) {
        Method method = invocation.getMethod();
        Object[] arguments = invocation.getArguments();
        return String.format("%d|%s#%s|%d|%s|%s", num,
                method.getDeclaringClass().getSimpleName(), method.getName(), time, JSON.toJSONString(arguments),
                Objects.isNull(returnObject) ? "" : JSON.toJSONString(returnObject));
    }
}
```

## 配置Bean信息

```java
/**
 * Aop切面配置
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2019/11/28
 */
@Configuration
@EnableAspectJAutoProxy // 一定要开启，不开启无效，自定义的实现是通过EnableAspectJAutoProxy来实现的
public class AopConfiguration {

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    public TraceBeanFactoryPointcutAdvisor traceBeanFactoryPointcutAdvisor(){
        TraceBeanFactoryPointcutAdvisor pointcutAdvisor = new TraceBeanFactoryPointcutAdvisor();
        pointcutAdvisor.setAdvice(traceInterceptor());
        return pointcutAdvisor;
    }

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    public TraceInterceptor traceInterceptor(){
        return new TraceInterceptor();
    }
}
```

## 若是不希望拦截所有的方法，自行实现`Pointcut`

```java
/**
 * 日志切面
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/5/18
 */
public class TracePointcut implements Pointcut, Serializable {

    public static final TracePointcut INSTANCE = new TracePointcut();

    /**
     * Enforce Singleton pattern.
     */
    private TracePointcut() {
    }

    @Override
    public ClassFilter getClassFilter() {
        // service 注解打点,true表示派生的注解
        return new AnnotationClassFilter(Service.class, true);
    }

    @Override
    public MethodMatcher getMethodMatcher() {
        return MethodMatcher.TRUE;
    }

    /**
     * Required to support serialization. Replaces with canonical
     * instance on deserialization, protecting Singleton pattern.
     * Alternative to overriding {@code equals()}.
     */
    private Object readResolve() {
        return INSTANCE;
    }

    @Override
    public String toString() {
        return "Pointcut.TRUE";
    }
}
```

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



