---
title: Spring Cloud配置中心
author: FelixFly
date: 2020-01-29
tags:
    - spring cloud
categories: 
    - spring cloud
archives: 2020
---

1. Environment 抽象
2. 基于git实现配置中心

<!-- more -->

# Spring Cloud配置中心

> 版本信息
>
> Spring Cloud : Hoxton.SR1
>
> Spring Boot : 2.2.2.RELEASE

## Environment 抽象

* `org.springframework.core.env.Environment` 关注于读取profile
  * `org.springframework.core.env.PropertyResolver` 关注于读取配置
* `org.springframework.core.env.ConfigurableEnvironment` 关注于存储profile
  * `org.springframework.core.env.ConfigurablePropertyResolver` 关注于类型转换

> 默认实现：`org.springframework.core.env.StandardEnvironment`

### 配置资源

* `org.springframework.core.env.PropertySource` 单个读资源的抽象，对应注解`@org.springframework.context.annotation.PropertySource`
* `org.springframework.core.env.PropertySources` 多个读资源的抽象，对应注解`@org.springframework.context.annotation.PropertySource`
* `org.springframework.core.env.MutablePropertySources` 关注于存储资源

> 默认实现：`org.springframework.core.env.CompositePropertySource`

> Spring Boot 外部化配置
>
> 1. Devtools global settings properties on your home directory (~/.spring-bootdevtools.
>     properties when devtools is active).
>
> 2. @TestPropertySource annotations on your tests.
>
> 3. properties attribute on your tests. Available on @SpringBootTest and the test annotations for
>     testing a particular slice of your application.
>
> 4. Command line arguments. 
>
>    > `commandLineArgs` -->`org.springframework.core.env.CommandLinePropertySource`
>
> 5. Properties from SPRING_APPLICATION_JSON (inline JSON embedded in an environment variable
>     or system property).
>
>   > `spring.application.json` -->`org.springframework.boot.env.SpringApplicationJsonEnvironmentPostProcessor.JsonPropertySource`
>
> 6. ServletConfig init parameters.
>
>    > `servletConfigInitParams` --> `org.springframework.core.env.PropertySource.StubPropertySource` 占位
>    >
>    > -->`org.springframework.web.context.support.ServletConfigPropertySource`
>
> 7. ServletContext init parameters.
>
>    > `servletContextInitParams` -->`org.springframework.core.env.PropertySource.StubPropertySource` 占位
>    >
>    > --> `org.springframework.web.context.support.ServletContextPropertySource`
>
> 8. JNDI attributes from java:comp/env.
>
>    > `jndiProperties` -->`org.springframework.jndi.JndiPropertySource`
>
> 9. Java System properties (System.getProperties()).
>
>   > `systemProperties` -->`org.springframework.core.env.PropertiesPropertySource`
>
> 10. OS environment variables.
>
>   > `systemEnvironment`-->`org.springframework.core.env.SystemEnvironmentPropertySource`
>
> 11. A RandomValuePropertySource that has properties only in random.*.
>
>    > `random` --> `org.springframework.boot.env.RandomValuePropertySource`
>
> 12. Profile-specific application properties outside of your packaged jar (application-{profile}.properties and YAML variants).
>
> 13. Profile-specific application properties packaged inside your jar (application-{profile}.properties and YAML variants).
>
> 14. Application properties outside of your packaged jar (application.properties and YAML variants).
>
> 15. Application properties packaged inside your jar (application.properties and YAML variants).
>
>    > 12-15类型`applicationConfig: [${location"]` -->`org.springframework.boot.env.OriginTrackedMapPropertySource`
>
> 16. @PropertySource annotations on your @Configuration classes.
>
> 17. Default properties (specified by setting SpringApplication.setDefaultProperties).

### 类型转换

