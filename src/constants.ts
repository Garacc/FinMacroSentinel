/**
 * Shared constants for FinMacroSentinel
 * Contains keywords and configuration shared across modules
 */

import { NewsCategory, NewsTags, PrimaryTag, AssetTag, RegionTag, TimeTag } from './types';

/**
 * Category keywords for news classification
 * Used by both NewsCollector and KeywordAnalyzer
 */
export const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  [NewsCategory.MACRO_FINANCE]: [
    'cpi', 'ppi', 'gdp', 'fed', '美联储', '利率', '债券', '国债',
    '美元', '人民币', '汇率', '通胀', '非农', '就业', '央行', '货币政策',
    '量化宽松', 'qt', 'fomc', '议息', '收益率', '降息', '加息',
    'inflation', 'interest', 'rate', 'bond', 'treasury', 'dollar', 'yuan',
  ],
  [NewsCategory.INDUSTRY]: [
    '行业', '板块', 'etf', '新能源', '半导体', '芯片', 'ai', '人工智能',
    '汽车', '地产', '房地产', '银行', '保险', '券商', '医药', '消费',
    'nvidia', 'openai', 'amazon', 'tesla', 'robot', 'tech', 'semiconductor',
  ],
  [NewsCategory.GEOPOLITICS]: [
    '战争', '冲突', '制裁', '贸易战', '关税', 'g20', '峰会', '外交',
    '俄罗斯', '乌克兰', '中东', '朝鲜', '伊朗', '欧盟', '北约',
    'russia', 'ukraine', 'iran', 'china', 'usa', 'war', 'sanction',
  ],
};

/**
 * Asset keywords for mapping news to asset classes
 */
export const ASSET_KEYWORDS: Record<string, string[]> = {
  'bond': ['美债', '国债', '债券', 'bond', 'treasury', 'yield'],
  'stock': ['股票', '股市', '指数', 'stock', 'index', 'nasdaq', 'dow'],
  'gold': ['黄金', 'gold', '金价'],
  'oil': ['原油', '石油', '油价', 'oil', 'petroleum'],
  'currency': ['汇率', '美元', '人民币', '日元', 'currency', 'dollar', 'yen'],
  'tech': ['科技', 'ai', '芯片', '半导体', 'tech', 'nvidia', '半导体'],
};

/**
 * HTTP request timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  DEFAULT: 10000,
  API: 15000,
  SCRAPER: 10000,
} as const;

/**
 * News collection limits
 */
export const NEWS_LIMITS = {
  MIN_CONTENT_LENGTH: 50,      // Minimum content length for significant news
  MIN_SIGNIFICANT_ITEMS: 3,    // Minimum significant items to not trigger silence
  MAX_ITEMS_PER_SOURCE: 20,   // Maximum items to collect per source
  TOTAL_MAX_ITEMS: 100,        // Total maximum items after dedup
} as const;

/**
 * Tag keywords for multi-dimensional classification
 * Each tag maps to keywords that indicate that tag
 */
