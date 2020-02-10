---
title: Spring Cloud服务网关
author: FelixFly
date: 2020-02-09
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. 服务网关特性
2. 基于`RestTemplate`自定义服务网关
3. `Spring Cloud Netflix Zuul`网关
4. `Spring Cloud Gateway`网关

<!-- more -->

# Spring Cloud服务网关

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE
>
> Zookeeper :  3.5.6  （注册中心使用）

## 服务网关特性

> 服务网关是干什么用的？

* 认证
* 安全（授权）
* 动态路由

## 基于`RestTemplate`自定义服务网关

### 服务端演示提供服务

1. 添加`pom`依赖

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-actuator</artifactId>
   </dependency>
   
   <!--zookeeper 客户端-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId>
   </dependency>
   ```

2. 服务网关服务应用`GatewayServerApplication`

   ```java
   /**
    * 服务网关服务应用
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/8
    */
   @SpringBootApplication
   public class GatewayServerApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(GatewayServerApplication.class, args);
       }
   }
   ```

3. 演示服务端点

   ```java
   /**
    * 演示服务端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/8
    */
   @RestController
   public class EchoController {
   
       @Autowired
       private Environment environment;
   
   
       @GetMapping("/echo")
       public String echo(String message) {
           // 由于采用的是随机端口，这地方必须采用这个方式获取端口
           String port = environment.getProperty("local.server.port");
           return "ECHO(" + port + "):" + message;
       }
   }
   ```

4. 服务配置`application.yml`

   ```yaml
   spring:
     application:
       name: gateway-server
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
   server:
     port: 0
   ```

> 启动服务，根据启动日志查看本地的随机端口，此次端口是`54692`
>
> `http://127.0.0.1:54692/echo?message=Hello` 返回信息ECHO(54692):Hello

### 自定义服务网关

> 基于`Servlet`

**配置文件`application.yml`**

```java
spring:
  application:
    name: gateway-zuul
  cloud:
    zookeeper:
      connect-string: 127.0.0.1:2181
server:
  port: 7070
```

#### 基于`DiscoveryClient`

**`GatewayCustomServlet`网关`Servlet`**

> 包名：`top.felixfly.cloud.gateway.custom`

```java
/**
 * 服务网关Servlet实现
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/8
 */
@WebServlet(name = "gateway", urlPatterns = "/gateway/*")
public class GatewayCustomServlet extends HttpServlet {

    @Autowired
    private DiscoveryClient discoveryClient;

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // 访问地址的Uri:/{service-name}/${service-uri}
        String pathInfo = req.getPathInfo();
        String[] paths = StringUtils.split(pathInfo.substring(1), "/");
        // 服务名称
        String serverName = paths[0];
        // 服务访问地址
        String serverURI = paths[1];
        // 获取服务实例
        ServiceInstance serviceInstance = choose(serverName);
        // 目标地址
        String targetURL = createTargetURL(serviceInstance, serverURI, req);
        RestTemplate restTemplate = new RestTemplate();
        String method = req.getMethod();
        ResponseEntity<byte[]> responseEntity = restTemplate
                .exchange(targetURL, HttpMethod.resolve(method), null, byte[].class);
        // 返回状态
        resp.setStatus(responseEntity.getStatusCodeValue());
        // 媒体类型
        HttpHeaders headers = responseEntity.getHeaders();
        MediaType contentType = headers.getContentType();
        if (Objects.nonNull(contentType)) {
            resp.setHeader(HttpHeaders.CONTENT_TYPE, contentType.toString());
        }
        // 返回内容
        byte[] body = responseEntity.getBody();
        if (Objects.nonNull(body)) {
            ServletOutputStream outputStream = resp.getOutputStream();
            outputStream.write(responseEntity.getBody());
            outputStream.flush();
        }
    }

    private String createTargetURL(ServiceInstance instance, String serverURI,
                                   HttpServletRequest req) {
        StringBuilder urlBuilder = new StringBuilder(64);
        return urlBuilder.append(instance.isSecure() ? "https" : "http").append("://")
                .append(instance.getHost()).append(":").append(instance.getPort())
                .append(serverURI).append("?").append(req.getQueryString())
                .toString();
    }

    private ServiceInstance choose(String serverName) {
        List<ServiceInstance> instances = this.discoveryClient.getInstances(serverName);
        if (CollectionUtils.isEmpty(instances)) {
            throw new RuntimeException("无服务实例");
        }
        int index = new Random().nextInt(instances.size());
        return instances.get(index);
    }
}
```

