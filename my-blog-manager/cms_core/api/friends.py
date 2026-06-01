import os
import json
from fastapi import APIRouter, Request

router = APIRouter()

# 🌟 动态寻址逻辑
CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))
FRIENDS_TS_PATH = os.path.join(PROJECT_ROOT, "data", "friends.ts")


@router.post("/sync")
async def sync_friends(request: Request):
    try:
        payload = await request.json()
        friends_list = payload.get("friends", [])

        # 1. 序列化
        json_str = json.dumps(friends_list, ensure_ascii=False, indent=2)

        # 2. 构造 TS 模板
        ts_content = (
            "// 🛡️ 本文件由 XingHuiSama 控制台自动生成\n"
            "export interface Friend { id: string; name: string; url: string; description: string; avatar: string; themeColor: string; }\n\n"
            f"export const friendsData: Friend[] = {json_str};"
        )

        # 3. 物理落盘
        os.makedirs(os.path.dirname(FRIENDS_TS_PATH), exist_ok=True)
        with open(FRIENDS_TS_PATH, "w", encoding="utf-8") as f:
            f.write(ts_content)

        return {"success": True, "message": f"✨ 友链物理文件已更新！共同步 {len(friends_list)} 位好友。"}
    except Exception as e:
        return {"success": False, "message": f"后端同步崩溃: {str(e)}"}