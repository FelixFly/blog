---
title: Spring Cloud序幕
author: FelixFly
date: 2019-12-22
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2019
---



<!-- more -->

# Spring Cloud序幕

## 特性

* 分布式/版本配置
* 服务注册和发现
* 路由
* 服务调用
* 负载均衡
* 短路
* 分布式消息

## 云原声

### Spring Cloud Context

Bootstrap Context作为父上下文，名称为`bootstrap`,用来加载bootstrap配置信息，默认为`bootstrap.properties|yml`,PropertySource名称为`applicationConfig: [classpath:/bootstrap.yml]`,加载具有最高优先级，默认的配置子上下文可以进行覆盖，也就是默认的bootstrap配置是最低优先级，自定义bootstrap的配置具有优先级。应用上下文作为子上下文。

> `bootstrap`配置文件是由`BootstrapApplicationListener`进行加载，优先级为第6位
>
> `application`配置文件是由`ConfigFileApplicationListener`进行加载，优先级为第11位

#### Bootstrap 配置

> 需要在程序启动的上一层进行配置，比如程序的运行参数、JVM参数、系统的环境变量

* `spring.cloud.bootstrap.name`
* `spring.cloud.bootstrap.location`

#### 覆盖远程配置

> `org.springframework.cloud.bootstrap.config.PropertySourceBootstrapProperties`

* `spring.cloud.config.allowOverride=true` 允许覆盖配置
* `spring.cloud.config.overrideNone=false` 外部化配置处于最低优先级并且不可覆盖
* `spring.cloud.config.overrideSystemProperties=true` 只有系统环境、命令行参数以及环境变量可以覆盖远程配置，其他的本地配置文件不可覆盖

#### 自定义Bootstrap 配置

在META-INF/spring.factories中添加`org.springframework.cloud.bootstrap.BootstrapConfiguration`对应的配置类

#### 自定义Bootstrap 配置资源

> 这个自定义的PropertySource具有最高优先级

1. 实现`org.springframework.cloud.bootstrap.config.PropertySourceLocator#locate`方法

   ```java
   /**
    * 自定义实现
    *
    * @author FelixFly 2019/12/22
    */
   @Configuration
   public class CustomPropertySourceLocator implements PropertySourceLocator {
       
       @Override
       public PropertySource<?> locate(Environment environment) {
           return new MapPropertySource("customProperty",
                   Collections.singletonMap("spring.application.name", "custom-bootstrap"));
       }
   }
   ```

2. 在META-INF/spring.factories中加入配置

   ```properties
   org.springframework.cloud.bootstrap.BootstrapConfiguration=\
   top.felixfly.cloud.config.CustomPropertySourceLocator
   ```

#### 日志配置

 可以将日志配置配置到bootstrap配置中，但是不支持自定义的前缀

#### 环境改变

> 发布`EnvironmentChangedEvent`事件

* `@COnfigurationProperties`
* `@RefreshScope`

#### 加密和解密

需要添加`org.springframework.security:spring-security-rsa`

#### 端点

* [`POST`]`/actuator/env`更新环境配置，重新绑定@CongigurationProperties和日志级别
* `/actuator/refresh` 重新加载bootstrap上下文以及刷新`@RefreshScope`标注的`Bean`
* `/actuator/restart` 关闭应用上下文并重新启动（默认是关闭的）
* `/actuator/pause`和`/actuator/resume` 调用应用上下文`Lifecycle`的`stop()`和`start()`方法

### Spring Cloud Commons

#### `@EnableDiscoverClient` 启用服务发现

> 默认会自动注册到远程发现服务，不注册的需要调整`autoRegister`属性值为`false`

只要实现`DiscoveryClient`或`ReactiveDiscoveryClient`并且在`META-INF/spring.factories`中在`org.springframework.cloud.client.discovery.EnableDiscoveryClient`下申明的类都可以服务发现。

**健康检查**

> 健康检查的配置类`DiscoveryClientHealthIndicatorProperties`

* `spring.cloud.discovery.client.composite-indicator.enabled=false` 关闭所有的健康检查
* `spring.cloud.discovery.client.health-indicator.enabled=false` 关闭服务发现的健康检查
* `spring.cloud.discovery.client.health-indicator.includedescription=
  false` 关闭服务发现的健康检查描述

**服务发现的配置**

* `spring.cloud.discovery.blocking.enabled=false` 阻塞的服务发现关闭
* `spring.cloud.discovery.reactive.enabled=false` Reactive的服务发现关闭
* `spring.cloud.discovery.enabled=false`所有的服务发现都关闭

**服务发现的优先级**

* `spring.cloud.{clientIdentifier}.discovery.order` 通过此配置进行调整

#### `ServiceRegistry` 服务注册

> `org.springframework.cloud.client.serviceregistry.ServiceRegistry`
>
> * `void register(R registration)` 注册服务
> * `void deregister(R registration)` 反注册服务（撤销服务）
>
> `Registration`是个标记接口

**服务的自动注册**