**服务启动类`GatewayZuulApplication`**

```java
/**
 * 服务网关 Zuul 服务
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/8
 */
@SpringBootApplication
@ServletComponentScan(basePackages = "top.felixfly.cloud.gateway.custom")
public class GatewayZuulApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayZuulApplication.class, args);
    }
}
```

> 启动服务，访问地址`http://127.0.0.1:7070/gateway/gateway-server/echo?message=hello`
>
> 返回信息ECHO(54692):Hello

#### 基于`@LoadBlanced`

**`GatewayLoadBalancedServlet`负载均衡`Servlet`**

> 包名：`top.felixfly.cloud.gateway.custom`

```java
/**
 * 服务网关基于LoadBalanced Servlet实现
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/8
 */
@WebServlet(name = "gatewaylb", urlPatterns = "/gatewaylb/*")
public class GatewayLoadBalancedServlet extends HttpServlet {

    @Autowired
    @LoadBalanced
    private RestTemplate restTemplate;

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // 访问地址的Uri:/{service-name}/${service-uri}
        String pathInfo = req.getPathInfo();
        // 目标地址
        String targetURL = "http://" + pathInfo.substring(1) + "?" + req.getQueryString();
        String method = req.getMethod();
        ResponseEntity<byte[]> responseEntity = restTemplate
                .exchange(targetURL, HttpMethod.resolve(method), null, byte[].class);
        // 返回状态
        resp.setStatus(responseEntity.getStatusCodeValue());
        // 媒体类型
        HttpHeaders headers = responseEntity.getHeaders();
        MediaType contentType = headers.getContentType();
        if (Objects.nonNull(contentType)) {
            resp.setHeader(HttpHeaders.CONTENT_TYPE, contentType.toString());
        }
        // 返回内容
        byte[] body = responseEntity.getBody();
        if (Objects.nonNull(body)) {
            ServletOutputStream outputStream = resp.getOutputStream();
            outputStream.write(responseEntity.getBody());
            outputStream.flush();
        }
    }
}
```

**服务启动类`GatewayZuulApplication`**

```java
/**
 * 服务网关 Zuul 服务
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/8
 */
@SpringBootApplication
@ServletComponentScan(basePackages = "top.felixfly.cloud.gateway.custom")
public class GatewayZuulApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayZuulApplication.class, args);
    }

    @Bean
    @LoadBalanced
    public RestTemplate restTemplate(){
        return new RestTemplate();
    }
}

```

> 启动服务，访问地址`http://127.0.0.1:7070/gatewaylb/gateway-server/echo?message=hello`
>
> 返回信息ECHO(54692):Hello

**配置文件`application.yml`调整**

> 默认是启用`ribbon`进行负载均衡，可以关闭`ribbon`使用`Spring Cloud LoadBalanced`

```yaml
spring:
  application:
    name: gateway-zuul
  cloud:
    zookeeper:
      connect-string: 127.0.0.1:2181
    loadbalancer:
      ribbon:
        enabled: false # 关闭Ribbon
server:
  port: 7070
```

## `Spring Cloud Netflix Zuul`网关

### 基本使用

1. 添加`pom`依赖

   ```xml
   <!--zuul 网关-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
   </dependency>
   ```

2. 启动类添加`@EnableZuulProxy`

   ```java
   /**
    * 服务网关 Zuul 服务
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/8
    */
   @SpringBootApplication
   @EnableZuulProxy
   @ServletComponentScan(basePackages = "top.felixfly.cloud.gateway.custom")
   public class GatewayZuulApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(GatewayZuulApplication.class, args);
       }
   
       @Bean
       @LoadBalanced
       public RestTemplate restTemplate(){
           return new RestTemplate();
       }
   }
   
   ```

