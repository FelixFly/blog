---
title: Spring Cloud序幕
author: FelixFly
date: 2019-12-22
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. 特性
2. Spring Cloud 上下文
3. Spring Cloud 配置信息

<!-- more -->

# Spring Cloud序幕

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE

## 特性

* 分布式/版本配置  
* 服务注册和发现 
* 路由 
* 服务调用
* 负载均衡 
* 短路 
* 分布式消息 

## Spring Boot Actuator

### 端点

* `/actuator/beans` bean的端点
* `/actuator/env` 环境的端点

### 配置信息

* `management.endpoints.web.exposure.include` web暴露的外部端点，默认是info和health

## Spring Cloud 上下文

> 回顾Spring Mvc上下文
>
> Root WebApplicationContext (Service、Respostory)
>
> * Servlet WebApplicationContext (Controller)
>
> ```java
> public class MyWebAppInitializer extends
> AbstractAnnotationConfigDispatcherServletInitializer {
>     @Override
>     protected Class<?>[] getRootConfigClasses() {
>         return new Class<?>[] { RootConfig.class };
>     }
>     @Override
>     protected Class<?>[] getServletConfigClasses() {
>         return new Class<?>[] { App1Config.class };
>     }
>     @Override
>     protected String[] getServletMappings() {
>         return new String[] { "/app1/*" };
>     }
> }
> ```

### `/actuator/beans` bean的端点信息

```json
{
    "contexts": {
        "application-1": {
            "beans": {},
            "parentId": "bootstrap"
        },
        "bootstrap": {}
    }
}

```

> bootstrap ApplicationContext
>
> * application-1 ApplicationContext

### 加载类`BootstrapApplicationListener`

> 事件驱动`ApplicationEnvironmentPreparedEvent`

* 创建`bootstrap` ApplicationContext，默认是从`ContextIdApplicationContextInitializer`生成上下文的名称，后强制修改为`bootstrap`

  ```java
  private ConfigurableApplicationContext bootstrapServiceContext(
          ConfigurableEnvironment environment, final SpringApplication application,
          String configName) {
      StandardEnvironment bootstrapEnvironment = new StandardEnvironment();
      MutablePropertySources bootstrapProperties = bootstrapEnvironment
              .getPropertySources();
      for (PropertySource<?> source : bootstrapProperties) {
          bootstrapProperties.remove(source.getName());
      }
      String configLocation = environment
              .resolvePlaceholders("${spring.cloud.bootstrap.location:}");
      Map<String, Object> bootstrapMap = new HashMap<>();
      bootstrapMap.put("spring.config.name", configName);
      // if an app (or test) uses spring.main.web-application-type=reactive, bootstrap
      // will fail
      // force the environment to use none, because if though it is set below in the
      // builder
      // the environment overrides it
      bootstrapMap.put("spring.main.web-application-type", "none");
      if (StringUtils.hasText(configLocation)) {
          bootstrapMap.put("spring.config.location", configLocation);
      }
      bootstrapProperties.addFirst(
              new MapPropertySource(BOOTSTRAP_PROPERTY_SOURCE_NAME, bootstrapMap));
      for (PropertySource<?> source : environment.getPropertySources()) {
          if (source instanceof StubPropertySource) {
              continue;
          }
          bootstrapProperties.addLast(source);
      }
      // TODO: is it possible or sensible to share a ResourceLoader?
      SpringApplicationBuilder builder = new SpringApplicationBuilder()
              .profiles(environment.getActiveProfiles()).bannerMode(Mode.OFF)
              .environment(bootstrapEnvironment)
              // Don't use the default properties in this builder
              .registerShutdownHook(false).logStartupInfo(false)
              .web(WebApplicationType.NONE);
      final SpringApplication builderApplication = builder.application();
      if (builderApplication.getMainApplicationClass() == null) {
          // gh_425:
          // SpringApplication cannot deduce the MainApplicationClass here
          // if it is booted from SpringBootServletInitializer due to the
          // absense of the "main" method in stackTraces.
          // But luckily this method's second parameter "application" here
          // carries the real MainApplicationClass which has been explicitly
          // set by SpringBootServletInitializer itself already.
          builder.main(application.getMainApplicationClass());
      }
      if (environment.getPropertySources().contains("refreshArgs")) {
          // If we are doing a context refresh, really we only want to refresh the
          // Environment, and there are some toxic listeners (like the
          // LoggingApplicationListener) that affect global static state, so we need a
          // way to switch those off.
          builderApplication
                  .setListeners(filterListeners(builderApplication.getListeners()));
      }
      builder.sources(BootstrapImportSelectorConfiguration.class);
      final ConfigurableApplicationContext context = builder.run();
      // gh-214 using spring.application.name=bootstrap to set the context id via
      // `ContextIdApplicationContextInitializer` prevents apps from getting the actual
      // spring.application.name
      // during the bootstrap phase.
      // 从application或者spring.application.name(ContextIdApplicationContextInitializer类生成的) 调整为bootstrap
      context.setId("bootstrap");
      // Make the bootstrap context a parent of the app context
      addAncestorInitializer(application, context);
      // It only has properties in it now that we don't want in the parent so remove
      // it (and it will be added back later)
      bootstrapProperties.remove(BOOTSTRAP_PROPERTY_SOURCE_NAME);
      mergeDefaultProperties(environment.getPropertySources(), bootstrapProperties);
      return context;
  }
  ```