* `@EnableDiscoveryClient(autoRegister=false)` 通过注解的方式
* `spring.cloud.service-registry.auto-registration.enabled=false`  通过配置文件的方式

**服务自动注册事件**

> `spring.cloud.service-registry.auto-registration.enabled=false` 事件会关闭

* `InstancePreRegisteredEvent` 服务注册前置事件
* `InstanceRegisteredEvent ` 服务注册后置事件

**健康检查**

* `/service-registry` 检查检查端点，GET获取所有的注册状态，POST改变服务的状态

> `Euraka`服务状态`stauts`:`UP`、`DOWN`、`OUT_OF_SERVICE`和`UNKOWN`

#### RestTemplate 负载均衡服务调用客户端

通过添加`LoadBalanced`标识来表明负载均衡客户端

> url必须是虚拟的主机名称，就是服务的名称，不是主机名称
>
> 建议使用`BlockingLoadBalancerClient`,`RibbonLoadBalancerClient`正在维护不推荐使用
>
> 两者都在的时候默认是使用`RibbonLoadBalancerClient`，通过配置spring.cloud.loadbalancer.ribbon.enabled=false进行关闭

```java
@Configuration
public class MyConfiguration {
    
    @LoadBalanced
    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

public class MyClass {
    
    @Autowired
    private RestTemplate restTemplate;
    
    public String doOtherStuff() {
        String results = restTemplate.getForObject("http://stores/stores",
        String.class);
        return results;
    }
}
```

#### `WebClient` 负载均衡服务调用客户端

通过添加`LoadBalanced`标识来表明负载均衡客户端

> url必须是虚拟的主机名称，就是服务的名称，不是主机名称

```java
@Configuration
public class MyConfiguration {
    
    @Bean
    @LoadBalanced
    public WebClient.Builder loadBalancedWebClientBuilder() {
        return WebClient.builder();
    }
}
public class MyClass {
    @Autowired
    private WebClient.Builder webClientBuilder;
    
    public Mono<String> doOtherStuff() {
        return webClientBuilder.build().get().uri("http://stores/stores")
            .retrieve().bodyToMono(String.class);
    }
}
```

#### 尝试失败请求

默认是关闭的。添加`Spring Retry`来启用，配置参数

* `client.ribbon.MaxAutoRetries`
* `client.ribbon.MaxAutoRetriesNextServer`
* `client.ribbon.OkToRetryOnAllOperations`
* `spring.cloud.loadbalancer.retry.enabled=false` 关闭重试请求

**自定义实现`BackOffPolicy`**

创建一个类型为`LoadBalancedRetryFactory`的`Bean`并重写createBackOffPolicy方法

```java
@Configuration
public class MyConfiguration {
    @Bean
    LoadBalancedRetryFactory retryFactory() {
        return new LoadBalancedRetryFactory() {
            @Override
            public BackOffPolicy createBackOffPolicy(String service) {
                return new ExponentialBackOffPolicy();
            }
        };
}
```

**自定义实现`RetryListener`**

创建一个类型为LoadBalancedRetryListenerFactory的`Bean`并且返回值是服务的`RetryListener`数组

```java
@Configuration
public class MyConfiguration {
    
    @Bean
    LoadBalancedRetryListenerFactory retryListenerFactory() {
        return new LoadBalancedRetryListenerFactory() {
            @Override
            public RetryListener[] createRetryListeners(String service) {
                return new RetryListener[]{new RetryListener() {
                    @Override
                    public <T, E extends Throwable> boolean open(RetryContext context,
                                                                 RetryCallback<T, E> callback) {
                        //TODO Do you business...
                        return true;
                    }

                    @Override
                    public <T, E extends Throwable> void close(RetryContext context,
                                                               RetryCallback<T, E> callback, Throwable throwable) {
                        //TODO Do you business...
                    }

                    @Override
                    public <T, E extends Throwable> void onError(RetryContext context,
                                                                 RetryCallback<T, E> callback, Throwable throwable) {
                        //TODO Do you business...
                    }
                }};
            }
        };
    }
}
```

#### 多个`RestTemplate`或者`WebClient`对象

普通的直接用，要是使用负载均衡的话，加上`@LoadBalanced`注解进行申明

```java
@Configuration
public class MyConfiguration {
    
    @LoadBalanced
    @Bean
    RestTemplate loadBalanced() {
        return new RestTemplate();
    }
    
    @Primary
    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

public class MyClass {
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    @LoadBalanced
    private RestTemplate loadBalanced;
    
    public String doOtherStuff() {
        return loadBalanced.getForObject("http://stores/stores", String.class);
    }
    
    public String doStuff() {
        return restTemplate.getForObject("http://example.com", String.class);
    }
}
```

> 若是存在异常`java.lang.IllegalArgumentException: Can not set
> org.springframework.web.client.RestTemplate field com.my.app.Foo.restTemplate
> to com.sun.proxy.$Proxy89`,尝试注入`RestOperations`或者调整配置`spring.aop.proxyTargetClass=true`

