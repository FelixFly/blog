---
title: Spring Cloud服务熔断
author: FelixFly
date: 2020-02-05
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. `Spring Cloud Hystrix`使用
2. 基于`Spring Aop`自定义服务熔断
3. `Spring Cloud Hystrix`源码分析

<!-- more -->

# Spring Cloud服务熔断

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE
>
> Zookeeper :  3.5.6  （注册中心使用）

## `Spring Cloud Hystrix`使用

### 熔断策略

> - `THREAD` — it executes on a separate thread and concurrent requests are limited by the number of threads in the thread-pool
> - `SEMAPHORE` — it executes on the calling thread and concurrent requests are limited by the semaphore count

* 线程方式  超时，基于 Thread Pool + Future实现
* 信号量方式 限流，基于Semaphore实现

### 基本使用

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
   
   <!--hystrix-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
   </dependency>
   ```

2. 服务启动类添加`@EnableCircuitBreaker`

   ```java
   /**
    * 服务熔断应用
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/5
    */
   @SpringBootApplication
   @EnableCircuitBreaker
   public class CircuitBreakerApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(CircuitBreakerApplication.class, args);
       }
   }
   ```

3. 注解方式演示服务端点

   ```java
   /**
    * 注解演示服务端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/5
    */
   @RestController
   @RequestMapping("/annotation")
   public class AnnotationDemoController {
   
       @HystrixCommand(fallbackMethod = "fallBack", commandProperties = {
               @HystrixProperty(name = "execution.isolation.strategy", value = "THREAD"),
               @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "50")
       })
       @GetMapping("/thread/{message}")
       public String thread(@PathVariable String message) {
           await();
           return "Thread:" + message;
       }
   
       @HystrixCommand(fallbackMethod = "fallBack", commandProperties = {
               @HystrixProperty(name = "execution.isolation.strategy", value = "SEMAPHORE"),
               @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "50"),
               @HystrixProperty(name = "execution.isolation.semaphore.maxConcurrentRequests", value = "1")
       })
       @GetMapping("/semaphore/{message}")
       public String hello(@PathVariable String message) {
           await();
           return "Semaphore:" + message;
       }
   
       public String fallBack(String message) {
           return "Fallback:" + message;
       }
   
       public void await() {
           int waitTime = new Random().nextInt(100);
           try {
               System.out.printf("线程【%s】执行时间%d毫秒\n", Thread.currentThread().getName(), waitTime);
               TimeUnit.MILLISECONDS.sleep(waitTime);
           } catch (InterruptedException e) {
               throw new RuntimeException("线程中断");
           }
       }
   
   }
   ```

   > `@HystrixCommand`配置属性:`https://github.com/Netflix/Hystrix/wiki/Configuration#CommandProperties`

4. 配置文件`application.yml`

   ```yaml
   server:
     port: 8090
   ```

Thread方式访问地址：`http://127.0.0.1:8090/annotation/thread/123`会出现两种结果

* `Thread:123` 正常返回结果
* `Fallback:123` 超时返回结果

> 控制台打印
>
> ```verilog
> 线程【hystrix-DemoController-6】执行时间59毫秒
> 线程【hystrix-DemoController-7】执行时间12毫秒
> 线程【hystrix-DemoController-8】执行时间44毫秒
> 线程【hystrix-DemoController-9】执行时间22毫秒
> 线程【hystrix-DemoController-10】执行时间58毫秒
> ```
>
> 从控制台来看，这个切换线程了

`Semaphore`访问地址：`http://127.0.0.1:8090/annotation/semaphore/123`会出现两种结果

* `Semaphore:123` 正常返回结果
* `Fallback:123` 超时返回结果

