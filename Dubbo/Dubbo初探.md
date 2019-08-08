---
title: Dubbo初探
author: FelixFly
date: 2019-07-08
tags:
    - Dubbo
categories: 
    - Dubbo
archives: 2019
---

>  版本信息：
>
>  * Spring Boot 2.1.1.RELEASE
>
>  * Dubbo 2.7.1
>  * Fastjson 1.2.58
>  * JDK 1.8.0_192

1. Dubbo初探之直连
2. Dubbo初探之`Zookeeper`

<!-- more -->

# Dubbo初探

## Dubbo初探之直连

>模块
>
>* api 模块 接口代码
>* provider模块 服务提供方代码
>* consumer模块 服务消费方代码
>
>项目结构
>
>* dubbo-demo
>    * dubbo-demo-api
>    * dubbo-demo-pc
>      * dubbo-demo-provider
>      * dubbo-demo-consumer

### dubbo-demo

1. 模块依赖

   ```xml
   <parent>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-parent</artifactId>
       <version>2.1.1.RELEASE</version>
       <relativePath/> <!-- lookup parent from repository -->
   </parent>
   <groupId>top.felixfly.dubbo</groupId>
   <artifactId>dubbo-demo</artifactId>
   <version>0.0.1-SNAPSHOT</version>
   <name>dubbo-demo</name>
   <description>Demo project for Spring Boot</description>
   
   <properties>
       <java.version>1.8</java.version>
       <dubbo.version>2.7.1</dubbo.version>
       <fastjson.version>1.2.58</fastjson.version>
   </properties>
   
   <dependencies>
       <dependency>
           <groupId>org.projectlombok</groupId>
           <artifactId>lombok</artifactId>
           <optional>true</optional>
       </dependency>
   </dependencies>
   
   
   <dependencyManagement>
       <dependencies>
           <dependency>
               <groupId>top.felixfly.dubbo</groupId>
               <artifactId>dubbo-demo-api</artifactId>
               <version>${project.version}</version>
           </dependency>
   
   
           <dependency>
               <groupId>org.apache.dubbo</groupId>
               <artifactId>dubbo</artifactId>
               <version>${dubbo.version}</version>
           </dependency>
   
           <dependency>
               <groupId>com.alibaba</groupId>
               <artifactId>fastjson</artifactId>
               <version>${fastjson.version}</version>
           </dependency>
       </dependencies>
   </dependencyManagement>
   ```

### dubbo-demo-api

1. 模块依赖

   ```xml
   <dependency>
       <groupId>com.alibaba</groupId>
       <artifactId>fastjson</artifactId>
   </dependency>
   
   <dependency>
       <groupId>org.projectlombok</groupId>
       <artifactId>lombok</artifactId>
       <optional>true</optional>
   </dependency>
   ```

2. 代码类

   * `BaseEntity`

   ```java
   package top.felixfly.dubbo.dubbodemoapi.domain;
   
   import com.alibaba.fastjson.JSON;
   
   import java.io.Serializable;
   
   /**
    * 所有的基础类都继承该类
    *
    * @author FelixFly 2019/7/16
    */
   public class BaseEntity implements Serializable {
   
       private static final long serialVersionUID = -8555020158874377412L;
   
       @Override
       public String toString() {
           return JSON.toJSONString(this);
       }
   }
   ```

   * `Result`

   ```java
   package top.felixfly.dubbo.dubbodemoapi.domain;
   
   import lombok.*;
   
   /**
    * 返回结果
    *
    * @author FelixFly 2019/7/16
    */
   @Setter
   @Getter
   @NoArgsConstructor
   @AllArgsConstructor
   @Builder
   public class Result<T> extends BaseEntity{
   
       private static final long serialVersionUID = -8163056354010044750L;
       /**
        * 错误代码
        */
       private String errCode;
       /**
        * 错误信息
        */
       private String errMsg;
       /**
        * 数据
        */
       private T data;
   }
   ```

   * `UserRequest`

   ```java
   /**
    * 用户请求
    *
    * @author FelixFly 2019/7/16
    */
   @Setter
   @Getter
   @NoArgsConstructor
   public class UserRequest extends BaseEntity{
   
       private static final long serialVersionUID = -2918126214378675288L;
   
       /**
        * 用户名
        */
       private String name;
       /**
        * 密码
        */
       private String password;
   }
   ```

   * `UserService`

   ```java
   package top.felixfly.dubbo.dubbodemoapi.service;
   
   import top.felixfly.dubbo.dubbodemoapi.domain.Result;
   import top.felixfly.dubbo.dubbodemoapi.domain.UserRequest;
   
   /**
    * 用户service
    *
    * @author FelixFly 2019/7/16
    */
   public interface UserService {
   
       /**
        * 请求处理用户信息
        *
        * @param userRequest 用户请求参数
        * @return 处理结果
        */
       Result<UserRequest> handler(UserRequest userRequest);
   }
   ```

   
   
