---
title: Java 8
author: FelixFly
date: 2018-12-09
tags:
    - Java 8
categories: 
    - 基础
archives: 2018
---

1. `Lambda`
2. `Stream`
3. `Default Method`
4. `Optional`
5. `CompletableFuture`
6. `Date And Time`

<!-- more -->

# `Lambda`

> 编程规则
>
> * 编写相似的代码，尝试抽象
> * 不要重复代码（DRY `don't repeat yourself`）

## 匿名内部类

> 行为参数化——策略模式

```java
new Thread(new Runnable() {
    @Override
    public void run() {
        System.out.println("启动线程执行方法");
    }
}).start();

// lambda表达式
new Thread(() -> System.out.println("启动线程执行方法")).start();
```

## `Lambda`

### `@FunctionalInterface`

规定接口只有一个抽象方法，接口中有`default`方法实现以及`Object`里面的方法不参与抽象方法的统计

### 函数接口

* `Predicate`  

  有参数T，有返回值boolean,`boolean test(T t)`

  > 支持原生类型，避免自动拆装箱
  >
  > * `IntPredicate`  参数为int,`boolean test(int value)`
  > * `LongPredicate`  参数为long,`boolean test(long value)`
  > * `DoubleFunction`  参数为double,`boolean test(double value)`

  * `BiPredicate`  

    有参数T和U，有返回值boolean，`boolean test(T t, U u)`

* `Consumer`

  有参数T，无返回值，`void accept(T t)`

  > 支持原生类型，避免自动拆装箱
  >
  > * `IntConsumer` 参数为int,`void accept(int value)`
  > * `LongConsumer` 参数为long,`void accept(long value)`
  > * `DoubleConsumer` 参数为double,`void accept(double value)`

  * `BiConsumer`

    有参数T和U，无返回值，`void accept(T t, U u)`

    > 支持原生类型，避免自动拆装箱
    >
    > * `ObjIntConsumer` 有参数T和int，无返回值，`void accept(T t, int value)`
    > * `ObjLongConsumer` 有参数T和long，无返回值，`void accept(T t, long value)
    > * `ObjDoubleConsumer` 有参数T和double，无返回值，`void accept(T t, double value)

* `Supplier`

  无参数，有返回值T,`T get()`

  > 支持原生类型，避免自动拆装箱
  >
  > * `BooleanSupplier`  无参数，有返回值boolean,`boolean getAsBoolean()`
  > * `IntSupplier` 无参数，有返回值int,`int getAsInt()`
  > * `LongSupplier` 无参数，有返回值long,`long getAsLong()`
  > * `DoubleSupplier `无参数，有返回值double,`double getAsDouble()`

* `Function`

  有参数T，有返回值R,`R apply(T t)`

  >  支持原生类型,避免自动拆装箱
  >
  >  * `IntFunction` 有参数int，有返回值R，`R apply(int value);`
  >  * `IntToLongFunction` 有参数int,有返回值long,`long applyAsLong(int value)`
  >  * `IntToDoubleFunction`  有参数int,有返回值double,`double applyAsDouble(int value);`
  >  * `LongFunction` 有参数long，有返回值R，`R apply(long value)`
  >  * `LongToDoubleFunction` 有参数long，有返回值double，`double applyAsDouble(long value)`
  >  * `LongToIntFunction` 有参数long，有返回值int，`int applyAsInt(long value)`
  >  * `DoubleFunction` 有参数double,有返回值R，`R apply(double value)`
  >  * `DoubleToLongFunction` 有参数double,有返回值long，`long applyAsLong(double value)
  >  * `DoubleToIntFunction` 有参数double,有返回值int，`int applyAsInt(double value)
  >  * `ToIntFunction` 有参数T，有返回值int,`int applyAsInt(T value)`
  >  * `ToLongFunction` 有参数T，有返回值long,`long applyAsLong(T value)`
  >  * `ToDoubleFunction` 有参数T，有返回值double,`double applyAsDouble(T value)`

  * `UnaryOperator`

  有参数T，有返回值T，`T apply(T t)`

  > 支持原生类型，避免自动拆装箱
  >
  > - `IntUnaryOperator` 有参数int，有返回值int，`int applyAsInt(int t)`
  > - `LongUnaryOperator` 有参数long，有返回值long，`long applyAsLong(long t)`
  > - `DoubleUnaryOperator `有参数double，有返回值double，`double applyAsInt(double t)`

  * `BiFunction`

    有参数T和U，有返回值R,`R apply(T t, U u)`

    > 支持原生类型，避免自动拆装箱
    >
    > * `ToIntBiFunction` 有参数T和U，有返回值int,`int applyAsInt(T t, U u)
    > * `ToLongBiFunction` 有参数T和U，有返回值int,`long applyAsLong(T t, U u)
    > * `ToDoubleBiFunction` 有参数T和U，有返回值double,`int applyAsDouble(T t, U u)

    * `BinaryOperator`

      有参数T和T，有返回值T,`T apply(T t, T u)

      > 支持原生类型，避免自动拆装箱
      >
      > * `IntBinaryOperator` 有参数int和int，有返回值int,`int applyAsInt(int left, int right)`
      > * `LongBinaryOperator` 有参数long和long，有返回值long,`long applyAslong(long left, long right)`
      > * `DoubleBinaryOperator` 有参数double和double，有返回值double,`double applyAsDouble(double left, double right)`