> 控制台打印
>
> ```verilog
> 线程【http-nio-8090-exec-1】执行时间0毫秒
> 线程【http-nio-8090-exec-2】执行时间50毫秒
> 线程【http-nio-8090-exec-3】执行时间53毫秒
> 线程【http-nio-8090-exec-4】执行时间1毫秒
> 线程【http-nio-8090-exec-5】执行时间35毫秒
> 线程【http-nio-8090-exec-6】执行时间91毫秒
> 线程【http-nio-8090-exec-7】执行时间5毫秒
> 线程【http-nio-8090-exec-8】执行时间68毫秒
> ```
>
> 从控制台来看，这个没有切换线程

## 基于`Spring Aop`自定义服务熔断

### 服务熔断策略枚举

```java
/**
 * 服务熔断策略
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/5
 */
public enum CircuitBreakerStrategy {
    /**
     * 超时
     */
    THREAD,
    /**
     * 限流
     */
    SEMAPHORE;
}
```

### 服务熔断注解

```java
/**
 * 服务熔断注解
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/5
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface CircuitBreakerCommand {

    /**
     * 服务熔断策略,默认为{@link CircuitBreakerStrategy#SEMAPHORE}
     */
    CircuitBreakerStrategy strategy() default CircuitBreakerStrategy.SEMAPHORE;

    /**
     * 信号量
     */
    int semaphore() default 10;

    /**
     * 超时时间
     */
    int timeout() default 50;

    /**
     * 超时时间单位
     */
    TimeUnit timeUnit() default TimeUnit.MILLISECONDS;

    /**
     * 回调方法
     */
    String fallBack() default "";
}
```

### 服务熔断器（采用策略+模板方法模式）

* 服务熔断器接口

  ```java
  /**
   * 服务熔断器
   *
   * @author FelixFly <chenglinxu@yeah.net>
   * @date 2020/2/5
   */
  public interface CircuitBreaker {
  
      /**
       * 支持的策略
       *
       * @param strategy 策略
       * @return true 支持  false 不支持
       */
      boolean isSupport(CircuitBreakerStrategy strategy);
  
  
      /**
       * 执行方法
       *
       * @param joinPoint      切面执行
       * @param method         执行方法
       * @param circuitBreakerCommand 注解信息
       * @return 执行结果
       */
      Object execute(ProceedingJoinPoint joinPoint, Method method, CircuitBreakerCommand circuitBreakerCommand) throws Exception;
  }
  ```

* 服务熔断器抽象实现类

  ```java
  /**
   * 服务熔断器抽象实现
   *
   * @author FelixFly <chenglinxu@yeah.net>
   * @date 2020/2/5
   */
  public abstract class AbstractCircuitBreaker implements CircuitBreaker {
  
      @Override
      public Object execute(ProceedingJoinPoint joinPoint, Method method, CircuitBreakerCommand circuitBreakerCommand)
              throws Exception {
          // 目标对象
          Object target = joinPoint.getTarget();
          // 执行方法参数
          Object[] args = joinPoint.getArgs();
          try {
              return internalExecute(method, joinPoint, circuitBreakerCommand);
          } catch (TimeoutException exception) {
              // 对TimeoutException异常进行回调方法
              String fallBack = circuitBreakerCommand.fallBack();
              if (StringUtils.isNotBlank(fallBack)) {
                  return invokeFallBackMethod(method, target, circuitBreakerCommand, args);
              }
              throw exception;
          }
      }
  
  
      /**
       * 内部执行方法
       *
       * @param method         执行方法
       * @param joinPoint         切面执行
       * @param circuitBreakerCommand 服务熔断注解信息
       * @return 执行结果
       * @throws TimeoutException 超时异常
       */
      public abstract Object internalExecute(Method method, ProceedingJoinPoint joinPoint,
                                             CircuitBreakerCommand circuitBreakerCommand)
              throws Exception;
  
      /**
       * 执行服务熔断方法
       *
       * @param method         执行方法
       * @param target         目前对象
       * @param circuitBreakerCommand 服务熔断注解信息
       * @param args           方法参数
       * @return 执行结果
       */
      protected Object invokeFallBackMethod(Method method, Object target,
                                            CircuitBreakerCommand circuitBreakerCommand, Object[] args) throws Exception {
          Method fallBackMethod = fallBackMethod(method, target, circuitBreakerCommand);
          return fallBackMethod.invoke(target, args);
      }
  
  
      /**
       * 获取回调方法
       *
       * @param method         执行方法
       * @param target         目前对象
       * @param circuitBreakerCommand 服务熔断注解信息
       * @return 目标方法
       * @throws NoSuchMethodException 无此目标方法
       */
      private Method fallBackMethod(Method method, Object target,
                                    CircuitBreakerCommand circuitBreakerCommand) throws NoSuchMethodException {
          String fallBackMethodName = circuitBreakerCommand.fallBack();
          Class<?> beanClass = target.getClass();
          return beanClass.getMethod(fallBackMethodName, method.getParameterTypes());
      }
  }
  ```

