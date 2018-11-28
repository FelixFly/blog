---
Title: Spring 注解编程
author: FelixFly
date: 2018-10-18
tags:
    - spring
categories: 
    - spring
archives: 2018bean
---

1.  bean 注册
2. bean 生命周期

<!-- more -->

# Bean 注册

1. `@Configuration`与`@Bean`，`@Configuration`  指出Bean Difinition的资源文件

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
   > bean的名称默认为方法名称，也可以通过@Bean(value="person")进行指定

   问：Full @Configuration vs “lite” @Bean mode

   答：用`@Configuration`与其他的Spring `@Component`(`@Service`、`@Controller`)注解和`@Bean`一起使用的比较，`@Configuration`作为导入Bean Definition，本身也是Bean Definition，用其他`@Component`是Bean Definition，需要其他的Bean会使用DI 元信息。`@Bean`大多情况下都与`@Configuration`注解一起使用。

2. `@Configuration`与`@ComponentScan`，`@ComponentScan`指定扫描路径

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

3. 

# Bean 的生命周期

> 实例化(Constructor) --> 初始化 --> 销毁
>
> `singleton` Bean ，容器初始化的时候进行实例化
>
> `prototype` Bean，每次获取的时候进行初始化

>  回顾`xml`配置
>
> ```xml
> <bean init-method="init" destory-method="destory"></bean>
> ```

1. 通过Bean注解

   ```java
   @Bean(initMethod = "init",destroyMethod = "destory")
   ```

2. 实现`InitializingBean`以及`DisposableBean`

   * `org.springframework.beans.factory.InitializingBean#afterPropertiesSet`
   * `org.springframework.beans.factory.DisposableBean#destroy`

3. 实现`SmartLifecycle`(官方文档说的是`Lifecycle`)

   > 此实现接口的处理默认方法是`DefaultLifecycleProcessor`,调用start方法判断为
   >
   > ```java
   > private void startBeans(boolean autoStartupOnly) {
   > 		Map<String, Lifecycle> lifecycleBeans = getLifecycleBeans();
   > 		Map<Integer, LifecycleGroup> phases = new HashMap<>();
   > 		lifecycleBeans.forEach((beanName, bean) -> {
   >             // 判断bean是否是SmartLifecycle并且是否自动启动
   > 			if (!autoStartupOnly || (bean instanceof SmartLifecycle && ((SmartLifecycle) bean).isAutoStartup())) {
   > 				int phase = getPhase(bean);
   > 				LifecycleGroup group = phases.get(phase);
   > 				if (group == null) {
   > 					group = new LifecycleGroup(phase, this.timeoutPerShutdownPhase, lifecycleBeans, autoStartupOnly);
   > 					phases.put(phase, group);
   > 				}
   > 				group.add(beanName, bean);
   > 			}
   > 		});
   > 		if (!phases.isEmpty()) {
   > 			List<Integer> keys = new ArrayList<>(phases.keySet());
   > 			Collections.sort(keys);
   > 			for (Integer key : keys) {
   >                 // 调用Lifecycle#start方法,中间有判断逻辑
   > 				phases.get(key).start();
   > 			}
   > 		}
   > 	}
   > 
   > public void start() {
   > 			if (this.members.isEmpty()) {
   > 				return;
   > 			}
   > 			if (logger.isDebugEnabled()) {
   > 				logger.debug("Starting beans in phase " + this.phase);
   > 			}
   > 			Collections.sort(this.members);
   > 			for (LifecycleGroupMember member : this.members) {
   > 				doStart(this.lifecycleBeans, member.name, this.autoStartupOnly);
   > 			}
   > 		}
   > 
   > 
   > /**
   > 	 * Start the specified bean as part of the given set of Lifecycle beans,
   > 	 * making sure that any beans that it depends on are started first.
   > 	 * @param lifecycleBeans a Map with bean name as key and Lifecycle instance as value
   > 	 * @param beanName the name of the bean to start
   > 	 */
   > 	private void doStart(Map<String, ? extends Lifecycle> lifecycleBeans, String beanName, boolean autoStartupOnly) {
   > 		Lifecycle bean = lifecycleBeans.remove(beanName);
   > 		if (bean != null && bean != this) {
   > 			String[] dependenciesForBean = getBeanFactory().getDependenciesForBean(beanName);
   > 			for (String dependency : dependenciesForBean) {
   > 				doStart(lifecycleBeans, dependency, autoStartupOnly);
   > 			}
   >             // 判断bean是否已执行
   > 			if (!bean.isRunning() &&
   > 					(!autoStartupOnly || !(bean instanceof SmartLifecycle) || ((SmartLifecycle) bean).isAutoStartup())) {
   > 				if (logger.isTraceEnabled()) {
   > 					logger.trace("Starting bean '" + beanName + "' of type [" + bean.getClass().getName() + "]");
   > 				}
   > 				try {
   > 					bean.start();
   > 				}
   > 				catch (Throwable ex) {
   > 					throw new ApplicationContextException("Failed to start bean '" + beanName + "'", ex);
   > 				}
   > 				if (logger.isDebugEnabled()) {
   > 					logger.debug("Successfully started bean '" + beanName + "'");
   > 				}
   > 			}
   > 		}
   > 	}
   > 
   > ```

   ```java
   @Component
   public class LifecycleBean implements SmartLifecycle {
   
       private boolean isStart;
   
   
       public LifecycleBean() {
           System.out.println("LifecycleBean...Constructor...");
       }
   
       @Override
       public void start() {
           isStart = true;
           System.out.println("LifecycleBean...start...");
       }
   
       @Override
       public void stop() {
           System.out.println("LifecycleBean...stop...");
       }
   
       @Override
       public boolean isRunning() {
           return isStart;
       }
   }
   ```

