from fastapi import APIRouter, Body
import os
import re
import json
from typing import Dict, Any

router = APIRouter()

# ---------------------------------------------------------
# 🛠️ 寻址引擎：物理锁死 Manager 本地根目录！(终极修复版)
# ---------------------------------------------------------
CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))


def get_config_path():
    possible_paths = [
        os.path.join(PROJECT_ROOT, 'siteConfig.ts'),
        os.path.join(PROJECT_ROOT, 'src', 'siteConfig.ts'),
        os.path.join(os.path.dirname(CURRENT_API_DIR), 'siteConfig.ts')
    ]

    for p in possible_paths:
        if os.path.exists(p):
            return p

    print(f"❌ 警告：在 Manager 目录未找到 siteConfig.ts！正在搜索的根目录是: {PROJECT_ROOT}")
    return None


def dict_to_ts_string(data, indent=2):
    """安全地将字典转为 TypeScript 格式，自动处理多行字符串转义"""
    if isinstance(data, dict):
        lines = ["{"]
        for k, v in data.items():
            # 🌟 核心修复：无论是字典还是外层，全部使用 json.dumps 强制安全转义，彻底消灭 Unterminated string constant
            val = json.dumps(v, ensure_ascii=False)
            lines.append(f"{' ' * (indent + 2)}{k}: {val},")
        lines.append(" " * indent + "}")
        return "\n".join(lines)
    return json.dumps(data, ensure_ascii=False)


def parse_ts_dict(dict_str: str) -> Dict[str, Any]:
    """
    从 TypeScript 对象字面量字符串中提取所有 key-value 对。
    支持 string / number / boolean 值，自动推断类型。
    用于合并写入时保留文件中已有的未知字段。
    """
    result: Dict[str, Any] = {}
    # 1) 字符串值（双引号、单引号、反引号模板字符串）
    for m in re.finditer(r"""([a-zA-Z0-9_]+)\s*:\s*"([\s\S]*?)"\s*[,}]""", dict_str):
        result[m.group(1)] = m.group(2)
    for m in re.finditer(r"""([a-zA-Z0-9_]+)\s*:\s*'([\s\S]*?)'\s*[,}]""", dict_str):
        if m.group(1) not in result:
            result[m.group(1)] = m.group(2)
    for m in re.finditer(r"""([a-zA-Z0-9_]+)\s*:\s*`([\s\S]*?)`\s*[,}]""", dict_str):
        if m.group(1) not in result:
            result[m.group(1)] = m.group(2)
    # 2) 布尔值
    for m in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*(true|false)', dict_str):
        if m.group(1) not in result:
            result[m.group(1)] = m.group(2) == 'true'
    # 3) 数字（整数 / 浮点数）
    for m in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*(\d+(?:\.\d+)?)', dict_str):
        key = m.group(1)
        if key not in result:
            val = m.group(2)
            result[key] = int(val) if '.' not in val else float(val)
    return result


