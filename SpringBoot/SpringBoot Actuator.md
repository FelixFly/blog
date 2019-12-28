---
title: Spring Boot Actuator
author: FelixFly
date: 2019-12-23
tags:
    - spring boot
categories: 
    - spring toot
archives: 2019
---

1.  配置文件的读取
2.  自动装配

<!-- more -->

# `Spring Boot Actuator`

为生产准备的特性。当你发布应用的试试，Spring Boot 包含一堆特性来帮助你监控和管理应用。你选择通过`Http` 端点或者`JMX`来管理和监控你的应用。审计、健康和度量收集自动装配到你的应用。

## 启用`Spring Boot Actuator`

> 加入maven依赖即可

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

## 端点

### 端点列表

> `JMX`和`Web`是对应的ID默认启用状态

|         ID         |                             描述                             | `JMX` | Web  |
| :----------------: | :----------------------------------------------------------: | ----- | ---- |
|   `auditevents`    | 暴露当前应用的审计事件信息，需要`AuditEventRepository`的`Bean` | Yes   | No   |
|      `beans`       |                显示当前应用的完整的`Bean`列表                | Yes   | No   |
|      `caches`      |                       暴露可获取的缓存                       | Yes   | No   |
|    `conditions`    |            显示装配或者自动装配成功或者失败的条件            | Yes   | No   |
|   `configprops`    |             显示`@ConfigurationProperties`的列表             | Yes   | No   |
|       `env`        |           暴露`ConfigurableEnvironment`的配置信息            | Yes   | No   |
|      `flyway`      |        显示应用的任意数据库迁移，需要`Flyway`的`Bean`        | Yes   | No   |
|      `health`      |                      显示应用的健康信息                      | Yes   | Yes  |
|    `httptrace`     | 显示`Http`调用信息（默认显示最后100个`http`请求响应），需要`HttpTraceRepository`的`bean` | Yes   | No   |
|       `info`       |                       显示任意应用信息                       | Yes   | Yes  |
| `intergationgraph` |    显示Spring 聚合图表，需要`spring-integration-core`依赖    | Yes   | No   |
|     `loggers`      |                   显示和修改应用的日志配置                   | Yes   | No   |
|    `liquibase`     |      显示应用的任意数据库迁移，需要`Liquibase`的`Bean`       | Yes   | No   |
|     `metrics`      |                   显示当前的应用的度量指标                   | Yes   | No   |
|     `mappings`     |                  显示`@RequestMapping`列表                   | Yes   | No   |
|  `scheduledtasks`  |                       显示定时任务列表                       | Yes   | No   |
|     `shutdown`     |                 优雅地关闭应用，默认是关闭的                 | Yes   | No   |
|    `theaddump`     |                         执行线程转存                         | Yes   | No   |

若是web应用的话，还有以下端点

|      ID       |                             秒速                             | `JMX` | Web  |
| :-----------: | :----------------------------------------------------------: | ----- | ---- |
|  `sessions`   |   允许检索和删除用户session信息，需要一个`Servlet`web应用    | Yes   | No   |
|  `heapdump`   |                 返回一个`hprof`的堆转存文件                  | N/A   | No   |
|   `jolokia`   | 通过`http`暴露`JMX`的`Bean`，需要`jolokia-core`,在`WebFlux`不可用 | N/A   | No   |
|   `logfile`   | 返回日志文件的内容（需要配置`logging.file.name`和`logging.file.path`），支持`http`的`Range`请求头来返回当前日志文件的部分信息 | N/A   | No   |
| `promethueus` | 暴露`prometheus`的度量信息，需要`micrometer-registry-prometheus`依赖 | N/A   | No   |

### 启用端点

* `management.endpoint.<id>.enabled=true` 启用对应的id的端点
* `management.endpoints.enabled-by-default=false` 默认都不启用
* `management.endpoints.<type>.exposure.include=info,health` 启用info和health端点，`type`包含`jms`以及`web`
* `management.endpoints.<type>.exposure.exclude=info,health` 关闭info和health端点，`type`包含`jms`以及`web`

> `include`与`exclude`所有的内容，使用`*`，注意在`yaml`配置`*`的时候需要引号
>
> ```yaml
> management:
>     endpoints:
>         web:
>             exposure:
>                 include: "*"
> ```

### 端点安全

Spring Boot 提供了`RequestMatcher`对象联合`Spring Security`使用

```java
@Configuration(proxyBeanMethods = false)
public class ActuatorSecurity extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.requestMatcher(EndpointRequest.toAnyEndpoint())
            .authorizeRequests((requests) ->
            requests.anyRequest().hasRole("ENDPOINT_ADMIN"));
        http.httpBasic();
    }
}
```

若是被`Spring Security`阻止，可以设置所有放行

```java
@Configuration(proxyBeanMethods = false)
public class ActuatorSecurity extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.requestMatcher(EndpointRequest.toAnyEndpoint())
            .authorizeRequests((requests) ->
            requests.anyRequest().permitAll());
    }
}
```

### 跨域配置

* `management.endpoints.web.cors.allowed-origins=https://example.com` 跨域源
* `management.endpoints.web.cors.allowed-methods=GET,POST` 跨域访问方法

### 自定义实现

`@Bean`上添加`@EndPoint`注解，任意方法上添加`@ReadOperation`、`@WriteOperation`和`@DeleteOperation`在`JMX`以及`Web`上都会暴露。若是只想暴露一种，使用`@JmxEndpoint`或者`@WebEndpoint`。使用`@EndpointWebExtension`和`@EndpointJmxExtension`在已经暴露的端点上添加参数。使用`Servlet`或者Spring注解`@Controller`和`@RestController`来禁止`JMX`或者其他的`web`环境。

### 健康信息配置

* `management.endpoint.health.show-details=never` 默认不显示详情信息

  > * `when-authorized`认证信息，配置`management.endpoint.health.roles`进行配置，默认的话所有认证的用户都有权限
  > * `always` 所有用户都显示

* `management.endpoint.health.show-components`

* `management.health.defaults.enabled` 关闭健康检查信息

#### 自定义健康检查信息



#### `Reative`健康检查信息