* `org.springframework.core.convert.ConversionService` 类型转换服务
* `org.springframework.core.convert.converter.Converter` 类型转换接口
* `org.springframework.core.convert.converter.GenericConverter`  普通的类型转换接口
* `org.springframework.core.convert.converter.ConditionalConverter` 适配（条件）的类型转换
* `org.springframework.core.convert.converter.ConverterRegistry` 类型转换的注册中心
* `org.springframework.core.convert.converter.ConverterFactory` 类型转的注册工厂
* `org.springframework.core.convert.support.ConfigurableConversionService` 可配置的类型转换服务

> 默认实现：`org.springframework.core.convert.support.DefaultConversionService`

### 配置文件加载

* `org.springframework.boot.env.PropertySourceLoader` 配置资源加载
  * `org.springframework.boot.env.PropertiesPropertySourceLoader` properties（xml）配置文件加载
  * `org.springframework.boot.env.YamlPropertySourceLoader` yml（yaml）配置文件加载
* `org.springframework.cloud.bootstrap.config.PropertySourceLocator` Spring Cloud中配置资源加载
  * `org.springframework.cloud.config.client.ConfigServicePropertySourceLocator` 配置服务资源实现
  * `org.springframework.cloud.config.server.environment.EnvironmentRepositoryPropertySourceLocator` 环境仓库配置服务资源实现

### Environment与PropertySource的关系

#### Spring

* ``org.springframework.core.env.Environment`
  * `org.springframework.core.env.ConfigurableEnvironment`
    * `org.springframework.core.env.MutablePropertySources`
      * `org.springframework.core.env.PropertySource`

#### Spring Cloud

* `org.springframework.cloud.config.environment.Environment`
  * `org.springframework.cloud.config.environment.PropertySource`

## 基于git实现配置中心

### 服务端

#### 应用

1. 创建git的配置目录文件，以E:/GitHub/properties文件夹为例，使用的是git客户端

   ```powershell
   cd /e/GitHub/properties
   git init
   ```

2. 创建配置文件configserver.yml以及configserver-dev.yml，配置文件内容如下

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

   > 配置文件命名规则：
   >
   > {application}/{profile}[/{label}]
   > {application}-{profile}.yml
   > {label}/{application}-{profile}.yml
   > {application}-{profile}.properties
   > {label}/{application}-{profile}.properties
   >
   > * {application} 为配置文件名称，对应`spring.cloud.config.name`
   > * {profile} 为配置文件激活环境，对应`spring.cloud.config.profile`,没有默认为default
   > * {label} 为配置文件标签（git中为分支版本），对应`spring.cloud.config.label`

3. 添加pom的依赖

   ```xml
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-config-server</artifactId>
   </dependency>
   ```

4. 启动类添加`@EnableConfigServer`

   ```java
   /**
    * 配置服务启动类
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/1/29
    */
   @SpringBootApplication
   @EnableConfigServer
   public class SpringCloudConfigServerApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(SpringCloudConfigServerApplication.class, args);
       }
   }
   ```

5. 配置文件bootstrap.yml

   ```yaml
   management:
     endpoints:
       web:
         exposure:
           include: health,info,beans,env
   server:
     port: 8090
   spring:
     cloud:
       config:
         server:
           git:
             uri: file:///E:/GitHub/properties
   ```

6. 启动`SpringCloudConfigServerApplication`,验证配置文件访问路径为`http://127.0.0.1:8090/{application}/{profile}`，若是有{label},后面再加上/{label}

   > {label}若是存在"/"，使用“(_)”进行替换，实现类`org.springframework.cloud.config.server.environment.EnvironmentController`

   * 示例访问地址：`http://127.0.0.1:8090/configserver/default`

     ```json
     {
         "name": "configserver",
         "profiles": [
             "default"
         ],
         "label": null,
         "version": "f6cb3fcb36ae0ea085d0342ebe5e68811b9098a5",
         "state": null,
         "propertySources": [{
                 "name": "file:///E:/GitHub/properties/configserver.yml",
                 "source": {
                     "management.endpoints.web.exposure.include": "health,info,beans,env",
                     "spring.application.name": "application-name"
                 }
             }
         ]
     }
     ```

   * 示例访问地址：`http://127.0.0.1:8090/configserver/dev`

     ```json
     {
         "name": "configserver",
         "profiles": [
             "dev"
         ],
         "label": null,
         "version": "f6cb3fcb36ae0ea085d0342ebe5e68811b9098a5",
         "state": null,
         "propertySources": [{
                 "name": "file:///E:/GitHub/properties/configserver-dev.yml",
                 "source": {
                     "management.endpoints.web.exposure.include": "health,info,beans,env",
                     "spring.application.name": "application-name"
                 }
             }, {
                 "name": "file:///E:/GitHub/properties/configserver.yml",
                 "source": {
                     "management.endpoints.web.exposure.include": "health,info,beans,env",
                     "spring.application.name": "application-name"
                 }
             }
         ]
     }
     ```

