---
title: CAS之客户端Shiro集成
author: FelixFly
date: 2019-08-08
tags:
    - CAS
categories: 
    - 单点登录
archives: 2019
---

1. 配置文件xml集成

2. spring boot 集成

  <!-- more -->
> 
>  Shiro集成采用是pac4j，shiro-cas官方不推荐使用
>
>  版本信息：
>
>  * CAS 5.3.11
>  * Shiro 1.4.0
>  * buji-pac4j 4.1.0
>  * pac4j-cas 3.7.0
>  * JDK 1.8.0_192
>  * Spring 4.0.3.RELEASE
>  * Spring Boot 2.1.1.RELEASE

# `CAS`之客户端`Shiro`集成

## 配置文件`xml`集成

* 依赖配置

  ```xml
  <!--版本配置-->
  <shiro.version>1.4.0</shiro.version>
  <pac4j.version>4.1.0</pac4j.version>
  <pac4j.cas.version>3.7.0</pac4j.cas.version>
  <!--依赖包-->
  <dependency>
      <groupId>org.apache.shiro</groupId>
      <artifactId>shiro-core</artifactId>
      <version>${shiro.version}</version>
  </dependency>
  <dependency>
      <groupId>org.apache.shiro</groupId>
      <artifactId>shiro-web</artifactId>
      <version>${shiro.version}</version>
  </dependency>
  <dependency>
      <groupId>org.apache.shiro</groupId>
      <artifactId>shiro-spring</artifactId>
      <version>${shiro.version}</version>
  </dependency>
  <!--shiro cas 认证-->
  <dependency>
      <groupId>io.buji</groupId>
      <artifactId>buji-pac4j</artifactId>
      <version>${pac4j.version}</version>
  </dependency>
  <dependency>
      <groupId>org.pac4j</groupId>
      <artifactId>pac4j-cas</artifactId>
      <version>${pac4j.cas.version}</version>
  </dependency>
  ```

* 添加配置文件信息resource\system.properties

  ```properties
  # cas 登录认证信息
  casClientName = scs
  # cas 登录地址前缀
  casUrlPrefix = http://127.0.0.1:8443/cas
  # 本系统访问前缀
  callbackUrlPrefix = http://127.0.0.1:9080
  ```

* 配置读取配置文件信息

  ```xml
  <!-- 加载*.properties File -->
  <bean id="dbConfPostProcessor"
      class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer">
      <property name="locations">
          <list>      
              <value>classpath:system.properties</value>
          </list>
      </property>
  </bean>
  ```

* 编写认证Realm，扩展`AuthorizingRealm`，也可以直接扩展`Pac4jRealm`(这个`supports`方法就不需要了)

  ```java
  /**
   * 自定义登录验证
   *
   * @author FelixFly 2019/7/23
   */
  @Component("shiroDbRealm")
  public class ShiroDbRealm extends AuthorizingRealm {
      public Logger logger = LoggerFactory.getLogger(getClass());
  
  
      @Override
      public boolean supports(AuthenticationToken token) {
          return token instanceof Pac4jToken;
      }
  
  
      // 授权
      @Override
      protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
  
          User user = (User) principalCollection.getPrimaryPrincipal();
          // String userId = (String)
          // principalCollection.fromRealm(getName()).iterator().next();
          Integer userId = user.getId();
          if (userId == null || userId.intValue() == 0) {
              return null;
          }
          // 添加角色及权限信息
          SimpleAuthorizationInfo sazi = new SimpleAuthorizationInfo();
         	// sazi.addRoles();
          // sazi.addStringPermissions();
          return sazi;
      }
  
      // 认证
      @Override
      protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token)
              throws AuthenticationException {
          final Pac4jToken pac4jToken = (Pac4jToken) token;
          final List<CommonProfile> commonProfileList = pac4jToken.getProfiles();
          final CommonProfile commonProfile = commonProfileList.get(0);
          String userId = commonProfile.getId();
          // 获取对应的用户信息,没有用户信息返回null
          // User user = ;
          // 根据用户ID进行认证
           return new SimpleAuthenticationInfo(user, commonProfileList.hashCode(), getName());
      }
  
  }
  ```

  