4. `@PostConstruct` 与`@PreDestroy`

5. 实现`BeanPostProcessor`

   * `org.springframework.beans.factory.config.BeanPostProcessor#postProcessBeforeInitialization`
   * `org.springframework.beans.factory.config.BeanPostProcessor#postProcessAfterInitialization`

> 源码分析
>
> `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#initializeBean`
>
> ```java
> /**
> 	 * Initialize the given bean instance, applying factory callbacks
> 	 * as well as init methods and bean post processors.
> 	 * <p>Called from {@link #createBean} for traditionally defined beans,
> 	 * and from {@link #initializeBean} for existing bean instances.
> 	 * @param beanName the bean name in the factory (for debugging purposes)
> 	 * @param bean the new bean instance we may need to initialize
> 	 * @param mbd the bean definition that the bean was created with
> 	 * (can also be {@code null}, if given an existing bean instance)
> 	 * @return the initialized bean instance (potentially wrapped)
> 	 * @see BeanNameAware
> 	 * @see BeanClassLoaderAware
> 	 * @see BeanFactoryAware
> 	 * @see #applyBeanPostProcessorsBeforeInitialization
> 	 * @see #invokeInitMethods
> 	 * @see #applyBeanPostProcessorsAfterInitialization
> 	 */
> 	protected Object initializeBean(final String beanName, final Object bean, @Nullable RootBeanDefinition mbd) {
> 		if (System.getSecurityManager() != null) {
> 			AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
> 				invokeAwareMethods(beanName, bean);
> 				return null;
> 			}, getAccessControlContext());
> 		}
> 		else {
> 			invokeAwareMethods(beanName, bean);
> 		}
> 		// init方法之前
> 		Object wrappedBean = bean;
> 		if (mbd == null || !mbd.isSynthetic()) {
> 			wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
> 		}
> 
> 		try {
>             // 调用init方法
> 			invokeInitMethods(beanName, wrappedBean, mbd);
> 		}
> 		catch (Throwable ex) {
> 			throw new BeanCreationException(
> 					(mbd != null ? mbd.getResourceDescription() : null),
> 					beanName, "Invocation of init method failed", ex);
> 		}
>         // 调用init方法之后
> 		if (mbd == null || !mbd.isSynthetic()) {
> 			wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
> 		}
> 
> 		return wrappedBean;
> 	}
> ```



> 执行顺序
>
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

