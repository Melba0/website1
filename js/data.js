/* =========================================================
   data.js · 一枝桂赏月宴 · 全部内容与搭配规则
   菜单固定，菜名意象不变；变的是配方、替换、咸淡。
   ========================================================= */

/* ---------------- 一 · 天时：天气 ---------------- */
export const WEATHERS = [
  {
    id: 'sunny', name: '晴', label: '一轮无碍', glyph: '晴',
    idea: '天无片云，月色如洗，杯盘都鍍了一层银边',
    sky: ['#050912', '#0b1426', '#16253f'],
    cloud: 0.06, rain: 0, snow: 0, wind: 0.25, cold: 0.15, moonOp: 1,
    sense: '天净无尘，远处江水的一点腥甜也闻得见',
    poem: '今夜月明人尽望，不知秋思落谁家。',
    teaBias: 'cold-ok', color: '#f4e6b0'
  },
  {
    id: 'cloudy', name: '薄云', label: '云走月走', glyph: '云',
    idea: '薄云自月上走过，光一忽儿明一忽儿暗，最宜慢饮',
    sky: ['#070c18', '#101c31', '#1d3050'],
    cloud: 0.42, rain: 0, snow: 0, wind: 0.5, cold: 0.22, moonOp: 0.86,
    sense: '云薄风轻，桂花的甜是一阵一阵的',
    poem: '云散月明谁点缀，天容海色本澄清。',
    teaBias: 'any', color: '#e6d7a8'
  },
  {
    id: 'veiled', name: '云遮月', label: '月藏云后', glyph: '阴',
    idea: '月被云裹住，只漏一圈毛边的光，灯要拨亮些',
    sky: ['#060a14', '#0d1628', '#1a2844'],
    cloud: 0.8, rain: 0, snow: 0, wind: 0.6, cold: 0.35, moonOp: 0.5,
    sense: '云压得低，灯下影子也发软',
    poem: '天街夜色凉如水，卧看牵牛织女星。',
    teaBias: 'warm', color: '#cdbf9c'
  },
  {
    id: 'rain', name: '微雨', label: '细雨湿桂', glyph: '雨',
    idea: '雨丝斜斜，瓦上起一层水光，桂香被雨按在阶前',
    sky: ['#050c15', '#0b1725', '#14263a'],
    cloud: 0.66, rain: 1, snow: 0, wind: 0.62, cold: 0.4, moonOp: 0.32,
    sense: '雨脚细密，灯晕发软，桂花被打落一层',
    poem: '空山新雨后，天气晚来秋。',
    teaBias: 'warm', color: '#bcd0d8'
  },
  {
    id: 'wind', name: '桂风', label: '风起桂香', glyph: '风',
    idea: '风斜桂走，金屑漫天，落在肩上、盏里、盘边',
    sky: ['#060c1a', '#0e1a30', '#192c4a'],
    cloud: 0.24, rain: 0, snow: 0, wind: 1, cold: 0.3, moonOp: 0.92,
    sense: '风穿廊过堂，桂香一层一层地涌上来',
    poem: '桂子月中落，天香云外飘。',
    teaBias: 'any', color: '#f0cf8c'
  },
  {
    id: 'frost', name: '霜降', label: '冷露凝霜', glyph: '霜',
    idea: '阶上结白，窗棂起毛，热酒热茶当家',
    sky: ['#040a14', '#0b1a2c', '#153048'],
    cloud: 0.2, rain: 0, snow: 1, wind: 0.4, cold: 1, moonOp: 0.88,
    sense: '冷得干净，呵气成白，桂香反倒更利',
    poem: '银烛秋光冷画屏，轻罗小扇扑流萤。',
    teaBias: 'hot', color: '#cfe2f2'
  }
];
export const weatherById = id => WEATHERS.find(w => w.id === id) || WEATHERS[0];

