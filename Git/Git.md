---
title: Git
author: FelixFly
date: 2018-12-09
tags:
    - Git
categories: 
    - 工具
archives: 2018
---

1. Git的安装
2. Git的常用命令

<!-- more -->

> [Pro Git书籍](https://git-scm.com/book/zh/v2/)

# Git的安装

## Windows安装

* [下载地址](https://git-scm.com/download/win)

# Git的常用命令

## config配置

### 配置类型

* `--local`
* `--global`

* `--system`

### 查看基础配置

使用`git config --global/system/local -l/--list`进行查看

### 默认配置用户名以及邮箱

* `git config --global user.name "userName" `
* `git config --global user.email "userEmail"`

## `log`命令

使用`git log`进行查看

* --all 查看所有分支的历史
* --graph 查看图形化的 信息
* -n 后面加数字，查看最近（后面加的数字）条历史记录
* (branch) 查看什么分支日志

> web查看log命令：git help --web log
>
> 图形化查看log：gitk

## branch命令

使用`git checkout`命令

* -b (branch) (hash)  在hash上创建分支
* (branch) 切换分支

## 查看文件命令

使用`git cat-file`命令

* -t  (hash) 查看文件类型
* -p (hash) 查看文件内容