* 配置shiro相关信息

  ```xml
  <!-- 权限管理器 -->
  <bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
      <!-- 数据库认证的实现 -->
      <property name="realm" ref="shiroDbRealm"/>
      <!-- session 管理器 -->
      <property name="sessionManager" ref="sessionManager"/>
      <!--工厂-->
      <property name="subjectFactory" ref="subjectFactory"/>
  </bean>
  
  <bean id="subjectFactory" class="io.buji.pac4j.subject.Pac4jSubjectFactory"/>
  
  <!-- session管理器 -->
  <bean id="sessionManager"
        class="org.apache.shiro.web.session.mgt.DefaultWebSessionManager">
      <!-- 超时时间 -->
      <property name="globalSessionTimeout" value="-1"/>
      <property name="sessionIdCookieEnabled" value="true"/>
  
      <property name="sessionIdCookie" ref="simpleCookie"/>
      <property name="deleteInvalidSessions" value="true"/>
      <property name="sessionValidationSchedulerEnabled" value="true"/>
  </bean>
  
  <!-- sessionIdCookie的实现,用于重写覆盖容器默认的JSESSIONID -->
  <bean id="simpleCookie" class="org.apache.shiro.web.servlet.SimpleCookie">
      <!-- cookie的name,对应的默认是 JSESSIONID -->
      <constructor-arg name="name" value="${casClientName}"/>
      <!-- jsessionId的path为 / 用于多个系统共享jsessionId -->
      <property name="path" value="/"/>
      <property name="httpOnly" value="false"/>
      <property name="maxAge" value="-1"/>
  </bean>
  
  <bean id="casConfig" class="org.pac4j.cas.config.CasConfiguration">
      <property name="loginUrl" value="${casUrlPrefix}/login"/>
      <property name="protocol" value="CAS30"/>
      <property name="acceptAnyProxy" value="true"/>
      <property name="prefixUrl" value="${casUrlPrefix}/"/>
  </bean>
  
  
  <bean id="casClient" class="org.pac4j.cas.client.CasClient">
      <constructor-arg name="configuration" ref="casConfig"/>
      <property name="callbackUrl" value="${callbackUrlPrefix}/callback?client_name=${casClientName}"/>
      <property name="name" value="${casClientName}"/>
  </bean>
  
  <bean id="authcConfig" class="org.pac4j.core.config.Config">
      <constructor-arg name="client" ref="casClient"/>
  </bean>
  
  <!-- shiro的主过滤器,beanId 和web.xml中配置的filter name需要保持一致 -->
  <bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
      <!-- 安全管理器 -->
      <property name="securityManager" ref="securityManager"/>
      <!-- 默认的登陆访问url -->
      <property name="loginUrl" value="/login"/>
      <!-- 登陆成功后跳转的url -->
      <property name="successUrl" value="/index"/>
      <!-- 没有权限跳转的url -->
      <property name="unauthorizedUrl" value="/unauth"/>
      <!-- 访问地址的过滤规则,从上至下的优先级,如果有匹配的规则,就会返回,不会再进行匹配 -->
      <property name="filterChainDefinitions">
          <value>
              / = securityFilter
              /logout = logout
              /error = anon
              /callback = callbackFilter
              /index = securityFilter
              /**/ajax/** = securityFilter
              /** = securityFilter
          </value>
      </property>
  
      <!-- 声明自定义的过滤器 -->
      <property name="filters">
          <util:map>
              <entry key="securityFilter" value-ref="securityFilter"/>
              <entry key="callbackFilter" value-ref="callbackFilter"/>
              <entry key="logout" value-ref="logout"/>
          </util:map>
      </property>
  
  </bean>
  
  <bean name="securityFilter" class="io.buji.pac4j.filter.SecurityFilter">
      <property name="config" ref="authcConfig"/>
      <property name="clients" value="${casClientName}"/>
  </bean>
  
  
  <bean id="callbackFilter" class="io.buji.pac4j.filter.CallbackFilter">
      <property name="config" ref="authcConfig"/>
      <property name="defaultUrl" value="${callbackUrlPrefix}/index"/>
  </bean>
  
  
  <bean id="logout" class="io.buji.pac4j.filter.LogoutFilter">
      <property name="config" ref="authcConfig"/>
      <property name="centralLogout" value="true"/>
      <property name="localLogout" value="true"/>
      <property name="logoutUrlPattern" value="/logout"/>
      <property name="defaultUrl" value="${callbackUrlPrefix}/index"/>
  </bean>
  
  <!-- 起效权限注解,这个很少在web项目中用到,一般是控制url的访问,不是在controller中声明权限注解 -->
  <bean id="lifecycleBeanPostProcessor" class="org.apache.shiro.spring.LifecycleBeanPostProcessor"/>
  
  
  <bean id="authorizationAttributeSourceAdvisor"
        class="org.apache.shiro.spring.security.interceptor.AuthorizationAttributeSourceAdvisor">
      <property name="securityManager" ref="securityManager"/>
  </bean>
  ```