* 赋值父上下文

  ```java
  private void addAncestorInitializer(SpringApplication application,
          ConfigurableApplicationContext context) {
      boolean installed = false;
      for (ApplicationContextInitializer<?> initializer : application
              .getInitializers()) {
          if (initializer instanceof AncestorInitializer) {
              installed = true;
              // New parent,将 bootstrap上下文作为父上下文传入
              ((AncestorInitializer) initializer).setParent(context);
          }
      }
      if (!installed) {
          application.addInitializers(new AncestorInitializer(context));
      }
  
  }
  
  
  private static class AncestorInitializer implements
          ApplicationContextInitializer<ConfigurableApplicationContext>, Ordered {
  
      private ConfigurableApplicationContext parent;
  
      AncestorInitializer(ConfigurableApplicationContext parent) {
          this.parent = parent;
      }
  
      public void setParent(ConfigurableApplicationContext parent) {
          this.parent = parent;
      }
  
      @Override
      public int getOrder() {
          // Need to run not too late (so not unordered), so that, for instance, the
          // ContextIdApplicationContextInitializer runs later and picks up the merged
          // Environment. Also needs to be quite early so that other initializers can
          // pick up the parent (especially the Environment).
          return Ordered.HIGHEST_PRECEDENCE + 5;
      }
  
      @Override
      public void initialize(ConfigurableApplicationContext context) {
          while (context.getParent() != null && context.getParent() != context) {
              context = (ConfigurableApplicationContext) context.getParent();
          }
          reorderSources(context.getEnvironment());
          new ParentContextApplicationContextInitializer(this.parent)
                  .initialize(context);
      }
  
      private void reorderSources(ConfigurableEnvironment environment) {
          PropertySource<?> removed = environment.getPropertySources()
                  .remove(DEFAULT_PROPERTIES);
          if (removed instanceof ExtendedDefaultPropertySource) {
              ExtendedDefaultPropertySource defaultProperties = (ExtendedDefaultPropertySource) removed;
              environment.getPropertySources().addLast(new MapPropertySource(
                      DEFAULT_PROPERTIES, defaultProperties.getSource()));
              for (PropertySource<?> source : defaultProperties.getPropertySources()
                      .getPropertySources()) {
                  if (!environment.getPropertySources().contains(source.getName())) {
                      environment.getPropertySources().addBefore(DEFAULT_PROPERTIES,
                              source);
                  }
              }
          }
      }
  
  }
  ```

## Spring Cloud 配置信息

* application.yml配置

  ```yaml
  management:
    endpoints:
      web:
        exposure:
          include: health,info,beans,env
  spring:
    application:
      name: application-name
  ```