#### 源码分析

1. `@EnableConfigServer`注解

   ```java
   @Target(ElementType.TYPE)
   @Retention(RetentionPolicy.RUNTIME)
   @Documented
   @Import(ConfigServerConfiguration.class)
   public @interface EnableConfigServer {
   
   }
   ```

   就是导入了`ConfigServerConfiguration`的配置Bean

   ```java
   @Configuration(proxyBeanMethods = false)
   public class ConfigServerConfiguration {
   
   	@Bean
   	public Marker enableConfigServerMarker() {
   		return new Marker();
   	}
       
   	class Marker {
   
   	}
   }
   ```

   这个`ConfigServerConfiguration`配置Bean就配置了一个Marker的Bean,猜想这个Marker的Bean是不是某个配置的自动装配条件

2. `ConfigServerAutoConfiguration` 服务配置自动装配

   ```java
   @Configuration(proxyBeanMethods = false)
   @ConditionalOnBean(ConfigServerConfiguration.Marker.class)
   @EnableConfigurationProperties(ConfigServerProperties.class)
   @Import({ EnvironmentRepositoryConfiguration.class, CompositeConfiguration.class,
   		ResourceRepositoryConfiguration.class, ConfigServerEncryptionConfiguration.class,
   		ConfigServerMvcConfiguration.class, ResourceEncryptorConfiguration.class })
   public class ConfigServerAutoConfiguration {
   
   }
   ```

   这个`ConfigServerAutoConfiguration`自动装配条件是`ConfigServerConfiguration.Marker.class`这个类型的Bean存在

   * 启用了`ConfigServerProperties`配置信息
   * 导入了一些配置信息，如`EnvironmentRepositoryConfiguration`

3.  默认启用git的实现代码

   ```java
   @Configuration(proxyBeanMethods = false)
   @ConditionalOnMissingBean(value = EnvironmentRepository.class,
   		search = SearchStrategy.CURRENT)
   class DefaultRepositoryConfiguration {
   
   	@Bean
   	public MultipleJGitEnvironmentRepository defaultEnvironmentRepository(
   			MultipleJGitEnvironmentRepositoryFactory gitEnvironmentRepositoryFactory,
   			MultipleJGitEnvironmentProperties environmentProperties) throws Exception {
   		return gitEnvironmentRepositoryFactory.build(environmentProperties);
   	}
   
   }
   ```

   `DefaultRepositoryConfiguration`在不存在`EnvironmentRepository.class`类型的Bean下自动装配，`MultipleJGitEnvironmentRepository`-->`JGitEnvironmentRepository` git仓储的实现