### dubbo-demo-pc

   1. 模块依赖
   
      ```xml
      <dependency>
          <groupId>top.felixfly.dubbo</groupId>
          <artifactId>dubbo-demo-api</artifactId>
      </dependency>
      
      <dependency>
          <groupId>org.apache.dubbo</groupId>
          <artifactId>dubbo</artifactId>
      </dependency>
      ```

   ### dubbo-demo-provider

1. 代码

   * `DubboConfiguration`

     ```java
     package top.felixfly.dubbo.dubbodemo.provider.configuration;
     
     import org.apache.dubbo.config.ApplicationConfig;
     import org.apache.dubbo.config.RegistryConfig;
     import org.apache.dubbo.config.spring.context.annotation.DubboComponentScan;
     import org.springframework.context.annotation.Bean;
     import org.springframework.context.annotation.Configuration;
     
     /**
      * dubbo 配置类
      *
      * @author FelixFly 2019/7/17
      */
     @Configuration
     @DubboComponentScan(basePackages = "top.felixfly.dubbo.dubbodemo.provider.service")
     public class DubboConfiguration {
     
         @Bean
         public ApplicationConfig applicationConfig() {
             ApplicationConfig applicationConfig = new ApplicationConfig();
             applicationConfig.setName("dubbo-provide");
             return applicationConfig;
         }
     
     
         @Bean
         public RegistryConfig registryConfig() {
             RegistryConfig registryConfig = new RegistryConfig();
             // 没有注册中心，采用直连方式
             registryConfig.setAddress("N/A");
             return registryConfig;
         }
     }
     ```
     
* `UserServiceImpl`
   
  ```java
     package top.felixfly.dubbo.dubbodemo.provider.service;
     
     import org.apache.dubbo.config.annotation.Service;
     import top.felixfly.dubbo.dubbodemoapi.domain.Result;
     import top.felixfly.dubbo.dubbodemoapi.domain.UserRequest;
     import top.felixfly.dubbo.dubbodemoapi.service.UserService;
     
     /**
      * {@link UserService} 用户service实现类
      *
      * @author FelixFly 2019/7/17
      */
     @Service(version = "1.0.0")
     public class UserServiceImpl implements UserService {
     
         @Override
         public Result<UserRequest> handler(UserRequest userRequest) {
             System.out.println(userRequest);
             return Result.<UserRequest>builder().data(userRequest).errCode("200").errMsg("成功").build();
         }
     }
     
     ```
   
* `DubboProviderServer`
   
  ```java
     package top.felixfly.dubbo.dubbodemo.provider;
     
     import org.springframework.context.annotation.AnnotationConfigApplicationContext;
     import top.felixfly.dubbo.dubbodemo.provider.configuration.DubboConfiguration;
     
     import java.io.IOException;
     
     /**
      * 服务提供者启动类
      *
      * @author FelixFly 2019/7/17
      */
     public class DubboProviderServer {
     
         public static void main(String[] args) throws IOException {
             AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(DubboConfiguration.class);
             context.start();
     
             // 阻塞程序
             System.in.read();
         }
     }
     
     ```