# =========================================================
# 🚀 接口 1：读取配置 (GET) - 终极安全隔离版 (🌟 修复布尔值读取)
# =========================================================
@router.get("/get")
def get_site_config():
    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "未能找到 siteConfig.ts 文件"}

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()

        parsed_config = {}
        root_content = content

        # 1. 🌟 预先提取并隔离所有已知的“嵌套对象”，防止内部属性泄露到外层！
        known_dicts = ['social', 'gitalkConfig', 'geminiConfig', 'icpConfig']
        for dict_name in known_dicts:
            dict_match = re.search(rf'{dict_name}\s*:\s*\{{([\s\S]+?)\}}', content)
            if dict_match:
                dict_str = dict_match.group(1)
                # 从根内容中剔除，防止下面的通用正则去抓里面的零散数据
                root_content = re.sub(rf'{dict_name}\s*:\s*\{{[\s\S]+?\}},?', '', root_content)

                sub_dict = {}
                # 提取字符串（支持安全匹配包含 \n 的字符串）
                for m in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*(["\'])([\s\S]*?)\2', dict_str):
                    # 将转义的 \\n 恢复为真实的换行，供前端显示
                    sub_dict[m.group(1)] = m.group(3).replace('\\n', '\n')

                # Gitalk 的管理员数组特供处理
                if dict_name == 'gitalkConfig':
                    admin_match = re.search(r'admin\s*:\s*\[(.*?)\]', dict_str)
                    if admin_match:
                        admin_raw = admin_match.group(1)
                        sub_dict['admin'] = [x.strip(" \"'") for x in admin_raw.split(',') if x.strip(" \"'")]
                    else:
                        sub_dict['admin'] = []

                parsed_config[dict_name] = sub_dict

        # 2. 🌟 核心升级：提取外层基础变量（现在支持 字符串、布尔值、数字！）
        for match in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*(?:(["\'])([\s\S]*?)\2|(true|false|\d+))', root_content):
            key = match.group(1)
            str_val = match.group(3) # 匹配到的字符串
            raw_val = match.group(4) # 匹配到的布尔或数字

            if str_val is not None:
                parsed_config[key] = str_val.replace('\\n', '\n')
            elif raw_val == 'true':
                parsed_config[key] = True
            elif raw_val == 'false':
                parsed_config[key] = False
            elif raw_val.isdigit():
                parsed_config[key] = int(raw_val)

        return {"success": True, "data": parsed_config}
    except Exception as e:
        return {"success": False, "message": f"解析失败: {str(e)}"}


# =========================================================
# 🚀 接口 2：写入配置 (POST) - 白名单防漏防崩溃版
# =========================================================
@router.post("/update")
def update_site_config(payload: Dict[str, Any] = Body(...)):
    updates = payload.get("updates", {})
    if not updates:
        return {"success": False, "message": "没有收到需要更新的数据"}

    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "未能扫描到 siteConfig.ts"}

    # 🌟 核心防线：绝对安全的根节点白名单！
    VALID_ROOT_KEYS = {
        "title", "authorName", "bio", "avatarUrl", "useGradient", "themeColors",
        "bgImages", "defaultPostCover", "photoWallImage", "cloudMusicIds", "social",
        "counts", "chatterTitle", "chatterDescription", "picBedName", "picBedUrl",
        "picBedToken", "danmakuList", "gitalkConfig", "buildDate", "footerBadges",
        "icpConfig", "geminiConfig",
        "faviconUrl",
        "navTitle",
        "navSuffix",
        "navAfter",
        "friendLinkApplyFormat",
        "enableLevelSystem" # 👈 你加的字段在这里，完美！
    }

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()

        print("\n" + "=" * 50)
        print(f"🔥 启动物理引擎，目标文件: {config_path}")
        updated_count = 0

        for key, value in updates.items():

            # 拦截非白名单字段，彻底防止二次覆写灾难
            if key not in VALID_ROOT_KEYS:
                print(f"  🛑 拦截非根节点危险字段 -> [{key}]")
                continue

            # 专属通道 1：Gitalk 特殊格式组装
            if key == "gitalkConfig":
                admin_list = value.get("admin", [])
                if isinstance(admin_list, str):
                    admin_list = [admin_list]
                admin_str = '["' + '", "'.join(admin_list) + '"]'

                # 安全转义客户端凭据
                cid = json.dumps(value.get('clientID', ''), ensure_ascii=False)
                csec = json.dumps(value.get('clientSecret', ''), ensure_ascii=False)
                repo = json.dumps(value.get('repo', ''), ensure_ascii=False)
                owner = json.dumps(value.get('owner', ''), ensure_ascii=False)

                gitalk_ts_code = f"""{{
    clientID: {cid},
    clientSecret: {csec},
    repo: {repo},
    owner: {owner},
    admin: {admin_str},
  }}"""
                pattern = rf"({key}\s*:\s*)\{{[\s\S]*?\}}"
                if re.search(pattern, content):
                    content = re.sub(pattern, lambda m: m.group(1) + gitalk_ts_code, content, count=1)
                    print(f"  ✅ 成功修改并落盘(专列) -> [{key}]")
                    updated_count += 1
                continue

            # ================= 原有的通用处理逻辑 =================
            # 🌟 核心修复：这里原本就支持将 bool 转换成 'true' 或 'false' 字符串写入，所以 POST 没问题！
            if isinstance(value, str):
                val_str = json.dumps(value, ensure_ascii=False)
            elif isinstance(value, bool):
                val_str = str(value).lower() # 👈 这里完美的把 bool 变成了 'true' / 'false'
            elif isinstance(value, dict):
                # 🌟 合并策略：先从已有文件中读出旧字段，再用前端传来的新值覆盖
                # 这样可以在 siteConfig.ts 里手动加新 key（如 apiKey、baseUrl），不会被 CMS 覆盖丢失
                existing = {}
                m = re.search(rf"{key}\s*:\s*\{{([\s\S]*?)\}}", content)
                if m:
                    existing = parse_ts_dict(m.group(1))
                merged = {**existing, **value}
                val_str = dict_to_ts_string(merged, indent=2)
            else:
                val_str = json.dumps(value, ensure_ascii=False)

            if isinstance(value, dict):
                pattern = rf"({key}\s*:\s*)\{{[\s\S]*?\}}"
            elif isinstance(value, list):
                pattern = rf"({key}\s*:\s*)\[[\s\S]*?\]"
            else:
                # 写入正则也能匹配布尔值和数字，所以替换没有问题
                pattern = rf"({key}\s*:\s*)(['\"`][\s\S]*?['\"`]|true|false|\d+)"

            if re.search(pattern, content):
                content = re.sub(pattern, lambda m: m.group(1) + val_str, content, count=1)
                print(f"  ✅ 成功修改并落盘 -> [{key}]")
                updated_count += 1

        # 写入物理磁盘
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"🔥 任务圆满完成，共刷新 {updated_count} 个字段")
        print("=" * 50 + "\n")

        return {"success": True, "message": "本地 siteConfig.ts 修改成功！"}

    except Exception as e:
        print(f"❌ 物理写入发生灾难性错误: {str(e)}")
        return {"success": False, "message": f"文件读写错误: {str(e)}"}