export const TAG_KEYWORDS: {
  primary: Record<PrimaryTag, string[]>;
  asset: Record<AssetTag, string[]>;
  region: Record<RegionTag, string[]>;
  time: Record<TimeTag, string[]>;
} = {
  // Primary theme tags
  primary: {
    'macro': [
      'cpi', 'ppi', 'gdp', 'gdp年率', '通胀', 'inflation', '央行', '美联储', 'fed',
      '利率', '利率决定', 'fomc', '议息', '量化宽松', 'qe', 'qt', '缩表', '扩表',
      '货币政策', '财政政策', '宏观', '宏观经济', 'm2', '社融', '新增贷款',
      '非农', '就业', '失业率', '消费者信心', '制造业', 'pmi', '采购经理指数',
    ],
    'asset': [
      '大类资产', '资产配置', '配置', '资金流向', '资金流入', '资金流出', '资产类别',
      '投资策略', '投资组合', '资产类别', 'beta', 'alpha', '风险偏好', 'risk',
    ],
    'industry': [
      '行业', '板块', 'etf', '新能源', '半导体', '芯片', 'ai', '人工智能',
      '汽车', '地产', '房地产', '银行', '保险', '券商', '医药', '消费', '能源',
      'nvidia', 'openai', 'amazon', 'tesla', 'robot', '科技', '互联网', '电商',
    ],
    'geopolitics': [
      '战争', '冲突', '制裁', '贸易战', '关税', 'g20', '峰会', '外交', '谈判',
      '俄罗斯', '乌克兰', '中东', '朝鲜', '伊朗', '欧盟', '北约', '联合国',
      'russia', 'ukraine', 'iran', 'war', 'sanction', 'trade war', 'tariff',
    ],
    'policy': [
      '证监会', '银保监会', '央行', '财政部', '发改委', '监管', '政策', '法规',
      '注册制', 'IPO', '再融资', '退市', '新规', '征求意见', '草案',
      'sec', 'fintech', 'regulation', '监管机构', 'fda', '药品审批',
    ],
    'sentiment': [
      'vix', '恐慌指数', '波动率', '资金流向', '融资融券', '杠杆', '对冲',
      '风险情绪', '市场情绪', '情绪指标', 'fear', 'greed', 'put', 'call',
      '期权', '期货', 'cftc', '持仓', '净多头', '净空头',
    ],
  },

  // Asset class tags
  asset: {
    'bond': [
      '美债', '国债', '债券', 'bond', 'treasury', 'yield', '收益率', '十年期',
      '两年期', '三十年期', '债券市场', '债券收益率', '信用债', '城投债', '企业债',
      '央行购债', 'qe', '量化宽松', 'taper', '缩减购债', '负利率', '名义收益率',
    ],
    'stock': [
      '股票', '股市', '指数', 'stock', 'index', 'nasdaq', 'dow', '道琼斯',
      '标普', 'sp500', '上证', '深证', '创业板', '科创板', '北证', 'a股', '港股',
      '美股', '欧股', '日股', '股指', '大盘', '个股', '成分股', '权重股',
    ],
    'fx': [
      '汇率', '美元', '人民币', '日元', '欧元', '英镑', 'currency', 'dollar',
      'usd', 'cny', 'jpy', 'eur', '外汇', '外汇市场', '美元指数', 'dxy',
      '贬值', '升值', '中间价', '在岸', '离岸', '跨境', '资本流动',
    ],
    'commodity': [
      '黄金', '原油', '石油', '铜', '铝', '锌', '镍', '小麦', '玉米', '大豆',
      'gold', 'oil', 'petroleum', 'copper', 'lme', '期货', '现货', '大宗商品',
      '大宗', '商品', '能源', '金属', '农产品', '供需', '库存', '库存报告',
    ],
    'crypto': [
      '比特币', '以太坊', 'btc', 'eth', '加密货币', '数字货币', '虚拟货币',
      'crypto', 'bitcoin', 'ethereum', '区块链', 'defi', 'nft', '币圈',
      '交易所', 'coinbase', 'binance', '监管', 'sec', 'etf审批', '现货etf',
    ],
    'reits': [
      'reits', '房地产', '房地产投资信托', '地产', '房产', '房价', '租金',
      'real estate', 'property', '商业地产', '住宅地产', '工业地产',
      '收租', '物业', '出租率', '空置率',
    ],
  },

  // Geographic region tags
  region: {
    'us': [
      '美国', '美联储', 'fed', '非农', '就业', '美股', '道琼斯', '纳斯达克',
      '标普', '华尔街', '美元', '美债', 'us', 'usa', 'america', 'united states',
      'fomc', '鲍威尔', '耶伦', '财政部长', 'cpi', 'ppi', 'gdp',
    ],
    'china': [
      '中国', 'a股', '上证', '深证', '人民币', '央行', '证监会', '财政部',
      '宏观政策', '稳增长', '刺激政策', '财政发力', '货币政策', 'china', 'chinese',
      'A股', '港股', '中概股', '内需', '出口', '贸易', '经济工作会议',
    ],
    'europe': [
      '欧洲', '欧元区', 'ecb', '欧洲央行', '德国', '法国', '意大利', '英国',
      '欧盟', '英国央行', 'boe', '脱欧', '欧元', 'europe', 'euro', 'eu',
      '欧洲股市', 'dax', 'cac', 'ftse', '斯托克', '欧洲债券', '欧洲通胀',
    ],
    'japan': [
      '日本', '日本央行', 'boj', '日元', '日本股市', '日经', 'nikkei',
      'japan', 'japanese', '负利率', 'ycc', '收益率曲线控制', '宽松政策',
      '通胀', '辞职', '植田和男', '黑田东彦',
    ],
    'emerging': [
      '新兴市场', '新兴经济体', '金砖', 'brics', '印度', '巴西', '俄罗斯',
      '南非', '墨西哥', '印尼', '越南', '土耳其', '阿根廷', '沙特', 'em',
      '新兴市场股市', '新兴市场债券', '资金流向新兴',
    ],
    'global': [
      '全球', '全球市场', '全球股市', 'world', 'global', 'worldwide',
      '国际', '各国', '多国', 'g7', 'g20', '峰会', '协调', '央行年会',
    ],
  },

  // Time horizon tags
  time: {
    'short': [
      '今日', '昨天', '刚刚', '最新', '短线', '日内', '本周', '今日消息',
      '突发', '震惊', '意外', '惊喜', '惊吓', '即时', '快讯', 'brief',
      'daily', 'today', 'overnight', 'intraday', '波动', '冲击',
    ],
    'medium': [
      '中期', '未来', '预计', '预期', '展望', '预测', '季度', '今年',
      'monthly', 'quarterly', '季度报', '中期趋势', '拐点', '转折',
      '1-3个月', '未来数周', '中期预期',
    ],
    'long': [
      '长期', '未来几年', '长期来看', '长期趋势', '十年', 'years',
      'long-term', 'structural', '结构性', '趋势性', '根本性',
      '2030', '2050', '长期逻辑', '基本面', '长期配置',
    ],
  },
};