* 调整web.xml相关配置

  ```xml
  <!-- 添加退出登录相关配置 -->
  <filter>
      <filter-name>singleSignOutFilter</filter-name>
      <filter-class>org.jasig.cas.client.session.SingleSignOutFilter</filter-class>
      <init-param>
          <param-name>ignoreInitConfiguration</param-name>
          <param-value>true</param-value>
      </init-param>
      <init-param>
          <param-name>casServerUrlPrefix</param-name>
          <param-value>http://127.0.0.1:8443/cas</param-value>
      </init-param>
  </filter>
  ```

* 需要启动CGLIB动态代理

  ```xml
  <aop:aspectj-autoproxy proxy-target-class="true"/>
  ```

## `Spring Boot` 集成

* 依赖配置

  ```xml
  <!--版本配置-->
  <shiro.version>1.4.0</shiro.version>
  <pac4j.version>4.1.0</pac4j.version>
  <pac4j.cas.version>3.7.0</pac4j.cas.version>
  <!--依赖包-->
  <!--shiro-->
  <dependency>
      <groupId>org.apache.shiro</groupId>
      <artifactId>shiro-spring</artifactId>
      <version>${shiro.version}</version>
  </dependency>
  
  <dependency>
      <groupId>io.buji</groupId>
      <artifactId>buji-pac4j</artifactId>
      <version>${pac4j.version}</version>
      <exclusions>
          <exclusion>
              <artifactId>shiro-web</artifactId>
              <groupId>org.apache.shiro</groupId>
          </exclusion>
      </exclusions>
  </dependency>
  <dependency>
      <groupId>org.pac4j</groupId>
      <artifactId>pac4j-cas</artifactId>
      <version>${pac4j.cas.version}</version>
  </dependency>
  ```

* 配置文件`ShiroCasProperties`

  ```java
  /**
   * shiro CAS 配置信息
   *
   * @author FelixFly 2019/7/10
   */
  @Setter
  @Getter
  @ConfigurationProperties(prefix = "shiro.cas")
  public class ShiroCasProperties {
  
      /**
       * 客户端名称
       */
      private String clientName = "scs";
      /**
       * cas 访问前缀
       */
      private String casUrlPrefix;
      /**
       * 登录回调前缀
       */
      private String callbackUrlPrefix;
  }
  ```

* 配置说明说明文件`META-INF/additional-spring-configuration-metadata.json`

  ```json
  {
    "properties": [
      {
        "name": "shiro.cas.client-name",
        "type": "java.lang.String",
        "description": "shiro cas client name."
      },
      {
        "name": "shiro.cas.cas-url-prefix",
        "type": "java.lang.String",
        "description": "shiro cas  url prefix."
      },
      {
        "name": "shiro.cas.callback-url-prefix",
        "type": "java.lang.String",
        "description": "shiro cas callback url prefix."
      }
    ]
  }
  ```

