---
title: Spring Environment 简介
author: FelixFly
date: 2021-06-21
tags:
    - spring
categories: 
    - spring
archives: 2021
---

1. Environment 抽象
2. Environment 标准实现
3. Environment 资源加载
4. Environment 属性获取
5. Spring Boot Environment 生命周期
6. Spring Cloud Environment 生命周期
7. Environment 扩展点
8. Environment 扩展点执行顺序

<!--more -->

> 版本说明：
>
> * `Spring Boot 2.4.8`
> * `Spring Cloud Hoxton.SR11,对应的Spring Boot 2.3.10.RELEASE`

# Environment 抽象

 `org.springframework.core.env.Environment` 环境配置

* `profile `  环境
* `Property` 配置信息解析

 `org.springframework.core.env.ConfigurableEnvironment` 可配置的环境

* `profile `  环境可配置
* `MutablePropertySources` 可变的属性配置源
  * `org.springframework.core.env.PropertySources` 多个属性配置源 `@PropertySources`
    * `org.springframework.core.env.PropertySource` 属性配置源 `@PropertySource`

`org.springframework.web.context.ConfigurableWebEnvironment`  可配置的web环境(针对Servlet)

* `ServletContext` Servlet上下文
* `ServletConfig` Servlet配置

`org.springframework.boot.web.reactive.context.ConfigurableReactiveWebEnvironment` 可配置的响应式web环境

> Spring Cloud中抽象
>
> * `org.springframework.cloud.config.environment.Environment` 环境配置
> * `org.springframework.cloud.config.environment.PropertySource` 属性配置源

# Environment 资源加载

> 扩展知识：资源 `org.springframework.core.io.Resource`

* `org.springframework.boot.env.PropertySourceLoader` 配置属性加载器
  * `org.springframework.boot.env.PropertiesPropertySourceLoader` Properties文件配置属性加载器
  * `org.springframework.boot.env.YamlPropertySourceLoader` Yaml配置属性加载器
* `org.springframework.cloud.bootstrap.config.PropertySourceLocator` 配置属性加载器(Spring Cloud)

# Environment 属性获取

* `org.springframework.core.env.PropertyResolver` 配置解析器，Environment子类

  * `getProperty(String key)` 获取指定key的值
  * `getProperty(String key, String defaultValue)` 获取指定key的值，没有值的话为默认值
  * `getProperty(String key, Class<T> targetType)` 获取指定key的值并进行转换
  * `getProperty(String key, Class<T> targetType, T defaultValue)` 获取指定key的值并进行转换，没有值的话为默认值

* `org.springframework.boot.context.properties.bind.Binder` 配置绑定器

  * `bind(java.lang.String, org.springframework.boot.context.properties.bind.Bindable<T>)` 绑定方法

  ```java
  Binder binder = Binder.get(environment);
  String userName = binder.bind("user.name", String.class).orElse("-1");
  ```

# Environment 标准实现

* `org.springframework.core.env.StandardEnvironment` 标准环境实现

  * `systemProperties` 系统属性  -- `System.getProperties()`
  * `systemEnvironment` 系统环境配置  -- `System.getenv()`

* `org.springframework.web.context.support.StandardServletEnvironment` 标准Servlet环境实现

  > `Servlet`配置实现初始为占位实现`StubPropertySource`,后面初始化的时候进行替换

  * `servletConfigInitParams` Servlet配置参数
  * `servletContextInitParams` Servlet上下文参数
  * `jndiProperties` jndi配置（如果有的话）

* `org.springframework.boot.web.reactive.context.StandardReactiveWebEnvironment`  标准响应式Web环境实现

# Spring Boot Environment 生命周期

> 以标准Servlet环境为例，主要是prepareEnvironment阶段

1. 创建或者返回Environment，若是配置过直接返回，没有配置的话根据类型推断出Environment 实现

   > `org.springframework.boot.ApplicationServletEnvironment`，其为`StandardServletEnvironment` 子类实现

