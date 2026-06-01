// app/api/chat/route.ts — DeepSeek API
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

export async function POST(req: Request) {
  console.log("🐱 [1/4] 路由进入：对接 DeepSeek 脑回路");

  try {
    const { message } = await req.json();

    const config = siteConfig.geminiConfig;
    const apiKey = (process.env.DEEPSEEK_API_KEY || config.apiKey || '').trim();
    const baseUrl = config.baseUrl || 'https://api.deepseek.com';

    if (!apiKey) {
      console.error("❌ 找不到 API Key");
      return new Response(JSON.stringify({ error: "Key missing" }), { status: 500 });
    }

    const url = `${baseUrl}/v1/chat/completions`;
    console.log(`📡 [2/4] 正在呼叫 DeepSeek 模型: ${config.modelId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: config.maxOutputTokens,
        temperature: config.temperature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🚨 DeepSeek 拒绝了请求:", JSON.stringify(data));
      return new Response(JSON.stringify({
        error: `API Error: ${response.status}`,
        details: data.error?.message || "未知错误",
      }), { status: response.status });
    }

    console.log("✅ [3/4] DeepSeek 成功响应");
    const reply = data.choices?.[0]?.message?.content || "本喵现在不想理你喵...";

    console.log("🎉 [4/4] 回复已生成，准备传回前端");

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("🔥 运行时崩溃:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "Ready", model: "DeepSeek" }), { status: 200 });
}
