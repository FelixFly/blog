---
title: Spring Cloud负载均衡
author: FelixFly
date: 2020-02-04
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. 理论知识
2. 自定义负载均衡
3. `Spring Cloud LoadBalanced`实现
4. `Netflix Ribbon` 实现

<!-- more -->

# Spring Cloud负载均衡

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE
>
> Zookeeper :  3.5.6  （注册中心使用）

## 理论知识

负载均衡分为4层负载和7层负载（4层和7层负载是针对网络协议），还可以分为客户端负载和服务端负载

* 4层负载 一般来说是硬件负载，比如`F5`
* 7层负载 一般来说是软件负载，比如`Nginx`

> `OSI`模型(`Open System Interconnection Reference Model` 开放式系统互联通信参考模型)
>
> 1. 物理层
> 2. 数据链路层
> 3. 网络层
> 4. 传输层
> 5. 会话层
> 6. 表达层
> 7. 应用层 

### 常见负载均衡算法

* Round Robin 轮询
* Random 随机
* Hash 哈希

* Least Connections 最小连接数
* Least Time 最少时间
* Least Response Times 最小响应时间

## 自定义负载均衡

### 服务端

> 一个简单的对外提供服务，基于`Zookeeper`注册中心

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

2. 简单的对外提供服务端点

   ```java
   /**
    * 服务提供端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/4
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

3. 配置文件`application.yml`

   ```yaml
   spring:
     application:
       name: load-balance-server
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
   server:
     port: 0
   ```

4. 服务启动程序类`LoadBalanceServerApplication`

   ```java
   /**
    * 负载均衡服务端启动程序
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/4
    */
   @SpringBootApplication
   public class LoadBalanceServerApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(LoadBalanceServerApplication.class, args);
       }
   }
   ```

   > 启动服务，根据启动日志查看本地的随机端口，此次端口是`50939`
   >
   > `http://127.0.0.1:50939/echo?message=Hello` 返回信息ECHO(50939):Hello

### 客户端

> 了解`RestTemplate`核心`api`
>
> * `org.springframework.web.client.RestTemplate` Rest客户端模板
> * `org.springframework.http.client.ClientHttpRequestFactory` `http`客户端请求工厂
>   * `org.springframework.http.client.SimpleClientHttpRequestFactory` 简单实现（`JDK`）
>   * `org.springframework.http.client.HttpComponentsClientHttpRequestFactory` apache HTTP组件实现
>   * `org.springframework.http.client.OkHttp3ClientHttpRequestFactory` `OkHttp`实现
> * `org.springframework.http.client.ClientHttpRequest` `http`客户端请求
>   * `org.springframework.http.HttpRequest` `http` 请求信息
>     * `org.springframework.http.HttpMessage` `http`请求头信息
>   * `org.springframework.http.HttpOutputMessage` `http`返回信息
>     * `org.springframework.http.HttpMessage` `http`请求头信息
> * `org.springframework.http.client.ClientHttpResponse` `http`客户端返回信息
>
> 序列化与反序列化是通过`Spring MVC`组件进行转换
>
> * `org.springframework.http.converter.HttpMessageConverter` `http`信息转换

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

2. 客户端提供服务端点

   ```java
   /**
    * 服务提供端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/4
    */
   @RestController
   public class EchoController {
   
       @Autowired
       private RestTemplate restTemplate;
   
       @GetMapping("/{serveName}/echo/{message}")
       public String echo(@PathVariable String serveName,@PathVariable String message) {
           return restTemplate.getForObject("http://"+serveName+"/echo?message=" + message, String.class);
       }
       
   }
   ```
   
3. 配置文件`application.yml`

   ```yaml
   spring:
     application:
       name: load-balance-client
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
   server:
     port: 8080
   ```

4. `RestTemplate`拦截器`LoadBalancedRequestInterceptor`

   ```java
   /**
    * 自定义实现负载均衡拦截器
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/4
    */
   @Component
   public class LoadBalancedRequestInterceptor implements ClientHttpRequestInterceptor {
   
       @Autowired
       private DiscoveryClient discoveryClient;
   
   
       @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
               throws IOException {
           URI uri = request.getURI();
           // 主机名
           String host = uri.getHost();
           List<ServiceInstance> instances = this.discoveryClient.getInstances(host);
           // 暂不考虑没有服务的情况
           int size = instances.size();
           // 随机
           int index = new Random().nextInt(size);
           ServiceInstance instance = instances.get(index);
           String url = (instance.isSecure() ? "https://" : "http://") +
                   instance.getHost() + ":" + instance.getPort()+uri.getPath()+"?"+uri.getQuery();
           // 客户端调用
           ClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
           ClientHttpRequest clientHttpRequest = requestFactory.createRequest(URI.create(url), request.getMethod());
           return clientHttpRequest.execute();
       }
   }
   ```
   