4. 自定义环境仓储的实现

   从上面可得知，默认的git环境仓储实现只有在不存在`EnvironmentRepository.class`类型的Bean下自动装配，我们只需要自定义一个`EnvironmentRepository`的Bean就行了

   ```java
   @Bean
   public EnvironmentRepository defaultEnvironmentRepository(){
       return (application, profile, label) -> {
           Environment environment = new Environment("custom-default");
           List<PropertySource> propertySources = environment.getPropertySources();
           Map<String, String> sourceMap = new HashMap<>();
           sourceMap.put("application", "custom-application");
           PropertySource propertySource = new PropertySource("map", sourceMap);
           propertySources.add(propertySource);
           return environment;
       };
   }
   ```

   访问地址：`http://127.0.0.1:8090/{application}/{profile}`，若是有{label},后面再加上/{label}

   ```json
   {
       "name": "config",// {application}
       "profiles": [
           "default" // {profile}
       ],
       "label": null, // {label}
       "version": null,
       "state": null,
       "propertySources": [{
               "name": "map",
               "source": {
                   "application": "custom-application"
               }
           }
       ]
   }
   ```

### 客户端

#### 应用

1. 添加pom的依赖

   ```xml
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-config</artifactId>
   </dependency>
   ```

2. 配置文件bootstrap.yml

   ```yaml
   spring:
     cloud:
       config:
         uri: http://127.0.0.1:8090
         name: configserver
     application:
       name: config-client
   ```

3. 服务启动类

   ```java
   /**
    * 配置客户端启动类
    *
    * @author FelixFly <chenglinxu@yeah.net>
    * @date 2020/1/29
    */
   @SpringBootApplication
   public class SpringCloudConfigClientApplication {
   
       public static void main(String[] args) {
           SpringApplication.run(SpringCloudConfigClientApplication.class, args);
       }
   }
   ```

4. 启动服务，查看/actuator/env

   ```json
   {
       "activeProfiles": [],
       "propertySources": [{
               "name": "server.ports",
               "properties": {}
           }, {
               "name": "bootstrapProperties-configClient",
               "properties": {}
           }, {
               "name": "bootstrapProperties-file:///E:/GitHub/properties/configserver.yml",
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
               "name": "springCloudClientHostInfo",
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

   从上得知配置信息`bootstrapProperties-file:///E:/GitHub/properties/configserver.yml`具有高优先级，从先前的知识得知，自定义的bootstrap具有高优先级，实现类实现了`PropertySourceLocator`

   > 自定义配置加载类`org.springframework.cloud.config.client.ConfigServicePropertySourceLocator`

#### 源码分析

`ConfigServicePropertySourceLocator`加载配置资源

