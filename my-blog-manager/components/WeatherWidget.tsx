// components/WeatherWidget.tsx
"use client";

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Loader2, Wind, Droplets } from 'lucide-react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<{ city: string; temp: number; text: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQWeather = async () => {
      try {
        // 🌟 1. 从环境变量获取你的 Key
        const apiKey = process.env.NEXT_PUBLIC_QWEATHER_KEY;
        if (!apiKey) {
          throw new Error("API Key 缺失");
        }

        // 🌟 2. 和风天气：直接请求北京市 (LocationID: 101010100) 的实况天气
        // 如果想定位其他城市，可以去他们官网查 LocationID，或者传经纬度 (如 location=116.4,39.9)
        const locationId = "101010100";

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // 注意：免费版用的是 devapi.qweather.com
        const res = await fetch(
          `https://devapi.qweather.com/v7/weather/now?location=${locationId}&key=${apiKey}`,
          { signal: controller.signal }
        ).catch(e => { throw e });

        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("天气服务拒绝响应");

        const data = await res.json();

        if (data.code !== "200") {
          throw new Error(`API 报错: ${data.code}`);
        }

        setWeather({
          city: "北京市",
          temp: parseInt(data.now.temp, 10),
          text: data.now.text, // 比如 "多云", "晴"
          icon: data.now.icon  // 和风自带的图标代码，稍后映射
        });

      } catch (err) {
        // 出错静默降级为模拟模式，不再报错弹脸
        setWeather({ city: "北京市", temp: 24, text: "气候模拟", icon: "999" });
      } finally {
        setLoading(false);
      }
    };

    fetchQWeather();
  }, []);

  // 🌟 3. 将和风天气的 Icon 代码映射到我们炫酷的 Lucide 图标上
  const getWeatherIcon = (iconCode: string) => {
    const code = parseInt(iconCode, 10);
    // 晴天系 (100, 103, 104 等)
    if (code >= 100 && code <= 104) {
      // 100是晴，其他是多云/阴
      return code === 100
        ? <Sun className="text-amber-400" size={38} />
        : <Cloud className="text-slate-300" size={38} />;
    }
    // 雨天系 (300 ~ 399)
    if (code >= 300 && code <= 399) return <CloudRain className="text-blue-400" size={38} />;
    // 雪天系 (400 ~ 499)
    if (code >= 400 && code <= 499) return <Snowflake className="text-indigo-200" size={38} />;
    // 雷暴/特殊天气
    if (code === 302 || code === 303 || code === 304) return <CloudLightning className="text-purple-400" size={38} />;
    // 其他情况 (雾、霾、沙尘暴等)
    if (code >= 500 && code <= 515) return <Wind className="text-orange-300" size={38} />;

    // 兜底图标
    return <Cloud className="text-slate-400" size={38} />;
  };

  return (
    <div className="w-full h-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col justify-center transition-all duration-700 hover:scale-[1.02] group relative overflow-hidden">

      {/* 动态光晕 */}
      <div className={`absolute -right-6 -top-6 w-32 h-32 blur-3xl rounded-full transition-colors duration-700 ${weather?.icon === '999' ? 'bg-amber-500/20 group-hover:bg-amber-500/40' : 'bg-indigo-500/20 group-hover:bg-indigo-500/40'}`}></div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 text-slate-500 w-full justify-center relative z-10">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
          <span className="text-[10px] font-black tracking-widest uppercase">连接和风卫星...</span>
        </div>
      ) : weather && (
        <div className="flex items-center justify-between relative z-10 w-full">
          <div className="flex flex-col flex-1 pr-2">
            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${weather.icon === '999' ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-500 dark:text-indigo-400'}`}>
              {weather.icon === '999' ? 'Simulated' : 'QWeather'}
            </span>
            <span className="text-base font-bold text-slate-800 dark:text-white line-clamp-1">
              {weather.city}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">
                {weather.temp}°
              </span>
              <span className="text-xs font-bold text-slate-500">
                {weather.text}
              </span>
            </div>
          </div>
          <div className="relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 drop-shadow-md shrink-0">
            {getWeatherIcon(weather.icon)}
          </div>
        </div>
      )}
    </div>
  );
}