/* ---------------- 二 · 天时：时刻 ---------------- */
export const TIMES = [
  {
    id: 'geng1', name: '初更', moonLabel: '月在东',
    moon: { x: 0.15, y: 0.32, r: 36 },
    sky: ['#0a1424', '#12203a', '#1e3654'], starOp: 0.5, lantern: 0.5, chill: 0.2,
    sense: '天刚擦黑，灯笼才点上，桂影还淡',
    poem: '月上柳梢头，人约黄昏后。', moonWord: '东'
  },
  {
    id: 'midnight', name: '夜半', moonLabel: '月在中天',
    moon: { x: 0.56, y: 0.26, r: 50 },
    sky: ['#060c19', '#0e1a2e', '#1b2f4e'], starOp: 1, lantern: 1, chill: 0.5,
    sense: '月到中天，桂影最浓，酒也最暖',
    poem: '今夜月明人尽望，不知秋思落谁家。', moonWord: '中'
  },
  {
    id: 'slant', name: '月斜', moonLabel: '月偏西',
    moon: { x: 0.76, y: 0.34, r: 38 },
    sky: ['#07101f', '#101d33', '#20375a'], starOp: 0.8, lantern: 0.8, chill: 0.6,
    sense: '月斜西去，江面波光被拉得又长又斜',
    poem: '江天一色无纤尘，皎皎空中孤月轮。', moonWord: '西'
  },
  {
    id: 'dawn', name: '将晓', moonLabel: '月西沉',
    moon: { x: 0.88, y: 0.56, r: 26 },
    sky: ['#0a1424', '#16283f', '#2c4a68'], starOp: 0.24, lantern: 0.45, chill: 0.95,
    sense: '天将破晓，天色微蓝，霜气浮在石阶上',
    poem: '鸡声茅店月，人迹板桥霜。', moonWord: '沉'
  },
  {
    id: 'zenith', name: '满月当空', moonLabel: '月正中',
    moon: { x: 0.40, y: 0.27, r: 66 },
    sky: ['#050a16', '#0b1730', '#182c4c'], starOp: 0.9, lantern: 1, chill: 0.45,
    sense: '月大得惊人，银白铺了一地，走路像踩在水上',
    poem: '海上生明月，天涯共此时。', moonWord: '正'
  }
];
export const timeById = id => TIMES.find(t => t.id === id) || TIMES[1];

