// siteConfig.ts - 你的全站"控制中心"
// 🛡️ 此文件包含个人配置，请勿提交到公开仓库。可参考 siteConfig.example.ts 进行配置。

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "我的博客",
  faviconUrl: "",
  authorName: "博客作者",
  bio: "在这里写下你的个人简介...",

  navTitle: "作者",
  navSuffix: "の",
  navAfter: "Blog",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "",

  // 3. 网站背景设置
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"],
  bgImages: [],

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "",

  // 5. 首页照片墙预览图
  photoWallImage: "",
  cloudMusicIds: [],

  social: {
    github: "https://github.com/你的用户名",
    gitee: "",
    google: "",
    email: "your-email@example.com",
    qq: "",
    wechat: "",
  },

  counts: {
    photos: 0,
  },

  chatterTitle: "杂谈",
  chatterDescription: "记录你的想法与灵感",

  // 图床配置 (Lsky Pro / 去不图床等)
  picBedName: "",
  picBedUrl: "",
  picBedToken: "",

  // 全局背景弹幕
  danmakuList: ["Hello World!", "欢迎来到我的博客~", "今天天气真好！"],

  // Gitalk 评论系统配置
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },

  buildDate: "2026-01-01T00:00:00",

  footerBadges: [
    { name: "Next.js 15", color: "text-sky-500", svg: "" },
    { name: "React 19", color: "text-cyan-400", svg: "" },
    { name: "Tailwind 4", color: "text-teal-400", svg: "" },
    { name: "Vercel", color: "text-purple-500", svg: "" },
  ],

  icpConfig: {
    name: "",
    link: "",
  },

  // AI 猫猫助手配置 (支持兼容 OpenAI API 的服务)
  geminiConfig: {
    modelId: "deepseek-chat",
    baseUrl: "https://api.deepseek.com",
    systemPrompt: "你是一只可爱的猫猫助手，请用萌系的语气回答问题。",
    maxOutputTokens: 150,
    temperature: 0.85,
  },

  friendLinkApplyFormat: "名称：\n简介：\n链接：\n头像：",
  enableLevelSystem: true,
};