* 超时熔断器

  ```java
  /**
   * {@link CircuitBreakerStrategy#THREAD} 超时熔断器
   *
   * @author FelixFly <chenglinxu@yeah.net>
   * @date 2020/2/5
   */
  @Service
  public class ThreadCircuitBreaker extends AbstractCircuitBreaker {
  
      private ExecutorService executorService = Executors.newFixedThreadPool(2);
  
      @Override
      public boolean isSupport(CircuitBreakerStrategy strategy) {
          return CircuitBreakerStrategy.THREAD.equals(strategy);
      }
  
      @Override
      public Object internalExecute(Method method, ProceedingJoinPoint joinPoint,
                                    CircuitBreakerCommand circuitBreakerCommand) throws Exception {
          // 执行方法参数
          Object[] args = joinPoint.getArgs();
  
          // 进行异步调用
          Future<Object> future = executorService.submit(() -> {
              try {
                  return joinPoint.proceed(args);
              } catch (Throwable throwable) {
                  throw new RuntimeException("调用目标方法错误");
              }
          });
          try {
              return future.get(circuitBreakerCommand.timeout(), circuitBreakerCommand.timeUnit());
          } catch (TimeoutException timeoutException) {
              future.cancel(true);//取消执行
              throw timeoutException;
          }
  
          // 使用CompletableFuture进行异步调用,超时异常没有办法取消调用
          /*CompletableFuture<Object> completableFuture = CompletableFuture.supplyAsync(() -> {
  
              try {
                  return joinPoint.proceed(args);
              } catch (Throwable throwable) {
                  throw new RuntimeException("调用目标方法错误");
              }
          });
          try {
              return completableFuture.get(circuitBreakerCommand.timeout(), circuitBreakerCommand.timeUnit());
          } catch (TimeoutException timeoutException) {
              // this value has no effect in this implementation because interrupts are not used to control processing.
              completableFuture.cancel(true);//取消执行，无法进行取消
              throw timeoutException;
          }*/
      }
      
      @PreDestroy
      public void destroy(){
          executorService.shutdown();
      }
  }
  ```

* 限流熔断器

  ```java
  /**
   * {@link CircuitBreakerStrategy#SEMAPHORE} 限流熔断器
   *
   * @author FelixFly <chenglinxu@yeah.net>
   * @date 2020/2/5
   */
  @Service
  public class SemaphoreCircuitBreaker extends AbstractCircuitBreaker {
  
      private Map<Method, Semaphore> methodSemaphoreMap = new ConcurrentHashMap<>(128);
  
      @Override
      public boolean isSupport(CircuitBreakerStrategy strategy) {
          return CircuitBreakerStrategy.SEMAPHORE.equals(strategy);
      }
  
      @Override
      public Object internalExecute(Method method, ProceedingJoinPoint joinPoint,
                                    CircuitBreakerCommand circuitBreakerCommand) throws Exception {
          Semaphore semaphore = initSemaphore(method, circuitBreakerCommand.semaphore());
          boolean tryAcquire = semaphore.tryAcquire(circuitBreakerCommand.timeout(), circuitBreakerCommand.timeUnit());
          if (!tryAcquire) {
              throw new TimeoutException("获取信号量超时");
          }
          try {
              return joinPoint.proceed(joinPoint.getArgs());
          } catch (Throwable throwable) {
              throw new RuntimeException("调用目标方法错误");
          } finally {
              semaphore.release();
          }
      }
  
      private Semaphore initSemaphore(Method method, int semaphore) {
          return methodSemaphoreMap.computeIfAbsent(method,
                  value -> new Semaphore(semaphore));
      }
  }
  ```

