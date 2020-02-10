---
title: Spring Cloud服务调用
author: FelixFly
date: 2020-02-07
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. `OpenFeign`核心`api`
2. `Spring Cloud Feign`使用
3. `RestTemplate`自定义实现服务调用
4. `Spring Cloud Feign`源码分析

<!-- more -->

# Spring Cloud服务调用

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE
>
> Zookeeper :  3.5.6  （注册中心使用）

## `OpenFeign`核心`api`

> Feign is a Java to HTTP client binder inspired by [Retrofit](https://github.com/square/retrofit), [JAXRS-2.0](https://jax-rs-spec.java.net/nonav/2.0/apidocs/index.html), and [WebSocket](http://www.oracle.com/technetwork/articles/java/jsr356-1937161.html)

* `feign.Feign` 核心类
* `feign.Contract` 服务接口类的注解和值解析
* `feign.Client`  调用
* `feign.Retryer` 重试
* `feign.codec.Encoder` 序列化，对象转成`Http`请求
* `feign.codec.Decoder` 反序列化，`Http`请求转换为对象
* `feign.QueryMapEncoder` 查询参数的编码
* `feign.codec.ErrorDecoder` 错误信息编码
* `feign.Request` 请求参数
* `feign.InvocationHandlerFactory` 控制反射方法分派

## `Spring Cloud Feign`使用

### 服务端

> 一个简单的对外提供服务，基于`Zookeeper`注册中心

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
   <!--zookeeper 客户端-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId>
   </dependency>
   ```

2. 简单的对外提供服务端点

   ```java
   /**
    * 演示服务端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/7
    */
   @RestController
   public class EchoController {
   
       @Autowired
       private Environment environment;
   
   
       @GetMapping("/echo")
       public String echo(@RequestParam String message) {
           // 由于采用的是随机端口，这地方必须采用这个方式获取端口
           String port = environment.getProperty("local.server.port");
           return "ECHO(" + port + "):" + message;
       }
   }
   ```

3. 配置文件`application.yml`

   ```yaml
   spring:
     application:
       name: feign-server
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
   server:
     port: 0
   ```

4. 服务启动程序类`FeignServerApplication`

   ```java
   /**
    * Feign 服务端应用
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/7
    */
   @SpringBootApplication
   public class FeignServerApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(FeignServerApplication.class, args);
       }
   }
   ```

   > 启动服务，根据启动日志查看本地的随机端口，此次端口是`60981`
   >
   > `http://127.0.0.1:60981/echo?message=Hello` 返回信息ECHO(60981):Hello

### 客户端

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
   <!--zookeeper 客户端-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId>
   </dependency>
   <!--openfeign 客户端调用-->
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-openfeign</artifactId>
   </dependency>
   ```

2. 服务提供接口

   ```java
   /**
    * 服务提供echo服务
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/7
    */
   @FeignClient("feign-server") //标注是Feign Client
   public interface EchoService {
   
       @GetMapping("/echo")
       String echo(@RequestParam("message") String message);
   }
   ```

3. 客户端提供服务端点

   ```java
   /**
    * 演示服务端点
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/7
    */
   @RestController
   public class EchoController {
   
       @Autowired
       private EchoService echoService;
   
       @GetMapping("/echo")
       public String echo(String message) {
           return this.echoService.echo(message);
       }
   }
   ```

4. 配置文件`application.yml`

   ```yaml
   spring:
     application:
       name: feign-client
     cloud:
       zookeeper:
         connect-string: 127.0.0.1:2181
   server:
     port: 8090
   ```

5. 服务启动程序类`FeignClientApplication`

   ```java
   /**
    * Feign 客户端服务
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/2/7
    */
   @SpringBootApplication
   @EnableFeignClients(clients = EchoService.class) //启用Feign Client
   public class FeignClientApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(FeignClientApplication.class, args);
       }
   }
   ```

   > 启动服务，`http://localhost:8090/echo?message=hello` 返回信息ECHO(60981):hello

## `RestTemplate`自定义实现服务调用

### 自定义客户端调用注解

```java
/**
 * rest 客户端调用
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/7
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RestFeignClient {

    /**
     * 服务名称
     *
     */
    String value() default "";
}
```

### 自定义客户端调用服务

```java
/**
 * 服务提供echo服务
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/7
 */
@RestFeignClient("feign-server") //标注是Feign Client
public interface RestEchoService {

    @GetMapping("/echo")
    String echo(@RequestParam("message") String message);
}
```

