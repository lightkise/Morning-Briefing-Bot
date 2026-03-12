// Version: 26.03.12
// Last Updated: 2026-03-12

export default {
  async scheduled(event, env, ctx) {
    await sendDailyBriefing(env, "淄博博山");
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const city = url.searchParams.get("city") || "淄博博山";
    await sendDailyBriefing(env, city);
    return new Response("简报已发送", { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
};

async function sendDailyBriefing(env, city) {
  const { BOT_TOKEN, CHAT_ID } = env;
  const line = "────────────────";

  // 1. 获取天气
  let weather = "获取失败";
  try {
    weather = await (await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t&lang=zh-cn`)).text();
  } catch (e) {}

  // 2. 获取 TED 灵感
  let tedTitle = "今日 TED 推荐", tedLink = "https://www.ted.com/talks";
  try {
    const tedRes = await fetch("https://www.ted.com/talks/rss");
    const tedText = await tedRes.text();
    tedTitle = tedText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)[1];
    tedLink = tedText.match(/<link>(.*?)<\/link>/)[1];
  } catch (e) {}

  // 3. 获取文学时刻
  let litContent = "阅读是灵魂的避难所。", litFrom = "书海";
  try {
    const litRes = await fetch("https://v1.hitokoto.cn/?c=d&c=i");
    const litData = await litRes.json();
    litContent = litData.hitokoto;
    litFrom = litData.from;
  } catch (e) {}

  // 4. 获取经济学人
  let ecoTitle = "The Economist Today", ecoLink = "https://www.economist.com/", ecoSummary = "";
  try {
    const ecoRes = await fetch("https://www.economist.com/the-world-this-week/rss.xml");
    const ecoText = await ecoRes.text();
    const items = ecoText.split('<item>');
    ecoTitle = items[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)[1];
    ecoLink = items[1].match(/<link>(.*?)<\/link>/)[1];
    const descMatch = items[1].match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
    if (descMatch) {
      // 这里的 60 个字符限制是为了给图片 Caption 留出安全空间
      ecoSummary = descMatch[1].replace(/<[^>]+>/g, '').substring(0, 60) + "...";
    }
  } catch (e) {}

  // 5. 艺术灵感
  const arts = [
    { text: "梵高：即使在最黑暗的夜里，色彩依然可以跳动。", img: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg" },
    { text: "莫奈：真正的美，是捕捉那一刻即逝的光影。", img: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Claude_Monet_-_Impression%2C_soleil_levant.jpg" },
    { text: "罗丹：世界并不缺少美，而是缺少发现美的眼睛。", img: "https://upload.wikimedia.org/wikipedia/commons/d/d4/The_Thinker_Rodin_Museum.jpg" },
    { text: "毕加索：艺术洗去了灵魂中日常生活的尘埃。", img: "https://upload.wikimedia.org/wikipedia/commons/9/98/Pablo_Picasso%2C_1910-11%2C_Girl_with_a_Mandolin.jpg" }
  ];
  const art = arts[Math.floor(Math.random() * arts.length)];

  // 6. 最终精美排版
  const message = `☀️ <b>早安 Light Kise</b>\n` +
    `${line}\n` +
    `📍 <b>今日天气</b> [${city}]：${weather}\n` +
    `${line}\n` +
    `💡 <b>TED 灵感</b>：${tedTitle}\n🔗 <a href="${tedLink}">点击观看</a>\n` +
    `${line}\n` +
    `📖 <b>文学时刻</b>：\n「${litContent}」\n——《${litFrom}》\n` +
    `${line}\n` +
    `📈 <b>经济学人</b>：${ecoTitle}\n🔗 <a href="https://translate.google.com/translate?sl=en&tl=zh-CN&u=${encodeURIComponent(ecoLink)}">中文版</a>\n` +
    `${line}\n` +
    `🎨 <b>艺术灵感</b>：\n${art.text}`;

  // 7. 发送逻辑：优雅降级
  try {
    const photoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        photo: art.img,
        caption: message.substring(0, 1024), // 字符截断保护
        parse_mode: "HTML"
      })
    });

    if (!photoRes.ok) throw new Error("Photo send failed");
  } catch (err) {
    // 降级发送纯文本
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `${message}\n${line}\n🖼 <a href="${art.img}">今日艺术画作预览</a>`,
        parse_mode: "HTML",
        disable_web_page_preview: false
      })
    });
  }
}