### 服务熔断切面

```java
/**
 * {@link CircuitBreakerCommand} 服务熔断切面
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/5
 */
@Configuration
@Aspect
public class CircuitBreakerAop {

    @Autowired
    private List<CircuitBreaker> circuitBreakers;

    @Around("@annotation(top.felixfly.cloud.circuit.breaker.annotation.CircuitBreakerCommand)")
    public Object circuitBreaker(ProceedingJoinPoint joinPoint) throws Exception {
        // @CircuitBreaker直接注解在方法上，肯定是直接返回
        MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
        // 执行方法
        Method method = methodSignature.getMethod();
        CircuitBreakerCommand circuitBreakerCommand = method.getAnnotation(CircuitBreakerCommand.class);

        CircuitBreakerStrategy strategy = circuitBreakerCommand.strategy();
        CircuitBreaker circuitBreaker = circuitBreakers.stream().filter(item -> item.isSupport(strategy))
                .findAny().orElseThrow(() -> new RuntimeException("无此服务策略[" + strategy + "]"));
        return circuitBreaker.execute(joinPoint,method, circuitBreakerCommand);
    }
}
```

### 自定义服务端点

```java
/**
 * 自定义演示服务端点
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/5
 */
@RestController
@RequestMapping("custom")
public class CustomDemoController {

    @CircuitBreakerCommand(strategy = CircuitBreakerStrategy.THREAD, fallBack = "fallBack")
    @GetMapping("/thread/{message}")
    public String thread(@PathVariable String message) {
        await();
        System.out.println("执行Thread");
        return "Thread:" + message;
    }

    @CircuitBreakerCommand(strategy = CircuitBreakerStrategy.SEMAPHORE, semaphore = 1, fallBack = "fallBack")
    @GetMapping("/semaphore/{message}")
    public String hello(@PathVariable String message) {
        await();
        System.out.println("执行Semaphore");
        return "Semaphore:" + message;
    }

    public String fallBack(String message) {
        return "Fallback:" + message;
    }

    public void await() {
        // 100的时候限流熔断不太好演示，改成300进行演示
        int waitTime = new Random().nextInt(300);
        try {
            System.out.printf("线程【%s】执行时间%d毫秒\n", Thread.currentThread().getName(), waitTime);
            TimeUnit.MILLISECONDS.sleep(waitTime);
        } catch (InterruptedException e) {
            throw new RuntimeException("线程中断");
        }
    }

}
```

Thread方式访问地址：`http://127.0.0.1:8090/custom/thread/123`会出现两种结果

* `Thread:123` 正常返回结果
* `Fallback:123` 超时返回结果

`Semaphore`访问地址：`http://127.0.0.1:8090/custom/semaphore/123`会出现两种结果

* `Semaphore:123` 正常返回结果
* `Fallback:123` 超时返回结果

## `Spring Cloud Hystrix`源码分析