/* ---------------- 三 · 六个包间 ---------------- */
export const ROOMS = [
  {
    id: 'guiying', name: '桂影阁', ordinal: '其一',
    couplet: '桂子月中落，天香云外飘',
    idea: '江南庭院，木格窗，老桂树，月光洒在青瓷竹编上，桂花飘落',
    sense: { scent: '桂花的甜，混着新劈的竹木气', sound: '窗外风过桂叶，沙沙地响，偶尔一朵花落在瓦上' },
    palette: ['#22301f', '#2f4227', '#1a2418'],
    accent: '#5f8a52', warm: false,
    glow: 'radial-gradient(60% 60% at 50% 60%, rgba(214,196,140,.55), rgba(16,24,16,.92))',
    aura: 'radial-gradient(circle, rgba(160,200,130,.22), transparent 68%)',
    plating: '青瓷、竹编、木盘',
    platingSet: ['青瓷浅盘', '竹编垫盘', '老木托盘'],
    utensils: '竹筷、青瓷勺',
    teaPool: ['桂花乌龙', '凤凰单丛', '冷泡龙井'],
    sidePool: ['桂花糖藕', '糖炒栗子', '糟毛豆', '陈皮梅'],
    poets: ['王维', '李清照'],
    poemPool: [
      ['桂子月中落，天香云外飘。', '宋之问《灵隐寺》'],
      ['人闲桂花落，夜静春山空。', '王维《鸟鸣涧》'],
      ['暗淡轻黄体性柔，情疏迹远只香留。', '李清照《鹧鸪天·桂花》'],
      ['何须浅碧深红色，自是花中第一流。', '李清照《鹧鸪天·桂花》'],
      ['中庭地白树栖鸦，冷露无声湿桂花。', '王建《十五夜望月》'],
      ['桂魄初生秋露微，轻罗已薄未更衣。', '王维《秋夜曲》']
    ],
    deco: 'gui'
  },
  {
    id: 'wangyue', name: '望月台', ordinal: '其二',
    couplet: '举杯邀明月，对影成三人',
    idea: '高台露台，无遮挡，满月巨大，白瓷玉盘银器，远处城郭',
    sense: { scent: '高处风冷，酒香被吹得很散', sound: '远远的城郭更鼓，一声一声落在露台上' },
    palette: ['#20293a', '#2e3c52', '#151d2b'],
    accent: '#93a9c4', warm: false,
    glow: 'radial-gradient(60% 60% at 50% 55%, rgba(210,226,248,.6), rgba(14,20,32,.94))',
    aura: 'radial-gradient(circle, rgba(190,215,245,.24), transparent 68%)',
    plating: '白瓷、玉盘、银器',
    platingSet: ['白瓷高足盘', '白玉拼盘', '银线攒盘'],
    utensils: '银箸、白瓷杯',
    teaPool: ['铁观音', '桂花酒', '凤凰单丛'],
    sidePool: ['醋泡花生', '糟毛豆', '酱萝卜', '陈皮花生'],
    poets: ['李白', '张九龄'],
    poemPool: [
      ['举杯邀明月，对影成三人。', '李白《月下独酌》'],
      ['海上生明月，天涯共此时。', '张九龄《望月怀远》'],
      ['明月出天山，苍茫云海间。', '李白《关山月》'],
      ['小时不识月，呼作白玉盘。', '李白《古朗月行》'],
      ['露从今夜白，月是故乡明。', '杜甫《月夜忆舍弟》'],
      ['灭烛怜光满，披衣觉露滋。', '张九龄《望月怀远》']
    ],
    deco: 'terrace'
  },
  {
    id: 'jiangyue', name: '江月榭', ordinal: '其三',
    couplet: '春江潮水连海平，海上明月共潮生',
    idea: '临江水榭，窗外江水，波光灯影，青白瓷水波纹盘，银箸',
    sense: { scent: '水汽里带一点青苔和湿木头的味', sound: '水声拍着榭柱，橹声偶尔由远及近' },
    palette: ['#182736', '#23384c', '#101a26'],
    accent: '#6f9bb8', warm: false,
    glow: 'radial-gradient(60% 60% at 50% 62%, rgba(170,206,228,.5), rgba(10,16,24,.94))',
    aura: 'radial-gradient(circle, rgba(150,200,235,.22), transparent 68%)',
    plating: '青白瓷、水波纹盘',
    platingSet: ['青白瓷水波纹盘', '影青平底盘', '白瓷莲瓣碟'],
    utensils: '银箸、影青盏',
    teaPool: ['冷泡龙井', '陈皮普洱', '黄酒', '柚子茶'],
    sidePool: ['糟毛豆', '酱萝卜', '醋泡花生', '陈皮梅'],
    poets: ['张若虚', '张九龄'],
    poemPool: [
      ['春江潮水连海平，海上明月共潮生。', '张若虚《春江花月夜》'],
      ['江天一色无纤尘，皎皎空中孤月轮。', '张若虚《春江花月夜》'],
      ['江畔何人初见月？江月何年初照人？', '张若虚《春江花月夜》'],
      ['星垂平野阔，月涌大江流。', '杜甫《旅夜书怀》'],
      ['野旷天低树，江清月近人。', '孟浩然《宿建德江》'],
      ['明月松间照，清泉石上流。', '王维《山居秋暝》']
    ],
    deco: 'river'
  },
  {
    id: 'shuangtian', name: '霜天阁', ordinal: '其四',
    couplet: '银烛秋光冷画屏，轻罗小扇扑流萤',
    idea: '高处清寒，霜色窗棂，冷蓝月光，冰裂白瓷，石盘，风铃',
    sense: { scent: '冷空气里一丝陈皮的苦香', sound: '檐角风铃，三五声，冷而脆' },
    palette: ['#1b2433', '#28384c', '#121a24'],
    accent: '#9fc0d8', warm: false,
    glow: 'radial-gradient(60% 60% at 50% 58%, rgba(200,224,246,.52), rgba(12,18,26,.95))',
    aura: 'radial-gradient(circle, rgba(200,225,250,.22), transparent 68%)',
    plating: '冰裂白瓷、石盘',
    platingSet: ['冰裂白瓷盘', '青石圆盘', '白瓷梅瓶碟'],
    utensils: '乌木筷、白瓷小盏',
    teaPool: ['陈皮普洱', '老白茶', '姜茶', '桂花乌龙'],
    sidePool: ['陈皮梅', '糖炒栗子', '酱萝卜', '醋泡花生'],
    poets: ['杜牧', '王建'],
    poemPool: [
      ['银烛秋光冷画屏，轻罗小扇扑流萤。', '杜牧《秋夕》'],
      ['中庭地白树栖鸦，冷露无声湿桂花。', '王建《十五夜望月》'],
      ['今夜月明人尽望，不知秋思落谁家。', '王建《十五夜望月》'],
      ['天阶夜色凉如水，卧看牵牛织女星。', '杜牧《秋夕》'],
      ['鸡声茅店月，人迹板桥霜。', '温庭筠《商山早行》'],
      ['暮云收尽溢清寒，银汉无声转玉盘。', '苏轼《阳关曲·中秋月》']
    ],
    deco: 'frost'
  },
  {
    id: 'lingnan', name: '岭南轩', ordinal: '其五',
    couplet: '但愿人长久，千里共婵娟',
    idea: '岭南庭院，芭蕉、柚子、陈皮，广彩瓷器，铜盘，藤编，暖黄灯',
    sense: { scent: '柚子皮、陈皮、晒过的芭蕉叶，暖而甜', sound: '院里蟋蟀不停，远处有人低声说话' },
    palette: ['#2a2114', '#3d2f1a', '#1d1710'],
    accent: '#c99a45', warm: true,
    glow: 'radial-gradient(60% 60% at 50% 62%, rgba(255,206,130,.6), rgba(26,18,10,.94))',
    aura: 'radial-gradient(circle, rgba(255,196,110,.24), transparent 68%)',
    plating: '广彩、铜盘、藤编',
    platingSet: ['广彩花鸟盘', '黄铜暖盘', '藤编垫盘'],
    utensils: '红木筷、铜匙',
    teaPool: ['陈皮普洱', '柚子茶', '老白茶', '黄酒'],
    sidePool: ['陈皮花生', '柚子皮蜜饯', '酱萝卜', '糖炒栗子'],
    poets: ['苏轼'],
    poemPool: [
      ['但愿人长久，千里共婵娟。', '苏轼《水调歌头》'],
      ['暮云收尽溢清寒，银汉无声转玉盘。', '苏轼《阳关曲·中秋月》'],
      ['此生此夜不长好，明月明年何处看。', '苏轼《阳关曲·中秋月》'],
      ['人有悲欢离合，月有阴晴圆缺。', '苏轼《水调歌头》'],
      ['明月几时有？把酒问青天。', '苏轼《水调歌头》'],
      ['一年好景君须记，最是橙黄橘绿时。', '苏轼《赠刘景文》']
    ],
    deco: 'lingnan'
  },
  {
    id: 'jinghua', name: '京华厅', ordinal: '其六',
    couplet: '海上生明月，天涯共此时',
    idea: '京味华贵，红木，珐琅，铜锅，漆盘，宫灯，窗外宫墙月',
    sense: { scent: '茉莉花茶的清、铜锅的暖、老红木的沉', sound: '宫灯下有人在票戏，一句西皮流水' },
    palette: ['#2c1a1a', '#422424', '#1e1111'],
    accent: '#b8874a', warm: true,
    glow: 'radial-gradient(60% 60% at 50% 58%, rgba(255,196,120,.55), rgba(30,16,12,.95))',
    aura: 'radial-gradient(circle, rgba(255,180,110,.22), transparent 68%)',
    plating: '珐琅、铜锅、漆盘',
    platingSet: ['景泰蓝珐琅盘', '紫铜暖锅', '朱漆描金盘'],
    utensils: '象牙筷、铜匙',
    teaPool: ['茉莉花茶', '黄酒', '老白茶', '铁观音'],
    sidePool: ['酱萝卜', '醋泡花生', '陈皮花生', '糟毛豆'],
    poets: ['张九龄', '李白'],
    poemPool: [
      ['海上生明月，天涯共此时。', '张九龄《望月怀远》'],
      ['今夜月明人尽望，不知秋思落谁家。', '王建《十五夜望月》'],
      ['举头望明月，低头思故乡。', '李白《静夜思》'],
      ['长安一片月，万户捣衣声。', '李白《子夜吴歌》'],
      ['但愿人长久，千里共婵娟。', '苏轼《水调歌头》'],
      ['灭烛怜光满，披衣觉露滋。', '张九龄《望月怀远》']
    ],
    deco: 'palace'
  }
];
export const roomById = id => ROOMS.find(r => r.id === id) || ROOMS[0];