3. 配置文件`application.yml`添加路由配置

   ```java
   spring:
     application:
       name: gateway-zuul
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
       loadbalancer:
         ribbon:
           enabled: false # 关闭Ribbon
   server:
     port: 7070
   zuul:
     routes:
       gateway-server: /gateway-server/**
   ```

   > 默认不配置`uri`，自动启用负载均衡，直连配置
   >
   > ```yaml
   > zuul:
   >   routes:
   >     gateway-server:
   >       path: /gateway-server/**
   >       url: http://127.0.0.1:54692
   > ```

> 启动服务，访问地址`http://127.0.0.1:7070/gateway-server/echo?message=hello`
>
> 返回信息ECHO(54692):Hello

### 原理分析

**`@EnableZuulProxy`注解**

```java
@EnableCircuitBreaker
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Import(ZuulProxyMarkerConfiguration.class)
public @interface EnableZuulProxy {

}
```

启用了服务熔断以及导入了`ZuulProxyMarkerConfiguration`

**`ZuulProxyMarkerConfiguration`源码**

```java
@Configuration(proxyBeanMethods = false)
public class ZuulProxyMarkerConfiguration {

   @Bean
   public Marker zuulProxyMarkerBean() {
      return new Marker();
   }

   class Marker {

   }

}
```

注册了一个`Marker`的`Bean`，这个`Bean`会作为装配条件

**`ZuulProxyAutoConfiguration`自动配置类**

```java
@Configuration(proxyBeanMethods = false)
@Import({ RibbonCommandFactoryConfiguration.RestClientRibbonConfiguration.class,
		RibbonCommandFactoryConfiguration.OkHttpRibbonConfiguration.class,
		RibbonCommandFactoryConfiguration.HttpClientRibbonConfiguration.class,
		HttpClientConfiguration.class })
@ConditionalOnBean(ZuulProxyMarkerConfiguration.Marker.class)
public class ZuulProxyAutoConfiguration extends ZuulServerAutoConfiguration {
	...
}
```

**父类`ZuulServerAutoConfiguration`自动配置类**

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties({ ZuulProperties.class })
@ConditionalOnClass({ ZuulServlet.class, ZuulServletFilter.class })
@ConditionalOnBean(ZuulServerMarkerConfiguration.Marker.class)
// Make sure to get the ServerProperties from the same place as a normal web app would
// FIXME @Import(ServerPropertiesAutoConfiguration.class)
public class ZuulServerAutoConfiguration {

	...

    // 注册了一个ZuulController
	@Bean
	public ZuulController zuulController() {
		return new ZuulController();
	}

    // 在ZuulController加了ZuulHandlerMapping路由匹配
	@Bean
	public ZuulHandlerMapping zuulHandlerMapping(RouteLocator routes,
			ZuulController zuulController) {
		ZuulHandlerMapping mapping = new ZuulHandlerMapping(routes, zuulController);
		mapping.setErrorController(this.errorController);
		mapping.setCorsConfigurations(getCorsConfigurations());
		return mapping;
	}

	...

    // 注册了一个ZuulServlet
	@Bean
	@ConditionalOnMissingBean(name = "zuulServlet")
	@ConditionalOnProperty(name = "zuul.use-filter", havingValue = "false",
			matchIfMissing = true)
	public ServletRegistrationBean zuulServlet() {
		ServletRegistrationBean<ZuulServlet> servlet = new ServletRegistrationBean<>(
				new ZuulServlet(), this.zuulProperties.getServletPattern());
		// The whole point of exposing this servlet is to provide a route that doesn't
		// buffer requests.
		servlet.addInitParameter("buffer-requests", "false");
		return servlet;
	}

    

	...

}
```

> 从上可知：注册了`ZuulController`和`ZuulServlet`
>
> * `ZuulController` 访问地址针对的是根路径"/",也就是基本使用的地址
>
> * `ZuulServlet` 访问地址针对的是`Servlet`配置地址，默认是“/zuul”,如是访问地址更改为：`http://127.0.0.1:7070/zuul/gateway-server/echo?message=hello`也是可以返回正常结果
>
>   返回信息ECHO(54692):Hello

### 核心`api`

