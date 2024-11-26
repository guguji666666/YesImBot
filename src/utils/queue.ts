import { Config } from '../config';
import { getMemberName } from './prompt';
import JSON5 from "json5";
import fs from 'fs';
import path from 'path';

function containsFilter(sessionContent: string, FilterList: any): boolean {
  for (const filterString of FilterList) {
    if (sessionContent.includes(filterString)) {
      return true;
    }
  }
  return false;
}

export class SendQueue {
  private sendQueueMap: Map<
    string,
    {
      id: number;
      sender: string;
      sender_id: string;
      content: string;
      timestamp: string;
      guildId: string;
    }[]
  >;
  private triggerCountMap: Map<string, number>;
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, '../../data/queue.json');
    this.sendQueueMap = new Map<
      string,
      {
        id: number;
        sender: string;
        sender_id: string;
        content: string;
        timestamp: string;
        guildId: string;
      }[]
    >();
    this.triggerCountMap = new Map<string, number>();
    this.loadFromFile();
  }

  private parseTimestamp(timestamp: string): Date {
    const [yyyy, mm, dd, hh, min, sec] = timestamp.split('/').map(Number);
    return new Date(yyyy, mm - 1, dd, hh, min, sec);
  }

  private getCurrentTimestamp(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}/${hh}/${min}/${sec}`;
  }

  // 保存数据到文件
  public saveToFile(): void {
    try {
      const data = {
        sendQueueMap: Object.fromEntries(this.sendQueueMap),
        triggerCountMap: Object.fromEntries(this.triggerCountMap)
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('存档队列数据失败:', error);
    }
  }

  // 从文件加载数据
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // 将普通对象转换回 Map，并确保包含 timestamp 属性
        this.sendQueueMap = new Map(
          Object.entries(data.sendQueueMap).map(([key, value]) => [
            key,
            (value as any[]).map((item) => ({
              ...item,
              timestamp: item.timestamp || '', // 兼容旧数据
            })),
          ])
        );
        this.triggerCountMap = new Map(Object.entries(data.triggerCountMap));

        console.log('已从文件加载队列数据');
      }
    } catch (error) {
      console.error('加载队列数据失败:', error);
    }
  }

  // 消息入队
  updateSendQueue(
    group: string,
    sender: string,
    sender_id: any,
    content: string,
    id: any,
    FilterList: any,
    TriggerCount: number,
    selfId: string
  ) {
    const timestamp = this.getCurrentTimestamp();
    if (this.sendQueueMap.has(group)) {
      if (containsFilter(content, FilterList)) return;
      const queue = this.sendQueueMap.get(group);
      queue.push({ id: Number(id), sender: sender, sender_id: sender_id, content: content, timestamp: timestamp, guildId: group });
      this.sendQueueMap.set(group, queue);
    } else {
      this.sendQueueMap.set(group, [
        { id: Number(id), sender: sender, sender_id: sender_id, content: content, timestamp: timestamp, guildId: group },
      ]);
    }

    // 更新触发计数
    const currentCount = this.triggerCountMap.get(group) ?? TriggerCount;
    this.triggerCountMap.set(group, selfId === sender_id ? currentCount : currentCount - 1); // 自己发的消息不计数
    this.saveToFile();
  }

  // 检查队列长度
  checkQueueSize(group: string, size: number): boolean {
    if (this.sendQueueMap.has(group)) {
      const queue = this.sendQueueMap.get(group);
      console.log(`此会话的记忆容量: ${queue.length} / ${size}`);
      return queue.length >= size;
    }
    return false;
  }

  // 检查记忆槽位长度
  checkMixedQueueSize(groups: Set<string>, size: number): boolean {
    let totalLength = 0;

    for (const group of groups) {
      if (this.sendQueueMap.has(group)) {
        const queue = this.sendQueueMap.get(group);
        totalLength += queue.length;
      }
    }

    console.log(`记忆槽位的容量: ${totalLength} / ${size}`);
    return totalLength >= size;
  }

  // 检查触发计数
  checkTriggerCount(group: string): boolean {
    if (this.triggerCountMap.has(group)) {
      const count = this.triggerCountMap.get(group);
      console.log(`距离下一次触发还有: ${count} 条消息`);
      if (count <= 0) {
        return true;
      }
      return false;
    }
    return false;
  }

  // 重置触发计数
  resetTriggerCount(group: string, nextTriggerCount: number):boolean {
    if (this.triggerCountMap.has(group)) {
      this.triggerCountMap.set(group, nextTriggerCount);
      this.saveToFile();
      console.log(`已设置下一次触发计数为 ${nextTriggerCount}`);
      return true;
    }
    return false;
  }

  // 消息出队到队列长度为maxQueueSize
  resetSendQueue(group: string, maxQueueSize: number) {
    const queue = this.sendQueueMap.get(group);
    if (queue && queue.length > 0) {
      const newQueue = queue.slice(-maxQueueSize);
      this.sendQueueMap.set(group, newQueue);
      this.saveToFile();
      console.log(`此会话队列已满，已出队至 ${newQueue.length} 条`);
    }
  }

  // 清空队列
  clearSendQueue(group: string) {
    if (this.sendQueueMap.has(group)) {
      this.sendQueueMap.delete(group);
      this.triggerCountMap.delete(group);
      this.saveToFile();
      console.log(`已清空此会话: ${group}`);
      return true;
    } else {
      console.log(`此会话不存在: ${group}`);
      return false;
    }
  }

  // 根据消息id和群号字符串集合查找消息所在会话
  findGroupByMessageId(messageId: string, groups: Set<string>): string | null {
    if (messageId.trim() === '') {
      return null;
    }
    for (const group of groups) {
      if (this.sendQueueMap.has(group)) {
        const queue = this.sendQueueMap.get(group);
        if (queue) {
          for (const message of queue) {
            if (message.id === Number(messageId)) {
              return group;
            }
          }
        }
      }
    }
    return null;
  }

  async getPrompt(groups: Set<string>, config: Config, session: any): Promise<string> {
    // 收集所有群组的消息
    let messages = [];

    for (const group of groups) {
      if (this.sendQueueMap.has(group)) {
        const queue = this.sendQueueMap.get(group);
        messages = messages.concat(queue);
      }
    }

    // 按照时间戳排序
    messages.sort((a, b) => {
      return this.parseTimestamp(a.timestamp).getTime() - this.parseTimestamp(b.timestamp).getTime();
    });

    // 如果超过长度限制，丢弃旧的消息
    const maxSize = config.Group.SendQueueSize;
    if (messages.length > maxSize) {
      messages = messages.slice(-maxSize);
    }

    if (messages.length === 0) {
      return "[]";
    }

    // 转换为 promptArr
    const promptArr = await Promise.all(messages.map(async (item) => {
      return {
        time: item.timestamp,
        session_id: item.guildId,
        id: item.id,
        author: await getMemberName(config, session, item.sender_id),
        author_id: item.sender_id,
        msg: item.content,
      };
    }));

    // 转换为字符串
    let promptStr = JSON5.stringify(promptArr, null, 2);

    // 处理 <img base64="xxx" /> 标签
    const imgTagRegex = /<img base64=\\"[^\\"]*\\"\s*\/?>/g;
    const matches = promptStr.match(imgTagRegex);
    if (matches && config.ImageViewer.Memory !== -1) {
      const imgCount = matches.length;
      const imgToKeep = config.ImageViewer.Memory;
      const imgToReplace = imgCount - imgToKeep;

      if (imgToReplace > 0) {
        let replacedCount = 0;
        promptStr = promptStr.replace(imgTagRegex, (match) => {
          if (replacedCount < imgToReplace) {
            replacedCount++;
            return '[图片]';
          }
          return match;
        });
      }
    }

    return promptStr;
  }
}