/* ---------------- 四 · 六道菜（菜单固定）---------------- */
/* light 清淡度 0-10；meat 荤度；sweet 甜度；warm 温热；heavy 厚重 */
export const DISHES = [
  {
    id: 'shrimp', name: '金柚醋拌鲜虾沙拉', accent: '#e8a34c',
    idea: '金柚剥成小瓣，鲜虾断生即起，醋汁里兑一点蜜，酸甜先行开胃',
    texture: '冷碟 · 脆爽带汁',
    light: 10, meat: 2, sweet: 4, warm: 0, heavy: 1,
    base: ['鲜虾 8 只，断生后冰镇', '金柚肉 6 瓣，去筋', '米醋 2 勺、蜂蜜 1 勺', '紫苏丝、熟芝麻少许'],
    tune: {
      light: ['醋汁减盐三分，柚子汁略多', '蜂蜜减半，只留一点果香'],
      standard: [],
      strong: ['添一勺鱼露提鲜，撒炸葱头'],
      sweet: ['蜂蜜加至 1 勺半，添冰糖渍柚皮丝'],
      sour: ['米醋加半勺，兑青柠汁'],
      spicy: ['拌入小米辣碎与花椒油'],
      lessalt: ['不放盐，用柚汁与醋提味'],
      lessoil: ['不加香油，只用果酸']
    },
    swaps: [
      { for: '虾', to: '鲜贝柱或烤麸', note: '忌虾者换鲜贝柱；纯素者换烤麸，先卤后拌' },
      { for: '坚果', to: '瓜子仁或熟芝麻', note: '忌坚果者去花生碎，改瓜子仁' },
      { for: '麸质', to: '米醋、无麸酱油', note: '忌麸质者换米醋与无麸酱油' }
    ]
  },
  {
    id: 'asparagus', name: '玉盘百合清炒芦笋', accent: '#8fbf6a',
    idea: '芦笋削去老根，鲜百合掰瓣，猛火三铲起锅，碧色不改',
    texture: '热菜 · 清鲜爽脆',
    light: 9, meat: 0, sweet: 2, warm: 1, heavy: 1,
    base: ['嫩芦笋 300 克，斜切', '鲜百合 1 头，掰瓣洗净', '蒜片、盐少许', '山茶油 1 勺'],
    tune: {
      light: ['少油少盐，蒜香轻', '起锅前点几滴冷压麻油'],
      standard: [],
      strong: ['添干贝丝同炒，用高汤打芡'],
      sweet: ['配几粒枸杞与蜜渍百合'],
      sour: ['起锅烹半勺香醋'],
      spicy: ['加小米辣与蒜片同爆'],
      lessalt: ['只用高汤与百合自身的甜'],
      lessoil: ['改用水炒法，一滴油润锅']
    },
    swaps: [
      { for: '麸质', to: '不用酱油，只用盐', note: '忌麸质者不上酱油' },
      { for: '坚果', to: '去腰果碎', note: '忌坚果者不加腰果' }
    ]
  },
  {
    id: 'crab', name: '秋夜椰香咖喱芋蟹', accent: '#e0a33a',
    idea: '芋头炖到起沙，蟹壳里的黄化进椰浆咖喱，辛香里带一点甜',
    texture: '热菜 · 浓香带汁',
    light: 4, meat: 8, sweet: 5, warm: 3, heavy: 7,
    base: ['鲜蟹 2 只，拆件拍粉', '荔浦芋头 300 克，切滚刀', '椰浆 200 毫升、咖喱粉 1 勺', '香茅、南姜、柠檬叶'],
    tune: {
      light: ['椰奶多、咖喱少，芋头先蒸后入', '撤去辣油，只用香茅南姜提香'],
      standard: [],
      strong: ['咖喱加倍，添一勺虾膏与椰糖'],
      sweet: ['添椰糖与南瓜泥，咖喱转柔'],
      sour: ['起锅挤青柠，添罗望子汁'],
      spicy: ['加小米辣与辣椒油，咖喱里再下花椒'],
      lessalt: ['用鱼露代盐，量减半'],
      lessoil: ['椰浆改低脂椰奶，撇去浮油']
    },
    swaps: [
      { for: '蟹', to: '软壳蟹或嫩豆腐', note: '忌蟹者换软壳蟹（仍属蟹类则改用嫩豆腐）' },
      { for: '虾', to: '不用虾膏', note: '忌虾者以干贝丝代虾膏' },
      { for: '乳制品', to: '椰浆为主', note: '忌乳制品者全用椰浆，不加淡奶' },
      { for: '麸质', to: '蟹件改米粉拍粉', note: '忌麸质者用米粉代替面粉' }
    ]
  },
  {
    id: 'chicken', name: '枫红香菇板栗烧鸡', accent: '#b8703a',
    idea: '板栗先炒后烧，香菇吸足鸡汁，收出一层红亮的胶',
    texture: '热菜 · 咸鲜回甜',
    light: 5, meat: 9, sweet: 5, warm: 4, heavy: 6,
    base: ['走地鸡 半只，斩块', '板栗 200 克、干香菇 8 朵', '生抽 2 勺、冰糖 1 小块', '姜片、桂皮一小段'],
    tune: {
      light: ['少酱少糖，板栗多，汁收到薄薄一层', '撇净浮油，改用清鸡汤'],
      standard: [],
      strong: ['添老抽上色，加一勺蚝油收浓'],
      sweet: ['冰糖加倍，添红枣与桂圆'],
      sour: ['起锅烹陈醋半勺'],
      spicy: ['加干辣椒与花椒，改麻辣口'],
      lessalt: ['生抽减半，用干香菇水提鲜'],
      lessoil: ['去皮去油，改汽锅慢蒸']
    },
    swaps: [
      { for: '鸡', to: '杏鲍菇或鲜牛肝菌', note: '忌鸡者换杏鲍菇，先煸出焦边' },
      { for: '坚果', to: '板栗本身非坚果，可安心', note: '板栗属坚果类，忌坚果者改芋头块' },
      { for: '麸质', to: '换无麸酱油、不加蚝油', note: '忌麸质者以盐与香菇水调味' }
    ]
  },
  {
    id: 'duck', name: '月满桂香酥皮嫩鸭', accent: '#c9814a',
    idea: '鸭皮烘到起酥，桂花蜜刷一层，片开时先闻香再落筷',
    texture: '热菜 · 酥香丰腴',
    light: 3, meat: 10, sweet: 6, warm: 4, heavy: 8,
    base: ['嫩鸭 1 只，先卤后烘', '桂花蜜 2 勺、麦芽糖 1 勺', '花椒盐、五香粉少许', '荷叶饼、葱丝、甜面酱'],
    tune: {
      light: ['少盐少糖，桂香加重，皮下的油片去一层', '荷叶饼改薄饼，减半'],
      standard: [],
      strong: ['卤水里加重香料，桂花蜜厚刷两遍'],
      sweet: ['桂花蜜加倍，配糖渍金桔'],
      sour: ['配一碟山楂梅酱'],
      spicy: ['椒盐里加辣椒面与花椒粉'],
      lessalt: ['卤水减盐，靠桂花与果木香'],
      lessoil: ['改挂炉烘，不用油淋']
    },
    swaps: [
      { for: '鸭', to: '素鸭（豆腐衣卷）', note: '忌鸭者换素鸭，同样卤后烘，刷桂花蜜' },
      { for: '麸质', to: '荷叶饼改米粉薄饼', note: '忌麸质者甜面酱换无麸酱' },
      { for: '坚果', to: '去花生碎', note: '忌坚果者不加碎花生' }
    ]
  },
  {
    id: 'mooncake', name: '霜天团圆冰皮月饼', accent: '#d9c7e0',
    idea: '冰皮凉透，陈皮与豆沙各占一半，切开正合六人分',
    texture: '甜点 · 凉润细腻',
    light: 8, meat: 0, sweet: 9, warm: 0, heavy: 3,
    base: ['冰皮粉 100 克、椰浆 120 毫升', '红豆沙 150 克、陈皮末 1 勺', '咸蛋黄（可选）', '熟糯米粉防粘'],
    tune: {
      light: ['减糖，陈皮多，冰皮做薄', '去咸蛋黄，改桂花糖渍栗子馅'],
      standard: [],
      strong: ['加咸蛋黄与玫瑰酱，味更厚'],
      sweet: ['豆沙里添冰糖与蜜枣'],
      sour: ['添梅子酱与山楂馅'],
      spicy: ['皮里揉一点姜汁，暖口'],
      lessalt: ['不放盐，不加咸蛋黄'],
      lessoil: ['不加黄油，全用椰浆']
    },
    swaps: [
      { for: '乳制品', to: '椰浆冰皮', note: '忌乳制品者不添牛奶黄油，全用椰浆' },
      { for: '坚果', to: '去瓜子仁', note: '忌坚果者不撒碎坚果' },
      { for: '麸质', to: '冰皮用糯米粉与粘米粉', note: '忌麸质者不用小麦淀粉' },
      { for: '蛋', to: '去咸蛋黄', note: '忌蛋者纯豆沙馅' }
    ]
  }
];
export const dishById = id => DISHES.find(d => d.id === id) || DISHES[0];

