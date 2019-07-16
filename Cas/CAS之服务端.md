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

2. 调整配置文件信息

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
   cas.authn.jdbc.query[0].url = jdbc:oracle:thin:@192.168.1.21:1521:orcl
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