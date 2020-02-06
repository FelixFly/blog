---
title: Spring Cloud服务注册与服务发现
author: FelixFly
date: 2020-01-29
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. 核心api
2. 基于Euraka的注册中心

<!-- more -->

# Spring Cloud服务注册与服务发现

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE
>
> Zookeeper :  3.5.6
>
> Consul : 1.6.3
>
> Nacos: 1.1.4

## 核心api

* `org.springframework.cloud.client.serviceregistry.ServiceRegistry`  服务注册

  * `org.springframework.cloud.client.serviceregistry.Registration` 注册信息
    * `org.springframework.cloud.client.ServiceInstance` 服务实例信息

  > 服务注册只能单注册中心，不能多注册中心

* `org.springframework.cloud.client.discovery.DiscoveryClient` 服务发现

  * `org.springframework.cloud.client.ServiceInstance` 服务实例信息

  > 默认实现：`org.springframework.cloud.client.discovery.composite.CompositeDiscoveryClient`，可以多种服务发现并行

## 基于Euraka的注册中心以及服务发现

### 服务端

#### 应用

1. 添加pom依赖

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   
   <!--eureka注册中心-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
   </dependency>
   ```

2. 配置文件`application.yml`

   ```yaml
   spring:
     application:
       name: euraka-server
   server:
     port: 9090
   
   eureka:
     client:
       service-url:
         defaultZone: http://127.0.0.1:${server.port}/eureka/
   ```

3.  启动类`EurekaDiscoveryServerApplication`

   ```java
   /**
    * Eureka 服务发现注册中心
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/1
    */
   @SpringBootApplication
   @EnableEurekaServer
   public class EurekaDiscoveryServerApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(EurekaDiscoveryServerApplication.class, args);
       }
   }
   ```

Eureka 服务端访问地址： `http://127.0.0.1:9090/`

> Spring Cloud Eureka 服务端配置类：`org.springframework.cloud.netflix.eureka.server.EurekaServerConfigBean`
>
> Eureka 服务端端点: `https://github.com/Netflix/eureka/wiki/Eureka-REST-operations`
>
> Spring Cloud Eureka 服务端 端点去掉版本信息即可，比如`/eureka/v2/apps`改成`/eureka/apps`

#### 源码分析

* 分析`@EnableEurekaServer`

  ```java
  @Target(ElementType.TYPE)
  @Retention(RetentionPolicy.RUNTIME)
  @Documented
  @Import(EurekaServerMarkerConfiguration.class)
  public @interface EnableEurekaServer {
  
  }
  
  @Configuration(proxyBeanMethods = false)
  public class EurekaServerMarkerConfiguration {
  
  	@Bean
  	public Marker eurekaServerMarkerBean() {
  		return new Marker();
  	}
  
  	class Marker {
  
  	}
  
  }
  ```

  导入了`EurekaServerMarkerConfiguration`配置信息，该配置注册了`Marker`的`Bean`，由前面的`@EnableConfigServer`得知，这个`Marker`的`Bean`是一个类`EurekaServerAutoConfiguration`的自动装配条件

* 分析`EurekaServerAutoConfiguration`

  ```java
  @Configuration(proxyBeanMethods = false)
  @Import(EurekaServerInitializerConfiguration.class)
  @ConditionalOnBean(EurekaServerMarkerConfiguration.Marker.class)
  @EnableConfigurationProperties({ EurekaDashboardProperties.class,
  		InstanceRegistryProperties.class })
  @PropertySource("classpath:/eureka/server.properties")
  public class EurekaServerAutoConfiguration implements WebMvcConfigurer{
      ...
  }
  ```

  导入了`EurekaServerInitializerConfiguration`配置信息

### 客户端