* `org.springframework.cloud.netflix.zuul.web.ZuulController` `Zuul`网关的控制器，内部调用是`ZuulServlet`

* `com.netflix.zuul.http.ZuulServlet` 网关的核心处理类

* `com.netflix.zuul.ZuulFilter` 网关的过滤器，有如下类型

  * `pre` 前置过滤器
  * `route` 路由过滤器
  * `post` 后置过滤器
  * `error` 错误过滤器

* `org.springframework.cloud.netflix.zuul.filters.RouteLocator` 路由列表加载器

  * `org.springframework.cloud.netflix.zuul.filters.RefreshableRouteLocator` 可刷新的路由列表加载器

  > 有两种实现：
  >
  > * `org.springframework.cloud.netflix.zuul.filters.discovery.DiscoveryClientRouteLocator` 服务发现路由列表加载器
  > * `org.springframework.cloud.netflix.zuul.filters.SimpleRouteLocator` 本地配置的路由列表加载器
  >
  > 默认实现:`org.springframework.cloud.netflix.zuul.filters.CompositeRouteLocator`

## `Spring Cloud Gateway`网关

### 基本使用

1. 添加`pom`依赖

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-actuator</artifactId>
   </dependency>
   
   <!--zookeeper 客户端-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId>
   </dependency>
   <!--gateway 网关-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-gateway</artifactId>
   </dependency>
   ```

2. 服务应用启动类`GatewayApplication`

   ```java
   /**
    * 服务网关应用服务
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/9
    */
   @SpringBootApplication
   public class GatewayApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(GatewayApplication.class, args);
       }
   }
   ```

3. 配置文件`application.yml`（直连方式）

   ```yaml
   spring:
     application:
       name: gateway-gateway
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
       loadbalancer:
         ribbon:
           enabled: false # 关闭Ribbon
       gateway:
         routes:
           - id: gateway-server
             uri: http://127.0.0.1:54692
             predicates:
             - Path=/gateway-server/**
             filters:
             - StripPrefix=1 #去掉Path一个/路径分割,http://127.0.0.1:54692/**
   
   server:
     port: 6060
   ```

   > 通过`uri`直连方式，访问地址：`http://127.0.0.1:6060/gateway-server/echo?message=hello`
   >
   > 访问结果：`ECHO(54692):hello`

4. 调整配置文件`application.yml`（服务发现方式）

   ```yaml
   spring:
     application:
       name: gateway-gateway
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
       loadbalancer:
         ribbon:
           enabled: false # 关闭Ribbon
       gateway:
         routes:
           - id: gateway-server
             #uri: http://127.0.0.1:54692
             uri: lb://gateway-server
             predicates:
             - Path=/gateway-server/**
             filters:
             - StripPrefix=1 #去掉Path一个/路径分割,http://127.0.0.1:54692/**
   
   server:
     port: 6060
   ```

   > 服务发现方式（负载均衡），访问地址：`http://127.0.0.1:6060/gateway-server/echo?message=hello`
   >
   > 访问结果：`ECHO(54692):hello`

### 核心`api`

* `org.springframework.cloud.gateway.handler.predicate.RoutePredicateFactory` 路由匹配工厂
  * `PathRoutePredicateFactory` 路径路由匹配
  * ...
* `org.springframework.cloud.gateway.filter.factory.GatewayFilterFactory` 网关过滤器工厂
  * `org.springframework.cloud.gateway.filter.factory.StripPrefixGatewayFilterFactory` 去掉前缀过滤器工厂
  * ...
* `org.springframework.cloud.gateway.filter.GatewayFilter` 网关过滤器
* `org.springframework.cloud.gateway.filter.GatewayFilterChain` 网关过滤器的链
* `org.springframework.cloud.gateway.filter.GlobalFilter` 全局的过滤器
  * `org.springframework.cloud.gateway.filter.ReactiveLoadBalancerClientFilter` 负载均衡的过滤器
  * ...
* `org.springframework.cloud.gateway.route.RouteDefinition` 路由信息的定义
* `org.springframework.cloud.gateway.route.RouteDefinitionLocator` 路由信息加载器
* `org.springframework.cloud.gateway.route.RouteDefinitionRepository` 路由信息的仓储