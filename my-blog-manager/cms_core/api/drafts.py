import os
import json
import time
import yaml
from fastapi import APIRouter, Request
from datetime import datetime
import re
import markdown  # 确保你已经安装了 markdown 库 (pip install markdown)
from markdownify import markdownify as md

router = APIRouter()

# 🌟 终极物理锁死防线：绝对定位到 my-blog-manager 根目录，无视任何全局目录切换！
CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))


def get_manager_drafts_dir() -> str:
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    drafts_dir = os.path.join(PROJECT_ROOT, "manager_data", "drafts")
    if not os.path.exists(drafts_dir):
        os.makedirs(drafts_dir)
    return drafts_dir


@router.post("/save")
async def save_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "后端无法解析传来的 JSON 数据"}

    drafts_dir = get_manager_drafts_dir()
    draft_id = payload.get("id")

    if not draft_id or draft_id == 'new':
        draft_id = f"draft_{int(time.time() * 1000)}"
    elif payload.get("type") == "about":
        draft_id = "about"

    draft_data = {
        "id": draft_id,
        "type": payload.get("type", "post"),
        "title": payload.get("title", ""),
        "description": payload.get("description", ""),
        "content": payload.get("content", ""),
        "cover": payload.get("cover", ""),
        "tags": payload.get("tags", []),
        "mood": payload.get("mood", ""),
        "date": payload.get("date", ""),
        "lastModified": int(time.time() * 1000)
    }

    file_path = os.path.join(drafts_dir, f"{draft_id}.json")
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(draft_data, f, ensure_ascii=False, indent=2)
        return {"success": True, "message": "草稿已安全落盘", "id": draft_id}
    except Exception as e:
        return {"success": False, "message": f"草稿保存失败: {str(e)}"}