### 自定义客户端启用注解

```java
/**
 * 启用Rest 客户端
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/7
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(RestFeignClientsRegistrar.class)
public @interface EnableRestFeignClients {

    /**
     * {@link RestFeignClient}接口列表
     */
    Class<?>[] clients() default {};
}
```

### 导入`RestFeignClientsRegistrar`

```java
/**
 * rest 客户端注册
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/7
 */
public class RestFeignClientsRegistrar
        implements ImportBeanDefinitionRegistrar, BeanFactoryAware {

    private BeanFactory beanFactory;

    @Override
    public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
        // 类加载类
        ClassLoader classLoader = metadata.getClass().getClassLoader();
        // 获取EnableRestFeignClients注解的内容
        Map<String, Object> annotationAttributes = metadata
                .getAnnotationAttributes(EnableRestFeignClients.class.getName());
        // 获取clients
        Class<?>[] clients = (Class<?>[]) annotationAttributes.get("clients");
        Stream.of(clients)
                .filter(Class::isInterface)
                .filter(interfaceClass ->
                        Objects.nonNull(AnnotationUtils.findAnnotation(interfaceClass, RestFeignClient.class)))
                .forEach(restClientClass -> {
                    // 获取服务名称
                    RestFeignClient restFeignClient = AnnotationUtils
                            .findAnnotation(restClientClass, RestFeignClient.class);
                    String serviceName = restFeignClient.value();


                    Object proxyInstance = Proxy.newProxyInstance(classLoader, new Class<?>[]{restClientClass},
                            new RestFeignClientInvocationHandler(serviceName, this.beanFactory));

                    // 注册Bean
                    BeanDefinitionBuilder beanDefinitionBuilder = BeanDefinitionBuilder
                            .genericBeanDefinition(RestFeignClientFactoryBean.class);
                    beanDefinitionBuilder.addConstructorArgValue(proxyInstance);
                    beanDefinitionBuilder.addConstructorArgValue(restClientClass);
                    AbstractBeanDefinition beanDefinition = beanDefinitionBuilder.getBeanDefinition();
                    String beanName = serviceName + restClientClass.getName();
                    beanDefinition.setFactoryBeanName("&" + beanName);
                    registry.registerBeanDefinition(beanName, beanDefinition);

                });
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        this.beanFactory = beanFactory;
    }


    private static class RestFeignClientFactoryBean implements FactoryBean<Object> {

        private final Object object;
        private final Class<?> objectType;

        private RestFeignClientFactoryBean(Object object, Class<?> objectType) {
            this.object = object;
            this.objectType = objectType;
        }


        @Override
        public Object getObject() throws Exception {
            return this.object;
        }

        @Override
        public Class<?> getObjectType() {
            return this.objectType;
        }
    }
}
```

### 动态代理调用`RestFeignClientInvocationHandler`

```java
/**
 * Rest 客户端调用
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/7
 */
public class RestFeignClientInvocationHandler implements InvocationHandler {

    private final String serverName;

    private final BeanFactory beanFactory;

    public RestFeignClientInvocationHandler(String serverName, BeanFactory beanFactory) {
        this.serverName = serverName;
        this.beanFactory = beanFactory;
    }


    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 带有requestMapping的方法
        RequestMapping requestMapping =
                AnnotatedElementUtils
                        .findMergedAnnotation(method, RequestMapping.class);
        // 没有RequestMapping的方法调用原来的方法
        if (Objects.isNull(requestMapping)) {
            return method.invoke(proxy, args);
        }
        // 路径，默认只取第一个
        String path = requestMapping.path()[0];
        // beanFactory的默认实现是DefaultListableBeanFactory,可以直接强制转成ListableBeanFactory
        ListableBeanFactory listableBeanFactory = (ListableBeanFactory) this.beanFactory;
        // 获取所有的RestTemplate的Bean
        Map<String, RestTemplate> restTemplateMap = listableBeanFactory
                .getBeansOfType(RestTemplate.class);
        // 获取标注有的@LoadBalanced的RestTemplate的BeanName
        String restTemplateName = restTemplateMap.keySet()
                .stream()
                .filter(beanName -> Objects
                        .nonNull(listableBeanFactory.findAnnotationOnBean(beanName,
                                LoadBalanced.class)))
                .findAny()
                .orElseThrow(() -> new RuntimeException("没有@LoadBalanced标注的RestTemplate"));
        // 获取标注有的@LoadBalanced的RestTemplate
        RestTemplate restTemplate = restTemplateMap.get(restTemplateName);
        StringBuilder paramBuilder = new StringBuilder("http://").append(serverName).append(path).append("?");
        Parameter[] parameters = method.getParameters();
        for (int i = 0; i < parameters.length; i++) {
            Parameter parameter = parameters[0];
            RequestParam requestParam = AnnotationUtils.getAnnotation(parameter, RequestParam.class);
            if (Objects.isNull(requestParam)) {
                continue;
            }
            String paramName = requestParam.value();
            String paramValue = String.valueOf(args[i]);
            paramBuilder.append("&").append(paramName).append("=").append(paramValue);
        }
        String url = paramBuilder.toString();
        RequestMethod[] requestMethods = requestMapping.method();
        // 默认取第一个
        HttpMethod httpMethod = HttpMethod.resolve(requestMethods[0].name());
        ResponseEntity<?> exchange = restTemplate.exchange(url, httpMethod, null,
                method.getReturnType());
        return exchange.getBody();
    }
}
```

