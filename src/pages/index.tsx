import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">专注 Java 后端技术栈，记录学习与实践的点滴</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/java-basic/java-core-1">
            开始阅读
          </Link>
        </div>
      </div>
    </header>
  );
}

const categories = [
  {
    title: 'Java 基础',
    count: 6,
    description: 'Java 核心基础、JVM 垃圾回收、并发编程、设计原则与设计模式',
    link: '/docs/java-basic/java-core-1',
  },
  {
    title: 'Spring 生态',
    count: 17,
    description: 'Spring IOC/AOP 源码与注解编程、SpringBoot 自动装配与生命周期、SpringCloud 微服务全家桶',
    link: '/docs/spring/spring-annotation',
  },
  {
    title: '数据存储',
    count: 10,
    description: 'MySQL 与 InnoDB 引擎、事务与锁、Redis 核心与高可用、ElasticSearch 查询与弹性设计',
    link: '/docs/data-storage/mysql-intro',
  },
  {
    title: '中间件',
    count: 4,
    description: 'CAS 单点登录（服务端与客户端 Shiro 集成）、Dubbo 服务治理、XXL-JOB 分布式调度',
    link: '/docs/middleware/cas-server',
  },
  {
    title: 'DevOps',
    count: 8,
    description: 'Docker 容器化、Nginx 反向代理、Jenkins 持续集成、Linux、Ghostty + tmux 终端工具链、Git 版本管理',
    link: '/docs/devops/docker',
  },
  {
    title: 'AI 与大模型',
    count: 9,
    description: 'AI 编程工具全景、Claude Code 记忆与 Skill 系统、BMAD 方法论与 Team Mode、Spec Kit、OpenSpec SDD',
    link: '/docs/ai/ai-coding-concepts',
  },
];

type CategoryItem = {
  title: string;
  count: number;
  description: string;
  link: string;
};

function CategoryCard({title, count, description, link}: CategoryItem) {
  return (
    <div className={clsx('col col--4', styles.cardCol)}>
      <Link to={link} className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>{title}</h3>
          <span className={styles.badge}>{count} 篇</span>
        </div>
        <p className={styles.cardDesc}>{description}</p>
      </Link>
    </div>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <h2 className={styles.sectionTitle}>知识体系</h2>
            <div className="row">
              {categories.map((props, idx) => (
                <CategoryCard key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
