import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Java 基础',
      items: [
        {
          type: 'category',
          label: 'Java 核心',
          items: [
            'java-basic/java-core-1',
            'java-basic/java-8',
            'java-basic/jvm-gc',
            'java-basic/concurrent-core',
          ],
        },
        {
          type: 'category',
          label: '设计模式',
          items: [
            'java-basic/design-principles',
            'java-basic/singleton-pattern',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Spring 生态',
      items: [
        {
          type: 'category',
          label: 'Spring',
          items: [
            'spring/spring-annotation',
            'spring/spring-ioc-source',
            'spring/spring-annotation-ioc-source',
            'spring/spring-annotation-aop',
            'spring/spring-bean-lifecycle',
            'spring/spring-config',
          ],
        },
        {
          type: 'category',
          label: 'SpringBoot',
          items: [
            'spring/springboot-autoconfigure',
            'spring/springboot-lifecycle',
            'spring/springboot-actuator',
            'spring/spring-environment',
          ],
        },
        {
          type: 'category',
          label: 'SpringCloud',
          items: [
            'spring/springcloud-intro',
            'spring/springcloud-eureka',
            'spring/springcloud-ribbon',
            'spring/springcloud-feign',
            'spring/springcloud-hystrix',
            'spring/springcloud-gateway',
            'spring/springcloud-config',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '数据存储',
      items: [
        {
          type: 'category',
          label: 'MySQL',
          items: [
            'data-storage/mysql-intro',
            'data-storage/innodb-engine',
            'data-storage/innodb-transaction-lock',
          ],
        },
        {
          type: 'category',
          label: 'Redis',
          items: [
            'data-storage/redis-intro',
            'data-storage/redis-deep-dive',
            'data-storage/redis-high-availability',
          ],
        },
        {
          type: 'category',
          label: 'ElasticSearch',
          items: [
            'data-storage/es-intro',
            'data-storage/es-basic',
            'data-storage/es-query',
            'data-storage/es-elastic-design',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '中间件',
      items: [
        {
          type: 'category',
          label: 'CAS 单点登录',
          items: [
            'middleware/cas-server',
            'middleware/cas-client-shiro',
          ],
        },
        'middleware/dubbo-intro',
        'middleware/xxl-job',
      ],
    },
    {
      type: 'category',
      label: 'DevOps',
      items: [
        {
          type: 'category',
          label: '容器化',
          items: [
            'devops/docker',
            'devops/docker-images',
          ],
        },
        {
          type: 'category',
          label: '服务与运维',
          items: [
            'devops/nginx',
            'devops/jenkins',
            'devops/linux',
            'devops/tmux',
          ],
        },
        'devops/git',
      ],
    },
    {
      type: 'category',
      label: 'AI 与大模型',
      items: [
        'ai/ai-coding-concepts',
        'ai/claude-code-memory',
        'ai/bmad-method',
        'ai/spec-kit',
        'ai/openspec-sdd',
        'ai/superpowers',
      ],
    },
  ],
};

export default sidebars;