5. 服务启动程序类`LoadBalanceServerApplication`

   ```java
   **
    * 负载均衡客户端启动程序
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/4
    */
   @SpringBootApplication
   public class LoadBalanceClientApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(LoadBalanceClientApplication.class, args);
       }
   
       @Bean
       @Autowired
       public RestTemplate restTemplate(LoadBalancedRequestInterceptor interceptor){
           RestTemplate restTemplate = new RestTemplate();
           restTemplate.setInterceptors(Collections.singletonList(interceptor));
           return restTemplate;
       }
   
   }
   ```

   > 启动服务，`http://127.0.0.1:8090/load-balance-server/echo/hello` 返回信息ECHO(51157):hello
   >

## `Spring Cloud LoadBalanced`实现

> * Spring `RestTemplate` as a Load Balancer Client
>* Spring `WebClient` as a Load Balancer Client
> * Spring `WebFlux` `WebClient` with `ReactorLoadBalancerExchangeFilterFunction`

#### `@LoadBalanced`注解分析

```java
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@Qualifier
public @interface LoadBalanced {

}
```

`@Qualifier`注解的作用

* 配置`value`的时候 根据Bean的名称（name）或者别名(alias)进行查找
* 没有配置的时候 标识分类

示例:

```java
/**
 * {@link Qualifier}应用
 *
 * @author xcl <xcl@winning.com.cn>
 * @date 2020/2/4
 */
@SpringBootApplication
public class QualifierApplication  implements ApplicationRunner {

    @Bean
    public String a(){
        return "bean-a";
    }

    @Bean
    @Qualifier
    public String b(){
        return "bean-b";
    }

    @Bean
    @Qualifier
    public String c(){
        return "bean-c";
    }

    @Autowired
    private Map<String,String> beans;

    @Autowired
    @Qualifier
    private Map<String, String> qualifierBeans;

    public static void main(String[] args) {
        new SpringApplicationBuilder(QualifierApplication.class)
                .web(WebApplicationType.NONE)
                .run(args);
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println(beans);
        System.out.println(qualifierBeans);
    }
}
```

打印结果：

```
{a=bean-a, b=bean-b, c=bean-c}
{b=bean-b, c=bean-c}
```

从结果可知：Bean b 和Bean c根据`@Qualifier`进行了分组

#### `@LoadBalanced`注解使用

1. 客户端注册`@LoadBalanced`的`RestTemplate`

   ```java
   /**
    * 负载均衡客户端启动程序
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/4
    */
   @SpringBootApplication
   public class LoadBalanceClientApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(LoadBalanceClientApplication.class, args);
       }
   
       @Bean
       @Autowired
       public RestTemplate restTemplate(LoadBalancedRequestInterceptor interceptor){
           RestTemplate restTemplate = new RestTemplate();
           restTemplate.setInterceptors(Collections.singletonList(interceptor));
           return restTemplate;
       }
   
   
       @Bean
       @LoadBalanced
       public RestTemplate lbRestTemplate(){
           return new RestTemplate();
       }
   
   }
   ```

2. 调整客户端提供服务端点

   ```java
   /**
    * 服务提供端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/4
    */
   @RestController
   public class EchoController {
   
       @Autowired
       private RestTemplate restTemplate;
   
       @Autowired
       @LoadBalanced
       private RestTemplate lbRestTemplate;
   
       @GetMapping("/{serveName}/echo/{message}")
       public String echo(@PathVariable String serveName,@PathVariable String message) {
           return restTemplate.getForObject("http://"+serveName+"/echo?message=" + message, String.class);
       }
   
   
       @GetMapping("/{serveName}/lb-echo/{message}")
       public String lbEcho(@PathVariable String serveName,@PathVariable String message) {
           return lbRestTemplate.getForObject("http://"+serveName+"/echo?message=" + message, String.class);
       }
   
   }
   ```

   > 启动服务，`http://127.0.0.1:8090/load-balance-server/lb-echo/hello` 返回信息ECHO(51157):hello

#### `@LoadBalanced`核心`api`

* `org.springframework.cloud.client.loadbalancer.LoadBalancerInterceptor`  负载均衡的`RestTemplate`拦截器

