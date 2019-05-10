---
title: SpringBoot自动装配
author: FelixFly
date: 2019-05-10
tags:
    - spring boot
categories: 
    - spring toot
archives: 2019
---

1.  配置文件的读取
2.  自动装配

<!-- more -->

> 说明：
>
> 1. 需要lombok插件
>
> 2. Spring Boot 2.1.4.RELEASE
>
> 3. 需要配置的信息如下，Spring 中配置信息文件为`system.properties`,Spring Boot中直接在`applicaiton.properties`
>
>    ```properties
>    system.name = test
>    ```
>

# 配置文件

## 实现方式

#### Spring XML方式

##### `property-placeholder`方式

1. XML配置`application-xml-property.xml`

   ```xml
   <context:property-placeholder location="classpath:system.properties"/>
   ```

2. 配置类`XmlConfiguration`

   ```java
   @Setter
   @Getter
   @Component
   @ImportResource("classpath:/application-xml-property.xml")
   public class XmlConfiguration {
   
       @Value("${system.name}")
       private String systemName;
   }
   ```

##### `PropertyPlaceholderConfigurer`方式

1. XML配置`application-property-configurer.xml`

   ```xml
   <bean class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer">     <property name="location" value="classpath:system.properties"/>
   </bean>
   ```

2.  配置类`PropertyPlaceholderConfiguration`

   ```java
   @Setter
   @Getter
   @Component
   @ImportResource("classpath:/application-property-configurer.xml")
   public class PropertyPlaceholderConfiguration {
   
       @Value("${system.name}")
       private String systemName;
   }
   ```

##### `utils:properties`方式

1. XML配置`application-utils-property.xml`

   ```xml
   <utils:properties id="system" location="classpath:system.properties" />
   ```

2. 配置类`UtilsPropertyConfiguration`

   ```java
   @Setter
   @Getter
   @Component
   @ImportResource("classpath:/application-utils-property.xml")
   public class UtilsPropertyConfiguration {
   
       @Value("#{system['system.name']}")
       public String systemName;
   }
   ```

### Spring 注解方式

#### `@PropertySource`注解

```java
@Setter
@Getter
@Component
@PropertySource(value = "classpath:/system.properties")
public class PropertySourceConfiguration {

    @Value("${system.name}")
    private String systemName;
}
```

### Spring Boot 注解方式

####  `@ConfigurationProperties`

#### 启用方式

##### `@Compnent`

##### `@EnableConfigurationProperties`

## 问题

## 若property文件中有中文，代码中获取会出现乱码

答：Spring XML 三种方式分别解决如下:

- `property-placeholder`方式可利用属性`file-encoding`配置文件编码
- `PropertyPlaceholderConfigurer`方式可利用property属性`fileEncoding`配置文件编码
- `utils:properties`方式可利用将中文转换为Unicode编码写在properties文件中

Spring 注解方式可利用`@PropertySource`注解属性encoding配置文件编码



