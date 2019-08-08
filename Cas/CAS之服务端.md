---
title: CAS之服务端
author: FelixFly
date: 2019-07-08
tags:
    - CAS
categories: 
    - 单点登录
archives: 2019
---

>  版本信息：
>
> * CAS 5.3.11
> * JDK 1.8.0_192

1. 搭建CAS服务端
2. 连接数据库进行配置用户信息
3. 自定义登录页面

<!-- more -->

# `CAS`之服务端

## `CAS`之服务端搭建

> [官方文档](https://apereo.github.io/cas/5.3.x/index.html)
>
> 采用Maven War Overlay进行部署

1. 下载[Apereo CAS WAR Overlay template](https://github.com/apereo/cas-overlay-template/tree/5.3)

2. 创建Maven的标准目录`src/main/java`、`src/main/resources`,`test`测试目录自行根据需要创建

3. 在`resources`目录下创建`applicaiton.properties`

   ```properties
   # 启动端口
   server.port = 8091
   # 单点登录用户
   cas.authn.accept.users = casuser::Mellon
   ```

4. 在cmd中执行如下命令

   ```powershell
   # 利用Spring Boot进行启用
   .\build.cmd bootrun
   ```

5.  访问`http://localhost:8091/login`，利用配置文件中配置的用户登录即可

### 问题

1. 会出现STOP字样

   ```verilog
   2019-07-08 10:44:27,691 WARN [org.apereo.cas.config.support.authentication.AcceptUsersAuthenticationEventExecutionPlanConfiguration] - <
   
     ____    _____    ___    ____    _ 
    / ___|  |_   _|  / _ \  |  _ \  | |
    \___ \    | |   | | | | | |_) | | |
     ___) |   | |   | |_| | |  __/  |_|
    |____/    |_|    \___/  |_|     (_)
                                       
   
   CAS is configured to accept a static list of credentials for authentication. While this is generally useful for demo purposes, it is STRONGLY recommended that you DISABLE
    this authentication method (by setting 'cas.authn.accept.users' to a blank value) and switch to a mode that is more suitable for production.>
   ```

   这个问题的出现是由于在配置文件中静态配置了单点登录用户信息

2. 利用模板搭建执行`bootrun`会出现`log4j2.xml`文件未找到异常

   ```verilog
   2019-07-08 10:44:34,449 main ERROR Unable to access jar:file:/E:/Repository/org/apereo/cas/cas-server-webapp-tomcat/5.3.9/cas-server-webapp-tomcat-5.3.9.war!/WEB-INF/clas
   ses!/log4j2.xml java.io.FileNotFoundException: JAR entry WEB-INF/classes!/log4j2.xml not found in E:\Repository\org\apereo\cas\cas-server-webapp-tomcat\5.3.9\cas-server-w
   ebapp-tomcat-5.3.9.war
   ```

   采用`.\build.cmd clean package`先进行打包，在到`target`目录下执行`java -jar cas.war`即可

## 数据库配置用户信息

> 需要添加的依赖信息
>
> * `cas-server-support-jdbc-drivers`
> * `cas-server-support-generic`
> * `cas-server-support-jdbc`
> * `cas-server-support-jdbc-authentication`
> * 数据库所对应的驱动

1. 添加上述依赖，为保持版本统一，对版本进行统一管理

   ```xml
   <!--统一版本-->
   <properties>
       <java.version>1.8</java.version>
       <cas.version>5.3.11</cas.version>
   </properties>
   
   <!--依赖信息-->
   <dependency>
       <groupId>org.apereo.cas</groupId>
       <artifactId>cas-server-support-jdbc-drivers</artifactId>
       <version>${cas.version}</version>
       <scope>runtime</scope>
   </dependency>
   
   <!--org.pac4j:pac4j-saml无法下载，进行排除依赖-->
   <dependency>
       <groupId>org.apereo.cas</groupId>
       <artifactId>cas-server-support-generic</artifactId>
       <version>${cas.version}</version>
       <exclusions>
           <exclusion>
               <artifactId>pac4j-saml</artifactId>
               <groupId>org.pac4j</groupId>
           </exclusion>
       </exclusions>
   </dependency>
   
   <dependency>
       <groupId>org.apereo.cas</groupId>
       <artifactId>cas-server-support-jdbc</artifactId>
       <version>${cas.version}</version>
   </dependency>
   
   <dependency>
       <groupId>org.apereo.cas</groupId>
       <artifactId>cas-server-support-jdbc-authentication</artifactId>
       <version>${cas.version}</version>
       <scope>runtime</scope>
   </dependency>
   
   <!--数据库依赖，此地方采用的是Oracle数据库-->
   <dependency>
       <groupId>com.oracle</groupId>
       <artifactId>ojdbc6</artifactId>
       <version>11.2.0.3</version>
       <scope>runtime</scope>
   </dependency>
   ```

2. 调整配置文件信息application.properties

   ```properties
   # 需要注释上面静态配置的用户信息
   # cas.authn.accept.users = casuser::Mellon
   
   #Query Database Authentication 数据库查询校验用户名开始
   #查询账号密码sql，必须包含密码字段
   cas.authn.jdbc.query[0].sql = select * from t_user where login_id=?
   #指定上面的sql查询字段名（必须）
   cas.authn.jdbc.query[0].fieldPassword = password
   #指定过期字段，1为过期，若过期不可用（可选）
   #cas.authn.jdbc.query[0].fieldExpired=expired
   #为不可用字段段，1为不可用，需要修改密码（可选）
   #cas.authn.jdbc.query[0].fieldDisabled=disabled
   #数据库方言hibernate的
   cas.authn.jdbc.query[0].dialect = org.hibernate.dialect.Oracle10gDialect
   #数据库驱动
   cas.authn.jdbc.query[0].driverClass = oracle.jdbc.driver.OracleDriver
   #数据库连接
   cas.authn.jdbc.query[0].url = jdbc:oracle:thin:@127.0.0.1:1521:orcl
   #数据库用户名
   cas.authn.jdbc.query[0].user = FRAME
   #数据库密码
   cas.authn.jdbc.query[0].password = FRAME
   #默认加密策略，通过encodingAlgorithm来指定算法，默认NONE不加密
   cas.authn.jdbc.query[0].passwordEncoder.type = DEFAULT
   cas.authn.jdbc.query[0].passwordEncoder.characterEncoding = UTF-8
   cas.authn.jdbc.query[0].passwordEncoder.encodingAlgorithm = MD5
   ```

3. 执行`mvn clean -U package -DskipTests`生成可执行war

4. `target`目录下执行`java -jar`对应的war即可

### 问题

1. 调整为Mysql数据库

   * 引入mysql依赖

   ```xml
   <dependency>
       <groupId>mysql</groupId>
       <artifactId>mysql-connector-java</artifactId>
       <version>6.0.6</version>
       <scope>runtime</scope>
   </dependency>
   ```

   * 调整配置文件application.properties

   ```properties
   #Query Database Authentication 数据库查询校验用户名开始
   #查询账号密码sql，必须包含密码字段
   cas.authn.jdbc.query[0].sql = select * from t_user where login_id=?
   #指定上面的sql查询字段名（必须）
   cas.authn.jdbc.query[0].fieldPassword = password
   #指定过期字段，1为过期，若过期不可用（可选）
   #cas.authn.jdbc.query[0].fieldExpired=expired
   #为不可用字段段，1为不可用，需要修改密码（可选）
   #cas.authn.jdbc.query[0].fieldDisabled=disabled
   #数据库方言hibernate的
   cas.authn.jdbc.query[0].dialect = org.hibernate.dialect.MySQLDialect
   #数据库驱动
   cas.authn.jdbc.query[0].driverClass = com.mysql.cj.jdbc.Driver
   #数据库连接
   cas.authn.jdbc.query[0].url = jdbc:mysql://127.0.0.1:3306/scs_system?useUnicode=true&characterEncoding=utf-8&zeroDateTimeBehavior=convertToNull&transformedBitIsBoolean=true&useSSL=false
   #数据库用户名
   cas.authn.jdbc.query[0].user = scs
   #数据库密码
   cas.authn.jdbc.query[0].password = scs
   #默认加密策略，通过encodingAlgorithm来指定算法，默认NONE不加密
   cas.authn.jdbc.query[0].passwordEncoder.type = DEFAULT
   cas.authn.jdbc.query[0].passwordEncoder.characterEncoding = UTF-8
   cas.authn.jdbc.query[0].passwordEncoder.encodingAlgorithm = MD5
   ```

## 服务端配置问题

### 支持http请求

* 调整配置文件application.properties

  ```properties
  # 启用配置文件
  cas.serviceRegistry.initFromJson = true
  ```

* 添加resource/services/HTTPSandIMAPS-10000001.json

  ```json
  {
    "@class" : "org.apereo.cas.services.RegexRegisteredService",
    "serviceId" : "^(https|http|imaps)://.*",
    "name" : "HTTPS and IMAPS",
    "id" : 10000001,
    "description" : "This service definition authorizes all application urls that support HTTPS and IMAPS protocols.",
    "evaluationOrder" : 10000
  }
  ```

### 多个系统都需要进行登录

* 调整配置文件application.properties

  ```properties
  # 设置此属性来控制多个登录，不然每个都需要进行用户登录
  cas.tgc.secure = false
  ```

### 退出的时候重定向

* 调整配置文件application.properties

  ```properties
  # 退出的时候页面需要重定向
  cas.logout.followServiceRedirects = true
  ```

## 服务端之扩展

> 扩展需要添加对应的依赖
>
> ```xml
> <dependency>
>     <groupId>org.apereo.cas</groupId>
>     <artifactId>cas-server-core-authentication-api</artifactId>
>     <version>${cas.version}</version>
> </dependency>
> 
> <dependency>
>     <groupId>org.projectlombok</groupId>
>     <artifactId>lombok</artifactId>
>     <version>1.18.4</version>
>     <optional>true</optional>
> </dependency>
> <dependency>
>     <groupId>org.apereo.cas</groupId>
>     <artifactId>cas-server-core-webflow-api</artifactId>
>     <version>${cas.version}</version>
> </dependency>
> 
> <dependency>
>     <groupId>org.apereo.cas</groupId>
>     <artifactId>cas-server-core-util-api</artifactId>
>     <version>${cas.version}</version>
>     <exclusions>
>         <exclusion>
>             <groupId>org.pac4j</groupId>
>             <artifactId>pac4j-saml</artifactId>
>         </exclusion>
>     </exclusions>
> </dependency>
> <dependency>
>     <groupId>org.apereo.cas</groupId>
>     <artifactId>cas-server-core-webflow</artifactId>
>     <version>${cas.version}</version>
> </dependency>
> ```

### 登录页面进行调整

* 添加resource/templates/casLoginView.html
* casLoginView.html编写新的界面即可

### 登录页面增加参数

* 扩展`UsernamePasswordCredential`

  ```java
  /**
   * 用户密码锁验证
   *
   * @author FelixFly 2019/7/23
   */
  @Slf4j
  @ToString(callSuper = true,exclude = "lockPin")
  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  @EqualsAndHashCode
  public class UserPasswordLockCredential extends UsernamePasswordCredential {
  
      private static final long serialVersionUID = -6062908366598099951L;
  
  
      @Size(min = 1, message = "required.lockPin")
      private String lockPin;
  
  
      @Size(min = 1, message = "required.lockNo")
      private String lockNo;
  }
  ```

* 登录页面进行绑定对应属性数据，扩展`DefaultLoginWebflowConfigurer`

  ```java
  /**
   * 自定义登录验证
   *
   * @author FelixFly 2019/7/23
   */
  public class CustomLoginWebflowConfigurer extends DefaultLoginWebflowConfigurer {
  
  
      public CustomLoginWebflowConfigurer(FlowBuilderServices flowBuilderServices, FlowDefinitionRegistry loginFlowDefinitionRegistry, ApplicationContext applicationContext, CasConfigurationProperties casProperties) {
          super(flowBuilderServices, loginFlowDefinitionRegistry, applicationContext, casProperties);
      }
  
  
      @Override
      protected void createRememberMeAuthnWebflowConfig(Flow flow) {
          if (casProperties.getTicket().getTgt().getRememberMe().isEnabled()) {
              createFlowVariable(flow, CasWebflowConstants.VAR_ID_CREDENTIAL, RememberMeUsernamePasswordCredential.class);
              final ViewState state = getState(flow, CasWebflowConstants.STATE_ID_VIEW_LOGIN_FORM, ViewState.class);
              final BinderConfiguration cfg = getViewStateBinderConfiguration(state);
              cfg.addBinding(new BinderConfiguration.Binding("rememberMe", null, false));
          } else {
              createFlowVariable(flow, CasWebflowConstants.VAR_ID_CREDENTIAL, UserPasswordLockCredential.class);
              final ViewState state = getState(flow, CasWebflowConstants.STATE_ID_VIEW_LOGIN_FORM, ViewState.class);
              final BinderConfiguration cfg = getViewStateBinderConfiguration(state);
              cfg.addBinding(new BinderConfiguration.Binding("lockPin", null, false));
              cfg.addBinding(new BinderConfiguration.Binding("lockNo", null, false));
          }
      }
  }
  ```

* 通过自动装配调整默认配置

  ```java
  /**
   * 登录配置{@link CasWebflowContextConfiguration}
   *
   * @author FelixFly 2019/7/23
   */
  @Slf4j
  @EnableConfigurationProperties(CasConfigurationProperties.class)
  @Configuration
  @AutoConfigureBefore(value = CasWebflowContextConfiguration.class)// 这个地方一定要进行配置在默认配置之前，不然没办法更改配置
  public class CustomCasWebflowContextConfiguration {
  
      @Autowired
      private ApplicationContext applicationContext;
  
      @Autowired
      @Qualifier("loginFlowRegistry")
      private FlowDefinitionRegistry loginFlowRegistry;
  
      @Autowired
      @Qualifier("builder")
      private FlowBuilderServices builder;
  
      @Autowired
      private CasConfigurationProperties casProperties;
  
      @Bean("defaultLoginWebflowConfigurer")
      public CasWebflowConfigurer defaultLoginWebflowConfigurer() {
          CustomLoginWebflowConfigurer c = new CustomLoginWebflowConfigurer(builder, loginFlowRegistry, applicationContext, casProperties);
          c.initialize();
          return c;
      }
  
  }
  ```

* 配置自动装配文件resource/META-INF/spring.factories

  ```properties
  org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  top.felixfly.cas.config.CustomCasAuthenticationAutoConfiguration
  ```

* 在resource/templates/casLoginView.html添加对应的`lockPin`以及`lockNo`

  ```html
  <input type="hidden" id="lockPin" name="lockPin" value="123456789"/>
  <input type="hidden" id="lockNo" name="lockNo" value="9876543210"/>
  ```

### 扩展JDBC校验逻辑

* 扩展类`QueryDatabaseAuthenticationHandler`

  ```java
  /**
   * 自定义验证逻辑
   *
   * @author FelixFly 2019/7/23
   */
  @Slf4j
  public class UserPasswordLockAuthenticationHandler extends QueryDatabaseAuthenticationHandler {
      
      public UserPasswordLockAuthenticationHandler(String name, ServicesManager servicesManager, PrincipalFactory principalFactory, Integer order, DataSource dataSource, String sql, String fieldPassword, String fieldExpired, String fieldDisabled, Map<String, Object> attributes) {
          super(name, servicesManager, principalFactory, order, dataSource, sql, fieldPassword, fieldExpired, fieldDisabled, attributes);
      
      }
  
  
      @Override
      protected AuthenticationHandlerExecutionResult doAuthentication(Credential credential) throws GeneralSecurityException, PreventedException {
          // 此地方需要进行校验秘钥锁的逻辑
          UserPasswordLockCredential lockCredential = (UserPasswordLockCredential) credential;
          if (StringUtils.isBlank(lockCredential.getUsername())) {
              throw new AccountNotFoundException("Username is null.");
          }
          log.debug("Transforming credential username via [{}]", lockCredential.getUsername());
          if (StringUtils.isBlank(lockCredential.getPassword())) {
              throw new FailedLoginException("Password is null.");
          }
          log.debug("Attempting to encode credential password via [{}] for [{}]", lockCredential.getUsername(), lockCredential.getUsername());
          // 此地方增加对应的校验逻辑
          return super.doAuthentication(credential);
      }
  
      @Override
      public boolean supports(Credential credential) {
          // 自定义了扩展逻辑
          return credential instanceof UserPasswordLockCredential;
      }
  }
  ```

* 通过自动装配调整默认的配置

  ```java
  /**
   * 验证逻辑进行相应调整
   *
   * @author FelixFly 2019/7/23
   */
  @Slf4j
  @EnableConfigurationProperties(CasConfigurationProperties.class)
  @Configuration
  public class CustomCasAuthenticationAutoConfiguration {
  
      @Autowired(required = false)
      @Qualifier("queryPasswordPolicyConfiguration")
      private PasswordPolicyConfiguration queryPasswordPolicyConfiguration;
  
  
      @Autowired
      @Qualifier("servicesManager")
      private ServicesManager servicesManager;
  
      @Autowired(required = false)
      @Qualifier("searchModePasswordPolicyConfiguration")
      private PasswordPolicyConfiguration searchModePasswordPolicyConfiguration;
  
      @Autowired(required = false)
      @Qualifier("bindSearchPasswordPolicyConfiguration")
      private PasswordPolicyConfiguration bindSearchPasswordPolicyConfiguration;
  
      @Autowired(required = false)
      @Qualifier("queryAndEncodePasswordPolicyConfiguration")
      private PasswordPolicyConfiguration queryAndEncodePasswordPolicyConfiguration;
  
  
      @Autowired
      @Qualifier("jdbcPrincipalFactory")
      private PrincipalFactory jdbcPrincipalFactory;
  
  
      @Autowired
      private CasConfigurationProperties casProperties;
  
  
      @Bean
      @RefreshScope
      public Collection<AuthenticationHandler> jdbcAuthenticationHandlers() {
          final Collection<AuthenticationHandler> handlers = new HashSet<>();
          final JdbcAuthenticationProperties jdbc = casProperties.getAuthn().getJdbc();
          jdbc.getBind().forEach(b -> handlers.add(bindModeSearchDatabaseAuthenticationHandler(b)));
          jdbc.getEncode().forEach(b -> handlers.add(queryAndEncodeDatabaseAuthenticationHandler(b)));
          jdbc.getQuery().forEach(b -> handlers.add(queryDatabaseAuthenticationHandler(b)));
          jdbc.getSearch().forEach(b -> handlers.add(searchModeSearchDatabaseAuthenticationHandler(b)));
          return handlers;
      }
  
      private AuthenticationHandler bindModeSearchDatabaseAuthenticationHandler(final BindJdbcAuthenticationProperties b) {
          final BindModeSearchDatabaseAuthenticationHandler h = new BindModeSearchDatabaseAuthenticationHandler(b.getName(), servicesManager,
                  jdbcPrincipalFactory(), b.getOrder(), JpaBeans.newDataSource(b));
          h.setPasswordEncoder(PasswordEncoderUtils.newPasswordEncoder(b.getPasswordEncoder()));
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
  
          if (bindSearchPasswordPolicyConfiguration != null) {
              h.setPasswordPolicyConfiguration(bindSearchPasswordPolicyConfiguration);
          }
  
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
  
          if (StringUtils.isNotBlank(b.getCredentialCriteria())) {
              h.setCredentialSelectionPredicate(CoreAuthenticationUtils.newCredentialSelectionPredicate(b.getCredentialCriteria()));
          }
  
          log.debug("Created authentication handler [{}] to handle database url at [{}]", h.getName(), b.getUrl());
          return h;
      }
  
      private AuthenticationHandler queryAndEncodeDatabaseAuthenticationHandler(final QueryEncodeJdbcAuthenticationProperties b) {
          final QueryAndEncodeDatabaseAuthenticationHandler h = new QueryAndEncodeDatabaseAuthenticationHandler(b.getName(), servicesManager,
                  jdbcPrincipalFactory(), b.getOrder(), JpaBeans.newDataSource(b), b.getAlgorithmName(), b.getSql(), b.getPasswordFieldName(),
                  b.getSaltFieldName(), b.getExpiredFieldName(), b.getDisabledFieldName(), b.getNumberOfIterationsFieldName(), b.getNumberOfIterations(),
                  b.getStaticSalt());
  
          h.setPasswordEncoder(PasswordEncoderUtils.newPasswordEncoder(b.getPasswordEncoder()));
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
  
          if (queryAndEncodePasswordPolicyConfiguration != null) {
              h.setPasswordPolicyConfiguration(queryAndEncodePasswordPolicyConfiguration);
          }
  
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
  
          if (StringUtils.isNotBlank(b.getCredentialCriteria())) {
              h.setCredentialSelectionPredicate(CoreAuthenticationUtils.newCredentialSelectionPredicate(b.getCredentialCriteria()));
          }
  
          log.debug("Created authentication handler [{}] to handle database url at [{}]", h.getName(), b.getUrl());
          return h;
      }
  
  
      private AuthenticationHandler queryDatabaseAuthenticationHandler(final QueryJdbcAuthenticationProperties b) {
          final Multimap<String, Object> attributes = CoreAuthenticationUtils.transformPrincipalAttributesListIntoMultiMap(b.getPrincipalAttributeList());
          log.debug("Created and mapped principal attributes [{}] for [{}]...", attributes, b.getUrl());
  
          final UserPasswordLockAuthenticationHandler h = new UserPasswordLockAuthenticationHandler(b.getName(), servicesManager, 			                       jdbcPrincipalFactory, b.getOrder(),
                  JpaBeans.newDataSource(b), b.getSql(), b.getFieldPassword(),
                  b.getFieldExpired(), b.getFieldDisabled(), CollectionUtils.wrap(attributes));
  
          h.setPasswordEncoder(PasswordEncoderUtils.newPasswordEncoder(b.getPasswordEncoder()));
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
  
          if (queryPasswordPolicyConfiguration != null) {
              h.setPasswordPolicyConfiguration(queryPasswordPolicyConfiguration);
          }
  
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
  
          if (StringUtils.isNotBlank(b.getCredentialCriteria())) {
              h.setCredentialSelectionPredicate(CoreAuthenticationUtils.newCredentialSelectionPredicate(b.getCredentialCriteria()));
          }
  
          log.debug("Created authentication handler [{}] to handle database url at [{}]", h.getName(), b.getUrl());
          return h;
      }
  
  
      private AuthenticationHandler searchModeSearchDatabaseAuthenticationHandler(final SearchJdbcAuthenticationProperties b) {
          final SearchModeSearchDatabaseAuthenticationHandler h = new SearchModeSearchDatabaseAuthenticationHandler(b.getName(), servicesManager,
                  jdbcPrincipalFactory(), b.getOrder(), JpaBeans.newDataSource(b), b.getFieldUser(), b.getFieldPassword(), b.getTableUsers());
  
          h.setPasswordEncoder(PasswordEncoderUtils.newPasswordEncoder(b.getPasswordEncoder()));
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
          h.setPrincipalNameTransformer(PrincipalNameTransformerUtils.newPrincipalNameTransformer(b.getPrincipalTransformation()));
  
          if (searchModePasswordPolicyConfiguration != null) {
              h.setPasswordPolicyConfiguration(searchModePasswordPolicyConfiguration);
          }
  
          if (StringUtils.isNotBlank(b.getCredentialCriteria())) {
              h.setCredentialSelectionPredicate(CoreAuthenticationUtils.newCredentialSelectionPredicate(b.getCredentialCriteria()));
          }
  
          log.debug("Created authentication handler [{}] to handle database url at [{}]", h.getName(), b.getUrl());
          return h;
      }
  
      @Bean
      @RefreshScope
      public PrincipalFactory jdbcPrincipalFactory() {
          return PrincipalFactoryUtils.newPrincipalFactory();
      }
  
  }
  ```

* 配置自动装配文件resource/META-INF/spring.factories

  ```properties
  org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  top.felixfly.cas.config.CustomCasAuthenticationAutoConfiguration
  ```

  