### `@EnableCircuitBreaker`分析

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@Import(EnableCircuitBreakerImportSelector.class)
public @interface EnableCircuitBreaker {

}
```

* 导入了`EnableCircuitBreakerImportSelector`选择器

  ```java
  @Order(Ordered.LOWEST_PRECEDENCE - 100)
  public class EnableCircuitBreakerImportSelector
  		extends SpringFactoryImportSelector<EnableCircuitBreaker> {
  
  	@Override
  	protected boolean isEnabled() {
  		return getEnvironment().getProperty("spring.cloud.circuit.breaker.enabled",
  				Boolean.class, Boolean.TRUE);
  	}
  
  }
  ```

* 父类`SpringFactoryImportSelector`

  ```java
  public abstract class SpringFactoryImportSelector<T>
  		implements DeferredImportSelector, BeanClassLoaderAware, EnvironmentAware {
  
  	private final Log log = LogFactory.getLog(SpringFactoryImportSelector.class);
  
  	private ClassLoader beanClassLoader;
  
  	private Class<T> annotationClass;
  
  	private Environment environment;
  
  	@SuppressWarnings("unchecked")
  	protected SpringFactoryImportSelector() {
  		this.annotationClass = (Class<T>) GenericTypeResolver
  				.resolveTypeArgument(this.getClass(), SpringFactoryImportSelector.class);
  	}
  
  	@Override
  	public String[] selectImports(AnnotationMetadata metadata) {
  		if (!isEnabled()) {
  			return new String[0];
  		}
  		AnnotationAttributes attributes = AnnotationAttributes.fromMap(
  				metadata.getAnnotationAttributes(this.annotationClass.getName(), true));
  
  		Assert.notNull(attributes, "No " + getSimpleName() + " attributes found. Is "
  				+ metadata.getClassName() + " annotated with @" + getSimpleName() + "?");
  
  		// Find all possible auto configuration classes, filtering duplicates
  		List<String> factories = new ArrayList<>(new LinkedHashSet<>(SpringFactoriesLoader
  				.loadFactoryNames(this.annotationClass, this.beanClassLoader)));
  
  		if (factories.isEmpty() && !hasDefaultFactory()) {
  			throw new IllegalStateException("Annotation @" + getSimpleName()
  					+ " found, but there are no implementations. Did you forget to include a starter?");
  		}
  
  		if (factories.size() > 1) {
  			// there should only ever be one DiscoveryClient, but there might be more than
  			// one factory
  			this.log.warn("More than one implementation " + "of @" + getSimpleName()
  					+ " (now relying on @Conditionals to pick one): " + factories);
  		}
  
  		return factories.toArray(new String[factories.size()]);
  	}
  
  	protected boolean hasDefaultFactory() {
  		return false;
  	}
  
  	protected abstract boolean isEnabled();
  
  	protected String getSimpleName() {
  		return this.annotationClass.getSimpleName();
  	}
  
  	protected Class<T> getAnnotationClass() {
  		return this.annotationClass;
  	}
  
  	protected Environment getEnvironment() {
  		return this.environment;
  	}
  
  	@Override
  	public void setEnvironment(Environment environment) {
  		this.environment = environment;
  	}
  
  	@Override
  	public void setBeanClassLoader(ClassLoader classLoader) {
  		this.beanClassLoader = classLoader;
  	}
  
  }
  ```

  通过`SpringFactoriesLoader`加载了`EnableCircuitBreaker`的配置类

  > 查找这个`org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker`配置类发现`spring-cloud-netflix-hystrix`包下`META-INF/spring.factories`有如下配置
  >
  > ```properties
  > org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker=\
  > org.springframework.cloud.netflix.hystrix.HystrixCircuitBreakerConfiguration
  > ```

### `HystrixCircuitBreakerConfiguration` `Hystrix`服务熔断配置

```java
@Configuration(proxyBeanMethods = false)
public class HystrixCircuitBreakerConfiguration {

    // 从这个地方查看Hystrix也是通过Spring Aop进行实现的
	@Bean
	public HystrixCommandAspect hystrixCommandAspect() {
		return new HystrixCommandAspect();
	}

	@Bean
	public HystrixShutdownHook hystrixShutdownHook() {
		return new HystrixShutdownHook();
	}