2. 启动服务`DubboProviderServer`

   ```verilog
   Connected to the target VM, address: '127.0.0.1:53008', transport: 'socket'
   七月 17, 2019 11:02:40 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息: using logger: org.apache.dubbo.common.logger.jcl.JclLoggerAdapter
   七月 17, 2019 11:02:41 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] BeanNameGenerator bean can't be found in BeanFactory with name [org.springframework.context.annotation.internalConfigurationBeanNameGenerator], dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:41 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] BeanNameGenerator will be a instance of org.springframework.context.annotation.AnnotationBeanNameGenerator , it maybe a potential problem on bean name generation., dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:41 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] The BeanDefinition[Root bean: class [org.apache.dubbo.config.spring.ServiceBean]; scope=; abstract=false; lazyInit=false; autowireMode=0; dependencyCheck=0; autowireCandidate=true; primary=false; factoryBeanName=null; factoryMethodName=null; initMethodName=null; destroyMethodName=null] of ServiceBean has been registered with name : providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:41 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] 1 annotated Dubbo's @Service Components { [Bean definition with name 'userServiceImpl': Generic bean: class [top.felixfly.dubbo.dubbodemo.provider.service.UserServiceImpl]; scope=; abstract=false; lazyInit=false; autowireMode=0; dependencyCheck=0; autowireCandidate=true; primary=false; factoryBeanName=null; factoryMethodName=null; initMethodName=null; destroyMethodName=null; defined in file [E:\Study\dubbo-demo\dubbo-demo-pc\dubbo-demo-provider\target\classes\top\felixfly\dubbo\dubbodemo\provider\service\UserServiceImpl.class]] } were scanned under package[top.felixfly.dubbo.dubbodemo.provider.service], dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:42 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] The service ready on spring started. service: top.felixfly.dubbo.dubbodemoapi.service.UserService, dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:42 上午 org.apache.dubbo.common.logger.jcl.JclLogger warn
   警告:  [DUBBO] There's no valid metadata config found, if you are using the simplified mode of registry url, please make sure you have a metadata address configured properly., dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:42 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] Export dubbo service top.felixfly.dubbo.dubbodemoapi.service.UserService to local registry, dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:42 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] Export dubbo service top.felixfly.dubbo.dubbodemoapi.service.UserService to url dubbo://192.168.217.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?anyhost=true&application=dubbo-provide&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&bind.ip=192.168.217.1&bind.port=20880&default.deprecated=false&default.dynamic=false&default.register=true&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&methods=handler&pid=17352&register=true&release=2.7.1&revision=1.0.0&side=provider&timestamp=1563332562653&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:02:45 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] Start NettyServer bind /0.0.0.0:20880, export /192.168.217.1:20880, dubbo version: 2.7.1, current host: 192.168.217.1
   ```

### dubbo-demo-consumer
1. 代码
   

	* `DubboConfiguration`
	
	  ```java
	  package top.felixfly.dubbo.dubbodemo.consumer.configuration;
	  
	  import org.apache.dubbo.config.ApplicationConfig;
	  import org.apache.dubbo.config.RegistryConfig;
	  import org.apache.dubbo.config.spring.context.annotation.DubboComponentScan;
	  import org.springframework.context.annotation.Bean;
	  import org.springframework.context.annotation.ComponentScan;
	  import org.springframework.context.annotation.Configuration;
	  
	  /**
	   * dubbo 配置类
	   * {@link DubboComponentScan} 这个没有实现{@link ComponentScan}的功能
	   *
	   * @author FelixFly 2019/7/17
	   */
	  @Configuration
	  @DubboComponentScan(basePackages = "top.felixfly.dubbo.dubbodemo.consumer.service")
	  @ComponentScan(basePackages = "top.felixfly.dubbo.dubbodemo.consumer.service")
	  public class DubboConfiguration {
	      
	      @Bean
	      public ApplicationConfig applicationConfig() {
	          ApplicationConfig applicationConfig = new ApplicationConfig();
	          applicationConfig.setName("dubbo-consumer");
	          return applicationConfig;
	      }
	  
	      @Bean
	      public RegistryConfig registryConfig() {
	          RegistryConfig registryConfig = new RegistryConfig();
	          // 没有注册中心，采用直连方式
	          registryConfig.setAddress("N/A");
	          return registryConfig;
	      }
	  }
	  
	  ```
	
	* `DefaultUserService`
	
	  ```java
	  package top.felixfly.dubbo.dubbodemo.consumer.service;
	  
	  import org.apache.dubbo.config.annotation.Reference;
	  import org.springframework.stereotype.Service;
	  import top.felixfly.dubbo.dubbodemoapi.domain.Result;
	  import top.felixfly.dubbo.dubbodemoapi.domain.UserRequest;
	  import top.felixfly.dubbo.dubbodemoapi.service.UserService;
	  
	  /**
	   * 服务调用层
	   *
	   * @author FelixFly 2019/7/17
	   */
	  @Service
	  public class DefaultUserService {
	  
	      @Reference(version = "1.0.0",url = "dubbo://127.0.0.1:20880")
	      private UserService userService;
	  
	      public Result<UserRequest> handler(UserRequest userRequest){
	          return this.userService.handler(userRequest);
	      }
	  }
	  
	  ```
	
	* `DubboConsumerServer`
	
	  ```java
	  package top.felixfly.dubbo.dubbodemo.consumer;
	  
	  import org.springframework.context.annotation.AnnotationConfigApplicationContext;
	  import top.felixfly.dubbo.dubbodemo.consumer.configuration.DubboConfiguration;
	  import top.felixfly.dubbo.dubbodemo.consumer.service.DefaultUserService;
	  import top.felixfly.dubbo.dubbodemoapi.domain.Result;
	  import top.felixfly.dubbo.dubbodemoapi.domain.UserRequest;
	  
	  /**
	   * 服务消费者启动类
	   *
	   * @author FelixFly 2019/7/17
	   */
	  public class DubboConsumerServer {
	  
	      public static void main(String[] args) {
	          AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(DubboConfiguration.class);
	          context.start();
	          DefaultUserService userService = context.getBean(DefaultUserService.class);
	          UserRequest userRequest = new UserRequest();
	          userRequest.setName("FelixFly");
	          userRequest.setPassword("000000");
	          Result<UserRequest> handler = userService.handler(userRequest);
	          System.out.println(handler);
	      }
	  }
	  
	  ```
	
