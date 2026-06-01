# OriginBlogs — 开源个人博客框架

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)

一个基于 Next.js 构建的毛玻璃（Glassmorphism）风格个人博客系统，集成前端展示与本地后台管理控制台，支持 Markdown 写作、草稿管理及图床配置。

> **项目声明**：本项目基于 [Xinghuisama 的 XHBlogs（原项目名 Kirameku）](https://github.com/Xinghongia/Kirameku) 进行二次修改并开源发布，遵从 [CC BY-NC 4.0](LICENSE) 许可协议。感谢原作者的辛勤付出与开源精神。

---

## 语言

[English](README_EN.md) | 中文

---

## 特性

- Glassmorphism 毛玻璃 UI，支持动态渐变与图片背景
- TipTap 富文本编辑器 + Markdown 渲染，支持 LaTeX 数学公式与代码高亮
- Python 驱动的本地 CMS 后台，可视化管理文章、草稿与站点配置
- 照片墙、项目展示、友链等个人品牌建设模块
- 网易云音乐歌单管理与在线播放
- 基于 GitHub Issues 的 Gitalk 评论系统
- AI 对话助手，兼容 DeepSeek / OpenAI API
- 创意工坊与 RPG 等级系统
- 樱花、雪花、萤火虫等动态季节特效
- 全页面移动端适配

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm
- Git
- Python >= 3.10

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/你的用户名/OriginBlogs-public.git
cd OriginBlogs-public

# 启动前端
cd OriginBlogs
npm install
npm run dev
# 访问 http://localhost:3000

# 启动管理后台（另开终端）
cd ../my-blog-manager
# Windows: 双击 Start.bat
# 脚本将自动检测并安装所需依赖，随后启动后台控制台
```text

注意：请勿重命名 `my-blog-manager` 文件夹，否则会导致路径解析失败。

---

## 项目结构

```text
OriginBlogs-public/
├── OriginBlogs/              # 前端博客（Next.js App Router）
│   ├── app/                  # 页面路由
│   │   ├── about/            # 关于页
│   │   ├── chatter/          # 杂谈
│   │   ├── friends/          # 友链
│   │   ├── moments/          # 说说
│   │   ├── music/            # 音乐
│   │   ├── photowall/        # 照片墙
│   │   ├── posts/            # 文章
│   │   ├── projects/         # 项目展示
│   │   ├── timeline/         # 时间线
│   │   └── tree/             # 灵境（创意工坊 + 等级）
│   ├── components/           # 通用组件
│   ├── custom/               # 自定义扩展
│   └── public/               # 静态资源
├── my-blog-manager/          # 本地管理后台
├── picture/                  # 文档图片
├── LICENSE                   # CC BY-NC 4.0
├── README.md
└── README_EN.md
```text

---

## 部署

### 推送至 GitHub

```bash
cd OriginBlogs
git init
git add .
git commit -m "first commit"
git remote add origin git@github.com:你的用户名/你的仓库.git
git branch -M main
git push -u origin main
```text

建议使用私有仓库以保护数据隐私。

### 部署至 Vercel

1. 注册 [Vercel](https://vercel.com) 并绑定 GitHub 账号
2. 点击 Add New → Project，导入你的博客仓库
3. Framework Preset 选择 Next.js，点击 Deploy

部署成功后，Vercel 会分配一个免费二级域名。也可在项目设置 → Domains 中绑定自定义域名，并按提示在 DNS 服务商处添加解析记录。

### 本地双轨同步

管理后台采用"操作暂存区"机制，修改内容后遵循以下流程使变更上线：

```text
暂存到操作队列 → 更新本地 → 同步 Blog → 推送源码
```text

---

## 配置说明

### 图床

推荐使用[去不图床](https://7bu.top)，在后台填入 API Token 即可。也支持直接插入图片 URL。

### AI 助手

默认接入 DeepSeek API（兼容 OpenAI 格式）。在后台设置页填入 API Key，并在 Vercel 项目设置中添加环境变量 `DEEPSEEK_API_KEY`。

### 评论系统

基于 GitHub OAuth Apps + Gitalk：

1. 在 GitHub 创建一个 Public 仓库用于存储评论
2. 进入 GitHub Settings → Developer settings → OAuth Apps，新建应用
3. Homepage URL 填博客首页地址，Authorization callback URL 填博客域名
4. 将生成的 Client ID 和 Client Secret 填入后台评论设置

### 网易云音乐

在网易云音乐网页版中打开歌曲详情页，浏览器地址栏 URL 中的数字即为歌曲 ID，粘贴到后台搜索框即可收录。

---

## 参与贡献

欢迎提交 Issue 和 Pull Request。提交 PR 前请确保：

- 代码中不包含个人配置信息
- 敏感信息通过环境变量管理
- 参考 `siteConfig.example.ts` 和 `.env.example` 了解所需配置字段

### 开发计划

- [ ] Docker 一键部署
- [ ] 更多主题皮肤
- [ ] 多语言 i18n 支持
- [ ] 评论邮件通知

---

## 许可证

本项目基于 [Xinghuisama 的 XHBlogs](https://github.com/Xinghongia/Kirameku) 二次修改发布，采用 [CC BY-NC 4.0](LICENSE) 许可协议。

- 允许自由学习、分享和二次修改后发布（需注明原作者）
- 严禁用于任何商业用途