* `org.springframework.cloud.client.loadbalancer.LoadBalancerClient` 负载均衡的客户端
  
  * `org.springframework.cloud.client.loadbalancer.ServiceInstanceChooser` 服务实例选择器
  
  > 实现类：
  >
  > * `org.springframework.cloud.loadbalancer.blocking.client.BlockingLoadBalancerClient` `Spring Cloud LoadBalancer`实现
  > * `org.springframework.cloud.netflix.ribbon.RibbonLoadBalancerClient` Ribbon实现类
  
* `org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier` 服务实例列表生成器

  > 基于`DiscoveryClient`和`ReactiveDiscoveryClient`实现：`org.springframework.cloud.loadbalancer.core.DiscoveryClientServiceInstanceListSupplier`
  
* `org.springframework.cloud.loadbalancer.core.ReactorServiceInstanceLoadBalancer` 响应式服务实例负载均衡器

  * `org.springframework.cloud.loadbalancer.core.ReactorLoadBalancer` 响应式负载均衡器
    * `org.springframework.cloud.client.loadbalancer.reactive.ReactiveLoadBalancer`  响应式的负载均衡器

  > 默认实现是轮询的负载均衡器：`org.springframework.cloud.loadbalancer.core.RoundRobinLoadBalancer`
  >
  > **仅且仅有这一种实现**

## `Netflix Ribbon` 实现

### 核心`api`

> Ribbon客户端配置类`org.springframework.cloud.netflix.ribbon.RibbonClientConfiguration`

* `com.netflix.loadbalancer.ILoadBalancer` 负载均衡接口

  > 默认实现：`com.netflix.loadbalancer.ZoneAwareLoadBalancer` 
  >
  > 父类：`com.netflix.loadbalancer.DynamicServerListLoadBalancer` 动态服务列表负载均衡器

* `com.netflix.client.config.IClientConfig` 客户端配置

  > 默认实现：`com.netflix.client.config.DefaultClientConfigImpl`

* `com.netflix.loadbalancer.IRule` 负载规则

  > 默认实现：`com.netflix.loadbalancer.ZoneAvoidanceRule`
  >
  > * `com.netflix.loadbalancer.RandomRule` 随机
  > * `com.netflix.loadbalancer.RoundRobinRule` 轮询
  > * `com.netflix.loadbalancer.WeightedResponseTimeRule` 响应时间权重
  > * `com.netflix.loadbalancer.BestAvailableRule` 最大可用
  > * `org.springframework.cloud.zookeeper.discovery.dependency.StickyRule` 粘性（返回同一个实例）

* `com.netflix.loadbalancer.IPing` 存活检测

  > 默认实现：`com.netflix.loadbalancer.DummyPing` 一直存活

* `com.netflix.loadbalancer.ServerList` 服务列表

  > 默认实现：`com.netflix.loadbalancer.ConfigurationBasedServerList` 配置的服务列表（静态服务列表）
  >
  > 配置参数：`{severName}.ribbon.listOfServers`
  >
  > 动态服务列表
  >
  > * `com.netflix.niws.loadbalancer.DiscoveryEnabledNIWSServerList` Eureka服务列表
  >
  > * `org.springframework.cloud.consul.discovery.ConsulServerList` consul服务列表
  > * `org.springframework.cloud.zookeeper.discovery.ZookeeperServerList` `Zookeeper`服务列表
  > * `com.alibaba.cloud.nacos.ribbon.NacosServerList` `Nacos`服务列表
  >
  > 缺少了一种基于`DiscoveryClient`的动态服务列表实现

* `com.netflix.loadbalancer.ServerListFilter` 服务列表过滤器

  > 默认实现: `org.springframework.cloud.netflix.ribbon.ZonePreferenceServerListFilter`

* `com.netflix.loadbalancer.ServerListUpdater` 服务列表更新器

  > 默认实现：`com.netflix.loadbalancer.PollingServerListUpdater` 服务列表轮询更新器
  >
  > * `com.netflix.niws.loadbalancer.EurekaNotificationServerListUpdater` Eureka服务列表更新器

## 备注

> As Spring Cloud Ribbon is now under maintenance, we suggest you set
> spring.cloud.loadbalancer.ribbon.enabled to false, so that BlockingLoadBalancerClient is used
> instead of RibbonLoadBalancerClient.

由于Spring Cloud Ribbon正在维护，官方推荐使用`spring.cloud.loadbalancer.ribbon.enabled`设置为false（禁用Ribbon），`BlockingLoadBalancerClient `替代`RibbonLoadBalancerClient`。

