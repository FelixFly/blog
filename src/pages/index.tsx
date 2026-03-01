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
    count: 7,
    description: 'Java 核心基础、JVM 垃圾回收、并发编程、设计模式与设计原则',
    link: '/docs/java-basic/java-core-1',
  },
  {
    title: 'Spring 生态',
    count: 16,
    description: 'Spring IOC/AOP 源码、注解编程、SpringBoot 自动装配与生命周期、SpringCloud 微服务全家桶',
    link: '/docs/spring/spring-annotation',
  },
  {
    title: '数据存储',
    count: 10,
    description: 'MySQL 与 InnoDB 引擎、事务与锁、Redis 核心与高可用、ElasticSearch 查询与弹性设计',
    link: '/docs/data-storage/mysql-intro',
  },
  {
    title: '中间件与架构',
    count: 4,
    description: 'Dubbo 服务治理、CAS 单点登录与 Shiro 集成、XXL-JOB 分布式调度',
    link: '/docs/middleware/dubbo-intro',
  },
  {
    title: 'DevOps 与工具',
    count: 6,
    description: 'Docker 容器化、Nginx 反向代理、Jenkins 持续集成、Linux 与 Git 日常',
    link: '/docs/devops/docker',
  },
  {
    title: 'AI 与大模型',
    count: 5,
    description: 'AI 辅助编程理念、BMAD 方法论、Spec Kit 规范工具、OpenSpec SDD 设计',
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