/* ---------------- 五 · 口味 ---------------- */
export const FLAVORS = [
  { id: 'light',   name: '清淡', short: '少油少盐，留本味' },
  { id: 'standard',name: '标准', short: '照本店本色来做' },
  { id: 'strong',  name: '浓香', short: '火候足、汁收浓' },
  { id: 'sweet',   name: '偏甜', short: '甜味上提，柔和些' },
  { id: 'sour',    name: '偏酸', short: '酸口开胃，解腻' },
  { id: 'spicy',   name: '偏辣', short: '辛香打头，下酒好' },
  { id: 'lessalt', name: '少盐', short: '盐减半，用鲜味顶' },
  { id: 'lessoil', name: '少油', short: '撇油，改蒸与炖' }
];
export const flavorById = id => FLAVORS.find(f => f.id === id) || FLAVORS[1];

/* ---------------- 六 · 忌口 ---------------- */
export const ALLERGENS = [
  { id: 'shrimp',   name: '虾' },
  { id: 'crab',     name: '蟹' },
  { id: 'duck',     name: '鸭' },
  { id: 'chicken',  name: '鸡' },
  { id: 'nuts',     name: '坚果' },
  { id: 'dairy',    name: '乳制品' },
  { id: 'gluten',   name: '麸质' },
  { id: 'alcohol',  name: '酒精' },
  { id: 'chenpi',   name: '陈皮' }
];
export const allergenName = id => (ALLERGENS.find(a => a.id === id) || {}).name || id;