### 启动添加启用注解

```java
/**
 * Feign 客户端服务
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/7
 */
@SpringBootApplication
@EnableFeignClients(clients = EchoService.class) //启用Feign Client
@EnableRestFeignClients(clients = RestEchoService.class) // 启动Rest Client
public class FeignClientApplication {

    public static void main(String[] args) {
        SpringApplication.run(FeignClientApplication.class, args);
    }

    @LoadBalanced
    @Bean
    public RestTemplate restTemplate(){
        return new RestTemplate();
    }
}
```

### 演示服务端点

```java
/**
 * 演示服务端点
 *
 * @author FelixFly <chenglinxu@yeah.net>
 * @date 2020/2/7
 */
@RestController
public class EchoController {

    @Autowired
    private EchoService echoService;

    @Autowired
    private RestEchoService restEchoService;

    @GetMapping("/echo")
    public String echo(String message) {
        return this.echoService.echo(message);
    }

    @GetMapping("/rest/echo")
    public String restEcho(String message) {
        return this.restEchoService.echo(message);
    }
}
```

> 启动服务，`http://localhost:8090/rest/echo?message=hello` 返回信息ECHO(60981):hello

## `Spring Cloud Feign`源码分析

### `@EnableFeignClients`分析

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(FeignClientsRegistrar.class)
public @interface EnableFeignClients {

