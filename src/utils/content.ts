import { getMemberName } from './prompt';
import { h } from "koishi";
import https from 'https';
import axios from 'axios';
import { replaceImageWith } from './image-viewer';

interface Emoji {
  id: string;
  name: string;
  type: number;
}

class EmojiManager {
  private idToNameType: { [key: string]: { name: string, type: number } } = {};
  private nameTypeToId: { [key: string]: string } = {};

  constructor(emojis: Emoji[]) {
    emojis.forEach(emoji => {
      this.idToNameType[emoji.id] = { name: emoji.name, type: emoji.type };
      this.nameTypeToId[`${emoji.name}-${emoji.type}`] = emoji.id;
    });
  }

  async getNameById(id: string): Promise<{ name: string, type: number } | undefined> {
    return this.idToNameType[id];
  }

  async getIdByNameAndType(name: string, type: number): Promise<string | undefined> {
    return this.nameTypeToId[`${name}-${type}`];
  }
}

// qq表情数据
const emojis: Emoji[] = [
  { id: '0', name: '惊讶', type: 1 },
  { id: '1', name: '撇嘴', type: 1 },
  { id: '2', name: '色', type: 1 },
  { id: '3', name: '发呆', type: 1 },
  { id: '4', name: '得意', type: 1 },
  { id: '5', name: '流泪', type: 1 },
  { id: '6', name: '害羞', type: 1 },
  { id: '7', name: '闭嘴', type: 1 },
  { id: '8', name: '睡', type: 1 },
  { id: '9', name: '大哭', type: 1 },
  { id: '10', name: '尴尬', type: 1 },
  { id: '11', name: '发怒', type: 1 },
  { id: '12', name: '调皮', type: 1 },
  { id: '13', name: '呲牙', type: 1 },
  { id: '14', name: '微笑', type: 1 },
  { id: '15', name: '难过', type: 1 },
  { id: '16', name: '酷', type: 1 },
  // { id: '17', name: '菜刀', type: 1 },
  { id: '18', name: '抓狂', type: 1 },
  { id: '19', name: '吐', type: 1 },
  { id: '20', name: '偷笑', type: 1 },
  { id: '21', name: '可爱', type: 1 },
  { id: '22', name: '白眼', type: 1 },
  { id: '23', name: '傲慢', type: 1 },
  { id: '24', name: '饥饿', type: 1 },
  { id: '25', name: '困', type: 1 },
  { id: '26', name: '惊恐', type: 1 },
  { id: '27', name: '流汗', type: 1 },
  { id: '28', name: '憨笑', type: 1 },
  { id: '29', name: '悠闲', type: 1 },
  { id: '30', name: '奋斗', type: 1 },
  { id: '31', name: '咒骂', type: 1 },
  { id: '32', name: '疑问', type: 1 },
  { id: '33', name: '嘘', type: 1 },
  { id: '34', name: '晕', type: 1 },
  { id: '35', name: '折磨', type: 1 },
  { id: '36', name: '衰', type: 1 },
  { id: '37', name: '骷髅', type: 1 },
  { id: '38', name: '敲打', type: 1 },
  { id: '39', name: '再见', type: 1 },
  // { id: '40', name: '撇嘴', type: 1 },
  { id: '41', name: '发抖', type: 1 },
  { id: '42', name: '爱情', type: 1 },
  { id: '43', name: '跳跳', type: 1 },
  // { id: '44', name: '右哼哼', type: 1 },
  // { id: '45', name: '拥抱', type: 1 },
  { id: '46', name: '猪头', type: 1 },
  // { id: '47', name: '飞吻', type: 1 },
  // { id: '48', name: '鄙视', type: 1 },
  { id: '49', name: '拥抱', type: 1 },
  // { id: '50', name: '￥', type: 1 },
  // { id: '51', name: '可怜', type: 1 },
  // { id: '52', name: '赞', type: 1 },
  { id: '53', name: '蛋糕', type: 1 },
  { id: '59', name: '便便', type: 1 },
  { id: '60', name: '咖啡', type: 1 },
  { id: '63', name: '玫瑰', type: 1 },
  { id: '66', name: '爱心', type: 1 },
  { id: '74', name: '太阳', type: 1 },
  { id: '75', name: '月亮', type: 1 },
  { id: '76', name: '赞', type: 1 },
  { id: '78', name: '握手', type: 1 },
  { id: '79', name: '胜利', type: 1 },
  { id: '85', name: '飞吻', type: 1 },
  { id: '86', name: '怄火', type: 1 },
  { id: '89', name: '西瓜', type: 1 },
  { id: '96', name: '冷汗', type: 1 },
  { id: '97', name: '擦汗', type: 1 },
  { id: '98', name: '抠鼻', type: 1 },
  { id: '99', name: '鼓掌', type: 1 },
  { id: '100', name: '糗大了', type: 1 },
  { id: '101', name: '坏笑', type: 1 },
  { id: '102', name: '左哼哼', type: 1 },
  { id: '103', name: '右哼哼', type: 1 },
  { id: '104', name: '哈欠', type: 1 },
  { id: '106', name: '委屈', type: 1 },
  { id: '109', name: '左亲亲', type: 1 },
  { id: '111', name: '可怜', type: 1 },
  { id: '112', name: '菜刀', type: 1 },
  { id: '113', name: '啤酒', type: 1 },
  { id: '114', name: '篮球', type: 1 },
  { id: '115', name: '乒乓', type: 1 },
  { id: '116', name: '示爱', type: 1 },
  { id: '118', name: '抱拳', type: 1 },
  { id: '120', name: '拳头', type: 1 },
  { id: '122', name: '爱你', type: 1 },
  { id: '123', name: 'NO', type: 1 },
  { id: '124', name: 'OK', type: 1 },
  { id: '125', name: '转圈', type: 1 },
  { id: '129', name: '挥手', type: 1 },
  { id: '137', name: '鞭炮', type: 1 },
  { id: '144', name: '喝彩', type: 1 },
  { id: '147', name: '棒棒糖', type: 1 },
  { id: '171', name: '茶', type: 1 },
  { id: '173', name: '泪奔', type: 1 },
  { id: '174', name: '无奈', type: 1 },
  { id: '175', name: '卖萌', type: 1 },
  { id: '176', name: '小纠结', type: 1 },
  { id: '179', name: 'doge', type: 1 },
  { id: '180', name: '惊喜', type: 1 },
  { id: '181', name: '骚扰', type: 1 },
  { id: '182', name: '笑哭', type: 1 },
  { id: '183', name: '我最美', type: 1 },
  { id: '201', name: '点赞', type: 1 },
  { id: '203', name: '托脸', type: 1 },
  { id: '212', name: '托腮', type: 1 },
  { id: '214', name: '啵啵', type: 1 },
  { id: '219', name: '蹭一蹭', type: 1 },
  { id: '222', name: '抱抱', type: 1 },
  { id: '227', name: '拍手', type: 1 },
  { id: '232', name: '佛系', type: 1 },
  { id: '240', name: '喷脸', type: 1 },
  { id: '243', name: '甩头', type: 1 },
  { id: '246', name: '加油抱抱', type: 1 },
  { id: '262', name: '脑阔疼', type: 1 },
  { id: '264', name: '捂脸', type: 1 },
  { id: '265', name: '辣眼睛', type: 1 },
  { id: '266', name: '哦哟', type: 1 },
  { id: '267', name: '头秃', type: 1 },
  { id: '268', name: '问号脸', type: 1 },
  { id: '269', name: '暗中观察', type: 1 },
  { id: '270', name: 'emm', type: 1 },
  { id: '271', name: '吃瓜', type: 1 },
  { id: '272', name: '呵呵哒', type: 1 },
  { id: '273', name: '我酸了', type: 1 },
  { id: '277', name: '汪汪', type: 1 },
  { id: '278', name: '汗', type: 1 },
  { id: '281', name: '无眼笑', type: 1 },
  { id: '282', name: '敬礼', type: 1 },
  { id: '284', name: '面无表情', type: 1 },
  { id: '285', name: '摸鱼', type: 1 },
  { id: '287', name: '哦', type: 1 },
  { id: '289', name: '睁眼', type: 1 },
  { id: '290', name: '敲开心', type: 1 },
  { id: '293', name: '摸锦鲤', type: 1 },
  { id: '294', name: '期待', type: 1 },
  { id: '297', name: '拜谢', type: 1 },
  { id: '298', name: '元宝', type: 1 },
  { id: '299', name: '牛啊', type: 1 },
  { id: '305', name: '右亲亲', type: 1 },
  { id: '306', name: '牛气冲天', type: 1 },
  { id: '307', name: '喵喵', type: 1 },
  { id: '311', name: '打call', type: 1 },
  { id: '312', name: '变形', type: 1 },
  { id: '314', name: '仔细分析', type: 1 },
  { id: '315', name: '加油', type: 1 },
  { id: '317', name: '菜狗', type: 1 },
  { id: '318', name: '崇拜', type: 1 },
  { id: '319', name: '比心', type: 1 },
  { id: '320', name: '庆祝', type: 1 },
  { id: '322', name: '拒绝', type: 1 },
  { id: '324', name: '吃糖', type: 1 },
  { id: '325', name: '惊吓', type: 1 },
  { id: '326', name: '生气', type: 1 },
  { id: '333', name: '烟花', type: 1 },
  { id: '337', name: '花朵脸', type: 1 },
  { id: '338', name: '我想开了', type: 1 },
  { id: '339', name: '舔屏', type: 1 },
  { id: '341', name: '打招呼', type: 1 },
  { id: '342', name: '酸Q', type: 1 },
  { id: '343', name: '我方了', type: 1 },
  { id: '344', name: '大怨种', type: 1 },
  { id: '345', name: '红包多多', type: 1 },
  { id: '346', name: '你真棒棒', type: 1 },
  { id: '349', name: '坚强', type: 1 },
  { id: '350', name: '贴贴', type: 1 },
  { id: '351', name: '敲敲', type: 1 },
  { id: '360', name: '汪汪亲亲', type: 1 },
  { id: '361', name: '汪汪狗狗笑哭', type: 1 },
  { id: '362', name: '汪汪好兄弟', type: 1 },
  { id: '363', name: '汪汪狗狗可怜', type: 1},
  { id: '364', name: '汪汪超级赞', type: 1 },
  { id: '365', name: '汪汪狗狗生气', type: 1 },
  { id: '366', name: '汪汪芒狗', type: 1 },
  { id: '367', name: '汪汪狗狗疑问', type: 1 },
  { id: '368', name: '噗噗星人奥特笑哭', type: 1 },
  { id: '369', name: '噗噗星人彩虹', type: 1 },
  { id: '370', name: '噗噗星人祝贺', type: 1 },
  { id: '371', name: '噗噗星人冒泡', type: 1 },
  { id: '372', name: '噗噗星人气呼呼', type: 1 },
  { id: '373', name: '噗噗星人忙', type: 1 },
  { id: '374', name: '噗噗星人波波流泪', type: 1 },
  { id: '375', name: '噗噗星人超级鼓掌', type: 1 },
  { id: '376', name: '企鹅跺脚', type: 1 },
  { id: '377', name: '企鹅嗨', type: 1 },
  { id: '378', name: '企鹅企鹅笑哭', type: 1 },
  { id: '379', name: '企鹅企鹅流泪', type: 1 },
  { id: '380', name: '企鹅真棒', type: 1 },
  { id: '381', name: '企鹅路过', type: 1 },
  { id: '382', name: '企鹅emo', type: 1 },
  { id: '383', name: '企鹅企鹅爱心', type: 1 },
  { id: '384', name: 'QQ黄脸晚安', type: 1 },
  { id: '385', name: 'QQ黄脸太气了', type: 1 },
  { id: '386', name: 'QQ黄脸呜呜呜', type: 1 },
  { id: '387', name: 'QQ黄脸太好笑', type: 1 },
  { id: '388', name: 'QQ黄脸太头疼', type: 1 },
  { id: '389', name: 'QQ黄脸太赞了', type: 1 },
  { id: '390', name: 'QQ黄脸太头秃', type: 1 },
  { id: '391', name: 'QQ黄脸太沧桑', type: 1 },
  { id: '392', name: '龙年快乐', type: 1 },
  { id: '395', name: '略略略', type: 1 },
  { id: '396', name: '汪汪狼狗', type: 1 },
  { id: '397', name: '汪汪抛媚眼', type: 1 },
  { id: '398', name: '噗噗星人超级ok', type: 1 },
  { id: '399', name: '噗噗星人tui', type: 1 },
  { id: '400', name: '企鹅快乐', type: 1 },
  { id: '401', name: '企鹅超级转圈', type: 1 },
  { id: '402', name: 'QQ黄脸别说话', type: 1 },
  { id: '403', name: 'QQ黄脸出去玩', type: 1 },
  { id: '404', name: '喜花妮闪亮登场', type: 1 },
  { id: '405', name: '喜花妮好运来', type: 1 },
  { id: '406', name: '喜花妮姐是女王', type: 1 },
  { id: '407', name: '喜花妮我听听', type: 1 },
  { id: '408', name: '喜花妮臭美', type: 1 },
  { id: '409', name: '喜花妮送你花花', type: 1 },
  { id: '410', name: '喜花妮么么哒', type: 1 },
  { id: '411', name: '喜花妮一起嗨', type: 1 },
  { id: '412', name: '喜花妮开心', type: 1 },
  { id: '413', name: '喜花妮摇起来', type: 1 },
  { id: '415', name: '划龙舟', type: 1 },
  { id: '419', name: '火车', type: 1 },
  { id: '424', name: '续标识', type: 1 },
  { id: '425', name: '求放过', type: 1 },
  { id: '426', name: '玩火', type: 1 },
  { id: '427', name: '偷感', type: 1 },
  { id: '428', name: '收到', type: 1 },
  { id: '9728', name: '晴天', type: 2 },
  { id: '9749', name: '咖啡', type: 2 },
  { id: '9786', name: '可爱', type: 2 },
  { id: '10024', name: '闪光', type: 2 },
  { id: '10060', name: '错误', type: 2 },
  { id: '10068', name: '问号', type: 2 },
  { id: '127801', name: '玫瑰', type: 2 },
  { id: '127817', name: '西瓜', type: 2 },
  { id: '127822', name: '苹果', type: 2 },
  { id: '127827', name: '草莓', type: 2 },
  { id: '127836', name: '拉面', type: 2 },
  { id: '127838', name: '面包', type: 2 },
  { id: '127847', name: '刨冰', type: 2 },
  { id: '127866', name: '啤酒', type: 2 },
  { id: '127867', name: '干杯', type: 2 },
  { id: '127881', name: '庆祝', type: 2 },
  { id: '128027', name: '虫', type: 2 },
  { id: '128046', name: '牛', type: 2 },
  { id: '128051', name: '鲸鱼', type: 2 },
  { id: '128053', name: '猴', type: 2 },
  { id: '128074', name: '拳头', type: 2 },
  { id: '128076', name: '好的', type: 2 },
  { id: '128077', name: '厉害', type: 2 },
  { id: '128079', name: '鼓掌', type: 2 },
  { id: '128089', name: '内衣', type: 2 },
  { id: '128102', name: '男孩', type: 2 },
  { id: '128104', name: '爸爸', type: 2 },
  { id: '128147', name: '爱心', type: 2 },
  { id: '128157', name: '礼物', type: 2 },
  { id: '128164', name: '睡觉', type: 2 },
  { id: '128166', name: '水', type: 2 },
  { id: '128168', name: '吹气', type: 2 },
  { id: '128170', name: '肌肉', type: 2 },
  { id: '128235', name: '邮箱', type: 2 },
  { id: '128293', name: '火', type: 2 },
  { id: '128513', name: '呲牙', type: 2 },
  { id: '128514', name: '激动', type: 2 },
  { id: '128516', name: '高兴', type: 2 },
  { id: '128522', name: '嘿嘿', type: 2 },
  { id: '128524', name: '羞涩', type: 2 },
  { id: '128527', name: '哼哼', type: 2 },
  { id: '128530', name: '不屑', type: 2 },
  { id: '128531', name: '汗', type: 2 },
  { id: '128532', name: '失落', type: 2 },
  { id: '128536', name: '飞吻', type: 2 },
  { id: '128538', name: '亲亲', type: 2 },
  { id: '128540', name: '淘气', type: 2 },
  { id: '128541', name: '吐舌', type: 2 },
  { id: '128557', name: '大哭', type: 2 },
  { id: '128560', name: '紧张', type: 2 },
  { id: '128563', name: '瞪眼', type: 2 },
];

