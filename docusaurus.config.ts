import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'FelixFly Tech Blog',
  tagline: 'Java / Spring / Database / DevOps',
  favicon: 'img/favicon.ico',

  url: 'https://www.felixfly.top',
  baseUrl: '/',

  organizationName: 'felixfly',
  projectName: 'blog',

  onBrokenLinks: 'warn',

  markdown: {
    format: 'md',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en', 'zh'],
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'FelixFly',
      items: [
        {
          type: 'dropdown',
          label: 'Java 基础',
          position: 'left',
          items: [
            {type: 'html', value: '<strong>Java 核心</strong>', className: 'dropdown-section-title'},
            {label: 'Java Core', to: '/docs/java-basic/java-core-1'},
            {label: 'Java 8 新特性', to: '/docs/java-basic/java-8'},
            {label: 'JVM GC', to: '/docs/java-basic/jvm-gc'},
            {label: '并发编程', to: '/docs/java-basic/concurrent-core'},
            {type: 'html', value: '<strong>设计模式</strong>', className: 'dropdown-section-title'},
            {label: '设计原则', to: '/docs/java-basic/design-principles'},
            {label: '单例模式', to: '/docs/java-basic/singleton-pattern'},
          ],
        },
        {
          type: 'dropdown',
          label: 'Spring 生态',
          position: 'left',
          items: [
            {type: 'html', value: '<strong>Spring</strong>', className: 'dropdown-section-title'},
            {label: '注解编程', to: '/docs/spring/spring-annotation'},
            {label: 'IOC 源码解析', to: '/docs/spring/spring-ioc-source'},
            {label: '注解编程 IOC 源码', to: '/docs/spring/spring-annotation-ioc-source'},
            {label: '注解编程 AOP', to: '/docs/spring/spring-annotation-aop'},
            {label: 'Bean 生命周期', to: '/docs/spring/spring-bean-lifecycle'},
            {label: 'Spring 配置化', to: '/docs/spring/spring-config'},
            {type: 'html', value: '<strong>SpringBoot</strong>', className: 'dropdown-section-title'},
            {label: '自动装配', to: '/docs/spring/springboot-autoconfigure'},
            {label: '生命周期', to: '/docs/spring/springboot-lifecycle'},
            {label: 'Actuator', to: '/docs/spring/springboot-actuator'},
            {label: 'Environment 简介', to: '/docs/spring/spring-environment'},
            {type: 'html', value: '<strong>SpringCloud</strong>', className: 'dropdown-section-title'},
            {label: 'SpringCloud 序幕', to: '/docs/spring/springcloud-intro'},
            {label: '注册中心 Eureka', to: '/docs/spring/springcloud-eureka'},
            {label: '负载均衡 Ribbon', to: '/docs/spring/springcloud-ribbon'},
            {label: '服务调用 Feign', to: '/docs/spring/springcloud-feign'},
            {label: '服务熔断 Hystrix', to: '/docs/spring/springcloud-hystrix'},
            {label: '服务网关', to: '/docs/spring/springcloud-gateway'},
            {label: '配置中心', to: '/docs/spring/springcloud-config'},
          ],
        },
        {
          type: 'dropdown',
          label: '数据存储',
          position: 'left',
          items: [
            {type: 'html', value: '<strong>MySQL</strong>', className: 'dropdown-section-title'},
            {label: 'MySQL 初探', to: '/docs/data-storage/mysql-intro'},
            {label: 'InnoDB 引擎', to: '/docs/data-storage/innodb-engine'},
            {label: 'InnoDB 事务与锁', to: '/docs/data-storage/innodb-transaction-lock'},
            {type: 'html', value: '<strong>Redis</strong>', className: 'dropdown-section-title'},
            {label: 'Redis 初探', to: '/docs/data-storage/redis-intro'},
            {label: 'Redis 深入', to: '/docs/data-storage/redis-deep-dive'},
            {label: 'Redis 高可用', to: '/docs/data-storage/redis-high-availability'},
            {type: 'html', value: '<strong>ElasticSearch</strong>', className: 'dropdown-section-title'},
            {label: 'ES 初探', to: '/docs/data-storage/es-intro'},
            {label: 'ES 基础', to: '/docs/data-storage/es-basic'},
            {label: 'ES 查询篇', to: '/docs/data-storage/es-query'},
            {label: 'ES 弹性设计', to: '/docs/data-storage/es-elastic-design'},
          ],
        },
        {
          type: 'dropdown',
          label: '中间件',
          position: 'left',
          items: [
            {type: 'html', value: '<strong>CAS 单点登录</strong>', className: 'dropdown-section-title'},
            {label: 'CAS 服务端', to: '/docs/middleware/cas-server'},
            {label: 'CAS 客户端 Shiro 集成', to: '/docs/middleware/cas-client-shiro'},
            {type: 'html', value: '<strong>其他</strong>', className: 'dropdown-section-title'},
            {label: 'Dubbo 初探', to: '/docs/middleware/dubbo-intro'},
            {label: 'XXL-JOB 分布式调度', to: '/docs/middleware/xxl-job'},
          ],
        },
        {
          type: 'dropdown',
          label: 'DevOps',
          position: 'left',
          items: [
            {type: 'html', value: '<strong>容器化</strong>', className: 'dropdown-section-title'},
            {label: 'Docker', to: '/docs/devops/docker'},
            {label: 'Docker 镜像', to: '/docs/devops/docker-images'},
            {type: 'html', value: '<strong>服务与运维</strong>', className: 'dropdown-section-title'},
            {label: 'Nginx', to: '/docs/devops/nginx'},
            {label: 'Jenkins', to: '/docs/devops/jenkins'},
            {label: 'Linux', to: '/docs/devops/linux'},
            {label: 'Tmux', to: '/docs/devops/tmux'},
            {type: 'html', value: '<strong>版本管理</strong>', className: 'dropdown-section-title'},
            {label: 'Git', to: '/docs/devops/git'},
          ],
        },
        {
          type: 'dropdown',
          label: 'AI',
          position: 'left',
          items: [
            {label: 'AI 编程理念', to: '/docs/ai/ai-coding-concepts'},
            {label: 'BMAD 方法论', to: '/docs/ai/bmad-method'},
            {label: 'Spec Kit', to: '/docs/ai/spec-kit'},
            {label: 'OpenSpec SDD', to: '/docs/ai/openspec-sdd'},
            {label: 'Superpowers', to: '/docs/ai/superpowers'},
          ],
        },
        {
          href: 'https://github.com/felixfly',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {label: 'Java 基础', to: '/docs/java-basic/java-core-1'},
            {label: 'Spring 生态', to: '/docs/spring/spring-annotation'},
            {label: '数据存储', to: '/docs/data-storage/mysql-intro'},
          ],
        },
        {
          title: '更多',
          items: [
            {label: 'GitHub', href: 'https://github.com/felixfly'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} FelixFly. Built with Docusaurus.`,
    },
    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
      additionalLanguages: ['java', 'bash', 'sql', 'yaml', 'properties'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