	@Bean
	public HasFeatures hystrixFeature() {
		return HasFeatures
				.namedFeatures(new NamedFeature("Hystrix", HystrixCommandAspect.class));
	}

	/**
	 * {@link DisposableBean} that makes sure that Hystrix internal state is cleared when
	 * {@link ApplicationContext} shuts down.
	 */
	private class HystrixShutdownHook implements DisposableBean {

		@Override
		public void destroy() throws Exception {
			// Just call Hystrix to reset thread pool etc.
			Hystrix.reset();
		}

	}

}
```

### `HystrixCommandAspect` `HystrixCommand`切面

```java
@Aspect
public class HystrixCommandAspect {

    private static final Map<HystrixPointcutType, MetaHolderFactory> META_HOLDER_FACTORY_MAP;

    static {
        META_HOLDER_FACTORY_MAP = ImmutableMap.<HystrixPointcutType, MetaHolderFactory>builder()
                .put(HystrixPointcutType.COMMAND, new CommandMetaHolderFactory())
                .put(HystrixPointcutType.COLLAPSER, new CollapserMetaHolderFactory())
                .build();
    }

    @Pointcut("@annotation(com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand)")

    public void hystrixCommandAnnotationPointcut() {
    }

    @Pointcut("@annotation(com.netflix.hystrix.contrib.javanica.annotation.HystrixCollapser)")
    public void hystrixCollapserAnnotationPointcut() {
    }

    @Around("hystrixCommandAnnotationPointcut() || hystrixCollapserAnnotationPointcut()")
    public Object methodsAnnotatedWithHystrixCommand(final ProceedingJoinPoint joinPoint) throws Throwable {
        Method method = getMethodFromTarget(joinPoint);
        Validate.notNull(method, "failed to get method from joinPoint: %s", joinPoint);
        if (method.isAnnotationPresent(HystrixCommand.class) && method.isAnnotationPresent(HystrixCollapser.class)) {
            throw new IllegalStateException("method cannot be annotated with HystrixCommand and HystrixCollapser " +
                    "annotations at the same time");
        }
        MetaHolderFactory metaHolderFactory = META_HOLDER_FACTORY_MAP.get(HystrixPointcutType.of(method));
        MetaHolder metaHolder = metaHolderFactory.create(joinPoint);
        HystrixInvokable invokable = HystrixCommandFactory.getInstance().create(metaHolder);
        ExecutionType executionType = metaHolder.isCollapserAnnotationPresent() ?
                metaHolder.getCollapserExecutionType() : metaHolder.getExecutionType();

        Object result;
        try {
            if (!metaHolder.isObservable()) {
                result = CommandExecutor.execute(invokable, executionType, metaHolder);
            } else {
                result = executeObservable(invokable, executionType, metaHolder);
            }
        } catch (HystrixBadRequestException e) {
            throw e.getCause();
        } catch (HystrixRuntimeException e) {
            throw hystrixRuntimeExceptionToThrowable(metaHolder, e);
        }
        return result;
    }
    ....
}
```

从代码来看切面拦截了两个注解，`@HystrixCommand`和`@HystrixCollapser`，前面已经熟悉过`@HystrixCommand`,这个`@HystrixCollapser`又是什么内容

### `@HystrixCollapser`注解

```java
/**
 * This annotation is used to collapse some commands into a single backend dependency call.
 * This annotation should be used together with {@link HystrixCommand} annotation.
 * <p/>
 * Example:
 * <pre>
 *     @HystrixCollapser(batchMethod = "getUserByIds"){
 *          public Future<User> getUserById(String id) {
 *          return null;
 * }
 *  @HystrixCommand
 *      public List<User> getUserByIds(List<String> ids) {
 *          List<User> users = new ArrayList<User>();
 *          for (String id : ids) {
 *              users.add(new User(id, "name: " + id));
 *          }
 *      return users;
 * }
 *   </pre>
 *
 * A method annotated with {@link HystrixCollapser} annotation can return any
 * value with compatible type, it does not affect the result of collapser execution,
 * collapser method can even return {@code null} or another stub.
 * Pay attention that if a collapser method returns parametrized Future then generic type must be equal to generic type of List,
 * for instance:
 * <pre>
 *     Future<User> - return type of collapser method
 *     List<User> - return type of batch command method
 * </pre>
 * <p/>
 * Note: batch command method must be annotated with {@link HystrixCommand} annotation.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface HystrixCollapser {

    /**
     * Specifies a collapser key.
     * <p/>
     * default => the name of annotated method.
     *
     * @return collapser key.
     */
    String collapserKey() default "";

    /**
     * Method name of batch command.
     * <p/>
     * Method must have the following signature:
     * <pre>
     *     java.util.List method(java.util.List)
     * </pre>
     * NOTE: batch method can have only one argument.
     *
     * @return method name of batch command
     */
    String batchMethod();

    /**
     * Defines what scope the collapsing should occur within.
     * <p/>
     * default => the {@link Scope#REQUEST}.
     *
     * @return {@link Scope}
     */
    Scope scope() default Scope.REQUEST;

    /**
     * Specifies collapser properties.
     *
     * @return collapser properties
     */
    HystrixProperty[] collapserProperties() default {};

}
```

从`@HystrixCollapser`这个代码注释来看是针对`Future`返回值来做的，理解来看是多个`@HystrixCommand`组合注解

> Spring Cloud 官方文档没有对`@HystrixCollapser`注解类的介绍

```java
/**
 * 注解演示服务端点
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/5
 */