const emojiManager = new EmojiManager(emojis);

// 通过ID查询表情名称和类型
// console.log(emojiManager.getNameById('1')); // 输出: { name: 'smile', type: 1 }

// 通过表情名称和类型查询ID
// console.log(emojiManager.getIdByNameAndType('smile', 2)); // 输出: 3

export async function replaceTags(str: string, config: any): Promise<string> {
  const faceidRegex = /<face id="(\d+)"(?: name="([^"]*)")?(?: platform="[^"]*")?><img src="[^"]*"?\/><\/face>/g;
  const imgRegex = /<img[^>]+src\s*=\s*"([^"]+)"[^>]*\/>/g;
  const videoRegex = /<video[^>]+\/>/g;
  const audioRegex = /<audio[^>]+\/>/g;

  let finalString: string = str;

  const faceidMatches = Array.from(finalString.matchAll(faceidRegex));
  const faceidReplacements = await Promise.all(faceidMatches.map(async (match) => {
    let [, id, name] = match;
    if (!name) {
      const emoji = await emojiManager.getNameById(id);
      name = emoji ? emoji.name : "未知";
    }
    return {
      match: match[0],
      replacement: `[表情: ${name}]`,
    };
  }));
  faceidReplacements.forEach(({ match, replacement }) => {
    finalString = finalString.replace(match, replacement);
  });

  // url 转 base64 添加到 img 标签中
  const imgMatches = Array.from(finalString.matchAll(imgRegex));
  const imgReplacements = await Promise.all(imgMatches.map(async (match) => {
    const [fullMatch, src] = match;
    const imageUrl = src.replace(/&amp;/g, '&');
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // 忽略SSL证书验证
        timeout: 5000  // 5秒超时
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;

      return {
        match: fullMatch,
        replacement: `<img base64="${base64}" src="${imageUrl}"/>`
      };
    } catch (error) {
      console.error('Error converting image to base64:', error.message);
      return {
        match: fullMatch,
        replacement: `<img src="${imageUrl}"/>`
      };
    }
  }));

  if (config.ImageViewer.How !== 'LLM API 自带的多模态能力') {
    for (const { match, replacement } of imgReplacements) {
      const newReplacement = await replaceImageWith(replacement, config);
      finalString = finalString.replace(match, newReplacement);
    }
  } else {
    for (const { match, replacement } of imgReplacements) {
      finalString = finalString.replace(match, replacement);
    }
  }

  finalString = finalString.replace(videoRegex, "[视频]");
  finalString = finalString.replace(audioRegex, "[音频]");

  return finalString;
}