2. 配置属性源

   * 添加或者合并`defaultProperties`，放在末位

   * 添加或者合并`commandLineArgs`，放到首位

     > 若是存在`commandLineArgs`,创建组合配置，新的为`springApplicationCommandLineArgs`，再添加上`commandLineArgs`

   * 配置`profile`，钩子方法，暂时未进行实现

3. 组装属性源为调整`configurationProperties`配置，并将其放到首位

4. `SpringApplicationRunListener`发布`ApplicationEnvironmentPreparedEvent`事件

   * **`EnvironmentPostProcessorApplicationListener`** 环境后置处理器，最高优先级 + 10
     * 获取并执行`EnvironmentPostProcessor` 
       * RandomValuePropertySourceEnvironmentPostProcessor 添加`random`配置源，放在systemEnvironment之后或者最后
       * SystemEnvironmentPropertySourceEnvironmentPostProcessor 字符响应处理
       * SpringApplicationJsonEnvironmentPostProcessor 处理`spring.application.json`或者 `SPRING_APPLICATION_JSON`配置的json字符串，添加到Servlet配置前或者首位
       * CloudFoundryVcapEnvironmentPostProcessor 加载vcap配置源信息，放到命令行commandLineArgs之后或者放到首位
       * ConfigDataEnvironmentPostProcessor（ConfigFileApplicationListener）配置数据的加载
       * IntegrationPropertiesEnvironmentPostProcessor 加载`META-INF/spring.integration.properties`,将其放到末位
   * **`DelegatingApplicationListener`** 加载配置`context.listener.classes`的类`ApplicationListener`并`ApplicationEventMulticaster`进行广播当前事件，优先级0

5. 将`defaultProperties`配置移动到末位

6. 绑定环境信息到SpringApplication

7. 需要的话将Environment转换为类型推断的Environment 实现

8. 组装属性源为调整`configurationProperties`配置，并将其放到首位

> `prepareContext`应用上下文准备阶段，也可以修改Environment

1. 执行`ApplicationContextInitializer#initialize`方法
   * `DelegatingApplicationContextInitializer` 加载`context.initializer.classes`配置ApplicationContextInitializer
   * `ServerPortInfoApplicationContextInitializer` 加载启动端口到配置`local.server.port`,其中server可以被替换
2. `SpringApplicationRunListener`发布`ApplicationContextInitializedEvent`事件
   * **`DelegatingApplicationListener`** 加载配置`context.listener.classes`的类`ApplicationListener`并`ApplicationEventMulticaster`进行广播当前事件，优先级0
3. 加载`BeanDefinition`
   * `BeanDefinitionLoader#load()`
4. `SpringApplicationRunListener`发布`ApplicationPreparedEvent`事件
   * **`DelegatingApplicationListener`** 加载配置`context.listener.classes`的类`ApplicationListener`并`ApplicationEventMulticaster`进行广播当前事件，优先级0

# Spring Cloud Environment 生命周期

> `org.springframework.cloud.bootstrap.BootstrapApplicationListener `ApplicationEnvironmentPreparedEvent事件，最高优先级 + 5，也就是说在**`EnvironmentPostProcessorApplicationListener`类之前执行**，`application(-*).yml(properties)`配置文件比较靠后加载，所以下面的配置信息配置在`application(-*).yml(properties)`配置文件中无效，只能配置在`bootstrap(-*).yml(properties)`配置文件中

