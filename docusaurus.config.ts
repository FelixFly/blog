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
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '文档',
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
