export default {
  async scheduled(event, env, ctx) {
    await sendDailyBriefing(env, "淄博博山");
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const city = url.searchParams.get("city") || "淄博博山";
    await sendDailyBriefing(env, city);
    return new Response(`简报已发送，城市：${city}`, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

async function sendDailyBriefing(env, city) {
  // 从环境变量读取，而不是直接写在代码里（这是专业开发者的标准做法！）
  const BOT_TOKEN = env.BOT_TOKEN;
  const CHAT_ID = env.CHAT_ID;

  const weather = await (await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t&lang=zh-cn`)).text();
  const tedRes = await fetch("https://www.ted.com/talks/rss");
  const tedText = await tedRes.text();
  const titleMatch = tedText.match(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/);
  const linkMatch = tedText.match(/<item>[\s\S]*?<link>(.*?)<\/link>/);
  
  const message = `☀️ 早安 Light Kise\n📍 天气 [${city}]：${weather}\n💡 TED：${titleMatch[1]}\n🔗 ${linkMatch[1]}`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message })
  });
}