	...
}
```

**导入了`FeignClientsRegistrar`**

```java
class FeignClientsRegistrar
		implements ImportBeanDefinitionRegistrar, ResourceLoaderAware, EnvironmentAware {

	// patterned after Spring Integration IntegrationComponentScanRegistrar
	// and RibbonClientsConfigurationRegistgrar

	private ResourceLoader resourceLoader;

	private Environment environment;

	FeignClientsRegistrar() {
	}

	...

	@Override
	public void setResourceLoader(ResourceLoader resourceLoader) {
		this.resourceLoader = resourceLoader;
	}

	@Override
	public void registerBeanDefinitions(AnnotationMetadata metadata,
			BeanDefinitionRegistry registry) {
        // 注册默认配置
		registerDefaultConfiguration(metadata, registry);
        // 注册Feign 客户端
		registerFeignClients(metadata, registry);
	}

	private void registerDefaultConfiguration(AnnotationMetadata metadata,
			BeanDefinitionRegistry registry) {
		Map<String, Object> defaultAttrs = metadata
				.getAnnotationAttributes(EnableFeignClients.class.getName(), true);

		if (defaultAttrs != null && defaultAttrs.containsKey("defaultConfiguration")) {
			String name;
			if (metadata.hasEnclosingClass()) {
				name = "default." + metadata.getEnclosingClassName();
			}
			else {
				name = "default." + metadata.getClassName();
			}
			registerClientConfiguration(registry, name,
					defaultAttrs.get("defaultConfiguration"));
		}
	}

	public void registerFeignClients(AnnotationMetadata metadata,
			BeanDefinitionRegistry registry) {
		ClassPathScanningCandidateComponentProvider scanner = getScanner();
		scanner.setResourceLoader(this.resourceLoader);

		Set<String> basePackages;

		Map<String, Object> attrs = metadata
				.getAnnotationAttributes(EnableFeignClients.class.getName());
		AnnotationTypeFilter annotationTypeFilter = new AnnotationTypeFilter(
				FeignClient.class);
		final Class<?>[] clients = attrs == null ? null
				: (Class<?>[]) attrs.get("clients");
		if (clients == null || clients.length == 0) {
			scanner.addIncludeFilter(annotationTypeFilter);
			basePackages = getBasePackages(metadata);
		}
		else {
			final Set<String> clientClasses = new HashSet<>();
			basePackages = new HashSet<>();
			for (Class<?> clazz : clients) {
				basePackages.add(ClassUtils.getPackageName(clazz));
				clientClasses.add(clazz.getCanonicalName());
			}
			AbstractClassTestingTypeFilter filter = new AbstractClassTestingTypeFilter() {
				@Override
				protected boolean match(ClassMetadata metadata) {
					String cleaned = metadata.getClassName().replaceAll("\\$", ".");
					return clientClasses.contains(cleaned);
				}
			};
			scanner.addIncludeFilter(
					new AllTypeFilter(Arrays.asList(filter, annotationTypeFilter)));
		}

		for (String basePackage : basePackages) {
			Set<BeanDefinition> candidateComponents = scanner
					.findCandidateComponents(basePackage);
			for (BeanDefinition candidateComponent : candidateComponents) {
				if (candidateComponent instanceof AnnotatedBeanDefinition) {
					// verify annotated class is an interface
					AnnotatedBeanDefinition beanDefinition = (AnnotatedBeanDefinition) candidateComponent;
					AnnotationMetadata annotationMetadata = beanDefinition.getMetadata();
					Assert.isTrue(annotationMetadata.isInterface(),
							"@FeignClient can only be specified on an interface");

					Map<String, Object> attributes = annotationMetadata
							.getAnnotationAttributes(
									FeignClient.class.getCanonicalName());

					String name = getClientName(attributes);
					registerClientConfiguration(registry, name,
							attributes.get("configuration"));
					 // 注册Feign 客户端
					registerFeignClient(registry, annotationMetadata, attributes);
				}
			}
		}
	}

	private void registerFeignClient(BeanDefinitionRegistry registry,
			AnnotationMetadata annotationMetadata, Map<String, Object> attributes) {
		String className = annotationMetadata.getClassName();
        // 定义了一个FeignClientFactoryBean的BeanDefinition
		BeanDefinitionBuilder definition = BeanDefinitionBuilder
				.genericBeanDefinition(FeignClientFactoryBean.class);
		validate(attributes);
		definition.addPropertyValue("url", getUrl(attributes));
		definition.addPropertyValue("path", getPath(attributes));
		String name = getName(attributes);
		definition.addPropertyValue("name", name);
		String contextId = getContextId(attributes);
		definition.addPropertyValue("contextId", contextId);
		definition.addPropertyValue("type", className);
		definition.addPropertyValue("decode404", attributes.get("decode404"));
		definition.addPropertyValue("fallback", attributes.get("fallback"));
		definition.addPropertyValue("fallbackFactory", attributes.get("fallbackFactory"));
		definition.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_TYPE);

		String alias = contextId + "FeignClient";
		AbstractBeanDefinition beanDefinition = definition.getBeanDefinition();

		boolean primary = (Boolean) attributes.get("primary"); // has a default, won't be
																// null

		beanDefinition.setPrimary(primary);

		String qualifier = getQualifier(attributes);
		if (StringUtils.hasText(qualifier)) {
			alias = qualifier;
		}

		BeanDefinitionHolder holder = new BeanDefinitionHolder(beanDefinition, className,
				new String[] { alias });
		BeanDefinitionReaderUtils.registerBeanDefinition(holder, registry);
	}

	...

}
```

**注册了`FeignClientFactoryBean`**

```java
class FeignClientFactoryBean
		implements FactoryBean<Object>, InitializingBean, ApplicationContextAware {

	/***********************************
	 * WARNING! Nothing in this class should be @Autowired. It causes NPEs because of some
	 * lifecycle race condition.
	 ***********************************/

	private Class<?> type;

	private String name;

	private String url;

	private String contextId;

	private String path;

	private boolean decode404;

	private ApplicationContext applicationContext;

	private Class<?> fallback = void.class;

	private Class<?> fallbackFactory = void.class;

	@Override
	public void afterPropertiesSet() throws Exception {
		Assert.hasText(this.contextId, "Context id must be set");
		Assert.hasText(this.name, "Name must be set");
	}

	protected Feign.Builder feign(FeignContext context) {
		FeignLoggerFactory loggerFactory = get(context, FeignLoggerFactory.class);
		Logger logger = loggerFactory.create(this.type);

		// @formatter:off
		Feign.Builder builder = get(context, Feign.Builder.class)
				// required values
				.logger(logger)
				.encoder(get(context, Encoder.class))
				.decoder(get(context, Decoder.class))
				.contract(get(context, Contract.class));
		// @formatter:on

		configureFeign(context, builder);

		return builder;
	}

	protected void configureFeign(FeignContext context, Feign.Builder builder) {
		FeignClientProperties properties = this.applicationContext
				.getBean(FeignClientProperties.class);
		if (properties != null) {
			if (properties.isDefaultToProperties()) {
				configureUsingConfiguration(context, builder);
				configureUsingProperties(
						properties.getConfig().get(properties.getDefaultConfig()),
						builder);
				configureUsingProperties(properties.getConfig().get(this.contextId),
						builder);
			}
			else {
				configureUsingProperties(
						properties.getConfig().get(properties.getDefaultConfig()),
						builder);
				configureUsingProperties(properties.getConfig().get(this.contextId),
						builder);
				configureUsingConfiguration(context, builder);
			}
		}
		else {
			configureUsingConfiguration(context, builder);
		}
	}

	protected void configureUsingConfiguration(FeignContext context,
			Feign.Builder builder) {
		Logger.Level level = getOptional(context, Logger.Level.class);
		if (level != null) {
			builder.logLevel(level);
		}
		Retryer retryer = getOptional(context, Retryer.class);
		if (retryer != null) {
			builder.retryer(retryer);
		}
		ErrorDecoder errorDecoder = getOptional(context, ErrorDecoder.class);
		if (errorDecoder != null) {
			builder.errorDecoder(errorDecoder);
		}
		Request.Options options = getOptional(context, Request.Options.class);
		if (options != null) {
			builder.options(options);
		}
		Map<String, RequestInterceptor> requestInterceptors = context
				.getInstances(this.contextId, RequestInterceptor.class);
		if (requestInterceptors != null) {
			builder.requestInterceptors(requestInterceptors.values());
		}
		QueryMapEncoder queryMapEncoder = getOptional(context, QueryMapEncoder.class);
		if (queryMapEncoder != null) {
			builder.queryMapEncoder(queryMapEncoder);
		}
		if (this.decode404) {
			builder.decode404();
		}
	}

	protected void configureUsingProperties(
			FeignClientProperties.FeignClientConfiguration config,
			Feign.Builder builder) {
		if (config == null) {
			return;
		}

		if (config.getLoggerLevel() != null) {
			builder.logLevel(config.getLoggerLevel());
		}

		if (config.getConnectTimeout() != null && config.getReadTimeout() != null) {
			builder.options(new Request.Options(config.getConnectTimeout(),
					config.getReadTimeout()));
		}

		if (config.getRetryer() != null) {
			Retryer retryer = getOrInstantiate(config.getRetryer());
			builder.retryer(retryer);
		}

		if (config.getErrorDecoder() != null) {
			ErrorDecoder errorDecoder = getOrInstantiate(config.getErrorDecoder());
			builder.errorDecoder(errorDecoder);
		}

		if (config.getRequestInterceptors() != null
				&& !config.getRequestInterceptors().isEmpty()) {
			// this will add request interceptor to builder, not replace existing
			for (Class<RequestInterceptor> bean : config.getRequestInterceptors()) {
				RequestInterceptor interceptor = getOrInstantiate(bean);
				builder.requestInterceptor(interceptor);
			}
		}

		if (config.getDecode404() != null) {
			if (config.getDecode404()) {
				builder.decode404();
			}
		}

		if (Objects.nonNull(config.getEncoder())) {
			builder.encoder(getOrInstantiate(config.getEncoder()));
		}

		if (Objects.nonNull(config.getDecoder())) {
			builder.decoder(getOrInstantiate(config.getDecoder()));
		}

		if (Objects.nonNull(config.getContract())) {
			builder.contract(getOrInstantiate(config.getContract()));
		}
	}

	private <T> T getOrInstantiate(Class<T> tClass) {
		try {
			return this.applicationContext.getBean(tClass);
		}
		catch (NoSuchBeanDefinitionException e) {
			return BeanUtils.instantiateClass(tClass);
		}
	}

	protected <T> T get(FeignContext context, Class<T> type) {
		T instance = context.getInstance(this.contextId, type);
		if (instance == null) {
			throw new IllegalStateException(
					"No bean found of type " + type + " for " + this.contextId);
		}
		return instance;
	}

	protected <T> T getOptional(FeignContext context, Class<T> type) {
		return context.getInstance(this.contextId, type);
	}

	protected <T> T loadBalance(Feign.Builder builder, FeignContext context,
			HardCodedTarget<T> target) {
		Client client = getOptional(context, Client.class);
		if (client != null) {
			builder.client(client);
			Targeter targeter = get(context, Targeter.class);
			return targeter.target(this, builder, context, target);
		}

		throw new IllegalStateException(
				"No Feign Client for loadBalancing defined. Did you forget to include spring-cloud-starter-netflix-ribbon?");
	}

	@Override
	public Object getObject() throws Exception {
		return getTarget();
	}

	/**
	 * @param <T> the target type of the Feign client
	 * @return a {@link Feign} client created with the specified data and the context
	 * information
	 */
	<T> T getTarget() {
		FeignContext context = this.applicationContext.getBean(FeignContext.class);
		Feign.Builder builder = feign(context);

		if (!StringUtils.hasText(this.url)) {
			if (!this.name.startsWith("http")) {
				this.url = "http://" + this.name;
			}
			else {
				this.url = this.name;
			}
			this.url += cleanPath();
			return (T) loadBalance(builder, context,
					new HardCodedTarget<>(this.type, this.name, this.url));
		}
		if (StringUtils.hasText(this.url) && !this.url.startsWith("http")) {
			this.url = "http://" + this.url;
		}
		String url = this.url + cleanPath();
		Client client = getOptional(context, Client.class);
		if (client != null) {
			if (client instanceof LoadBalancerFeignClient) {
				// not load balancing because we have a url,
				// but ribbon is on the classpath, so unwrap
				client = ((LoadBalancerFeignClient) client).getDelegate();
			}
			if (client instanceof FeignBlockingLoadBalancerClient) {
				// not load balancing because we have a url,
				// but Spring Cloud LoadBalancer is on the classpath, so unwrap
				client = ((FeignBlockingLoadBalancerClient) client).getDelegate();
			}
			builder.client(client);
		}
		Targeter targeter = get(context, Targeter.class);
		return (T) targeter.target(this, builder, context,
				new HardCodedTarget<>(this.type, this.name, url));
	}

	...

}
```

构建了一个Feign调用，客户端有两种`LoadBalancerFeignClient`以及`FeignBlockingLoadBalancerClient`，

配置属性`FeignClientProperties`

### `OpenFeign`核心`api`在Spring Cloud中的扩展

> `org.springframework.cloud.openfeign.FeignClientsConfiguration`默认的配置类

* `feign.Contract` 服务接口类的注解和值解析

  * `org.springframework.cloud.openfeign.support.SpringMvcContract`

    支持`Spring MVC`的注解，比如`@RequestMapping`、`@PathVariable`等等

    > 参数注解处理核心接口：`org.springframework.cloud.openfeign.AnnotatedParameterProcessorr`
    >
    > * `@PathVariable` `PathVariableParameterProcessor`
    > * `@RequestParam` `RequestParamParameterProcessor`
    > * `@RequestHeader` `RequestHeaderParameterProcessor`
    > * `@SpringQueryMap` `QueryMapParameterProcessor`

* `feign.Client`  调用

  * `org.springframework.cloud.openfeign.ribbon.LoadBalancerFeignClient` Ribbon客户端调用
  * `org.springframework.cloud.openfeign.loadbalancer.FeignBlockingLoadBalancerClient` 阻塞的Feign客户端，`Spring Cloud LoadBalanced`实现

* `feign.Retryer` 重试

  * `Retryer.NEVER_RETRY` 不进行重试

* `feign.codec.Encoder` 序列化，对象转成`Http`请求

  * `new SpringEncoder(this.messageConverters)` 普通的反序列化
  * `new PageableSpringEncoder(new SpringEncoder(this.messageConverters))` 带有分页参数的反序列化

  从上可以得知，这个序列是通过`HttpMessageConverter`组合去处理的

* `feign.codec.Decoder` 反序列化，`Http`请求转换为对象

  * `new OptionalDecoder(new ResponseEntityDecoder(new SpringDecoder(this.messageConverters)))`

  从上可以得知，这个反序列是通过`HttpMessageConverter`组合去处理的