1. `BootstrapApplicationListener `ApplicationEnvironmentPreparedEvent事件

   * 加载配置`spring.cloud.bootstrap.location`以及`spring.cloud.bootstrap.additional-location`

   * 配置源类 `BootstrapImportSelectorConfiguration`，加载类`BootstrapImportSelector`

     * 加载配置文件/META-INF/spring.factories中`org.springframework.cloud.bootstrap.BootstrapConfiguration`配置类
       * `org.springframework.cloud.config.server.environment.EnvironmentRepositoryPropertySourceLocator` 环境资源仓储属性资源加载器，配置`spring.cloud.config.server.bootstrap=true`加载并且需要在`BootstrapConfiguration`配置类中配置一个名为`defaultEnvironmentRepository`的`EnvironmentRepository`,不然默认加载为`org.springframework.cloud.config.server.config.DefaultRepositoryConfiguration`
       * `org.springframework.cloud.config.client.ConfigServicePropertySourceLocator` 配置服务属性资源加载器，引入`spring-cloud-config-client`加载
     * 加载配置`spring.cloud.bootstrap.sources`配置的类

     > 加载配置文件还是ConfigDataEnvironmentPostProcessor（ConfigFileApplicationListener）这个类进行处理

     * 添加`org.springframework.context.ApplicationContextInitializer` bean信息
       * `org.springframework.cloud.bootstrap.config.PropertySourceBootstrapConfiguration` 执行`PropertySourceLocator`类
       * `org.springframework.cloud.bootstrap.encrypt.EnvironmentDecryptApplicationInitializer ` 解密`{cipher}`配置值

2. 执行PropertySourceBootstrapConfiguration#initialize方法，执行PropertySourceLocator#locateCollection

# Environment扩展点

## Spring Cloud Environment 扩展点

* 配置文件/META-INF/spring.factories中`org.springframework.cloud.bootstrap.BootstrapConfiguration`配置`PropertySourceLocator`实现类

* `systemProperties` 系统属性、`systemEnvironment` 系统环境配置以及`bootstrap(-*).yml(properties)`配置文件配置`spring.cloud.bootstrap.sources`的值为`PropertySourceLocator`实现类

* 实现`EnvironmentRepository`并在`BootstrapConfiguration`配置类配置为`defaultEnvironmentRepository`的Bean，在`systemProperties` 系统属性、`systemEnvironment` 系统环境配置以及`bootstrap(-*).yml(properties)`配置文件配置`spring.cloud.config.server.bootstrap=true`

  > 若是不以`defaultEnvironmentRepository`名称的Bean，默认加载为`org.springframework.cloud.config.server.config.DefaultRepositoryConfiguration`
  >
  > 若是配置多个实现`EnvironmentRepository`，需要再配置一个`@Primary`的`CompositeEnvironmentRepository`

## Spring Boot Environment 扩展点

* 实现事件(`ApplicationEnvironmentPreparedEvent、`ApplicationContextInitializedEvent、ApplicationPreparedEvent)监听并在配置文件/META-INF/spring.factories中`org.springframework.context.ApplicationListener`配置
* 在环境配置中添加`context.listener.classes`配置事件(`ApplicationEnvironmentPreparedEvent、`ApplicationContextInitializedEvent、ApplicationPreparedEvent)监听类
* 实现EnvironmentPostProcessor并在配置文件/META-INF/spring.factories中`org.springframework.boot.env.EnvironmentPostProcessor`配置
* ConfigDataEnvironmentPostProcessor（ConfigFileApplicationListener）配置数据的加载，会先加载profile对应配置，后加载默认（default）配置
* 实现`ApplicationContextInitializer`并在配置文件/META-INF/spring.factories中`org.springframework.context.ApplicationContextInitializer`配置
* 在环境配置中添加`context.initializer.classes`配置ApplicationContextInitializer实现类

# Environment 扩展点执行顺序

1. `PropertySourceLocator` 执行
2. `ApplicationEnvironmentPreparedEvent` 优先级在最高优先级 + 10 之前的执行
3. `EnvironmentPostProcessor` 执行
4. `ApplicationEnvironmentPreparedEvent` 优先级在最高优先级 + 10 之后的执行
5. `ApplicationContextInitializer` 执行
6. `ApplicationContextInitializedEvent` 执行
7. `ApplicationPreparedEvent` 执行
