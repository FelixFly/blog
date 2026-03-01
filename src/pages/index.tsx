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
        <p className="hero__subtitle">{siteConfig.tagline}</p>
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
  {title: 'Java 基础', description: 'Java Core、JVM、并发编程、设计模式', link: '/docs/java-basic/java-core-1'},
  {title: 'Spring 生态', description: 'Spring IOC/AOP、SpringBoot、SpringCloud 微服务', link: '/docs/spring/spring-annotation'},
  {title: '数据存储', description: 'MySQL、Redis、ElasticSearch', link: '/docs/data-storage/mysql-intro'},
  {title: '中间件与架构', description: 'Dubbo、CAS、XXL-JOB', link: '/docs/middleware/dubbo-intro'},
  {title: 'DevOps 与工具', description: 'Docker、Nginx、Linux、Git、Jenkins', link: '/docs/devops/docker'},
];

function CategoryCard({title, description, link}: {title: string; description: string; link: string}) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className="text--center padding-horiz--md">
        <h3><Link to={link}>{title}</Link></h3>
        <p>{description}</p>
      </div>
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