* 自动装配配置

  ```java
  /**
   * Shiro Cas 自动装备
   * @author FelixFly 2019/7/10
   */
  @Configuration
  @EnableConfigurationProperties(ShiroCasProperties.class)
  public class ShiroCasAutoConfiguration {
  
      private final ShiroCasProperties properties;
  
      public ShiroCasAutoConfiguration(ShiroCasProperties properties) {
          this.properties = properties;
      }
  
      /**
       * 认证方法{@link Pac4jRealm} 需要进行重写
       *
       * @return {@link Pac4jRealm}
       */
      @ConditionalOnMissingBean(Pac4jRealm.class)
      @Bean
      public Pac4jRealm casRealm() {
          return new Pac4jRealm();
      }
  
      /**
       * 权限管理器
       *
       * @param subjectFactory {@link Pac4jSubjectFactory}
       * @param sessionManager {@link SessionManager}
       * @param casRealm {@link Pac4jRealm}
       * @return {@link DefaultWebSecurityManager}
       */
      @Bean("securityManager")
      public DefaultWebSecurityManager securityManager(Pac4jSubjectFactory subjectFactory, SessionManager sessionManager, Pac4jRealm casRealm) {
          DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
          manager.setRealm(casRealm);
          manager.setSubjectFactory(subjectFactory);
          manager.setSessionManager(sessionManager);
          return manager;
      }
  
  
      /**
       * 使用 pac4j 的 subjectFactory
       *
       * @return {@link Pac4jSubjectFactory}
       */
      @Bean
      public Pac4jSubjectFactory subjectFactory() {
          return new Pac4jSubjectFactory();
      }
  
      @Bean
      public FilterRegistrationBean filterRegistrationBean() {
          FilterRegistrationBean<DelegatingFilterProxy> registration = new FilterRegistrationBean<>();
          registration.setFilter(new DelegatingFilterProxy("shiroFilter"));
          //该值缺省为false，表示生命周期由SpringApplicationContext管理，设置为true则表示由ServletContainer管理
          registration.addInitParameter("targetFilterLifecycle", "true");
          registration.setEnabled(true);
          registration.setOrder(Ordered.LOWEST_PRECEDENCE - 1);
          registration.addUrlPatterns("/*");
          return registration;
      }
  
      /**
       * 加载shiroFilter权限控制规则（从数据库读取然后配置）
       *
       * @param shiroFilterFactoryBean {@link ShiroFilterFactoryBean}
       */
      private void loadShiroFilterChain(ShiroFilterFactoryBean shiroFilterFactoryBean) {
          /*下面这些规则配置最好配置到配置文件中 */
          Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>(10);
          filterChainDefinitionMap.put("/", "securityFilter");
          filterChainDefinitionMap.put("/application/**", "securityFilter");
          filterChainDefinitionMap.put("/static/**", "anon");
          filterChainDefinitionMap.put("/index", "securityFilter");
          filterChainDefinitionMap.put("/login", "securityFilter");
          filterChainDefinitionMap.put("/callback", "callbackFilter");
          filterChainDefinitionMap.put("/logout", "logout");
          filterChainDefinitionMap.put("/**", "securityFilter");
          shiroFilterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
      }
  
      /**
       * pac4j配置客户端
       *
       * @param casClient {@link CasClient}
       * @return {@link Config}
       */
      @Bean("authcConfig")
      public Config config(CasClient casClient) {
          return new Config(casClient);
      }
  
  
      /**
       * cas 客户端配置
       *
       * @param casConfig {@link CasConfiguration}
       * @return {@link CasClient}
       */
      @Bean
      public CasClient casClient(CasConfiguration casConfig) {
          CasClient casClient = new CasClient(casConfig);
          //客户端回调地址
          casClient.setCallbackUrl(this.properties.getCallbackUrlPrefix()
                  + "/callback?client_name=" + this.properties.getClientName());
          casClient.setName(this.properties.getClientName());
          return casClient;
      }
  
      /**
       * 请求cas服务端配置
       */
      @Bean
      public CasConfiguration casConfig() {
          final CasConfiguration configuration = new CasConfiguration();
          //CAS server登录地址
          configuration.setLoginUrl(this.properties.getCasUrlPrefix() + "/login");
          //CAS 版本，默认为 CAS30，我们使用的是 CAS20
          configuration.setProtocol(CasProtocol.CAS30);
          configuration.setAcceptAnyProxy(true);
          configuration.setPrefixUrl(this.properties.getCasUrlPrefix() + "/");
          return configuration;
      }
  
  
      /**
       * shiroFilter 配置
       *
       * @param securityManager {@link DefaultWebSecurityManager}
       * @param config {@link DefaultWebSecurityManager}
       * @return {@link ShiroFilterFactoryBean}
       */
      @Bean("shiroFilter")
      public ShiroFilterFactoryBean factory(DefaultWebSecurityManager securityManager, Config config) {
          ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
          // 必须设置 SecurityManager
          shiroFilterFactoryBean.setSecurityManager(securityManager);
          // 添加casFilter到shiroFilter中
          loadShiroFilterChain(shiroFilterFactoryBean);
          Map<String, Filter> filters = new HashMap<>(3);
          //cas 资源认证拦截器
          SecurityFilter securityFilter = new SecurityFilter();
          securityFilter.setConfig(config);
          securityFilter.setClients(this.properties.getClientName());
  
          filters.put("securityFilter", securityFilter);
          //cas 认证后回调拦截器
          CallbackFilter callbackFilter = new CallbackFilter();
          callbackFilter.setConfig(config);
          callbackFilter.setDefaultUrl(this.properties.getCallbackUrlPrefix() + "/index");
          // 自定义logic调整主页面
          callbackFilter.setCallbackLogic(callbackLogic());
          filters.put("callbackFilter", callbackFilter);
          // 注销 拦截器
          LogoutFilter logoutFilter = new LogoutFilter();
          logoutFilter.setConfig(config);
          logoutFilter.setCentralLogout(true);
          logoutFilter.setLocalLogout(true);
          logoutFilter.setLogoutUrlPattern("/logout");
          logoutFilter.setDefaultUrl(this.properties.getCallbackUrlPrefix() + "/index");
          filters.put("logout", logoutFilter);
          shiroFilterFactoryBean.getFilters().putAll(filters);
          return shiroFilterFactoryBean;
      }
  
      /**
       * 授权回调配置
       *
       * @return {@link ShiroCallbackLogic}
       */
      @Bean
      @ConditionalOnMissingBean(name = "callbackLogic")
      public CallbackLogic<Object, J2EContext> callbackLogic(){
          return new ShiroCallbackLogic<>();
      }
  
  
  
      /**
       * 自定义cookie名称
       *
       * @return {@link SimpleCookie}
       */
      @Bean
      public SimpleCookie sessionIdCookie() {
          SimpleCookie cookie = new SimpleCookie(this.properties.getClientName());
          cookie.setMaxAge(-1);
          cookie.setPath("/");
          cookie.setHttpOnly(false);
          return cookie;
      }
  
      @Bean
      public DefaultWebSessionManager sessionManager(SimpleCookie sessionIdCookie) {
          DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
          sessionManager.setSessionIdCookie(sessionIdCookie);
          sessionManager.setSessionIdCookieEnabled(true);
          //-1无失效日期
          sessionManager.setGlobalSessionTimeout(-1);
          sessionManager.setDeleteInvalidSessions(true);
          sessionManager.setSessionValidationSchedulerEnabled(true);
          return sessionManager;
      }
  
      /**
       * 下面的代码是添加注解支持
       */
      @Bean
      @DependsOn("lifecycleBeanPostProcessor")
      public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
          DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator = new DefaultAdvisorAutoProxyCreator();
          // 强制使用cglib，防止重复代理和可能引起代理出错的问题
          defaultAdvisorAutoProxyCreator.setProxyTargetClass(true);
          return defaultAdvisorAutoProxyCreator;
      }
  
      @Bean
      public static LifecycleBeanPostProcessor lifecycleBeanPostProcessor() {
          return new LifecycleBeanPostProcessor();
      }
  
      @Bean
      public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(DefaultWebSecurityManager securityManager) {
          AuthorizationAttributeSourceAdvisor advisor = new AuthorizationAttributeSourceAdvisor();
          advisor.setSecurityManager(securityManager);
          return advisor;
      }
  
      @Bean
      public FilterRegistrationBean singleSignOutFilter() {
          FilterRegistrationBean<SingleSignOutFilter> bean = new FilterRegistrationBean<>();
          bean.setName("singleSignOutFilter");
          SingleSignOutFilter singleSignOutFilter = new SingleSignOutFilter();
          singleSignOutFilter.setCasServerUrlPrefix(this.properties.getCasUrlPrefix());
          singleSignOutFilter.setIgnoreInitConfiguration(true);
          bean.setFilter(singleSignOutFilter);
          bean.addUrlPatterns("/*");
          bean.setEnabled(true);
          bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
          return bean;
      }
  
  }
  ```