2. 启动`DubboConsumerServer`

   ```log
   七月 17, 2019 11:07:58 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息: using logger: org.apache.dubbo.common.logger.jcl.JclLoggerAdapter
   七月 17, 2019 11:07:59 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] BeanNameGenerator bean can't be found in BeanFactory with name [org.springframework.context.annotation.internalConfigurationBeanNameGenerator], dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:07:59 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] BeanNameGenerator will be a instance of org.springframework.context.annotation.AnnotationBeanNameGenerator , it maybe a potential problem on bean name generation., dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:07:59 上午 org.apache.dubbo.common.logger.jcl.JclLogger warn
   警告:  [DUBBO] No Spring Bean annotating Dubbo's @Service was found under package[top.felixfly.dubbo.dubbodemo.consumer.service], dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:08:00 上午 org.apache.dubbo.config.spring.beans.factory.annotation.AbstractAnnotationConfigBeanBuilder build
   信息: The bean[type:ReferenceBean] has been built.
   七月 17, 2019 11:08:00 上午 org.apache.dubbo.common.logger.jcl.JclLogger warn
   警告:  [DUBBO] There's no valid metadata config found, if you are using the simplified mode of registry url, please make sure you have a metadata address configured properly., dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:08:03 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] Successed connect to server /192.168.217.1:20880 from NettyClient 192.168.217.1 using dubbo version 2.7.1, channel is NettyChannel [channel=[id: 0x0728ba3e, L:/192.168.217.1:53095 - R:/192.168.217.1:20880]], dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:08:03 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] Start NettyClient DESKTOP-NK88E8F/192.168.217.1 connect to the server /192.168.217.1:20880, dubbo version: 2.7.1, current host: 192.168.217.1
   七月 17, 2019 11:08:03 上午 org.apache.dubbo.common.logger.jcl.JclLogger info
   信息:  [DUBBO] Refer dubbo service top.felixfly.dubbo.dubbodemoapi.service.UserService from url dubbo://127.0.0.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?application=dubbo-na-consumer&default.lazy=false&default.sticky=false&dubbo=2.0.2&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&pid=18696&register.ip=192.168.217.1&revision=1.0.0&side=consumer&sticky=false&timestamp=1563332880654&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   {"data":{"name":"FelixFly","password":"000000"},"errCode":"200","errMsg":"成功"}
   ```

## Dubbo初探之Zookeeper

## Dubbo初探之Nacos

