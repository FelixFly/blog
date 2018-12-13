---
title: Spring 注解编程IOC
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
3.  `Bean` 生命周期
4.  资源属性赋值

<!-- more -->

# Bean 注册

注册`Bean`的常用注解有`@Component`、`@Service`、`@Controller`、`@Repository`,通过扫描包的方式对这些注解进行解析注册`Bean`。

> 注解`ApplicationContext`:`AnnotationConfigApplicationContext`

## 常用注解

### `@Configuration`

声明`Bean Difinition`的配置文件，相当于一个xml文件

### `@Bean`

 声明`Bean`的组件

```java
@Configuration
public class CustomConfig {
    @Bean
    public Person person() {
        return new Person();
    }
}
```

相当于xml bean内容

```xml
<beans>
    <bean id="person" class="top.felixfly.entity.Person"/>
</beans>
```

> bean的名称默认为方法名称，也可以通过`@Bean(value="person")`或者`@Bean("person")`进行指定

### `@ComponentScan`

指定扫描路径

```java
@Configuration
@ComponentScan("top.felixfly.spring.annotation")
public class ScanConfiguration {
}
```

相当于xml `component-scan`

```xml
<beans>
    <context:component-scan package="top.felixfly.spring.annotation"/>
</beans>
```

### `@ComponentScans`

多个扫描路径，值为`ComponentScan`的数组，1.8以后可以用多个`@ComponentScan`代替此注解

### `@Scope`

指定`Bean`的作用域，默认为`singleton`

* `singleton` `org.springframework.beans.factory.config.ConfigurableBeanFactory#SCOPE_SINGLETON`
* `prototype` `org.springframework.beans.factory.config.ConfigurableBeanFactory#SCOPE_PROTOTYPE`
* `request` `org.springframework.web.context.WebApplicationContext#SCOPE_REQUEST`
* `session` `org.springframework.web.context.WebApplicationContext#SCOPE_SESSION`

```java
@Configuration
public class CustomConfig {
    @Bean
    @Scope("singleton")
    public Person person() {
        return new Person();
    }
}
```

相当于xml中bean中`scope`属性

```xml
<beans>
    <bean id="person" class="top.felixfly.entity.Person" scope="singleton"/>
</beans>
```

### `@Lazy`

懒加载，针对`singleton` `Bean`进行懒加载，默认情况下单实例Bean直接加载

```java
@Configuration
public class CustomConfig {
    @Bean
    @Lazy
    public Person person() {
        return new Person();
    }
}
```

相当于xml中bean的`lazy-init`属性

```xml
<beans>
    <bean id="person" class="top.felixfly.entity.Person" lazy-init="true"/>
</beans>
```

### `@DependsOn`

依赖关系注解

```java
@Configuration
public class CustomConfig {

    @Bean
    @DependsOn("person")
    public Manager manager(){
        return new Manager();
    }

    @Bean
    public Person person(){
        return new Person();
    }
}
```

相当于xml中bean的`depends-on`属性

```xml
<beans>
    <bean id="manager" class="top.felixfly.entity.Manager" depends-on="person"/>
</beans>
```

### `@Conditional`

条件装配`Bean`

* 实现`org.springframework.context.annotation.Condition`接口

  ```java
  public class CustomCondition implements Condition {
      @Override
      public boolean matches(ConditionContext context, AnnotatedTypeMetadata 	metadata) {
          // true 进行装配，false不进行装配
          return false;
      }
  }
  ```

* `Bean`上配置`@Conditional(Condition.class)`

  ```java
  @Configuration
  public class CustomConfig {
  
      @Conditional(CustomCondition.class)
      @Bean
      public Person person() {
          return new Person();
      }
  }
  ```

当matches方法返回true的时候进行注册当前`@Bean`，否则不注册。该注解也可以放到配置类上，matches方法返回true的时候进行注册当前配置类，否侧不注册。

### `@Profile`

环境注解，底层使用的是`@Conditional`

### `@Import`

快捷注册`Bean`，默认名称为类的全路径

* 直接导入类

  ```java
  @Configuration
  @Import(Person.class)
  public class CustomConfig {
  }
  ```

* 导入实现`org.springframework.context.annotation.ImportSelector`类

  ```java
  public class CustomImportSelector implements ImportSelector {
  
      @Override
      public String[] selectImports(AnnotationMetadata annotationMetadata) {
          return new String[]{Person.class.getName()};
      }
  }
  ```

  ```java
  @Configuration
  @Import(CustomImportSelector.class)
  public class CustomConfig {
  }
  ```

* 导入实现`org.springframework.context.annotation.ImportBeanDefinitionRegistrar`类

  ```java
  public class CustomImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {
  
      @Override
      public void registerBeanDefinitions(AnnotationMetadata annotationMetadata, BeanDefinitionRegistry registry) {
          // 自行注册BeanDefinition
          RootBeanDefinition beanDefinition = new RootBeanDefinition(Person.class);
          registry.registerBeanDefinition("person",beanDefinition);
      }
  }
  ```

  ```java
  @Configuration
  @Import(CustomImportBeanDefinitionRegistrar.class)
  public class CustomConfig {
  }
  ```