* bootstrap.yml配置

  ```yaml
  server:
    port: 8080
  spring:
    application:
      name: bootstrap-name
  ```

### `/actuator/env` 环境的端点

```json
{
    "activeProfiles": [],
    "propertySources": [{
            "name": "server.ports",
            "properties": {}
        }, {
            "name": "servletContextInitParams",
            "properties": {}
        }, {
            "name": "systemProperties",
            "properties": {}
        }, {
            "name": "systemEnvironment",
            "properties": {}
        }, {
            "name": "configServerClient",
            "properties": {}
        }, {
            "name": "springCloudClientHostInfo",
            "properties": {}
        }, {
            "name": "applicationConfig: [classpath:/application.yml]",
            "properties": {}
        }, {
            "name": "applicationConfig: [classpath:/bootstrap.yml]",
            "properties": {}
        }, {
            "name": "springCloudDefaultProperties",
            "properties": {}
        }
    ]
}
```

从上述配置来看，bootstrap的配置文件的优先级在application的配置文件之下。

### 自定义bootstrap配置

1. 实现`PropertySourceLocator`接口

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

2. 配置`META-INF\spring.factories`文件

   ```properties
   org.springframework.cloud.bootstrap.BootstrapConfiguration=\
   top.felixfly.springcloud.context.CustomPropertySourceLocator
   ```

3. `/actuator/env` 环境的端点信息

   ```json
   {
       "activeProfiles": [],
       "propertySources": [{
               "name": "server.ports",
               "properties": {}
           }, {
               "name": "bootstrapProperties-customProperty",
               "properties": {}
           }, {
               "name": "servletContextInitParams",
               "properties": {}
           }, {
               "name": "systemProperties",
               "properties": {}
           }, {
               "name": "systemEnvironment",
               "properties": {}
           }, {
               "name": "configServerClient",
               "properties": {}
           }, {
               "name": "springCloudClientHostInfo",
               "properties": {}
           }, {
               "name": "applicationConfig: [classpath:/application.yml]",
               "properties": {}
           }, {
               "name": "applicationConfig: [classpath:/bootstrap.yml]",
               "properties": {}
           }, {
               "name": "springCloudDefaultProperties",
               "properties": {}
           }
       ]
   }
   ```

   由此可见自定义的bootstrap的优先级比较高

   > By default, bootstrap properties (not bootstrap.properties but properties that are loaded during the bootstrap phase) are added with high precedence, so they cannot be overridden by local configuration.
   > 默认情况下，bootstrap配置（不包含bootstrap.properties信息）信息具有高优先级，本地配置无法进行覆盖
   >
   > Because of the ordering rules of property sources, the “bootstrap” entries take precedence.
   > However, note that these do not contain any data from bootstrap.yml, which has very low
   > precedence but can be used to set defaults.
   >
   > 由于配置资源的排序规则，bootstrap具有高优先级。但是，不包含bootstrap.yml配置文件的任何数据，默认情况下具有最低优先级

### 加载类

* 自定义bootstrap配置加载类`PropertySourceBootstrapConfiguration` ，自定义`PropertySourceLocator`排在最前

* 配置文件加载类`ConfigFileApplicationListener`,优先级为第11位
* `BootstrapApplicationListener` bootstrap配置，优先级为第6位

### 配置项

* bootstrap配置文件名称`spring.cloud.bootstrap.name`,默认为bootstrap
* bootstrap配置文件路径`spring.cloud.bootstrap.location`,默认为空
* `spring.cloud.config.allowOverride=true` 允许覆盖配置
* `spring.cloud.config.overrideNone=false` 外部化配置处于最低优先级并且不可覆盖
* `spring.cloud.config.overrideSystemProperties=true` 只有系统环境、命令行参数以及环境变量可以覆盖远程配置，其他的本地配置文件不可覆盖

> spring.cloud.config配置类`org.springframework.cloud.bootstrap.config.PropertySourceBootstrapProperties`

