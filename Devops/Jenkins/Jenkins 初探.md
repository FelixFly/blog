---
title: Jenkins 初探
author: FelixFly
date: 2022-08-11
tags:
    - Devops
categories: 
    - jenkins
archives: 2022
---

1. Jenkins 下载安装

   

<!-- more -->

> 版本说明
>
> 1. Centos 7 

# Jenkins安装

> 默认相关文件说明：
>
> ```shell
> sudo systemctl daemon-reload
> ```

1. JDK 安装，采用rpm方式安装，根据[JDK下载地址](https://www.oracle.com/cn/java/technologies/javase/jdk11-archive-downloads.html)下载对应的版本，执行如下命令

   ```shell
   rpm -ivh jdk-11.0.15.1_linux-x64_bin.rpm
   ```

   默认安装的路径在/usr/java下

2. 安装jenkins，执行如下命令

   ```shell
   sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
   sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key
   # 下载
   yum install- y jenkins
   ```

3. 启动jenkins，执行如下命令

   ```shell
   systemctl start jenkins
   ```

4. 访问地址http://127.0.0.1:8080，找到对应的位置的密码输入进行初始化

   ```shell
   cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

> ```
> nohup java -jar /usr/share/java/jenkins.war > /dev/null 2>&1 &
> ```



# 问题

1. 安装插件的时候提示出现错误，无法连接jenkins

   * 修改/var/lib/jenkins/config.xml文件

   ```xml
   <?xml version='1.1' encoding='UTF-8'?>
   <hudson>
     <disabledAdministrativeMonitors/>
     <version>2.346.3</version>
     <numExecutors>2</numExecutors>
     <mode>NORMAL</mode>
     <!-- 修改为false -->
     <useSecurity>true</useSecurity> 
     <!-- 需要删除 -->
     <authorizationStrategy class="hudson.security.FullControlOnceLoggedInAuthorizationStrategy">
       <denyAnonymousReadAccess>true</denyAnonymousReadAccess>
     </authorizationStrategy>
     <securityRealm class="hudson.security.HudsonPrivateSecurityRealm">
       <disableSignup>true</disableSignup>
       <enableCaptcha>false</enableCaptcha>
     </securityRealm>
     <!-- 需要删除 -->
     <disableRememberMe>false</disableRememberMe>
     <projectNamingStrategy class="jenkins.model.ProjectNamingStrategy$DefaultProjectNamingStrategy"/>
     <workspaceDir>${JENKINS_HOME}/workspace/${ITEM_FULL_NAME}</workspaceDir>
     <buildsDir>${ITEM_ROOTDIR}/builds</buildsDir>
     <jdks/>
     <viewsTabBar class="hudson.views.DefaultViewsTabBar"/>
     <myViewsTabBar class="hudson.views.DefaultMyViewsTabBar"/>
     <clouds/>
     <scmCheckoutRetryCount>0</scmCheckoutRetryCount>
     <views>
       <hudson.model.AllView>
         <owner class="hudson" reference="../../.."/>
         <name>all</name>
         <filterExecutors>false</filterExecutors>
         <filterQueue>false</filterQueue>
         <properties class="hudson.model.View$PropertyList"/>
       </hudson.model.AllView>
     </views>
     <primaryView>all</primaryView>
     <slaveAgentPort>-1</slaveAgentPort>
     <label></label>
     <crumbIssuer class="hudson.security.csrf.DefaultCrumbIssuer">
       <excludeClientIPFromCrumb>false</excludeClientIPFromCrumb>
     </crumbIssuer>
     <nodeProperties/>
     <globalNodeProperties/>
     <nodeRenameMigrationNeeded>false</nodeRenameMigrationNeeded>
   </hudson>
   ```

   ```shell
    sudo usermod -a -G root jenkins
   ```

2. 

# 参考资料

* JDK 下载地址 ：https://www.oracle.com/cn/java/technologies/javase/jdk11-archive-downloads.html
* Jenkins 安装指南：https://www.jenkins.io/download/





