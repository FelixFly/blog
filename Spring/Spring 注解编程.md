---
title: Spring 注解编程
author: FelixFly
date: 2018-10-18
tags:
    - spring
categories: 
    - spring
archives: 2018bean
---

1.  `Bean` 注册
2.  `Bean` 依赖注入

<!-- more -->

# Bean 注册

注册`Bean`的常用注解有`@Component`、`@Service`、`@Controller`、`@Repository`,通过扫描包的方式对这些注解进行解析注册`Bean`。

## 常用注解

### `@Configuration`与`@Bean`

`@Configuration`  声明Bean Difinition的来源文件

```java
@Configuration
public class CustomConfig {
    @Bean
    public Person person() {
        return new Person();
    }
}
```

> 相当于xml bean内容
>
> ```xml
> <beans>
>     <bean id="person" class="top.felixfly.entity.Person"/>
> </beans>
> ```
>
> bean的名称默认为方法名称，也可以通过`@Bean(value="person")`或者`@Bean("person")`进行指定

### `@Configuration`与`@ComponentScan`

`@ComponentScan`指定扫描路径

```java
@Configuration
@ComponentScan("top.felixfly.spring.annotation")
public class ScanConfiguration {
}
```

> 相当于xml component-scan
>
> ```xml
> <beans>
>     <context:component-scan package="top.felixfly.spring.annotation"/>
> </beans>
> ```



## 常见问题

### `@Configuration`、其他注解与`@Bean`结合使用有什么不同

答：`@Configuration`注解使用的其实也是一个`Bean`，但本身是`BeanFatory`,是经过`CGLIB`进行增强的`Bean`，其他注解（`@Component`、`@Service`、`@Controller`、`@Repository`）使用的就是一个简单的`Bean`

# Bean 的依赖注入

## 注入方式

### 构造器注入



### `Setter`方法注入

## 常见问题

### 循环依赖的问题

答：循环依赖的产生，BeanA依赖BeanB，BeanB依赖BeanC，而BeanC又依赖于BeanA，这时候就会产生循环依赖的问题，单例Bean中通过构造器注入会产生循环依赖的问题，会产生`BeanCurrentlyInCreationException`,通过`Setter`方法注入不会产生异常，可以解决循环依赖问题。原型@Bean通过`Setter`方法注入依然会产生`BeanCurrentlyInCreationException`，没办法解决循环依赖问题。

