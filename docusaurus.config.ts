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
            {label: 'Java 核心', to: '/docs/java-basic/java-core-1'},
            {label: 'Java 8', to: '/docs/java-basic/java-8'},
            {label: 'JVM GC', to: '/docs/java-basic/jvm-gc'},
            {label: '并发编程', to: '/docs/java-basic/concurrent-core'},
            {label: '设计原则', to: '/docs/java-basic/design-principles'},
            {label: '单例模式', to: '/docs/java-basic/singleton-pattern'},
          ],
        },
        {
          type: 'dropdown',
          label: 'Spring 生态',
          position: 'left',
          items: [
            {label: 'Spring 注解编程', to: '/docs/spring/spring-annotation'},
            {label: 'Spring IOC 源码', to: '/docs/spring/spring-ioc-source'},
            {label: 'Spring AOP', to: '/docs/spring/spring-annotation-aop'},
            {label: 'Bean 生命周期', to: '/docs/spring/spring-bean-lifecycle'},
            {label: 'SpringBoot 自动装配', to: '/docs/spring/springboot-autoconfigure'},
            {label: 'SpringCloud 微服务', to: '/docs/spring/springcloud-intro'},
          ],
        },
        {
          type: 'dropdown',
          label: '数据存储',
          position: 'left',
          items: [
            {label: 'MySQL 初探', to: '/docs/data-storage/mysql-intro'},
            {label: 'InnoDB 引擎', to: '/docs/data-storage/innodb-engine'},
            {label: 'Redis 初探', to: '/docs/data-storage/redis-intro'},
            {label: 'Redis 深入', to: '/docs/data-storage/redis-deep-dive'},
            {label: 'ElasticSearch 初探', to: '/docs/data-storage/es-intro'},
            {label: 'ElasticSearch 查询', to: '/docs/data-storage/es-query'},
          ],
        },
        {
          type: 'dropdown',
          label: '中间件',
          position: 'left',
          items: [
            {label: 'Dubbo 初探', to: '/docs/middleware/dubbo-intro'},
            {label: 'CAS 服务端', to: '/docs/middleware/cas-server'},
            {label: 'CAS 客户端 Shiro', to: '/docs/middleware/cas-client-shiro'},
            {label: 'XXL-JOB', to: '/docs/middleware/xxl-job'},
          ],
        },
        {
          type: 'dropdown',
          label: 'DevOps',
          position: 'left',
          items: [
            {label: 'Docker', to: '/docs/devops/docker'},
            {label: 'Docker 镜像', to: '/docs/devops/docker-images'},
            {label: 'Nginx', to: '/docs/devops/nginx'},
            {label: 'Jenkins', to: '/docs/devops/jenkins'},
            {label: 'Linux', to: '/docs/devops/linux'},
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
