// modules/data.js
export async function loadData() {
  const [events, fullGeoData, positions] = await Promise.all([
    d3.json("data/events.json"),
    d3.json("data/china_provinces.json"),
    d3.json("data/官职_filled.json") // ✅ 新增加载官职数据
  ]);

  const parseDate = d3.timeParse("%Y-%m-%d");

  events.forEach(d => d.date = parseDate(d.date));
  positions.forEach(d => {
  d.date = parseDate(d["年份"]);
  d.rankIndex = +d["官职指数"];
  d.description = d["仕途以及相关的事件描述（纬度1）"];
});


  const sorted = [...events].sort((a, b) => a.date - b.date);
  
  const wanted = ["Henan", "Anhui", "Zhejiang","Jiangxi","Shaanxi","Hubei","Chongqing","Jiangsu"];
  const filteredGeoData = {
    type: "FeatureCollection",
    features: fullGeoData.features.filter(f => wanted.includes(f.properties.name))
  };

  return { events, geoData: filteredGeoData, sorted, positions }; // ✅ 返回 positions
}