1. 添加pom依赖

   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   
   <!--eureka 客户端-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
   </dependency>
   ```

2. 配置文件application.yml(由于采用多个客户端，客户端采用profile进行区分)

   ```yaml
   spring:
     application:
       name: discovery-client
   eureka:
     client:
       enabled: false
   --- # eureka profile
   spring:
     profiles: eureka
   server:
     port: 8090
   eureka:
     client:
       enabled: true
       service-url:
         defaultZone: http://127.0.0.1:9090/eureka/
   ```

3. 启动类`DiscoveryClientApplication`

   ```java
   /**
    * 服务发现客户端程序
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/1
    */
   @SpringBootApplication
   //@EnableDiscoveryClient // 这个注解可以去掉
   public class DiscoveryClientApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(DiscoveryClientApplication.class, args);
       }
   }
   ```

4. 配置服务发现端点

   ```java
   /**
    * {@link DiscoveryClient} 端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/1
    */
   @RestController
   public class DiscoveryClientController {
   
       @Autowired
       private DiscoveryClient discoveryClient;
   
   
       @GetMapping("/services")
       public List<String> getServices() {
           return this.discoveryClient.getServices();
       }
   
       @GetMapping("/services/{serviceId}")
       public List<ServiceInstance> getInstances(@PathVariable String serviceId) {
           return this.discoveryClient.getInstances(serviceId);
       }
   
   
       @GetMapping("/services/{serviceId}/{instanceId}")
       public ServiceInstance getInstance(@PathVariable String serviceId,
                                          @PathVariable String instanceId) {
           return this.discoveryClient.getInstances(serviceId).stream()
                   .filter(serviceInstance -> serviceInstance.getInstanceId().equals(instanceId))
                   .findAny()
                   .orElseThrow(() -> new RuntimeException("无此[" + instanceId + "]对应的实例服务"));
       }
   }
   ```

   配置项目运行参数`--spring.profiles.active=eureka`进行启动

   端点访问：

   * `http://127.0.0.1:8090/services` 所有服务

     ```json
     [
         "euraka-server",
         "discovery-client"
     ]
     ```

   * `http://127.0.0.1:8090/services/discovery-client` `discovery-client`服务下所有实例

     ```json
     [{
             "host": "LAPTOP-DC0GJVN9",
             "port": 8090,
             "metadata": {
                 "management.port": "8090"
             },
             "secure": false,
             "instanceId": "LAPTOP-DC0GJVN9:discovery-client:8090",
             "uri": "http://LAPTOP-DC0GJVN9:8090",
             "serviceId": "DISCOVERY-CLIENT",
             "instanceInfo": {
                 "instanceId": "LAPTOP-DC0GJVN9:discovery-client:8090",
                 "app": "DISCOVERY-CLIENT",
                 "appGroupName": null,
                 "ipAddr": "192.168.43.160",
                 "sid": "na",
                 "homePageUrl": "http://LAPTOP-DC0GJVN9:8090/",
                 "statusPageUrl": "http://LAPTOP-DC0GJVN9:8090/actuator/info",
                 "healthCheckUrl": "http://LAPTOP-DC0GJVN9:8090/actuator/health",
                 "secureHealthCheckUrl": null,
                 "vipAddress": "discovery-client",
                 "secureVipAddress": "discovery-client",
                 "countryId": 1,
                 "dataCenterInfo": {
                     "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                     "name": "MyOwn"
                 },
                 "hostName": "LAPTOP-DC0GJVN9",
                 "status": "UP",
                 "overriddenStatus": "UNKNOWN",
                 "leaseInfo": {
                     "renewalIntervalInSecs": 30,
                     "durationInSecs": 90,
                     "registrationTimestamp": 1580651487603,
                     "lastRenewalTimestamp": 1580651487603,
                     "evictionTimestamp": 0,
                     "serviceUpTimestamp": 1580651487094
                 },
                 "isCoordinatingDiscoveryServer": false,
                 "metadata": {
                     "management.port": "8090"
                 },
                 "lastUpdatedTimestamp": 1580651487603,
                 "lastDirtyTimestamp": 1580651487044,
                 "actionType": "ADDED",
                 "asgName": null
             },
             "scheme": null
         }
     ]
     ```

   * `http://127.0.0.1:8090/services/discovery-client/LAPTOP-DC0GJVN9:discovery-client:8090` `discovery-client`服务下`LAPTOP-DC0GJVN9:discovery-client:8090`实例具体信息

     ```json
     {
         "host": "LAPTOP-DC0GJVN9",
         "port": 8090,
         "metadata": {
             "management.port": "8090"
         },
         "secure": false,
         "instanceId": "LAPTOP-DC0GJVN9:discovery-client:8090",
         "uri": "http://LAPTOP-DC0GJVN9:8090",
         "serviceId": "DISCOVERY-CLIENT",
         "instanceInfo": {
             "instanceId": "LAPTOP-DC0GJVN9:discovery-client:8090",
             "app": "DISCOVERY-CLIENT",
             "appGroupName": null,
             "ipAddr": "192.168.43.160",
             "sid": "na",
             "homePageUrl": "http://LAPTOP-DC0GJVN9:8090/",
             "statusPageUrl": "http://LAPTOP-DC0GJVN9:8090/actuator/info",
             "healthCheckUrl": "http://LAPTOP-DC0GJVN9:8090/actuator/health",
             "secureHealthCheckUrl": null,
             "vipAddress": "discovery-client",
             "secureVipAddress": "discovery-client",
             "countryId": 1,
             "dataCenterInfo": {
                 "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                 "name": "MyOwn"
             },
             "hostName": "LAPTOP-DC0GJVN9",
             "status": "UP",
             "overriddenStatus": "UNKNOWN",
             "leaseInfo": {
                 "renewalIntervalInSecs": 30,
                 "durationInSecs": 90,
                 "registrationTimestamp": 1580651487603,
                 "lastRenewalTimestamp": 1580651487603,
                 "evictionTimestamp": 0,
                 "serviceUpTimestamp": 1580651487094
             },
             "isCoordinatingDiscoveryServer": false,
             "metadata": {
                 "management.port": "8090"
             },
             "lastUpdatedTimestamp": 1580651487603,
             "lastDirtyTimestamp": 1580651487044,
             "actionType": "ADDED",
             "asgName": null
         },
         "scheme": null
     }
     ```