### `@ImportResource`

导入资源xml文件

> 资源文件名称`spring/application-spring.xml`

```xml
<beans>    
    <bean class="top.felixfly.spring.annotation.entity.Person">
        <constructor-arg index="0" value="张三"/>
        <constructor-arg index="1" value="27"/>
    </bean>
</beans>
```

```java
@Configuration
@ImportResource("classpath:/spring/application-spring.xml")
public class CustomConfig {
}
```

## 常见问题

### `@Configuration`、其他注解与`@Bean`结合使用有什么不同

答：`@Configuration`注解使用的其实也是一个`Bean`，但本身是`BeanFatory`,是经过`CGLIB`进行增强的`Bean`，其他注解（`@Component`、`@Service`、`@Controller`、`@Repository`）使用的就是一个简单的`Bean`

# Bean 依赖注入

## 常用注解

### `@Autowired`

Spring自带的自动注入，注解的属性`required`来支持是否必须要进行依赖注入。根据以下规则进行查找进行注入

1. 根据类型查找，只查询一个直接返回
2. 根据名称查找

```java
@Service
public class PersonService {

    @Autowired
    private PersonMapper personMapper;
}
```

可以结合以下注解进行使用

* `@Qualifier` 

  指定名称进行依赖注入

  ```java
  @Service
  public class PersonService {
  
      @Autowired
      @Qualifier("personMapper")
      private PersonMapper personMapper;
  }
  ```

* `@Primary` 

  指定优先进行依赖注入

  ```java
  @Service
  public class PersonService {
  
      @Autowired
      private PersonMapper personMapper;
  }
  ```

  ```java
  @Configuration
  @ComponentScan({"top.felixfly.spring.annotation.mapper","top.felixfly.spring.annotation.service"})
  public class CustomConfig {
  	// 优先注入
      @Bean("personMapper2")
      @Primary
      public PersonMapper personMapper(){
          return new PersonMapper();
      }
  }
  ```

> 只有一个有参构造器时，`@Autowired`可以省略，可以自动进行注入

### `@Resource`

Java规范(JSR250)的注解,默认按照属性的名称进行依赖查找匹配，也可以用属性`name`进行强制指定，但不支持与`@Primary`注解结合使用和`required`是否必须要进行依赖注入

```java
@Service
public class PersonService {

    @Resource
    private PersonMapper personMapper;
}

@Service
public class PersonService {
	// 强制指定Bean
    @Resource(name="personMapper2")
    private PersonMapper personMapper;
}
```

### `@Inject`

Java规范的注解（JSR330），功能与`@Autowired`一样，但不支持`required`是否必须要进行依赖注入。需要引入`javax.inject`

```xml
<dependency>
    <groupId>javax.inject</groupId>
    <artifactId>javax.inject</artifactId>
    <version>1</version>
</dependency>
```

```java
@Service
public class PersonService {

    @Inject
    private PersonMapper personMapper;
}
```

## 注入方式

### 构造器注入

```java
@Configuration
public class AppConfig {

    @Bean
    public BeanOne beanOne() {
        // 构造器注入
        return new BeanOne(beanTwo());
    }
    
    @Bean
    public BeanOne beanThree(BeanTwo beanTwo) {
        // 构造器注入
        return new BeanOne(beanTwo);
    }

    @Bean
    public BeanTwo beanTwo() {
        return new BeanTwo();
    }
}
```

### `Setter`方法注入

```java
public class BeanTwo {

    @Autowired
    public void setBeanOne(BeanOne beanOne) {
        this.beanOne = beanOne;
    }
}
```

## `Aware`接口

自定义组件注入Spring底层的组件，比如`ApplicationContext`，这些`Aware`接口一般通过`Processor`进行处理。`ApplicationContextAwareProcessor`处理`EnvironmentAware`、`EmbeddedValueResolverAware`、`ResourceLoaderAware`、`ApplicationEventPublisherAware`、`MessageSourceAware`、`ApplicationContextAware`

| `ApplicationContextAware`        | `ApplicationContext`           |
| -------------------------------- | ------------------------------ |
| `ApplicationEventPublisherAware` | `ApplicationContext`事件发布器 |
| `BeanClassLoaderAware`           | 类加载器                       |
| `BeanFactoryAware`               | Bean 工厂                      |
| `BeanNameAware`                  | Bean 名称                      |
| `BootstrapContextAware`          | `BootstrapContext`             |
| `MessageSourceAware`             | 国际化管理                     |
| `NotificationPublisherAware`     | `Spring JMX`通知发布器         |
| `ResourceLoaderAware`            | 资源加载器                     |
| `EmbeddedValueResolverAware`     | `@Value`解析器                 |
| `EnvironmentAware`               | 环境变量                       |

## 常见问题

### 循环依赖的问题

答：循环依赖的产生，BeanA依赖BeanB，BeanB依赖BeanC，而BeanC又依赖于BeanA，这时候就会产生循环依赖的问题，单例Bean中通过构造器注入会产生循环依赖的问题，会产生`BeanCurrentlyInCreationException`,通过`Setter`方法注入不会产生异常，可以解决循环依赖问题。原型@Bean通过`Setter`方法注入依然会产生`BeanCurrentlyInCreationException`，没办法解决循环依赖问题。

