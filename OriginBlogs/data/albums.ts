// 🛡️ 示例相册数据 — 请根据你的内容修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "id": "sample-album-1",
    "title": "示例相册",
    "description": "这是一个示例相册，你可以在后台管理面板中替换为自己的内容。",
    "cover": "https://placehold.co/600x400/3b82f6/white?text=Album+Cover",
    "date": "2026-01-01",
    "photos": [
      {
        "url": "https://placehold.co/800x600/6366f1/white?text=Photo+1",
        "caption": "示例照片 1"
      },
      {
        "url": "https://placehold.co/800x600/8b5cf6/white?text=Photo+2",
        "caption": "示例照片 2"
      }
    ]
  }
];