/* ---------------- 七 · 心愿（决定诗与宴名）---------------- */
export const MOODS = [
  { id: 'think',    name: '思念', feast: '清思宴', tail: '不知秋思落谁家', guestWord: '远方客' },
  { id: 'reunion',  name: '团圆', feast: '团圆宴', tail: '千里共婵娟',     guestWord: '归家客' },
  { id: 'leisure',  name: '闲适', feast: '闲月宴', tail: '夜静春山空',     guestWord: '闲散客' },
  { id: 'joy',      name: '欢宴', feast: '欢宴图', tail: '对影成三人',     guestWord: '豪饮客' },
  { id: 'cold',     name: '清冷', feast: '清寒宴', tail: '冷露无声湿桂花', guestWord: '独坐客' },
  { id: 'warm',     name: '温厚', feast: '温月宴', tail: '天涯共此时',     guestWord: '老友客' }
];
export const moodById = id => MOODS.find(m => m.id === id) || MOODS[1];

/* 心愿 × 诗：优先在此池中先抽 */
export const MOOD_POEMS = {
  think:   [['今夜月明人尽望，不知秋思落谁家。', '王建《十五夜望月》'], ['举头望明月，低头思故乡。', '李白《静夜思》'], ['露从今夜白，月是故乡明。', '杜甫《月夜忆舍弟》']],
  reunion: [['但愿人长久，千里共婵娟。', '苏轼《水调歌头》'], ['海上生明月，天涯共此时。', '张九龄《望月怀远》'], ['此生此夜不长好，明月明年何处看。', '苏轼《阳关曲·中秋月》']],
  leisure: [['人闲桂花落，夜静春山空。', '王维《鸟鸣涧》'], ['明月松间照，清泉石上流。', '王维《山居秋暝》'], ['野旷天低树，江清月近人。', '孟浩然《宿建德江》']],
  joy:     [['举杯邀明月，对影成三人。', '李白《月下独酌》'], ['明月出天山，苍茫云海间。', '李白《关山月》'], ['明月几时有？把酒问青天。', '苏轼《水调歌头》']],
  cold:    [['银烛秋光冷画屏，轻罗小扇扑流萤。', '杜牧《秋夕》'], ['中庭地白树栖鸦，冷露无声湿桂花。', '王建《十五夜望月》'], ['鸡声茅店月，人迹板桥霜。', '温庭筠《商山早行》']],
  warm:    [['绿蚁新醅酒，红泥小火炉。', '白居易《问刘十九》'], ['莫笑农家腊酒浑，丰年留客足鸡豚。', '陆游《游山西村》'], ['开轩面场圃，把酒话桑麻。', '孟浩然《过故人庄》']]
};