> 关于@EnableDiscoveryClient说明
>
> Spring Cloud Commons provides the @EnableDiscoveryClient annotation. This looks for
> implementations of the DiscoveryClient and ReactiveDiscoveryClient interfaces with META-INF/
> spring.factories. Implementations of the discovery client add a configuration class to
> spring.factories under the org.springframework.cloud.client.discovery.EnableDiscoveryClient key.
>
> Spring Cloud基础提供`@EnableDiscoveryClient`,该注解查找`META-INF/spring.factories`下`DiscoveryClient` 和`ReactiveDiscoveryClient`接口的实现。服务发现的配置和实现在`spring.factories`中`org.springframework.cloud.client.discovery.EnableDiscoveryClient`key下面。
>
> @EnableDiscoveryClient is no longer required. You can put a DiscoveryClient
> implementation on the classpath to cause the Spring Boot application to register
> with the service discovery server.
>
> `@EnableDiscoveryClient`不再是必须的。你可以将`DiscoveryClient`实现放到目录下来影响Spring Boot应用注册服务发现服务。
>
> To enable the Sidecar, create a Spring Boot application with @EnableSidecar. This annotation
> includes @EnableCircuitBreaker, @EnableDiscoveryClient, and @EnableZuulProxy. Run the resulting
> application on the same host as the non-JVM application.
>
> 为了启用边车模式，创建Spring Boot 应用使用`@EnableSidecar`。该注解包含`@EnableCircuitBreaker`、`@EnableDiscoveryClient`和`@EnableZuulProxy`。在同一主机启动应用作为非JVM应用。

## 基于Zookeeper的注册中心以及服务发现

### 服务端

