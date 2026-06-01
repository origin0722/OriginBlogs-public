// 🛡️ 示例项目数据 — 请根据你的内容修改

export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = [
  {
    "id": "sample-project-1",
    "name": "示例项目",
    "githubUrl": "https://github.com/你的用户名/你的项目",
    "description": "这是一个示例项目，你可以在后台管理面板中替换为自己的项目。",
    "icon": "🚀",
    "tags": ["Next.js", "React", "TypeScript", "Tailwind CSS"]
  }
];