/* 天气对诗句的偏好关键词 */
export const WEATHER_POEM_HINT = {
  sunny:  ['月明', '明月', '皎皎', '清寒', '玉盘', '银汉'],
  cloudy: ['云', '暮云', '云散', '苍茫'],
  veiled: ['夜', '星', '凉', '冷', '无声'],
  rain:   ['雨', '露', '湿', '清泉', '新雨'],
  wind:   ['桂', '天香', '风', '香留'],
  frost:  ['霜', '冷', '寒', '银烛', '白']
};

/* ---------------- 八 · 茶饮全表 ---------------- */
export const TEAS = {
  '桂花乌龙':  { hot: true,  note: '桂花窨的乌龙，香在鼻后' },
  '凤凰单丛':  { hot: true,  note: '蜜兰香，一泡比一泡稳' },
  '冷泡龙井':  { hot: false, note: '冷水泡足四小时，清得发甜' },
  '铁观音':    { hot: true,  note: '兰花香，回甘慢' },
  '桂花酒':    { hot: false, note: '温过的桂花酿，甜得短' },
  '陈皮普洱':  { hot: true,  note: '老陈皮压住熟普的堆味，饭后最妥' },
  '老白茶':    { hot: true,  note: '煮着喝，汤色如蜜' },
  '姜茶':      { hot: true,  note: '老姜红糖，冷天先暖手' },
  '黄酒':      { hot: true,  note: '加话梅与姜丝温到微烫' },
  '柚子茶':    { hot: true,  note: '蜜渍柚皮，配月饼正解甜' },
  '茉莉花茶':  { hot: true,  note: '七窨茉莉，香得干净' }
};
export const COLD_SUB = { '冷泡龙井': '温龙井', '桂花酒': '桂花热酿' };