/**
 * Classify tags for a news item based on its title and content
 */
export function classifyTags(title: string, content: string): NewsTags {
  const text = `${title} ${content}`.toLowerCase();

  // Initialize tag collections
  const primary: PrimaryTag[] = [];
  const asset: AssetTag[] = [];
  const region: RegionTag[] = [];
  const time: TimeTag[] = [];

  // Score each primary tag
  const primaryScores: Record<PrimaryTag, number> = {
    'macro': 0, 'asset': 0, 'industry': 0, 'geopolitics': 0, 'policy': 0, 'sentiment': 0,
  };

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS.primary)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        primaryScores[tag as PrimaryTag]++;
      }
    }
  }

  // Get top primary tags (max 2)
  const sortedPrimary = Object.entries(primaryScores)
    .sort(([, a], [, b]) => b - a);
  if (sortedPrimary[0][1] > 0) {
    primary.push(sortedPrimary[0][0] as PrimaryTag);
  }
  if (sortedPrimary[1] && sortedPrimary[1][1] > 0 && sortedPrimary[1][1] >= sortedPrimary[0][1] * 0.7) {
    primary.push(sortedPrimary[1][0] as PrimaryTag);
  }

  // Score each asset tag
  const assetScores: Record<AssetTag, number> = {
    'bond': 0, 'stock': 0, 'fx': 0, 'commodity': 0, 'crypto': 0, 'reits': 0,
  };

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS.asset)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        assetScores[tag as AssetTag]++;
      }
    }
  }

  // Get top asset tags (max 2)
  const sortedAsset = Object.entries(assetScores)
    .sort(([, a], [, b]) => b - a);
  if (sortedAsset[0][1] > 0) {
    asset.push(sortedAsset[0][0] as AssetTag);
  }
  if (sortedAsset[1] && sortedAsset[1][1] > 0 && sortedAsset[1][1] >= sortedAsset[0][1] * 0.7) {
    asset.push(sortedAsset[1][0] as AssetTag);
  }

  // Score each region tag
  const regionScores: Record<RegionTag, number> = {
    'us': 0, 'china': 0, 'europe': 0, 'japan': 0, 'emerging': 0, 'global': 0,
  };

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS.region)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        regionScores[tag as RegionTag]++;
      }
    }
  }

  // Get top region tags (max 2)
  const sortedRegion = Object.entries(regionScores)
    .sort(([, a], [, b]) => b - a);
  if (sortedRegion[0][1] > 0) {
    region.push(sortedRegion[0][0] as RegionTag);
  }
  if (sortedRegion[1] && sortedRegion[1][1] > 0 && sortedRegion[1][1] >= sortedRegion[0][1] * 0.7) {
    region.push(sortedRegion[1][0] as RegionTag);
  }

  // Score each time tag
  const timeScores: Record<TimeTag, number> = {
    'short': 0, 'medium': 0, 'long': 0,
  };

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS.time)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        timeScores[tag as TimeTag]++;
      }
    }
  }

  // Get top time tag (max 1)
  const sortedTime = Object.entries(timeScores)
    .sort(([, a], [, b]) => b - a);
  if (sortedTime[0][1] > 0) {
    time.push(sortedTime[0][0] as TimeTag);
  }

  return { primary, asset, region, time };
}

/**
 * Tag name mapping: English -> Chinese
 */
const tagNameMap: Record<string, string> = {
  // Primary
  macro: '宏观', asset: '资产', industry: '行业',
  geopolitics: '地缘', policy: '政策', sentiment: '情绪',
  // Asset
  bond: '债券', stock: '股票', fx: '外汇',
  commodity: '商品', crypto: '加密', reits: '地产',
  // Region
  us: '美国', china: '中国', europe: '欧洲',
  japan: '日本', emerging: '新兴', global: '全球',
  // Time
  short: '短线', medium: '中线', long: '长线',
};

/**
 * Convert tags to display string (Chinese)
 */
export function tagsToString(tags: NewsTags): string {
  const allTags = [
    ...tags.primary,
    ...tags.asset,
    ...tags.region,
    ...tags.time,
  ];
  return allTags.map(t => `[${tagNameMap[t] || t}]`).join('');
}