@router.post("/list")
async def list_drafts(request: Request):
    drafts_dir = get_manager_drafts_dir()
    drafts = []
    if not os.path.exists(drafts_dir):
        return {"success": True, "drafts": []}

    for filename in os.listdir(drafts_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(drafts_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    content = data.get("content", "")
                    data["contentPreview"] = content[:100] if content else ""
                    if "content" in data: del data["content"]
                    drafts.append(data)
            except Exception:
                continue
    drafts.sort(key=lambda x: x.get("lastModified", 0), reverse=True)
    return {"success": True, "drafts": drafts}


@router.post("/get")
async def get_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON 解析失败"}

    raw_id = payload.get("id", "").replace(".md", "")
    doc_type = payload.get("type", "post")
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    drafts_dir = get_manager_drafts_dir()

    # 1. 优先从草稿箱读取 JSON
    file_path = os.path.join(drafts_dir, f"{raw_id}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return {"success": True, "draft": json.load(f)}

    # 2. 如果没有草稿，从物理 MD 文件读取并解析
    target_md = None
    if raw_id == "about" or doc_type == "about":
        target_md = os.path.join(base_dir, "app", "about", "about.md")
    else:
        folder = "posts" if doc_type == "post" else "chatters"
        target_md = os.path.join(base_dir, folder, f"{raw_id}.md")

    if target_md and os.path.exists(target_md):
        try:
            with open(target_md, "r", encoding="utf-8") as f:
                raw_content = f.read()

            title, cover, description, mood, date = "", "", "", "", ""
            tags = []
            md_body = raw_content

            # 🌟 拆解 YAML Front Matter
            if raw_content.strip().startswith("---"):
                parts = raw_content.split("---", 2)
                if len(parts) >= 3:
                    try:
                        fm = yaml.safe_load(parts[1])
                        if fm:
                            title = fm.get("title", "")
                            cover = fm.get("cover", "")
                            description = fm.get("description", "")
                            mood = fm.get("mood", "")
                            date = fm.get("date", "")
                            tags = fm.get("tags", [])
                            if not isinstance(tags, list): tags = [tags] if tags else []
                        md_body = parts[2].strip()
                    except:
                        pass

            # 🌟 将 Markdown 转换为编辑器认识的 HTML
            html_content = markdown.markdown(md_body, extensions=['fenced_code', 'tables', 'nl2br'])

            draft_data = {
                "id": raw_id,
                "type": doc_type,
                "title": title or ("关于我" if doc_type == "about" else ""),
                "content": html_content,
                "tags": tags,
                "cover": cover,
                "description": description,
                "mood": mood,
                "date": date
            }
            return {"success": True, "draft": draft_data}
        except Exception as e:
            return {"success": False, "message": f"解析物理文件失败: {str(e)}"}

    return {"success": False, "message": "未找到相关文件"}


@router.post("/delete")
async def delete_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON 解析失败"}

    raw_id = payload.get("id", "").replace(".md", "").replace(".json", "")
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    drafts_dir = get_manager_drafts_dir()

    possible_paths = [
        os.path.join(drafts_dir, f"{raw_id}.json"),
        os.path.join(base_dir, "posts", f"{raw_id}.md"),
        os.path.join(base_dir, "chatters", f"{raw_id}.md")
    ]

    deleted_count = 0
    for p in possible_paths:
        if os.path.exists(p):
            try:
                os.remove(p)
                deleted_count += 1
            except:
                continue

    if deleted_count > 0:
        return {"success": True, "message": f"已彻底销毁相关文件"}
    return {"success": False, "message": "未找到相关文件"}


@router.post("/sync_local")
async def sync_local_operations(request: Request):
    payload = await request.json()
    operations = payload.get("operations", [])
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    drafts_dir = get_manager_drafts_dir()
    results = []

    for op in operations:
        if op.get("type") == "publish_article":
            data = op.get("value", {})
            doc_type = data.get("type", "post")
            doc_id = data.get("id", "")

            final_id = doc_id
            if not final_id or final_id == 'new':
                final_id = f"{doc_type}_{int(time.time())}"

            # ==========================================
            # 🌟 核心防吞空行逻辑：在给 markdownify 之前拦截处理 HTML
            # ==========================================
            raw_html = data.get("content", "")

            # 1. 拦截前端发来的带有全角空格的空段落，或者原生空段落
            # 我们直接把它们替换成带有 HTML 换行符的强硬结构
            raw_html = re.sub(r'<p>&#12288;<\/p>', '<br><br>', raw_html)
            raw_html = re.sub(r'<p><\/p>', '<br><br>', raw_html)

            # 2. 调用 markdownify 进行基础转换，保留 img
            # 强制让它保留 br 标签！
            md_content = md(raw_html, heading_style="ATX", keep=['img', 'br'])

            # 3. 转换完毕后，markdownify 可能会把 <br> 留下来，
            # 为了在 MD 中形成真实的空行，我们把保留下来的 <br> 或者 <br/> 全部替换为纯粹的 \n\n
            md_content = re.sub(r'<br\s*\/?>', '\n\n', md_content)
            # ==========================================

            # 🌟 处理日期与精确时间
            input_date = str(data.get("date", "")).strip()
            if input_date:
                # 如果前端只传了 "YYYY-MM-DD" (长度 <= 10)，帮它补上现在的时分秒
                if len(input_date) <= 10:
                    current_time = datetime.now().strftime("%H:%M:%S")
                    final_date = f"{input_date} {current_time}"
                else:
                    final_date = input_date
            else:
                # 如果没传，生成完整的当前时间
                final_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            fm = {
                "title": data.get("title", ""),
                "date": final_date,
                "tags": data.get("tags", []),
                "mood": data.get("mood", ""),
                "cover": data.get("cover", ""),
                "description": data.get("description", "")
            }
            final_text = f"---\n{yaml.dump(fm, allow_unicode=True, sort_keys=False)}---\n\n{md_content}"

            if doc_type == "about":
                save_path = os.path.join(base_dir, "app", "about", "about.md")
            else:
                folder = "posts" if doc_type == "post" else "chatters"
                save_path = os.path.join(base_dir, folder, f"{final_id}.md")

            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(final_text)

            draft_path = os.path.join(drafts_dir, f"{doc_id}.json")
            if os.path.exists(draft_path):
                try:
                    os.remove(draft_path)
                except:
                    pass

            results.append(f"✅ 已发布: {fm['title']}")

    return {"success": True, "message": "\n".join(results)}


@router.get("/all_tags")
async def get_all_historical_tags():
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    scan_dirs = {"post": os.path.join(base_dir, "posts"), "chatter": os.path.join(base_dir, "chatters")}
    tag_collections = {"post": set(), "chatter": set()}
    fm_regex = re.compile(r'---\s*\n(.*?)\n---\s*', re.DOTALL)

    for doc_type, dir_path in scan_dirs.items():
        if not os.path.exists(dir_path): continue
        for filename in os.listdir(dir_path):
            if filename.endswith(".md"):
                try:
                    with open(os.path.join(dir_path, filename), "r", encoding="utf-8") as f:
                        match = fm_regex.search(f.read())
                        if match:
                            fm = yaml.safe_load(match.group(1))
                            if fm and "tags" in fm:
                                for t in (fm["tags"] if isinstance(fm["tags"], list) else [fm["tags"]]):
                                    tag_collections[doc_type].add(str(t))
                except:
                    continue
    return {"success": True, "postTags": sorted(list(tag_collections["post"])),
            "chatterTags": sorted(list(tag_collections["chatter"]))}