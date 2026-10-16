/**
 * SVGからMetro V1 routemap configを生成するスクリプト
 * Usage: node scripts/generate-metro-config.js
 */
const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "..", "src", "data", "routemap", "svg", "metro-v1_routemap.svg");
const outputPath = path.join(__dirname, "..", "src", "data", "routemap", "metro-v1-routemap-config.json");

const svgContent = fs.readFileSync(svgPath, "utf-8");

// ---- 1. Parse routes (path elements in 路線 group) ----

const routeColors = {
    副都心線: "rgb(187,72,0)",
    有楽町線: "rgb(235,182,0)",
    大江戸線: "rgb(220,0,111)",
    東西線: "rgb(0,162,225)",
    丸ノ内線: "rgb(222,28,28)",
    新宿線: "rgb(125,180,40)",
    三田線: "rgb(0,99,179)",
    千代田線: "rgb(0,152,66)",
    銀座線: "rgb(242,143,0)",
    日比谷線: "rgb(137,169,184)",
    浅草線: "rgb(235,102,102)",
    半蔵門線: "rgb(163,139,192)",
    南北線: "rgb(0,173,156)",
    徒歩: "rgb(0,0,0)",
};

const routeNameMap = {
    副都心線: "fukutoshin",
    有楽町線: "yurakucho",
    大江戸線: "oedo",
    東西線: "tozai",
    丸ノ内線: "marunouchi",
    新宿線: "shinjuku",
    三田線: "mita",
    千代田線: "chiyoda",
    銀座線: "ginza",
    日比谷線: "hibiya",
    浅草線: "asakusa",
    半蔵門線: "hanzomon",
    南北線: "namboku",
    徒歩: "walk",
};

function extractRoutes() {
    const routes = [];

    // Extract route groups from 路線 section
    // Match <g id="ROUTENAME"> ... </g> blocks
    const routeGroupRegex = /<g\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g;

    // First, find the 路線 group
    const rosenMatch = svgContent.match(/<g\s+id="路線">([\s\S]*?)<\/g>\s*<g\s+id="マス"/);
    if (!rosenMatch) {
        console.error("Could not find 路線 group");
        return routes;
    }
    const rosenContent = rosenMatch[1];

    // Find individual route sections
    for (const [jpName, engName] of Object.entries(routeNameMap)) {
        if (jpName === "徒歩") continue; // Skip walk paths

        const routeData = {
            name: engName,
            visibility: "visible",
            paths: [],
        };

        // Extract paths for this route
        // Some routes are in <g id="NAME"> groups, some are standalone <path id="NAME">
        const groupRegex = new RegExp(`<g\\s+id="${jpName}"[^>]*>([\\s\\S]*?)</g>`, "g");
        const standaloneRegex = new RegExp(`<path\\s+id="${jpName}"[^>]*/>`, "g");

        let groupMatch = groupRegex.exec(rosenContent);
        if (groupMatch) {
            // Extract all paths within the group
            const pathRegex = /<path\s+d="([^"]+)"[^>]*style="([^"]+)"[^>]*\/>/g;
            let pathMatch;
            while ((pathMatch = pathRegex.exec(groupMatch[1])) !== null) {
                const d = pathMatch[1];
                const style = pathMatch[2];

                // Extract stroke color and width from style
                const strokeMatch = style.match(/stroke:([^;]+)/);
                const strokeWidthMatch = style.match(/stroke-width:([^;]+)/);

                if (strokeMatch) {
                    routeData.paths.push({
                        d: d,
                        stroke: strokeMatch[1].trim(),
                        strokeWidth: strokeWidthMatch ? strokeWidthMatch[1].replace("px", "").trim() : "25",
                    });
                }
            }
        }

        let standaloneMatch = standaloneRegex.exec(rosenContent);
        if (standaloneMatch) {
            const dMatch = standaloneMatch[0].match(/d="([^"]+)"/);
            const styleMatch = standaloneMatch[0].match(/style="([^"]+)"/);
            if (dMatch && styleMatch) {
                const strokeMatch = styleMatch[1].match(/stroke:([^;]+)/);
                const strokeWidthMatch = styleMatch[1].match(/stroke-width:([^;]+)/);
                if (strokeMatch) {
                    routeData.paths.push({
                        d: dMatch[1],
                        stroke: strokeMatch[1].trim(),
                        strokeWidth: strokeWidthMatch ? strokeWidthMatch[1].replace("px", "").trim() : "25",
                    });
                }
            }
        }

        if (routeData.paths.length > 0) {
            routes.push(routeData);
        }
    }

    // Also add walk paths
    const walkData = {
        name: "walk",
        visibility: "visible",
        paths: [],
    };
    const walkGroupMatch = rosenContent.match(/<g\s+id="徒歩"[^>]*>([\s\S]*?)<\/g>/);
    if (walkGroupMatch) {
        const pathRegex = /<path\s+d="([^"]+)"[^>]*style="([^"]+)"[^>]*\/>/g;
        let pathMatch;
        while ((pathMatch = pathRegex.exec(walkGroupMatch[1])) !== null) {
            walkData.paths.push({
                d: pathMatch[1],
                stroke: "rgb(0,0,0)",
                strokeWidth: "25",
            });
        }
    }
    if (walkData.paths.length > 0) {
        routes.unshift(walkData); // Walk goes first
    }

    return routes;
}