```java
/**
 * @author Dave Syer
 * @author Mathieu Ouellet
 *
 */
@Order(0)
public class ConfigServicePropertySourceLocator implements PropertySourceLocator {

	private static Log logger = LogFactory
			.getLog(ConfigServicePropertySourceLocator.class);

	private RestTemplate restTemplate;

	private ConfigClientProperties defaultProperties;

	public ConfigServicePropertySourceLocator(ConfigClientProperties defaultProperties) {
		this.defaultProperties = defaultProperties;
	}

	@Override
	@Retryable(interceptor = "configServerRetryInterceptor")
	public org.springframework.core.env.PropertySource<?> locate(
			org.springframework.core.env.Environment environment) {
       	// 从environment中覆盖spring.cloud.config相关配置（name|profile|label）
        // 这个地方有个优先级的问题，若是environment已经存在spring.cloud.config的相关配置，就使用			environment的配置，不再使用本地spring.cloud.config的配置
		ConfigClientProperties properties = this.defaultProperties.override(environment);
		CompositePropertySource composite = new OriginTrackedCompositePropertySource(
				"configService");
		RestTemplate restTemplate = this.restTemplate == null
				? getSecureRestTemplate(properties) : this.restTemplate;
		Exception error = null;
		String errorBody = null;
		try {
			String[] labels = new String[] { "" };
			if (StringUtils.hasText(properties.getLabel())) {
				labels = StringUtils
						.commaDelimitedListToStringArray(properties.getLabel());
			}
			String state = ConfigClientStateHolder.getState();
			// Try all the labels until one works
			for (String label : labels) {
                // 获取配置服务的配置环境信息
				Environment result = getRemoteEnvironment(restTemplate, properties,
						label.trim(), state);
				if (result != null) {
					log(result);

					// result.getPropertySources() can be null if using xml
					if (result.getPropertySources() != null) {
						for (PropertySource source : result.getPropertySources()) {
							@SuppressWarnings("unchecked")
							Map<String, Object> map = translateOrigins(source.getName(),
									(Map<String, Object>) source.getSource());
							composite.addPropertySource(
									new OriginTrackedMapPropertySource(source.getName(),
											map));
						}
					}

					if (StringUtils.hasText(result.getState())
							|| StringUtils.hasText(result.getVersion())) {
						HashMap<String, Object> map = new HashMap<>();
						putValue(map, "config.client.state", result.getState());
						putValue(map, "config.client.version", result.getVersion());
						composite.addFirstPropertySource(
								new MapPropertySource("configClient", map));
					}
					return composite;
				}
			}
			errorBody = String.format("None of labels %s found", Arrays.toString(labels));
		}
		catch (HttpServerErrorException e) {
			error = e;
			if (MediaType.APPLICATION_JSON
					.includes(e.getResponseHeaders().getContentType())) {
				errorBody = e.getResponseBodyAsString();
			}
		}
		catch (Exception e) {
			error = e;
		}
		if (properties.isFailFast()) {
			throw new IllegalStateException(
					"Could not locate PropertySource and the fail fast property is set, failing"
							+ (errorBody == null ? "" : ": " + errorBody),
					error);
		}
		logger.warn("Could not locate PropertySource: "
				+ (error != null ? error.getMessage() : errorBody));
		return null;

	}

	
    ...

	private Environment getRemoteEnvironment(RestTemplate restTemplate,
			ConfigClientProperties properties, String label, String state) {
		String path = "/{name}/{profile}";
		String name = properties.getName();
		String profile = properties.getProfile();
		String token = properties.getToken();
		int noOfUrls = properties.getUri().length;
		if (noOfUrls > 1) {
			logger.info("Multiple Config Server Urls found listed.");
		}

		Object[] args = new String[] { name, profile };
		if (StringUtils.hasText(label)) {
			if (label.contains("/")) {
				label = label.replace("/", "(_)");
			}
			args = new String[] { name, profile, label };
			path = path + "/{label}";
		}
		ResponseEntity<Environment> response = null;

		for (int i = 0; i < noOfUrls; i++) {
			Credentials credentials = properties.getCredentials(i);
			String uri = credentials.getUri();
			String username = credentials.getUsername();
			String password = credentials.getPassword();

			logger.info("Fetching config from server at : " + uri);

			try {
				HttpHeaders headers = new HttpHeaders();
				headers.setAccept(
						Collections.singletonList(MediaType.parseMediaType(V2_JSON)));
				addAuthorizationToken(properties, headers, username, password);
				if (StringUtils.hasText(token)) {
					headers.add(TOKEN_HEADER, token);
				}
				if (StringUtils.hasText(state) && properties.isSendState()) {
					headers.add(STATE_HEADER, state);
				}

				final HttpEntity<Void> entity = new HttpEntity<>((Void) null, headers);
                // 构建URL,通过restTemplate进行获取
                // uri + path = uri/{application}/{profile}/{label}
				response = restTemplate.exchange(uri + path, HttpMethod.GET, entity,
						Environment.class, args);
			}
			catch (HttpClientErrorException e) {
				if (e.getStatusCode() != HttpStatus.NOT_FOUND) {
					throw e;
				}
			}
			catch (ResourceAccessException e) {
				logger.info("Connect Timeout Exception on Url - " + uri
						+ ". Will be trying the next url if available");
				if (i == noOfUrls - 1) {
					throw e;
				}
				else {
					continue;
				}
			}

			if (response == null || response.getStatusCode() != HttpStatus.OK) {
				return null;
			}

			Environment result = response.getBody();
			return result;
		}

		return null;
	}

	...

}
```