@RestController
@RequestMapping("/annotation")
public class AnnotationDemoController {


    @HystrixCollapser(batchMethod = "batchMethod", collapserProperties = {
            @HystrixProperty(name = "timerDelayInMilliseconds", value = "50")
    })
    @GetMapping("/collapser/{message}")
    public Future<String> collapser(@PathVariable String message) {
        await();
        return null;
    }


    @HystrixCommand
    public List<String> batchMethod(List<String> messages) {
        await();
        return messages.stream().map(message ->"Thread:" + message).collect(toList());
    }

    public List<String> batchFallBack(List<String> messages) {
        return messages.stream().map(message ->"Fallback:" + message).collect(toList());
    }

    @HystrixCommand(fallbackMethod = "fallBack", commandProperties = {
            @HystrixProperty(name = "execution.isolation.strategy", value = "THREAD"),
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "50")
    })
    @GetMapping("/thread/{message}")
    public String thread(@PathVariable String message) {
        await();
        return "Thread:" + message;
    }

    @HystrixCommand(fallbackMethod = "fallBack", commandProperties = {
            @HystrixProperty(name = "execution.isolation.strategy", value = "SEMAPHORE"),
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "50"),
            @HystrixProperty(name = "execution.isolation.semaphore.maxConcurrentRequests", value = "1")
    })
    @GetMapping("/semaphore/{message}")
    public String hello(@PathVariable String message) {
        await();
        return "Semaphore:" + message;
    }

    public String fallBack(String message) {
        return "Fallback:" + message;
    }

    public void await() {
        int waitTime = new Random().nextInt(100);
        try {
            System.out.printf("线程【%s】执行时间%d毫秒\n", Thread.currentThread().getName(), waitTime);
            TimeUnit.MILLISECONDS.sleep(waitTime);
        } catch (InterruptedException e) {
            throw new RuntimeException("线程中断");
        }
    }

}
```

> `@HystrixCollapser`配置信息：https://github.com/Netflix/Hystrix/wiki/Configuration#Collapser

访问地址：`http://127.0.0.1:8090/annotation/collapser/123`

```json
{
	"cancelled": false,
	"done": true
}
```

> 暂时还没发现具体的用处，等发现的时候来继续补充