/*
    @description: 处理 AI 的消息
*/
export async function handleResponse(
  APIType: string,
  input: any,
  AllowErrorFormat: boolean,
  config: any,
  session: any,
): Promise<{
  res: string;
  resNoTag: string;
  LLMResponse: any;
  usage: any;
}> {
  let usage: any;
  let res: string;
  switch (APIType) {
    case "OpenAI": {
      res = input.choices[0].message.content;
      usage = input.usage;
      break;
    }
    case "Custom URL": {
      res = input.choices[0].message.content;
      usage = input.usage;
      break;
    }
    case "Cloudflare": {
      res = input.result.response;
      break;
    }
    default: {
      throw new Error(`不支持的 API 类型: ${APIType}`);
    }
  }
  if (typeof res != "string") {
    res = JSON.stringify(res, null, 2);
  }

  // 正版回复：
  // {
  //   "status": "success", // "success" 或 "skip" (跳过回复)
  //   "logic": "", // LLM思考过程
  //   "select": -1, // 回复引用的消息id
  //   "reply": "", // 初版回复
  //   "check": "", // 检查初版回复是否符合 "消息生成条例" 过程中的检查逻辑。
  //   "finReply": "" // 最终版回复
  //   "execute":[] // 要运行的指令列表
  // }
  const jsonMatch = res.match(/{.*}/s);
  if (jsonMatch) {
    res = jsonMatch[0];
  } else {
    throw new Error(`LLM provides unexpected response: ${res}`);
  }
  const LLMResponse = JSON.parse(res);
  if (LLMResponse.status != "success") {
    if (!AllowErrorFormat && LLMResponse.status != "skip") {
      throw new Error(`LLM provides unexpected response: ${res}`);
    } else {
      console.log(`LLM choose not to reply.`);
    }
  }
  let finalResponse: string = "";
  if (!AllowErrorFormat) {
    finalResponse += LLMResponse.finReply
      ? LLMResponse.finReply
      : LLMResponse.reply;
  } else {
    if (LLMResponse.finReply) finalResponse += LLMResponse.finReply;
    else if (LLMResponse.reply) finalResponse += LLMResponse.reply;
    // 盗版回复
    else if (LLMResponse.msg) finalResponse += LLMResponse.msg;
    else if (LLMResponse.text) finalResponse += LLMResponse.text;
    else if (LLMResponse.message) finalResponse += LLMResponse.message;
    else if (LLMResponse.answer) finalResponse += LLMResponse.answer;
    else throw new Error(`LLM provides unexpected response: ${res}`);
  }

  // 复制一份finalResonse为finalResponseNoTag，作为添加到队列中的bot消息内容
  let finalResponseNoTag = finalResponse;

  // 添加引用消息在finalResponse的开头
  if (~LLMResponse.select)
    finalResponse = h("quote", {
      id: LLMResponse.select,
    }) + finalResponse;

  // 使用 groupMemberList 反转义 <at> 消息
  const groupMemberList: { nick: string; user: { name: string; id: string } }[] = session.groupMemberList.data;

  if (!["群昵称", "用户昵称"].includes(config.Bot.NickorName)) {
    throw new Error(`Unsupported NickorName value: ${config.Bot.NickorName}`);
  }

  const getKey = (member: { nick: string; user: { name: string } }) => config.Bot.NickorName === "群昵称" ? member.nick : member.user.name;

  groupMemberList.sort((a, b) => getKey(b).length - getKey(a).length);

  groupMemberList.forEach((member) => {
    const name = getKey(member);
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const atRegex = new RegExp(`(?<!<at id="[^"]*" name=")@${escapedName}(?![^"]*"\s*\/>)`, 'g');
    finalResponse = finalResponse.replace(atRegex, `<at id="${member.user.id}" name="${name}" />`);
  });
  finalResponse = finalResponse.replace(/(?<!<at type=")@全体成员|@所有人|@all(?![^"]*"\s*\/>)/g, '<at type="all"/>');

  // 反转义 <face> 消息
  const faceRegex = /\[表情[:：]\s*([^\]]+)\]/g;
  const fullMatchRegex = /\[\s*([^\]]+)\s*\]/g;

  const matches = Array.from(finalResponse.matchAll(faceRegex)).concat(Array.from(finalResponse.matchAll(fullMatchRegex)));

  const replacements = await Promise.all(matches.map(async (match) => {
    const name = match[1];
    let id = await emojiManager.getIdByNameAndType(name, 1) || await emojiManager.getIdByNameAndType(name, 2) || '500';
    return {
      match: match[0],
      replacement: `<face id="${id}"></face>`,
    };
  }));

  replacements.forEach(({ match, replacement }) => {
    finalResponse = finalResponse.replace(match, replacement);
  });



  return {
    res: finalResponse,
    resNoTag: finalResponseNoTag,
    LLMResponse: LLMResponse,
    usage: usage,
  };
}