## 总结

四种基础函数接口，`PSCF`,分别为`Predicate`、`Supplier`、`Consumer`、`Function`,其分别代表`test`判断、`get`获取，`accept`接收消费，`apply`应用创建，支持原生类型有int、long、double，命名规则为对应原生类型的封装类加上对应的函数接口名称，若方法有返回值，方法签名规则为对应方法名加上`As*`，其中`Predicate`还有个原生类型boolean,`Function`接口有原生类型int、long、double相互之间的转换。有参数的函数接口（除`Supplier`外）都有扩展两个参数的函数接口，命名规则为为`Bi*`。`BiConsumer`有扩展第二个参数为原生类型int、long、double,命名规则为`Obj*Consumer`，`BiFunction`支持原生类型int、long、double返回值，命令规则为`To*BiFunction`。`Function`还有两个特需的函数接口，分别为`UnaryOperator`和`BinaryOperator`,分别表示T创建T，T,T创建T，同一种类型的参数同一种的返回值，他们支持原生类型int、long、double，命名规则为其原生类型的封装类加上的对应的函数接口名称，返回值的方法名是加上`As*`

> 备注：命名规则中的*代表原生类型的封装类

# `Stream`

# `Default Method`

接口可以有默认实现，用`default`进行申明方法，接口中也可以使用静态方法。

1. 何时使用
   * 可选方法
   * 多层继承行为
2. 同一个方法签名多层使用规则
   * 优先类中方法
   * 再次子类接口方法
   * 最后使用申明的方法，一般是指父接口的默认方法

# `Optional`

为了解决null问题，引进了`Optional`，这个一定程度了上是参考了`Guava`的实现。主要方法如下

| `empty`       | 返回一个空的`Optional`实例                                 |
| ------------- | ---------------------------------------------------------- |
| `filter`      | 不为空并且匹配，返回当前`Optional`,否则返回空的`Optional`  |
| `flatMap`     | 不为空，转换为方法转换的`Optional`,否则返回空的`Optional`  |
| `get`         | 不为空返回值，否则抛出`NoSuchElementException`             |
| `ifPresent`   | 不为空执行值消费，否则不处理                               |
| `isPresent`   | 不为空返回`true`，否则`false`                              |
| `map`         | 不为空应用提供的方法                                       |
| `of`          | 值为空抛出`NullPointerException`，否则返回`Optional`的实例 |
| `ofNullable`  | 返回`Optional`的实例，值为空时返回空的`Optional`           |
| `orElse`      | 不为空返回值，否则返回参数默认值                           |
| `orElseGet`   | 不为空返回值，否则返回参数方法创建值                       |
| `orElseThrow` | 不为空返回值，否则抛出方法创建的异常                       |

# `CompletableFuture`

# `Date And Time`