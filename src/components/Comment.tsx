import React from 'react';
import Giscus from '@giscus/react';
import {useColorMode} from '@docusaurus/theme-common';

export default function Comment(): React.ReactNode {
  const {colorMode} = useColorMode();

  return (
    <div style={{marginTop: '2rem'}}>
      <Giscus
        repo="FelixFly/blog"
        repoId="MDEwOlJlcG9zaXRvcnk3OTMyNDMwOQ=="
        category="General"
        categoryId="DIC_kwDOBLtqFc4CrmFj"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode === 'dark' ? 'dark' : 'light'}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