> 操作都是在Dubbo初探之直连基础上进行
>
> 版本：
>
> * nacos-server 1.1.0 [下载地址](https://github.com/alibaba/nacos/releases/download/1.1.0/nacos-server-1.1.0.zip)，解压过后启动bin\startup，访问浏览器`http://localhost:8848/nacos`进行用户名nacos/nacos进行登录
> * nacos-client 1.0.0 由于2.7.1版本的`dubbo-registry-nacos`用到了`com.alibaba.nacos.client.naming.utils.StringUtils`,这个类在高版本进行了移除

### dubbo-demo

1. 版本管理

   ```xml
   <nacos.version>1.0.0</nacos.version>
   ```

2.  模块依赖

   ```xml
   <dependency>
       <groupId>org.apache.dubbo</groupId>
       <artifactId>dubbo-registry-nacos</artifactId>
       <version>${dubbo.version}</version>
   </dependency>
   
   <dependency>
       <groupId>com.alibaba.nacos</groupId>
       <artifactId>nacos-client</artifactId>
       <version>${nacos.version}</version>
   </dependency>
   ```

### dubbo-demo-pc

1. 添加模块依赖

   ```xml
   <dependency>
       <groupId>org.apache.dubbo</groupId>
       <artifactId>dubbo-registry-nacos</artifactId>
   </dependency>
   
   <dependency>
       <groupId>com.alibaba.nacos</groupId>
       <artifactId>nacos-client</artifactId>
   </dependency>
   
   <dependency>
       <groupId>ch.qos.logback</groupId>
       <artifactId>logback-classic</artifactId>
   </dependency>
   ```

### dubbo-demo-provider

1. 代码

   * `DubboConfiguration`

     ```java
     package top.felixfly.dubbo.dubbodemo.provider.configuration;
     
     import org.apache.dubbo.config.ApplicationConfig;
     import org.apache.dubbo.config.RegistryConfig;
     import org.apache.dubbo.config.spring.context.annotation.DubboComponentScan;
     import org.springframework.context.annotation.Bean;
     import org.springframework.context.annotation.Configuration;
     
     /**
      * dubbo 配置类
      *
      * @author FelixFly 2019/7/17
      */
     @Configuration
     @DubboComponentScan(basePackages = "top.felixfly.dubbo.dubbodemo.provider.service")
     public class DubboConfiguration {
     
         @Bean
         public ApplicationConfig applicationConfig() {
             ApplicationConfig applicationConfig = new ApplicationConfig();
             applicationConfig.setName("dubbo-provide");
             return applicationConfig;
         }
     
     
         @Bean
         public RegistryConfig registryConfig() {
             RegistryConfig registryConfig = new RegistryConfig();
             // 没有注册中心，采用直连方式
             //registryConfig.setAddress("N/A");
             // nacos注册中心
             registryConfig.setAddress("nacos://127.0.0.1:8848");
             return registryConfig;
         }
     }
     ```

2. 启动服务`DubboProviderServer`

   ```log
   ...
   11:47:41.984 [main] INFO org.apache.dubbo.remoting.transport.AbstractServer -  [DUBBO] Start NettyServer bind /0.0.0.0:20880, export /192.168.217.1:20880, dubbo version: 2.7.1, current host: 192.168.217.1
   11:47:42.319 [main] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Register: dubbo://192.168.217.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?anyhost=true&application=dubbo-provide&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&default.deprecated=false&default.dynamic=false&default.register=true&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&methods=handler&pid=14636&register=true&release=2.7.1&revision=1.0.0&side=provider&timestamp=1563335259132&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:47:42.473 [main] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Subscribe: provider://192.168.217.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?anyhost=true&application=dubbo-provide&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&bind.ip=192.168.217.1&bind.port=20880&category=configurators&check=false&default.deprecated=false&default.dynamic=false&default.register=true&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&methods=handler&pid=14636&register=true&release=2.7.1&revision=1.0.0&side=provider&timestamp=1563335259132&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:47:42.538 [main] WARN org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Ignore empty notify urls for subscribe url provider://192.168.217.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?anyhost=true&application=dubbo-provide&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&bind.ip=192.168.217.1&bind.port=20880&category=configurators&check=false&default.deprecated=false&default.dynamic=false&default.register=true&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&methods=handler&pid=14636&register=true&release=2.7.1&revision=1.0.0&side=provider&timestamp=1563335259132&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:47:42.540 [com.alibaba.nacos.naming.client.listener] WARN org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Ignore empty notify urls for subscribe url provider://192.168.217.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?anyhost=true&application=dubbo-provide&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&bind.ip=192.168.217.1&bind.port=20880&category=configurators&check=false&default.deprecated=false&default.dynamic=false&default.register=true&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&methods=handler&pid=14636&register=true&release=2.7.1&revision=1.0.0&side=provider&timestamp=1563335259132&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   ```

### dubbo-demo-consumer

1. 代码

   * `DubboConfiguration`

     ```java
     package top.felixfly.dubbo.dubbodemo.consumer.configuration;
     
     import org.apache.dubbo.config.ApplicationConfig;
     import org.apache.dubbo.config.RegistryConfig;
     import org.apache.dubbo.config.spring.context.annotation.DubboComponentScan;
     import org.springframework.context.annotation.Bean;
     import org.springframework.context.annotation.ComponentScan;
     import org.springframework.context.annotation.Configuration;
     
     /**
      * dubbo 配置类
      * {@link DubboComponentScan} 这个没有实现{@link ComponentScan}的功能
      *
      * @author FelixFly 2019/7/17
      */
     @Configuration
     @DubboComponentScan(basePackages = "top.felixfly.dubbo.dubbodemo.consumer.service")
     @ComponentScan(basePackages = "top.felixfly.dubbo.dubbodemo.consumer.service")
     public class DubboConfiguration {
     
         @Bean
         public ApplicationConfig applicationConfig() {
             ApplicationConfig applicationConfig = new ApplicationConfig();
             applicationConfig.setName("dubbo-consumer");
             return applicationConfig;
         }
     
         @Bean
         public RegistryConfig registryConfig() {
             RegistryConfig registryConfig = new RegistryConfig();
             // 没有注册中心，采用直连方式
             //registryConfig.setAddress("N/A");
             // nacos注册中心
             registryConfig.setAddress("nacos://127.0.0.1:8848");
             return registryConfig;
         }
     }
     ```

   * `DefaultUserService`

     ```java
     package top.felixfly.dubbo.dubbodemo.consumer.service;
     
     import org.apache.dubbo.config.annotation.Reference;
     import org.springframework.stereotype.Service;
     import top.felixfly.dubbo.dubbodemoapi.domain.Result;
     import top.felixfly.dubbo.dubbodemoapi.domain.UserRequest;
     import top.felixfly.dubbo.dubbodemoapi.service.UserService;
     
     /**
      * 服务调用层
      *
      * @author FelixFly 2019/7/17
      */
     @Service
     public class DefaultUserService {
     
         @Reference(version = "1.0.0")
         private UserService userService;
     
         public Result<UserRequest> handler(UserRequest userRequest){
             return this.userService.handler(userRequest);
         }
     }
     ```

2. 启动服务`DubboConsumerServer`

   ```verilog
   ...
   11:48:32.347 [com.alibaba.nacos.naming.client.listener] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Notify urls for subscribe url consumer://192.168.217.1/top.felixfly.dubbo.dubbodemoapi.service.UserService?application=dubbo-na-consumer&category=providers,configurators,routers&default.lazy=false&default.sticky=false&dubbo=2.0.2&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&pid=25440&release=2.7.1&revision=1.0.0&side=consumer&sticky=false&timestamp=1563335309077&version=1.0.0, urls: [dubbo://192.168.217.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?anyhost=true&application=dubbo-provide&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&category=providers&default.deprecated=false&default.dynamic=false&default.register=true&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&methods=handler&path=top.felixfly.dubbo.dubbodemoapi.service.UserService&pid=14636&protocol=dubbo&register=true&release=2.7.1&revision=1.0.0&side=provider&timestamp=1563335259132&version=1.0.0], dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.353 [main] INFO org.apache.dubbo.config.AbstractConfig -  [DUBBO] Refer dubbo service top.felixfly.dubbo.dubbodemoapi.service.UserService from url nacos://127.0.0.1:8848/org.apache.dubbo.registry.RegistryService?anyhost=true&application=dubbo-na-consumer&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&category=providers&check=false&default.deprecated=false&default.dynamic=false&default.lazy=false&default.register=true&default.sticky=false&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&path=top.felixfly.dubbo.dubbodemoapi.service.UserService&pid=25440&protocol=dubbo&register=true&register.ip=192.168.217.1&release=2.7.1&remote.application=dubbo-provide&remote.timestamp=1563335259132&revision=1.0.0&side=consumer&sticky=false&timestamp=1563335309077&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.467 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxCapacityPerThread: 4096
   11:48:32.467 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.maxSharedCapacityFactor: 2
   11:48:32.467 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.linkCapacity: 16
   11:48:32.467 [main] DEBUG io.netty.util.Recycler - -Dio.netty.recycler.ratio: 8
   11:48:32.489 [NettyClientWorker-4-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkAccessible: true
   11:48:32.489 [NettyClientWorker-4-1] DEBUG io.netty.buffer.AbstractByteBuf - -Dio.netty.buffer.checkBounds: true
   11:48:32.490 [NettyClientWorker-4-1] DEBUG io.netty.util.ResourceLeakDetectorFactory - Loaded default ResourceLeakDetector: io.netty.util.ResourceLeakDetector@5b2ad353
   11:48:32.730 [DubboClientHandler-192.168.217.1:20880-thread-1] DEBUG org.apache.dubbo.remoting.transport.DecodeHandler -  [DUBBO] Decode decodeable message org.apache.dubbo.rpc.protocol.dubbo.DecodeableRpcResult, dubbo version: 2.7.1, current host: 192.168.217.1
   {"data":{"name":"FelixFly","password":"000000"},"errCode":"200","errMsg":"成功"}
   11:48:32.743 [Thread-0] DEBUG org.springframework.context.annotation.AnnotationConfigApplicationContext - Closing org.springframework.context.annotation.AnnotationConfigApplicationContext@5e265ba4, started on Wed Jul 17 11:48:26 CST 2019
   11:48:32.743 [Thread-0] INFO org.apache.dubbo.registry.support.AbstractRegistryFactory -  [DUBBO] Close all registries [nacos://127.0.0.1:8848/org.apache.dubbo.registry.RegistryService?application=dubbo-na-consumer&dubbo=2.0.2&interface=org.apache.dubbo.registry.RegistryService&pid=25440&release=2.7.1&timestamp=1563335309182], dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.743 [Thread-0] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Destroy registry:nacos://127.0.0.1:8848/org.apache.dubbo.registry.RegistryService?application=dubbo-na-consumer&dubbo=2.0.2&interface=org.apache.dubbo.registry.RegistryService&pid=25440&release=2.7.1&timestamp=1563335309182, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.744 [Thread-0] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Unregister: consumer://192.168.217.1/top.felixfly.dubbo.dubbodemoapi.service.UserService?application=dubbo-na-consumer&category=consumers&check=false&default.lazy=false&default.sticky=false&dubbo=2.0.2&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&pid=25440&release=2.7.1&revision=1.0.0&side=consumer&sticky=false&timestamp=1563335309077&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.750 [Thread-0] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Destroy unregister url consumer://192.168.217.1/top.felixfly.dubbo.dubbodemoapi.service.UserService?application=dubbo-na-consumer&category=consumers&check=false&default.lazy=false&default.sticky=false&dubbo=2.0.2&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&pid=25440&release=2.7.1&revision=1.0.0&side=consumer&sticky=false&timestamp=1563335309077&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.750 [Thread-0] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Unsubscribe: consumer://192.168.217.1/top.felixfly.dubbo.dubbodemoapi.service.UserService?application=dubbo-na-consumer&category=providers,configurators,routers&default.lazy=false&default.sticky=false&dubbo=2.0.2&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&pid=25440&release=2.7.1&revision=1.0.0&side=consumer&sticky=false&timestamp=1563335309077&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.751 [Thread-0] INFO org.apache.dubbo.registry.nacos.NacosRegistry -  [DUBBO] Destroy unsubscribe url consumer://192.168.217.1/top.felixfly.dubbo.dubbodemoapi.service.UserService?application=dubbo-na-consumer&category=providers,configurators,routers&default.lazy=false&default.sticky=false&dubbo=2.0.2&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&pid=25440&release=2.7.1&revision=1.0.0&side=consumer&sticky=false&timestamp=1563335309077&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.752 [Thread-0] INFO org.apache.dubbo.rpc.protocol.dubbo.DubboProtocol -  [DUBBO] Close dubbo connect: /192.168.217.1:55207-->/192.168.217.1:20880, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.753 [Thread-0] INFO org.apache.dubbo.remoting.transport.netty4.NettyChannel -  [DUBBO] Close netty channel [id: 0xf9e87c8c, L:/192.168.217.1:55207 - R:/192.168.217.1:20880], dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.756 [Thread-0] INFO org.apache.dubbo.rpc.protocol.dubbo.DubboProtocol -  [DUBBO] Destroy reference: dubbo://192.168.217.1:20880/top.felixfly.dubbo.dubbodemoapi.service.UserService?anyhost=true&application=dubbo-na-consumer&bean.name=providers:dubbo:top.felixfly.dubbo.dubbodemoapi.service.UserService:1.0.0&category=providers&check=false&default.deprecated=false&default.dynamic=false&default.lazy=false&default.register=true&default.sticky=false&deprecated=false&dubbo=2.0.2&dynamic=false&generic=false&interface=top.felixfly.dubbo.dubbodemoapi.service.UserService&lazy=false&methods=handler&path=top.felixfly.dubbo.dubbodemoapi.service.UserService&pid=25440&protocol=dubbo&register=true&register.ip=192.168.217.1&release=2.7.1&remote.application=dubbo-provide&remote.timestamp=1563335259132&revision=1.0.0&side=consumer&sticky=false&timestamp=1563335309077&version=1.0.0, dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.757 [Thread-0] INFO org.apache.dubbo.qos.server.Server -  [DUBBO] qos-server stopped., dubbo version: 2.7.1, current host: 192.168.217.1
   11:48:32.766 [Thread-0] INFO org.apache.dubbo.config.spring.beans.factory.annotation.ReferenceAnnotationBeanPostProcessor - org.apache.dubbo.common.bytecode.proxy0@60c00826 was destroying!
   11:48:32.766 [Thread-0] INFO org.apache.dubbo.config.spring.beans.factory.annotation.ReferenceAnnotationBeanPostProcessor - class org.apache.dubbo.config.spring.beans.factory.annotation.ReferenceAnnotationBeanPostProcessor was destroying!
   ```

#### 问题

1. ` Address already in use: bind`

   ```log
   11:48:31.505 [main] ERROR org.apache.dubbo.qos.server.Server -  [DUBBO] qos-server can not bind localhost:22222, dubbo version: 2.7.1, current host: 192.168.217.1
   java.net.BindException: Address already in use: bind
   	at sun.nio.ch.Net.bind0(Native Method)
   	at sun.nio.ch.Net.bind(Net.java:433)
   	at sun.nio.ch.Net.bind(Net.java:425)
   	at sun.nio.ch.ServerSocketChannelImpl.bind(ServerSocketChannelImpl.java:223)
   	at io.netty.channel.socket.nio.NioServerSocketChannel.doBind(NioServerSocketChannel.java:130)
   	at io.netty.channel.AbstractChannel$AbstractUnsafe.bind(AbstractChannel.java:558)
   	at io.netty.channel.DefaultChannelPipeline$HeadContext.bind(DefaultChannelPipeline.java:1358)
   	at io.netty.channel.AbstractChannelHandlerContext.invokeBind(AbstractChannelHandlerContext.java:501)
   	at io.netty.channel.AbstractChannelHandlerContext.bind(AbstractChannelHandlerContext.java:486)
   	at io.netty.channel.DefaultChannelPipeline.bind(DefaultChannelPipeline.java:1019)
   	at io.netty.channel.AbstractChannel.bind(AbstractChannel.java:254)
   	at io.netty.bootstrap.AbstractBootstrap$2.run(AbstractBootstrap.java:366)
   	at io.netty.util.concurrent.AbstractEventExecutor.safeExecute(AbstractEventExecutor.java:163)
   	at io.netty.util.concurrent.SingleThreadEventExecutor.runAllTasks(SingleThreadEventExecutor.java:404)
   	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:466)
   	at io.netty.util.concurrent.SingleThreadEventExecutor$5.run(SingleThreadEventExecutor.java:897)
   	at io.netty.util.concurrent.FastThreadLocalRunnable.run(FastThreadLocalRunnable.java:30)
   	at java.lang.Thread.run(Thread.java:748)
   11:48:31.505 [main] WARN org.apache.dubbo.qos.protocol.QosProtocolWrapper -  [DUBBO] Fail to start qos server: , dubbo version: 2.7.1, current host: 192.168.217.1
   java.net.BindException: Address already in use: bind
   	at sun.nio.ch.Net.bind0(Native Method)
   	at sun.nio.ch.Net.bind(Net.java:433)
   	at sun.nio.ch.Net.bind(Net.java:425)
   	at sun.nio.ch.ServerSocketChannelImpl.bind(ServerSocketChannelImpl.java:223)
   	at io.netty.channel.socket.nio.NioServerSocketChannel.doBind(NioServerSocketChannel.java:130)
   	at io.netty.channel.AbstractChannel$AbstractUnsafe.bind(AbstractChannel.java:558)
   	at io.netty.channel.DefaultChannelPipeline$HeadContext.bind(DefaultChannelPipeline.java:1358)
   	at io.netty.channel.AbstractChannelHandlerContext.invokeBind(AbstractChannelHandlerContext.java:501)
   	at io.netty.channel.AbstractChannelHandlerContext.bind(AbstractChannelHandlerContext.java:486)
   	at io.netty.channel.DefaultChannelPipeline.bind(DefaultChannelPipeline.java:1019)
   	at io.netty.channel.AbstractChannel.bind(AbstractChannel.java:254)
   	at io.netty.bootstrap.AbstractBootstrap$2.run(AbstractBootstrap.java:366)
   	at io.netty.util.concurrent.AbstractEventExecutor.safeExecute(AbstractEventExecutor.java:163)
   	at io.netty.util.concurrent.SingleThreadEventExecutor.runAllTasks(SingleThreadEventExecutor.java:404)
   	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:466)
   	at io.netty.util.concurrent.SingleThreadEventExecutor$5.run(SingleThreadEventExecutor.java:897)
   	at io.netty.util.concurrent.FastThreadLocalRunnable.run(FastThreadLocalRunnable.java:30)
   	at java.lang.Thread.run(Thread.java:748)
   ```

   这个没有什么问题，要是解决的话，可以在`DubboConfiguration`的`ApplicationConfig`中加入配置相应的可用端口`applicationConfig.setQosPort(22223);`