// ---- 2. Parse station boxes ----

function extractStationBoxes() {
    const stations = {};

    // Search within マス section
    const masuStart = svgContent.indexOf('<g id="マス"');
    const masuEnd = svgContent.indexOf("</svg>");
    if (masuStart === -1) {
        console.error("Could not find マス group");
        return stations;
    }
    const masuContent = svgContent.substring(masuStart, masuEnd);

    // New format: simple <rect id="NAME" x="..." y="..." width="..." height="..."> elements
    const rectRegex = /<rect\s+id="([^"]+)"\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"/g;

    let match;
    while ((match = rectRegex.exec(masuContent)) !== null) {
        const name = match[1];
        const x = parseFloat(match[2]);
        const y = parseFloat(match[3]);
        const w = parseFloat(match[4]);
        const h = parseFloat(match[5]);

        stations[name] = {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(w),
            height: Math.round(h),
        };
    }

    return stations;
}

// ---- 3. Parse station text transforms ----

function extractStationTexts() {
    const texts = {};

    // Search entire SVG content
    const textContent = svgContent;

    // Pattern 1: <g transform="matrix(...)"><text x="..." y="..." style="...font-size:...;">NAME</text></g>
    const wrappedTextRegex =
        /<g\s+transform="matrix\(([^)]+)\)">\s*<text\s+x="([^"]+)"\s+y="([^"]+)"\s+style="[^"]*font-size:([^;]+);[^"]*">([^<]+)<\/text>\s*<\/g>/g;

    let match;
    while ((match = wrappedTextRegex.exec(textContent)) !== null) {
        const matrixStr = match[1];
        const textX = match[2].replace("px", "");
        const textY = match[3].replace("px", "");
        const fontSize = match[4].replace("px", "").trim();
        const stationName = match[5].trim();

        const matrixValues = matrixStr.split(",").map((s) => s.trim());
        const transformStr = `matrix(${matrixValues.join(",")})`;

        texts[stationName] = {
            x: textX,
            y: textY,
            fontSize: Math.round(parseFloat(fontSize)) + "px",
            transform: transformStr,
        };
    }

    // Pattern 2: bare <text x="..." y="..." style="...font-size:...;">NAME</text> (no wrapping <g>)
    const bareTextRegex = /<text\s+x="([^"]+)"\s+y="([^"]+)"\s+style="[^"]*font-size:([^;]+);[^"]*">([^<]+)<\/text>/g;

    while ((match = bareTextRegex.exec(textContent)) !== null) {
        const textX = match[1].replace("px", "");
        const textY = match[2].replace("px", "");
        const fontSize = match[3].replace("px", "").trim();
        const stationName = match[4].trim();

        // Only add if not already found via wrapped pattern
        if (!texts[stationName]) {
            texts[stationName] = {
                x: textX,
                y: textY,
                fontSize: Math.round(parseFloat(fontSize)) + "px",
                // No transform for bare text elements
            };
        }
    }

    return texts;
}

// ---- 4. Generate station code ----

function toRomanji(name) {
    // Simple romanization for station code
    const map = {
        西馬込: "NISHI-MAGOME",
        馬込: "MAGOME",
        中延: "NAKANOBU",
        戸越: "TOGOSHI",
        五反田: "GOTANDA",
        高輪台: "TAKANAWADAI",
        泉岳寺: "SENGAKUJI",
        三田: "MITA",
        芝公園: "SHIBAKOEN",
        赤羽橋: "AKABANEBASHI",
        御成門: "ONARIMON",
        内幸町: "UCHISAIWAICHO",
        日比谷: "HIBIYA",
        有楽町: "YURAKUCHO",
        "二重橋前〈丸の内〉": "NIJUBASHIMAE",
        東京: "TOKYO",
        大手町: "OTEMACHI",
        神保町: "JIMBOCHO",
        水道橋: "SUIDOBASHI",
        春日: "KASUGA",
        白山: "HAKUSAN",
        千石: "SENGOKU",
        巣鴨: "SUGAMO",
        西巣鴨: "NISHI-SUGAMO",
        新板橋: "SHIN-ITABASHI",
        板橋区役所前: "ITABASHI-KUYAKUSHOMAE",
        板橋本町: "ITABASHIHONCHO",
        本蓮沼: "MOTOHASUNUMA",
        志村坂上: "SHIMURA-SAKAUE",
        志村三丁目: "SHIMURA-SANCHOME",
        蓮根: "HASUNE",
        西台: "NISHIDAI",
        高島平: "TAKASHIMADAIRA",
        新高島平: "SHIN-TAKASHIMADAIRA",
        西高島平: "NISHI-TAKASHIMADAIRA",
        神谷町: "KAMIYACHO",
        虎ノ門ヒルズ: "TORANOMON-HILLS",
        虎ノ門: "TORANOMON",
        新橋: "SHIMBASHI",
        銀座: "GINZA",
        銀座一丁目: "GINZA-ITCHOME",
        築地: "TSUKIJI",
        月島: "TSUKISHIMA",
        八丁堀: "HATCHOBORI",
        新富町: "SHINTOMICHO",
        東銀座: "HIGASHI-GINZA",
        京橋: "KYOBASHI",
        日本橋: "NIHOMBASHI",
        三越前: "MITSUKOSHIMAE",
        神田: "KANDA",
        末広町: "SUEHIROCHO",
        上野広小路: "UENO-HIROKOJI",
        仲御徒町: "NAKA-OKACHIMACHI",
        秋葉原: "AKIHABARA",
        岩本町: "IWAMOTOCHO",
        馬喰横山: "BAKURO-YOKOYAMA",
        人形町: "NINGYOCHO",
        東日本橋: "HIGASHI-NIHOMBASHI",
        浅草橋: "ASAKUSABASHI",
        蔵前: "KURAMAE",
        浅草: "ASAKUSA",
        田原町: "TAWARAMACHI",
        稲荷町: "INARICHO",
        上野: "UENO",
        入谷: "IRIYA",
        三ノ輪: "MINOWA",
        南千住: "MINAMI-SENJU",
        錦糸町: "KINSHICHO",
        両国: "RYOGOKU",
        水天宮前: "SUITENGUMAE",
        清澄白河: "KIYOSUMI-SHIRAKAWA",
        菊川: "KIKUKAWA",
        住吉: "SUMIYOSHI",
        西大島: "NISHI-OJIMA",
        大島: "OJIMA",
        東大島: "HIGASHI-OJIMA",
        船堀: "FUNABORI",
        一之江: "ICHINOE",
        瑞江: "MIZUE",
        篠崎: "SHINOZAKI",
        本八幡: "MOTOYAWATA",
        門前仲町: "MONZEN-NAKACHO",
        木場: "KIBA",
        東陽町: "TOYOCHO",
        南砂町: "MINAMI-SUNAMACHI",
        西葛西: "NISHI-KASAI",
        葛西: "KASAI",
        浦安: "URAYASU",
        行徳: "GYOTOKU",
        妙典: "MYODEN",
        原木中山: "BARAKI-NAKAYAMA",
        西船橋: "NISHI-FUNABASHI",
        霞ケ関: "KASUMIGASEKI",
        永田町: "NAGATACHO",
        麴町: "KOJIMACHI",
        市ケ谷: "ICHIGAYA",
        九段下: "KUDANSHITA",
        竹橋: "TAKEBASHI",
        四ツ谷: "YOTSUYA",
        茅場町: "KAYABACHO",
        六本木: "ROPPONGI",
        広尾: "HIRO-O",
        恵比寿: "EBISU",
        中目黒: "NAKA-MEGURO",
        目黒: "MEGURO",
        辰巳: "TATSUMI",
        新木場: "SHIN-KIBA",
        荻窪: "OGIKUBO",
        南阿佐ヶ谷: "MINAMI-ASAGAYA",
        中野: "NAKANO",
        落合: "OCHIAI",
        東中野: "HIGASHI-NAKANO",
        中井: "NAKAI",
        落合南長崎: "OCHIAI-MINAMI-NAGASAKI",
        新江古田: "SHIN-EGOTA",
        練馬: "NERIMA",
        豊島園: "TOSHIMAEN",
        練馬春日町: "NERIMA-KASUGACHO",
        光が丘: "HIKARIGAOKA",
        新高円寺: "SHIN-KOENJI",
        西新宿: "NISHI-SHINJUKU",
        新宿西口: "SHINJUKU-NISHIGUCHI",
        新宿: "SHINJUKU",
        西新宿五丁目: "NISHI-SHINJUKU-GOCHOME",
        都庁前: "TOCHOMAE",
        代々木: "YOYOGI",
        国立競技場: "KOKURITSU-KYOGIJO",
        青山一丁目: "AOYAMA-ITCHOME",
        北参道: "KITA-SANDO",
        代々木公園: "YOYOGI-KOEN",
        渋谷: "SHIBUYA",
        表参道: "OMOTE-SANDO",
        外苑前: "GAIEMMAE",
        乃木坂: "NOGIZAKA",
        赤坂: "AKASAKA",
        赤坂見附: "AKASAKA-MITSUKE",
        代々木上原: "YOYOGI-UEHARA",
        "明治神宮前〈原宿〉": "MEIJI-JINGUMAE",
        新宿三丁目: "SHINJUKU-SANCHOME",
        新宿御苑前: "SHINJUKU-GYOEMMAE",
        曙橋: "AKEBONOBASHI",
        牛込神楽坂: "USHIGOME-KAGURAZAKA",
        牛込柳町: "USHIGOME-YANAGICHO",
        若松河田: "WAKAMATSU-KAWADA",
        四谷三丁目: "YOTSUYA-SANCHOME",
        西早稲田: "NISHI-WASEDA",
        雑司が谷: "ZOSHIGAYA",
        池袋: "IKEBUKURO",
        要町: "KANAMECHO",
        千川: "SENKAWA",
        小竹向原: "KOTAKE-MUKAIHARA",
        氷川台: "HIKAWADAI",
        平和台: "HEIWADAI",
        東新宿: "HIGASHI-SHINJUKU",
        地下鉄成増: "CHIKATETSU-NARIMASU",
        和光市: "WAKOSHI",
        東高円寺: "HIGASHI-KOENJI",
        中野新橋: "NAKANO-SHIMBASHI",
        中野富士見町: "NAKANO-FUJIMICHO",
        方南町: "HONANCHO",
        新中野: "SHIN-NAKANO",
        中野坂上: "NAKANO-SAKAUE",
        早稲田: "WASEDA",
        神楽坂: "KAGURAZAKA",
        東池袋: "HIGASHI-IKEBUKURO",
        新大塚: "SHIN-OTSUKA",
        茗荷谷: "MYOGADANI",
        後楽園: "KORAKUEN",
        本郷三丁目: "HONGO-SANCHOME",
        御茶ノ水: "OCHANOMIZU",
        新御茶ノ水: "SHIN-OCHANOMIZU",
        淡路町: "AWAJICHO",
        小川町: "OGAWAMACHI",
        湯島: "YUSHIMA",
        根津: "NEZU",
        千駄木: "SENDAGI",
        西日暮里: "NISHI-NIPPORI",
        町屋: "MACHIYA",
        北千住: "KITA-SENJU",
        綾瀬: "AYASE",
        北綾瀬: "KITA-AYASE",
        東大前: "TODAIMAE",
        本駒込: "HON-KOMAGOME",
        駒込: "KOMAGOME",
        西ケ原: "NISHIGAHARA",
        王子: "OJI",
        王子神谷: "OJI-KAMIYA",
        志茂: "SHIMO",
        赤羽岩淵: "AKABANE-IWABUCHI",
        大門: "DAIMON",
        汐留: "SHIODOME",
        豊洲: "TOYOSU",
        築地市場: "TSUKIJISHIJO",
        勝どき: "KACHIDOKI",
        地下鉄赤塚: "CHIKATETSU-AKATSUKA",
        白金台: "SHIROKANEDAI",
        白金高輪: "SHIROKANE-TAKANAWA",
        麻布十番: "AZABU-JUBAN",
        南行徳: "MINAMI-GYOTOKU",
        本所吾妻橋: "HONJO-AZUMABASHI",
        "押上〈スカイツリー前〉": "OSHIAGE",
        新御徒町: "SHIN-OKACHIMACHI",
        浜町: "HAMACHO",
        森下: "MORISHITA",
        小伝馬町: "KODEMMACHO",
        上野御徒町: "UENO-OKACHIMACHI",
        宝町: "TAKARACHO",
        六本木一丁目: "ROPPONGI-ITCHOME",
        溜池山王: "TAMEIKE-SANNO",
        国会議事堂前: "KOKKAI-GIJIDOMAE",
        半蔵門: "HANZOMON",
        桜田門: "SAKURADAMON",
        飯田橋: "IIDABASHI",
        江戸川橋: "EDOGAWABASHI",
        護国寺: "GOKOKUJI",
        高田馬場: "TAKADANOBABA",
        外苑前: "GAIEMMAE",
    };
    return map[name] || name.replace(/[〈〉]/g, "").toUpperCase();
}

// ---- 5. Build config ----

function buildConfig() {
    const routes = extractRoutes();
    const stationBoxes = extractStationBoxes();
    const stationTexts = extractStationTexts();

    console.log(`Found ${routes.length} routes`);
    console.log(`Found ${Object.keys(stationBoxes).length} station boxes`);
    console.log(`Found ${Object.keys(stationTexts).length} station texts`);

    // Build stations array
    const stations = [];
    const allNames = new Set([...Object.keys(stationBoxes), ...Object.keys(stationTexts)]);

    // Process station names that have both box and text
    for (const name of allNames) {
        const box = stationBoxes[name];
        const text = stationTexts[name];

        if (!box) {
            console.warn(`No box found for station: ${name}`);
            continue;
        }

        const code = "METRO_V1_" + toRomanji(name);

        const station = {
            name: name,
            code: code,
            box: {
                x: String(box.x),
                y: String(box.y),
                width: "100",
                height: "100",
            },
        };

        if (text) {
            station.text = {
                x: text.x,
                y: text.y,
                fontSize: text.fontSize,
                fontWeight: "normal",
                fill: "rgba(0, 0, 0, 1)",
                stroke: "rgba(255, 255, 255, 1)",
                transform: text.transform,
            };
        } else {
            // Default text position: above the box
            station.text = {
                x: String(box.x),
                y: String(box.y - 10),
                fontSize: "36px",
                fontWeight: "normal",
                fill: "rgba(0, 0, 0, 1)",
                stroke: "rgba(255, 255, 255, 1)",
            };
            console.warn(`No text found for station: ${name}, using default position`);
        }

        stations.push(station);
    }

    // Convert route stroke colors to rgba format
    for (const route of routes) {
        for (const pathData of route.paths) {
            // Convert rgb(r,g,b) to rgba(r,g,b,1) if needed
            const rgbMatch = pathData.stroke.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                pathData.stroke = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 1)`;
            }
        }
    }

    const config = {
        svgOverall: {
            viewBox: "0 0 7000 4950",
            transform: "translate(0, 0)",
        },
        stationBoxStyle: {
            stroke: "rgb(0, 0, 0)",
            fill: "rgb(255, 255, 255)",
            strokeWidth: "4",
            strokeLineJoin: "round",
        },
        routes: routes,
        stations: stations,
    };

    return config;
}

const config = buildConfig();
fs.writeFileSync(outputPath, JSON.stringify(config, null, 4), "utf-8");
console.log(`\nConfig written to: ${outputPath}`);
console.log(`Total stations: ${config.stations.length}`);
console.log(`Total routes: ${config.routes.length}`);
