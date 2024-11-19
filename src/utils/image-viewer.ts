import axios from 'axios';

export async function replaceImageWith(imgTag: string, config: any){
  // 从imgTag（形如<img src=\"https://xxxx\" base64=\"xxxxxx\" summary=\"xxxxx\" otherproperties />，属性出现顺序不定）中提取base64、src、summary属性
  const base64Match = imgTag.match(/base64\s*=\s*\"([^"]+)\"/);  // 自带`data:image/jpeg;base64,`头
  const srcMatch = imgTag.match(/src\s*=\s*\"([^"]+)\"/);
  const summaryMatch = imgTag.match(/summary\s*=\s*\"([^"]+)\"/);
  const how = config.ImageViewer.How;
  const server = config.ImageViewer.Server;
  const baseURL = config.ImageViewer.BaseURL;
  const requestBody = config.ImageViewer.RequestBody;
  const question = config.ImageViewer.Question;
  const token = config.ImageViewer.APIKey;
  const getResponseRegex = config.ImageViewer.GetDescRegex;
  switch (how) {
    case "图片描述服务": {
      // ToDO: 使用md5缓存相同图片且question相同时的描述，减少请求次数
      try {
        switch (server) {
          case "百度AI开放平台": {
            return await baiduImageDescription(srcMatch[1], base64Match[1], question, token);
          }

          case "自己搭建的服务": {
            return await myOwnImageDescription(srcMatch[1], base64Match[1], question, token, baseURL, requestBody, getResponseRegex);
          }
        }
      } catch (error) {
        console.error(error);
        return await replaceImageWith(imgTag, { ImageViewer: { How: "替换成[图片:summary]" } });
      }
    }

    case "替换成[图片:summary]": {
      if (summaryMatch) {
        return `[图片:${summaryMatch[1]}]`;
      } else {
        return "[图片]";
      }
    }

    case "替换成[图片]": {
      return "[图片]";
    }

    case "不做处理，以<img>标签形式呈现": {
      return imgTag;
    }
  }
}

async function myOwnImageDescription(src: string, base64: string, question: any, token: any, baseURL: string, requestBody: string, getResponseRegex: string) {
  const requestBodyParsed = requestBody
    .replace('<url>', src)
    .replace('<base64>', base64)
    .replace('<question>', question)
    .replace('<apikey>', token);

  try {
    const response = await axios.post(baseURL, JSON.parse(requestBodyParsed), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = response.data;
    const regex = new RegExp(getResponseRegex);
    const match = regex.exec(JSON.stringify(responseData));

    if (match && match[1]) {
      return match[1];
    } else {
      throw new Error('No match found in response');
    }
  } catch (error) {
    console.error('Error in myOwnImageDescription:', error);
    throw error;
  }
}

async function baiduImageDescription(src:string, base64: string, question: string, token: string) {
  const submitUrl = 'https://aip.baidubce.com/rest/2.0/image-classify/v1/image-understanding/request?access_token=' + token;
  const resultUrl = 'https://aip.baidubce.com/rest/2.0/image-classify/v1/image-understanding/get-result?access_token=' + token;
  const headers = {
    'Content-Type': 'application/json',
  };
  const submitData = {
    image: encodeURIComponent(base64),
    url: src,
    question: question,
  };

  try {
    // 提交请求
    const submitResponse = await axios.post(submitUrl, JSON.stringify(submitData), { headers });
    const taskId = submitResponse.data.result.task_id;

    // 获取结果
    const resultData = {
      task_id: taskId,
    };
    let resultResponse;
    let retCode;

    do {
      resultResponse = await axios.post(resultUrl, JSON.stringify(resultData), { headers });
      retCode = resultResponse.data.result.ret_code;
      if (retCode === 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
      }
    } while (retCode === 1);

    if (retCode === 0) {
      return resultResponse.data.result.description;
    } else {
      throw new Error('Failed to get image description');
    }
  } catch (error) {
    console.error('Error in baiduImageDescription:', error);
    throw error;
  }
}