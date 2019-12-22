---
title: JVM GC
author: FelixFly
date: 2019-09-10
tags:
    - JVM GC
categories: 
    - GC
archives: 2019
---

1. 运行时数据区
2. `GC`的介绍
3. 常用的工具

<!-- more -->

> 版本说明：
>
> * `JDK 1.8.0_202` 命名行参数选用`linux`版本说明
>
> 符号约定
>
> * `*size*` 内存大小，默认单位为`byte`，其他单位k(K)、m(M)以及g(G)

# 运行时数据区

## PC寄存器

## 栈（JAVA栈）

### 本地变量表

### 操作栈

### 动态链接

## 本地方法栈

## 方法区

### 元空间

## 堆

堆的大小控制参数

* 非标准参数

  * `-Xms*size*` 堆的初始化大小，不进行设置默认是新生代和老年代大小之和，必须是1024的倍数并且大于1MB

  * `-Xmx*size*` 堆的最大值，必须是1024的倍数并且大于2MB，server配置一般与堆的大小保持一致

    > 等同于`-XX:MaxHeapSize=*size*`

* `GC`参数

  * `-XX:InitialHeapSize=*size*` 堆的初始化大小，值必须为0,1024的倍数并且大于1M，默认值根据系统运行时配置，配置为0时，大小为新生代和老年代大小之和
  * `-XX:MaxHeapSize=*size*` 堆的最大大小，必须是1024的倍数并且大于2MB

堆包含新生代和老年代，默认比例是通过`-XX:NewRatio=*ratio*` 进行设置，默认值为2，也就是新生代占堆的总空间的1/3，其老年代占堆的总空间的2/3

```java
/**
 * -Xms120M -Xmx300M -XX:+PrintGCDetails
 * 
 */
public static void main(String[] args) {
    ManagementFactory.getMemoryPoolMXBeans().forEach(mxBean -> {
        System.out.printf("[%s]:%dK used %dK\n", mxBean.getName(),
                          mxBean.getUsage().getInit() / 1024,
                          mxBean.getUsage().getUsed() / 1024);
    });
}
```

```verilog
[Code Cache]:2496K used 1439K
[Metaspace]:0K used 4768K
[Compressed Class Space]:0K used 537K
[PS Eden Space]:30720K used 5533K
[PS Survivor Space]:5120K used 0K
[PS Old Gen]:81920K used 0K
Heap
 PSYoungGen      total 35840K, used 6148K [0x00000000f9c00000, 0x00000000fc400000, 0x0000000100000000)
  eden space 30720K, 20% used [0x00000000f9c00000,0x00000000fa201090,0x00000000fba00000)
  from space 5120K, 0% used [0x00000000fbf00000,0x00000000fbf00000,0x00000000fc400000)
  to   space 5120K, 0% used [0x00000000fba00000,0x00000000fba00000,0x00000000fbf00000)
 ParOldGen       total 81920K, used 0K [0x00000000ed400000, 0x00000000f2400000, 0x00000000f9c00000)
  object space 81920K, 0% used [0x00000000ed400000,0x00000000ed400000,0x00000000f2400000)
 Metaspace       used 4774K, capacity 4926K, committed 4992K, reserved 1056768K
  class space    used 538K, capacity 598K, committed 640K, reserved 1048576K
```

> PSYoungGen      total 35840K 此值大小不对，应该还要加上5120K
>
> 新生代的大小 35840+5120K，老年代的大小为81920K ，老年代与新生代的比例刚好是2

### 新生代

新生代的大小控制参数

* 非标准参数

  * `-Xmn*size*` 新生代的初始以及最大大小

    > 可以使用下面两个参数进行替换
    >
    > - `-XX:NewSize=size` 新生代的初始大小
    > - `-XX:MaxNewSize=size` 新生代的最大大小

* `GC`参数

  * `-XX:MaxNewSize=*size*` 新生代的最大大小，默认值是最大性能的值

  * `-XX:NewSize=*size*` 新生代的初始大小，建议为整个堆内存的1/2-1/4

    > 等同于-Xmn

新生代包含`Eden`和两个`Survivor`（from和to）区，默认比例为8：1：1，是由参数`-XX:InitialSurvivorRatio=*ratio*` 控制， 在`-XX:+UseParallelGC`或者`-XX:+UseParallelOldGC`下的幸存区的初始化比例。根据`-XX:+UseParallelGC`或者`-XX:+UseParallelOldGC`自适应分配大小并且根据应用的行为重新分配大小，这个只表示开始的初始化值。若是关闭自适应分配大小（`-XX:-UseAdaptiveSizePolicy`）,需要用`-XX:SurvivorRatio` 幸存区的比例大小。默认值是8，幸存区大小的计算公式为`S=Y/(R+2)`

### 老年代

> 参考文献
>
> 1. [linux版本参数](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html)