* 配置自动装配的配置文件`META-INF/spring.factories`

  ```pro
  org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.rx.ykt.shirocas.configuration.ShiroCasAutoConfiguration
  ```

### 问题

1. 扩展认证授权逻辑

   * 扩展`Pac4jRealm`

     ```java
     /**
      * 认证授权
      *
      * @author XCL 2019/7/9
      */
     public class ShiroPac4jRealm extends Pac4jRealm {
     
     
         // 授权
         @Override
         protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
     
             User user = (User) principalCollection.getPrimaryPrincipal();
             // String userId = (String)
             // principalCollection.fromRealm(getName()).iterator().next();
             Integer userId = user.getId();
             if (userId == null || userId.intValue() == 0) {
                 return null;
             }
             // 添加角色及权限信息
             SimpleAuthorizationInfo sazi = new SimpleAuthorizationInfo();
            	// sazi.addRoles();
             // sazi.addStringPermissions();
             return sazi;
         }
     
         // 认证
         @Override
         protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token)
                 throws AuthenticationException {
             final Pac4jToken pac4jToken = (Pac4jToken) token;
             final List<CommonProfile> commonProfileList = pac4jToken.getProfiles();
             final CommonProfile commonProfile = commonProfileList.get(0);
             String userId = commonProfile.getId();
             // 获取对应的用户信息,没有用户信息返回null
             // User user = ;
             // 根据用户ID进行认证
              return new SimpleAuthenticationInfo(user, commonProfileList.hashCode(), getName());
         }
     
     }
     ```

   * 启用上面这个Bean

     ```java
     @Bean
     public ShiroPac4jRealm shiroPac4jRealm() {
         return new ShiroPac4jRealm();
     }
     ```

2. 每次授权登录都返回登录页面

   * 扩展`ShiroCallbackLogic`

     ```java
     /**
      * {@link ShiroCallbackLogic} 重新登录的话需要跳转到原页面
      *
      * @author FelixFly 2019/7/10
      */
     @Slf4j
     public class CustomShiroCallbackLogic<R, C extends WebContext> extends ShiroCallbackLogic<R, C> {
     
     
         @Override
         protected HttpAction redirectToOriginallyRequestedUrl(WebContext context, String defaultUrl) {
             logger.debug("redirectUrl: {}", defaultUrl);
             return HttpAction.redirect(context, defaultUrl);
         }
     }
     ```

   * 启用上面的Bean

     ```java
     @Bean
     public CallbackLogic<Object, J2EContext> callbackLogic() {
         return new CustomShiroCallbackLogic<>();
     }
     ```

   * 上面配置了defaultUrl为`this.properties.getCallbackUrlPrefix() + "/index")`，这样每次登录授权都到主页面

   