/*
    @description: 处理 人类 的消息
*/
export async function processUserContent(config: any, session: any): Promise<{ content: string, name: string }> {
  const regex = /<at id="([^"]+)"(?:\s+name="([^"]+)")?\s*\/>/g;
  // 转码 <at> 消息，把<at id="0" name="YesImBot" /> 转换为 @Athena 或 @YesImBot
  const matches = Array.from(session.content.matchAll(regex));
  let finalName = "";

  const userContentPromises = matches.map(async (match) => {

    const id = match[1].trim();
    const name = match[2]?.trim(); // 可能获取到 name

    const memberName = await getMemberName(config, session, id);
    finalName = memberName ? memberName : (name ? name : "UserNotFound");
    return {
      match: match[0],
      replacement: `@${finalName}`,
    }
  });

  const userContents = await Promise.all(userContentPromises);
  let userContent: string = session.content;
  userContents.forEach(({ match, replacement }) => {
    userContent = userContent.replace(match, replacement);
  });

  // 替换 <at type="all"/> 和 <at type="here"/>
  userContent = userContent.replace(/<at type="all"\s*\/>/g, '@全体成员');
  userContent = userContent.replace(/<at type="here"\s*\/>/g, '@在线成员');

  userContent = await replaceTags(userContent, config);
  return { content: userContent, name: finalName };
}