/* ---------------- 九 · 上菜次序评分 ---------------- */
export const GUEST_PROFILES = [
  {
    id: 'poet', name: '诗人客',
    like: s => (s.balance * 0.6 + s.order * 0.4),
    words: {
      high: '诗人客说：清浓相济，一句一韵，这席有章法。',
      mid:  '诗人客说：起得清，收得甜，只是中段抢了半拍。',
      low:  '诗人客说：浓的压了清的，读来像一句断了的长调。'
    }
  },
  {
    id: 'gourmet', name: '老饕客',
    like: s => (s.rich * 0.55 + s.temp * 0.45),
    words: {
      high: '老饕客说：火候排得顺，一道压着一道。',
      mid:  '老饕客说：厚薄有致，只是收尾薄了些。',
      low:  '老饕客说：上来就浓，舌头到后面就钝了。'
    }
  },
  {
    id: 'child', name: '孩童客',
    like: s => (s.sweetCurve * 0.7 + s.balance * 0.3),
    words: {
      high: '孩童客说：甜的留在最后，我一直在等——等到了。',
      mid:  '孩童客说：甜的在中间，后面就有点苦了。',
      low:  '孩童客说：甜的第一道就吃完了，后面没有了。'
    }
  },
  {
    id: 'far', name: '远方客',
    like: s => (s.story * 0.65 + s.balance * 0.35),
    words: {
      high: '远方客说：从这一桌就看出，今夜是为团圆摆的。',
      mid:  '远方客说：菜都好，只是没吃出"要留人"的意思。',
      low:  '远方客说：这一桌像随手拼的，不像等谁回来。'
    }
  }
];

/* 先生定序：最稳的次序 */
export const CLASSIC_ORDER = ['shrimp', 'asparagus', 'crab', 'chicken', 'duck', 'mooncake'];

/* ---------------- 十 · 迎宾语（按天时）---------------- */
export const GREETINGS = {
  sunny:  ['天净月满，客官来得正好。', '今夜无云，露台的高凳留了最好的位子。'],
  cloudy: ['云薄，月色一忽儿亮一忽儿暗，正好慢饮。', '云走月也走，包间里看得最清。'],
  veiled: ['云把月裹住了，灯我给您拨亮些。', '月藏起来了，那便多喝一盏。'],
  rain:   ['雨丝细，阶上滑，客官往里走。', '雨打桂花，香都落在台阶上了。'],
  wind:   ['风起桂香，满院子都是甜的。', '这风好，把桂花都吹到廊下来了。'],
  frost:  ['霜下来了，我先把热酒温上。', '冷得干净，今夜宜热菜热茶。']
};
export const TIME_GREET = {
  geng1: '月色才上，慢慢吃，不急。',
  midnight: '月到中天，正是上菜的时候。',
  slant: '月偏西了，前面的菜要快些。',
  dawn: '天将晓，最后一盏茶我给您温着。',
  zenith: '满月当空，今夜一桌，就摆在这月光里。'
};

/* ---------------- 十一 · 小二推荐语 ---------------- */
export const WAITER_LINES = [
  '依着今夜的天时，我荐一间。',
  '客官若信我，这间最配今夜。',
  '方才路过，我替您相中了一间。',
  '天时地气都对得上，就这间罢。'
];