# Bean 生命周期

`Bean`的生命周期包含实例化-->初始化-->销毁，单实例`Bean`实例化在容器创建的时候进行实例化以及初始化，销毁在容器关闭的时候进行调用；多实例`Bean`在获取`Bean`的时候进行实例化以及初始化，销毁需要自行进行调用。

## 初始化和销毁常用方法

* `@Bean`指定`initMethod`和`destroyMethod`

  ```java
  @Configuration
  public class CustomConfig {
  
      @Bean(initMethod = "init",destroyMethod = "destroy")
      public Person person(){
          return new Person();
      }
  }
  ```

  相当于xml中配置`init-method`和`destroy-method`属性

  ```xml
  <beans>
      <bean class="top.felixfly.spring.annotation.entity.Person" init-method="init" destroy-method="destroy"/>
  </beans>
  ```

* 实现`InitializingBean`和`DisposableBean`

  ```java
  public class Person implements InitializingBean, DisposableBean {
  
      public Person() {
      }
  
      @Override
      public void afterPropertiesSet() throws Exception {
      }
  
      @Override
      public void destroy() throws Exception {
      }
  }
  ```

* 使用`@PostConstruct`和`@PreDestroy`

  > 注解使用`InitDestroyAnnotationBeanPostProcessor`进行解析处理，父类`CommonAnnotationBeanPostProcessor`

  ```java
  public class Person {
  
      public Person() {
      }
  
      @PostConstruct
      public void postConstruct(){
      }
  
      @PreDestroy
      public void preDestroy(){
      }
  }
  ```

## `BeanPostProcessor`

* `postProcessBeforeInitialization` 初始化之前执行方法
* `postProcessAfterInitialization`  初始化之后执行方法

```java
public class CustomBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }


    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }
}
```

```java
@Configuration
@Import(CustomBeanPostProcessor.class)
public class CustomConfig {

    @Bean
    public Person person(){
        return new Person();
    }
}
```

执行方法若是返回null值，后续的`BeanPostProcessor`不会进行执行，源代码执行如下：

`org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory`

```java
@Override
	public Object applyBeanPostProcessorsBeforeInitialization(Object existingBean, String beanName)
			throws BeansException {

		Object result = existingBean;
		for (BeanPostProcessor processor : getBeanPostProcessors()) {
			Object current = processor.postProcessBeforeInitialization(result, beanName);
			if (current == null) {
				return result;
			}
			result = current;
		}
		return result;
	}

	@Override
	public Object applyBeanPostProcessorsAfterInitialization(Object existingBean, String beanName)
			throws BeansException {

		Object result = existingBean;
		for (BeanPostProcessor processor : getBeanPostProcessors()) {
			Object current = processor.postProcessAfterInitialization(result, beanName);
			if (current == null) {
				return result;
			}
			result = current;
		}
		return result;
	}

```

## 常见问题

### 生命周期执行方法顺序

答：初始化方法执行顺序

1. `@PostConstruct`
2. 实现`InitializingBean`接口的方法
3. `@Bean`指定`initMethod`

销毁方法执行顺序

1. `@PreDestroy`
2. 实现`DisposableBean`接口的方法
3. `@Bean`指定`destroyMethod`

> Multiple lifecycle mechanisms configured for the same bean, with different initialization methods, are called as follows:
>
> 1. Methods annotated with `@PostConstruct`
> 2. `afterPropertiesSet()` as defined by the `InitializingBean` callback interface
> 3. A custom configured `init()` method
>
> Destroy methods are called in the same order:
>
> 1. Methods annotated with `@PreDestroy`
> 2. `destroy()` as defined by the `DisposableBean` callback interface
> 3. A custom configured `destroy()` method

# 资源属性赋值

## 常用注解

### `@Value`

属性进行赋值，可以有如下三种写法

* 直接赋值

  ```java
  public class Person {
  
      @Value("张三")
      private String name;
  }
  ```

* `SpEL`表达式 #{}

  ```java
  public class Person {
  
      @Value("#{20-2}")
      private String age;
  }
  ```

* ${} 文件属性赋值（通常在环境变量`Enviroment`中）,要配合`@PropertySource`使用

  ```java
  public class Person {
  
      @Value("${person.age}")
      private String age;
  }
  ```

### `@PropertySource`

引入配置文件,配置文件下根路径下`person.properties`

```java
@PropertySource("classpath:/person.properties")
public class CustomConfig {

}
```

相当于xml中的`context:property-placeholder`

```xml
<context:property-placeholder location="classpath:person.properties"/>
```

### `@PropertySources`

多个配置文件引入，值为`PropertySource`的数组，1.8以后可以用多个`@PropertySource`代替此注解

## 常见问题

### 配置文件属性乱码

答：注解`@PropertySource`通过属性`encoding`进行配置文件编码，该配置在4.3版本引入；xml配置文件中通过属性`file-encoding`配置文件编码