---
title: Spring 配置化
author: FelixFly
date: 2019-12-21
tags:
    - spring
categories: 
    - spring
archives: 2019
---

1.   `Environment`抽象
2.   `PropertySource`抽象

<!-- more -->

# `Environment`抽象

环境信息`org.springframework.core.env.Environment`

## 扩展接口

* `ConfigurableEnvironment` 可配置的环境信息
* `ConfigurableWebEnvironment` 可配置的web环境信息

## 标准实现 

* `StandardEnvironment` 标准的环境
* `StandardServletEnvironment` `Servlet`环境下的环境

## 生命周期

### 创建

> `org.springframework.context.support.AbstractApplicationContext#prepareRefresh`

```java
/**
 * Return the {@code Environment} for this application context in configurable
 * form, allowing for further customization.
 * <p>If none specified, a default environment will be initialized via
 * {@link #createEnvironment()}.
 */
@Override
public ConfigurableEnvironment getEnvironment() {
    if (this.environment == null) {
        this.environment = createEnvironment();
    }
    return this.environment;
}

/**
 * Create and return a new {@link StandardEnvironment}.
 * <p>Subclasses may override this method in order to supply
 * a custom {@link ConfigurableEnvironment} implementation.
 */
protected ConfigurableEnvironment createEnvironment() {
    return new StandardEnvironment();
}
```

### 初始化

通过构造器进行初始化，加载方法`org.springframework.core.env.AbstractEnvironment#customizePropertySources`

> 初始化的顺序详见`PropertySource`抽象

```java
/**
 * Customize the set of {@link PropertySource} objects to be searched by this
 * {@code Environment} during calls to {@link #getProperty(String)} and related
 * methods.
 *
 * <p>Subclasses that override this method are encouraged to add property
 * sources using {@link MutablePropertySources#addLast(PropertySource)} such that
 * further subclasses may call {@code super.customizePropertySources()} with
 * predictable results. For example:
 * <pre class="code">
 * public class Level1Environment extends AbstractEnvironment {
 *     &#064;Override
 *     protected void customizePropertySources(MutablePropertySources propertySources) {
 *         super.customizePropertySources(propertySources); // no-op from base class
 *         propertySources.addLast(new PropertySourceA(...));
 *         propertySources.addLast(new PropertySourceB(...));
 *     }
 * }
 *
 * public class Level2Environment extends Level1Environment {
 *     &#064;Override
 *     protected void customizePropertySources(MutablePropertySources propertySources) {
 *         super.customizePropertySources(propertySources); // add all from superclass
 *         propertySources.addLast(new PropertySourceC(...));
 *         propertySources.addLast(new PropertySourceD(...));
 *     }
 * }
 * </pre>
 * In this arrangement, properties will be resolved against sources A, B, C, D in that
 * order. That is to say that property source "A" has precedence over property source
 * "D". If the {@code Level2Environment} subclass wished to give property sources C
 * and D higher precedence than A and B, it could simply call
 * {@code super.customizePropertySources} after, rather than before adding its own:
 * <pre class="code">
 * public class Level2Environment extends Level1Environment {
 *     &#064;Override
 *     protected void customizePropertySources(MutablePropertySources propertySources) {
 *         propertySources.addLast(new PropertySourceC(...));
 *         propertySources.addLast(new PropertySourceD(...));
 *         super.customizePropertySources(propertySources); // add all from superclass
 *     }
 * }
 * </pre>
 * The search order is now C, D, A, B as desired.
 *
 * <p>Beyond these recommendations, subclasses may use any of the {@code add&#42;},
 * {@code remove}, or {@code replace} methods exposed by {@link MutablePropertySources}
 * in order to create the exact arrangement of property sources desired.
 *
 * <p>The base implementation registers no property sources.
 *
 * <p>Note that clients of any {@link ConfigurableEnvironment} may further customize
 * property sources via the {@link #getPropertySources()} accessor, typically within
 * an {@link org.springframework.context.ApplicationContextInitializer
 * ApplicationContextInitializer}. For example:
 * <pre class="code">
 * ConfigurableEnvironment env = new StandardEnvironment();
 * env.getPropertySources().addLast(new PropertySourceX(...));
 * </pre>
 *
 * <h2>A warning about instance variable access</h2>
 * Instance variables declared in subclasses and having default initial values should
 * <em>not</em> be accessed from within this method. Due to Java object creation
 * lifecycle constraints, any initial value will not yet be assigned when this
 * callback is invoked by the {@link #AbstractEnvironment()} constructor, which may
 * lead to a {@code NullPointerException} or other problems. If you need to access
 * default values of instance variables, leave this method as a no-op and perform
 * property source manipulation and instance variable access directly within the
 * subclass constructor. Note that <em>assigning</em> values to instance variables is
 * not problematic; it is only attempting to read default values that must be avoided.
 *
 * @see MutablePropertySources
 * @see PropertySourcesPropertyResolver
 * @see org.springframework.context.ApplicationContextInitializer
 */
protected void customizePropertySources(MutablePropertySources propertySources) {
}
```



### 完成

# `PropertySource`抽象

`Environment`对应一个`MutablePropertySources`，这个一个组合对象，包含多个`PropertySource`

* `servletConfigInitParams` -> `StubPropertySource`

  > web环境加载的时候会替换成`ServletConfigPropertySource`

* `servletContextInitParams` -> `StubPropertySource`

  > web环境加载的时候会替换成`ServletContextPropertySource`

* `jndiProperties` -> `JndiPropertySource`

* `systemEnvironment` -> `PropertiesPropertySource`

  > `(Map) System.getProperties()`

* `systemProperties` -> `SystemEnvironmentPropertySource`

  > `(Map) System.getenv()`