1. [下载地址](https://archive.apache.org/dist/zookeeper/zookeeper-3.5.6/)
2. 解压并修改conf/zoo.cfg文件名
3. 在bin/zkServer进行启动

### 客户端

> 应用代码部分跟Eureka客户端相同

1. 添加pom依赖

   ```xml
   <!--zookeeper 客户端-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId>
   </dependency>
   ```

2. 配置文件application.yml(由于采用多个客户端，客户端采用profile进行区分)

   ```yaml
   spring:
     application:
       name: discovery-client
     cloud:
       zookeeper: # 关闭 zookeeper 服务发现
         enabled: false # 关闭zookeeper
         discovery:
           enabled: false
   eureka:
     client:
       enabled: false
   --- # eureka profile
   spring:
     profiles: eureka
   server:
     port: 8090
   eureka:
     client:
       enabled: true
       service-url:
         defaultZone: http://127.0.0.1:9090/eureka/
   
   --- # zookeeper profile
   spring:
     profiles: zookeeper
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
         enabled: true
         discovery:
           enabled: true
   server:
     port: 0
   ```

   配置项目运行参数`--spring.profiles.active=zookeeper`进行启动,由于配置采用`server.port=0`随机端口，根据启动日志来甄别启动端口（*本机随机到的端口是57189*）

   端点访问：

   * `http://127.0.0.1:57189/services` 所有服务

     ```json
     [
         "discovery-client"
     ]
     ```

   * `http://127.0.0.1:57189/services/discovery-client` `discovery-client`服务下所有实例

     ```json
     [{
             "serviceId": "discovery-client",
             "host": "LAPTOP-DC0GJVN9",
             "port": 57189,
             "secure": false,
             "uri": "http://LAPTOP-DC0GJVN9:57189",
             "metadata": {},
             "serviceInstance": {
                 "name": "discovery-client",
                 "id": "d6475c0a-e0ee-4deb-9c03-454c3186f264",
                 "address": "LAPTOP-DC0GJVN9",
                 "port": 57189,
                 "sslPort": null,
                 "payload": {
                     "id": "application-1",
                     "name": "discovery-client",
                     "metadata": {}
                 },
                 "registrationTimeUTC": 1580654720186,
                 "serviceType": "DYNAMIC",
                 "uriSpec": {
                     "parts": [{
                             "value": "scheme",
                             "variable": true
                         }, {
                             "value": "://",
                             "variable": false
                         }, {
                             "value": "address",
                             "variable": true
                         }, {
                             "value": ":",
                             "variable": false
                         }, {
                             "value": "port",
                             "variable": true
                         }
                     ]
                 },
                 "enabled": true
             },
             "instanceId": "d6475c0a-e0ee-4deb-9c03-454c3186f264",
             "scheme": null
         }
     ]
     ```

   * `http://127.0.0.1:57189/services/discovery-client/d6475c0a-e0ee-4deb-9c03-454c3186f264` `discovery-client`服务下`d6475c0a-e0ee-4deb-9c03-454c3186f264`实例具体信息

     ```json
     {
         "serviceId": "discovery-client",
         "host": "LAPTOP-DC0GJVN9",
         "port": 57189,
         "secure": false,
         "uri": "http://LAPTOP-DC0GJVN9:57189",
         "metadata": {},
         "serviceInstance": {
             "name": "discovery-client",
             "id": "d6475c0a-e0ee-4deb-9c03-454c3186f264",
             "address": "LAPTOP-DC0GJVN9",
             "port": 57189,
             "sslPort": null,
             "payload": {
                 "id": "application-1",
                 "name": "discovery-client",
                 "metadata": {}
             },
             "registrationTimeUTC": 1580654720186,
             "serviceType": "DYNAMIC",
             "uriSpec": {
                 "parts": [{
                         "value": "scheme",
                         "variable": true
                     }, {
                         "value": "://",
                         "variable": false
                     }, {
                         "value": "address",
                         "variable": true
                     }, {
                         "value": ":",
                         "variable": false
                     }, {
                         "value": "port",
                         "variable": true
                     }
                 ]
             },
             "enabled": true
         },
         "instanceId": "d6475c0a-e0ee-4deb-9c03-454c3186f264",
         "scheme": null
     }
     ```


   ## 基于Consul的注册中心以及服务发现

   ### 服务端

   1. [下载地址](https://www.consul.io/downloads.html)

   2. 解压

   3. 在Consul目录下执行`consul agent -dev`

      > windows下是`.\consul.exe agent -dev`

   ### 客户端

   > 应用代码部分跟Eureka客户端相同

   1. 添加pom依赖
   
      ```xml
      <!--consul 客户端-->
      <dependency>
       <groupId>org.springframework.cloud</groupId>
          <artifactId>spring-cloud-starter-consul-discovery</artifactId>
      </dependency>
      ```
   
   2. 配置文件application.yml(由于采用多个客户端，客户端采用profile进行区分)
   
      ```yaml
      spring:
        application:
          name: discovery-client
        cloud:
          zookeeper: # 关闭 zookeeper 服务发现
            enabled: false # 关闭zookeeper
            discovery:
              enabled: false
          consul: # 关闭 consul 服务发现
            discovery:
              register: false
              enabled: false
            enabled: false
      eureka:
        client:
          enabled: false
      --- # eureka profile
      spring:
        profiles: eureka
      server:
        port: 8090
      eureka:
        client:
          enabled: true
          service-url:
            defaultZone: http://127.0.0.1:9090/eureka/
      
      --- # zookeeper profile
      spring:
        profiles: zookeeper
        cloud:
          zookeeper:
            connect-string: 127.0.0.1:2181
            enabled: true
         discovery:
              enabled: true
      server:
        port: 0
      --- # consul profile
      spring:
       profiles: consul
        cloud:
          consul:
            enabled: true
            host: 127.0.0.1
            port: 8500
         discovery:
              register: true
           enabled: true
      server:
        port: 8191
      ```
      
      配置项目运行参数`--spring.profiles.active=consul`进行启动
      
      端点访问：
      
      * `http://127.0.0.1:8191/services` 所有服务
      
        ```json
        [
            "consul",
            "discovery-client"
        ]
        
        ```
      
      * `http://127.0.0.1:8191/services/discovery-client` `discovery-client`服务下所有实例
      
        ```json
        [{
                "instanceId": "discovery-client-8191",
                "serviceId": "discovery-client",
                "host": "LAPTOP-DC0GJVN9",
                "port": 8191,
                "secure": false,
                "metadata": {
                    "secure": "false"
                },
                "uri": "http://LAPTOP-DC0GJVN9:8191",
                "scheme": null
            }
        ]
        ```
        
      * `http://127.0.0.1:8191/services/discovery-client/discovery-client-8191` `discovery-client`服务下`discovery-client-8191`实例具体信息
      
        ```json
        {
            "instanceId": "discovery-client-8191",
            "serviceId": "discovery-client",
            "host": "LAPTOP-DC0GJVN9",
            "port": 8191,
            "secure": false,
            "metadata": {
                "secure": "false"
         },
            "uri": "http://LAPTOP-DC0GJVN9:8191",
         "scheme": null
        }
        ```
       ```
        
       ```

## 基于Nacos的注册中心以及服务发现

### 服务端

1. [下载地址](https://github.com/alibaba/nacos/releases)
2. 解压
3. 在bin/startup进行启动

### 客户端

> 应用代码部分跟Eureka客户端相同

1. 添加pom依赖

   ```xml
   <!--nacos 客户端-->
   <dependency>
       <groupId>com.alibaba.cloud</groupId>
       <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
       <version>2.1.1.RELEASE</version>
   </dependency>
   ```

2. 配置文件application.yml(由于采用多个客户端，客户端采用profile进行区分)

   ```yaml
   spring:
     application:
       name: discovery-client
     cloud:
       zookeeper: # 关闭 zookeeper 服务发现
         enabled: false # 关闭zookeeper
         discovery:
           enabled: false
       consul: # 关闭 consul 服务发现
         discovery:
           register: false
           enabled: false
         enabled: false
       nacos: # 关闭 nacos 服务发现
         discovery:
           enabled: false
   # 暴露所有端点
   management:
     endpoints:
       web:
         exposure:
           include: '*'
   eureka:
     client:
       enabled: false
   --- # eureka profile
   spring:
     profiles: eureka
   server:
     port: 8090
   eureka:
     client:
       enabled: true
       service-url:
      defaultZone: http://127.0.0.1:9090/eureka/
      --- # zookeeper profile
      spring:
     profiles: zookeeper
        cloud:
       zookeeper:
            connect-string: 127.0.0.1:2181
            enabled: true
            discovery:
              enabled: true
      server:
     port: 0
      --- # consul profile
   spring:
        profiles: consul
        cloud:
          consul:
            enabled: true
            host: 127.0.0.1
            port: 8500
            discovery:
              register: true
              enabled: true
      server:
        port: 8191
      --- # nacos profile
      spring:
        profiles: nacos
        cloud:
          nacos:
            discovery:
              enabled: true
              server-addr: http://127.0.0.1:8848/
      server:
        port: 0
   
   ```

 配置项目运行参数`--spring.profiles.active=nacos`进行启动,由于配置采用`server.port=0`随机端口，根据启动日志来甄别启动端口（*本机随机到的端口是57785*）

   端点访问：

   * `http://127.0.0.1:57785/services` 所有服务
   
     ```json
     [
         "discovery-client"
     ]
     ```

   * `http://127.0.0.1:57785/services/discovery-client` `discovery-client`服务下所有实例
   
     ```json
     [{
             "serviceId": "discovery-client",
             "host": "192.168.43.160",
             "port": 57785,
             "secure": false,
             "metadata": {
                 "nacos.instanceId": "192.168.43.160#57785#DEFAULT#DEFAULT_GROUP@@discovery-client",
                 "nacos.weight": "1.0",
                 "nacos.cluster": "DEFAULT",
              "nacos.healthy": "true",
                 "preserved.register.source": "SPRING_CLOUD"
          },
             "uri": "http://192.168.43.160:57785",
             "scheme": null,
             "instanceId": null
         }
     ]
     ```
     
     > nacos的这个instanceId没有值，没办法获取单个的实例具体信息
     

## 注册中心总结

|    特性\注册中心    |      Eurka       |      Consul      | Zookeeper |   Nacos    |
| :-----------------: | :--------------: | :--------------: | :-------: | :--------: |
| server.port随机端口 |    默认不支持    |    默认不支持    |   支持    |    支持    |
|      适用规模       |      5K-10K      |       <3K        |  10K-20K  | 100K-1000K |
|       CAP模型       | AP（最终一致性） | AP（最终一致性） |    CP     | 未知待测定 |

>  server.port随机端口默认不支持说明：可以调整instanceId来支持，默认是应用名称、端口以及其他信息组成

