var router = require('express').Router();
// 引用 wechat 库，详细请查看 https://github.com/node-webot/wechat
var wechat = require('wechat');
var config = {
  token: process.env.token,
  appid: process.env.appid,
  encodingAESKey: process.env.encodingAESKey
};

var WechatAPI = require('wechat-api');
var api = new WechatAPI(process.env.appid,
  process.env.appsecret);

var request = require('request');

var wechatMenu = require('../settings/menu');

// router.use('/', wechat(config, function (req, res, next) {
//   // 微信输入信息都在req.weixin上
//   console.log(req.query.openid);
//   console.log(req.res._events)
// }));

// 创建菜单
// @author Yitta
// 1.get access_token
var requestURL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + process.env.appid + "&secret=" + process.env.appsecret;
console.log("requestURL", requestURL);
request.get({
      url: requestURL,
      json: true,
      headers: {
        "Content-Type": "application/json"
      }
    },
    function(err, httpResponse, body) {
      if (err != null) {
        console.log('公众号授权 error:', err); // Print the error if one occurred
      } else {
        // console.log('公众号授权 statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received
        console.log('公众号授权 body:', body);

        var newToken = body.access_token;
        //2.创建表单并发送
        var menuRequestURL = "https://api.weixin.qq.com/cgi-bin/menu/create?access_token=" + newToken;
        console.log("menuRequestURL", menuRequestURL);
        request.post({
              url: menuRequestURL,
              json: true,
              headers: {
                "content-type": "application/json"
              },
              body: {
                "button": wechatMenu.buttons
              }
            },
            function (err, httpResponse, body) {
              if (err != null) {
                console.log("菜单 EEEEEor ", err);
              } else {
                console.log("菜单 Success ");
              }
            })
      }
    });

//收到文字消息
router.use('/', wechat(config).text(function(message, req, res, next) {

  console.log("收到文字消息 ", message.Content);

  // message为文本内容
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125035',
  // MsgType: 'text',
  // Content: 'http',
  // MsgId: '5837397576500011341' }

  var keyArray = ['你好', '约吗', '作品'];
  var content = message.Content;
  var keyIndex = keyArray.indexOf(content);
  switch (keyIndex) {
    case 0:
      {
        res.reply({
          type: "text",
          content: '你好，大家好才是真的好！'
        });

      }
      break;
    case 1:
      {
        res.reply({
          type: "text",
          content: '不约，不约，叔叔我们不约！'
        });
      }
      break;
    case 2:
    {
      res.reply({
        type: "text",
        content: '精品案例：\nhttps://sk8.tech/wp-content/uploads/2017/02/SK8Tech-Company-Portfoliointeractive.pdf'
      });
    }
      break;
    default:
      res.reply({
        type: "text",
        content: '好咧亲~小编速速就来~'
      });
      break;
  }

  //包含关键词回复
  // if (message.Content.contains('案例','Case', '作品', '网站', 'App')) {
  //   res.reply({
  //     type: "text",
  //     content: '精品案例：\nhttps://sk8.tech/wp-content/uploads/2017/02/SK8Tech-Company-Portfoliointeractive.pdf'
  //   });
  // }
  //
  // if (message.Content.contains('联络','联系', '电话', '邮箱', '微博', '官网', '网站', '手机')) {
  //   res.reply({
  //     type: "text",
  //     content: 'SK8科技\n邮件：hi@sk8.tech\n网址：https://sk8.tech\n微博：weibo.com/sk8tech\n←点击左边就可以联系客服了哦~'
  //   });
  // }


  // 获取公众号access_token
  // @author Jack
  // @see https://mp.weixin.qq.com/wiki/11/0e4b294685f817b95cbed85ba5e82b8f.html
  var requestURL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + process.env.appid + "&secret=" + process.env.appsecret;
  console.log("requestURL", requestURL);
  request.get({
      url: requestURL,
      json: true,
      headers: {
        "Content-Type": "application/json"
      }
    },
    function(err, httpResponse, body) {
      if (err != null) {
        console.log('公众号授权 error:', err); // Print the error if one occurred 
      } else {
        // console.log('公众号授权 statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received         
        console.log('公众号授权 body:', body);

        var newToken = body.access_token;

        // 获取微信用户吗
        // @author Jack
        // @see https://mp.weixin.qq.com/wiki/14/bb5031008f1494a59c6f71fa0f319c66.html
        var userRequestURL = "https://api.weixin.qq.com/cgi-bin/user/info?access_token=" + newToken + "&openid=" + message.FromUserName;
        console.log("userRequestURL", userRequestURL);
        request.get({
            url: userRequestURL,
            json: true,
            headers: {
              "Content-Type": "application/json"
            }
          },
          function(err, httpResponse, body) {
            if (err != null) {
              console.log('用户数据 error:', err); // Print the error if one occurred 
            } else {
              console.log('用户数据 statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received         
              console.log('用户数据 body:', body);

              var nickname = body.nickname;
              var sex = body.sex;
              if (sex == 0) {
                sex = "未"
              } else if (sex == 1) {
                sex = "男"
              } else if (sex == 2) {
                sex = "女"
              }
              var language = body.language;
              var city = body.city;
              var province = body.province;
              var country = body.country;
              var profileImageURL = body.headimgurl;

              // Send text information to Slack
              // @author Jack
              // @see https://www.npmjs.com/package/request
              // @see https://api.slack.com/incoming-webhooks#sending_messages
              var slackWebhookMarketing = "https://hooks.slack.com/services/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";
              request.post({
                  url: slackWebhookMarketing,
                  json: true,
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: {
                    "text": "新消息：",
                    "attachments": [{
                      "title": nickname,
                      "title_link": "https://mp.weixin.qq.com/",
                      "text": message.Content,
                      "thumbnail_url": "profileImageURL",
                      "fields": [{
                        "title": "Gender",
                        "value": sex,
                        "short": true
                      }, {
                        "title": "Location",
                        "value": province,
                        "short": true
                      }],
                      "actions": [{
                        "name": "reply",
                        "text": "回复(待开发)",
                        "type": "button",
                        "value": "reply"
                      }]
                    }]
                  }
                },
                function(err, httpResponse, body) { /* ... */
                  if (err != null) {
                    console.log('Slack error:', err); // Print the error if one occurred 

                  } else {
                    console.log('Slack statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received         

                  }
                });

            }
          });
      }
    });

}).image(function(message, req, res, next) {
  // message为图片内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359124971',
  // MsgType: 'image',
  // PicUrl: 'http://mmsns.qpic.cn/mmsns/bfc815ygvIWcaaZlEXJV7NzhmA3Y2fc4eBOxLjpPI60Q1Q6ibYicwg/0',
  // MediaId: 'media_id',
  // MsgId: '5837397301622104395' }}).voice(function(message, req, res, next) {
  // TODO
}).voice(function(message, req, res, next) {
  // message为音频内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'voice',
  // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
  // Format: 'amr',
  // MsgId: '5837397520665436492' }
}).video(function(message, req, res, next) {
  // message为视频内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'video',
  // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
  // ThumbMediaId: 'media_id',
  // MsgId: '5837397520665436492' }
  // TODO
}).shortvideo(function(message, req, res, next) {
  // message为短视频内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'shortvideo',
  // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
  // ThumbMediaId: 'media_id',
  // MsgId: '5837397520665436492' }
  // TODO
}).location(function(message, req, res, next) {
  // message为链接内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'link',
  // Title: '公众平台官网链接',
  // Description: '公众平台官网链接',
  // Url: 'http://1024.com/',
  // MsgId: '5837397520665436492' }
  // TODO
}).link(function(message, req, res, next) {
  // message为链接内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'link',
  // Title: '公众平台官网链接',
  // Description: '公众平台官网链接',
  // Url: 'http://1024.com/',
  // MsgId: '5837397520665436492' }
  // TODO
}).event(function(message, req, res, next) {
  // message为事件内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'event',
  // Event: 'CLICK',
  // EventKey: 'KEY',
  // Latitude: '23.137466',
  // Longitude: '113.352425',
  // Precision: '119.385040',
  // MsgId: '5837397520665436492' }
  // TODO

//CLICK事件响应
  if (message.Event == 'CLICK') {
    console.log("收到点击事件 ", message.EventKey);

    var eventKey = message.EventKey;

    var primaryKey,
        secondaryKey;

    for (primaryKey in wechatMenu.buttons) {

      var primaryButton = wechatMenu.buttons[primaryKey];
      console.log("pirmaryButton ", primaryButton.name);

      for (secondaryKey in pirmaryButton.subButton) {

        var secondaryButton = wechatMenu.buttons[secondaryKey];
        console.log("secondaryButton ", secondaryButton.name);

        if (eventKey == secondaryButton.key) {
          console.log("reply ", secondaryButton.reply);
          res.reply(secondaryButton.reply);
        }
      }
    }
    
    
    
    //
    // var keyArray = ['品牌设计', '官网建设', 'App开发', '线上推广', '报个价呗', '企业介绍', '价值使命', '团队介绍', '技术孵化', '联系我们'];
    // var keyIndex = keyArray.indexOf(eventKey);
    // switch (keyIndex) {
    //   case 0:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '我们提供全套的品牌设计，包括:\n\n纯Logo：彩色，单色的Logo\n品牌版：Logo，名片，企业文件夹，信纸信封，定制文具等\n至尊版：电子名片，邮件签名，二维码，企业官网，微信公众号等\n\n更多详情，欢迎咨询客服~\n\n邮件：hi@sk8.tech\n网址：https://sk8.tech\n微博：weibo.com/sk8tech\n←点击左边就可以联系客服了哦~'
    //     });
    //
    //   }
    //     break;
    //   case 1:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '信息时代，没官网怎么行？我们提供全套的管网设计以及开发，包括:\n\nPC版：15页网站设计+开发，SEO优化，可选博客，论坛等功能\n手机版：15页网站设计+开发，SEO优化，可选博客，论坛等功能\n商城：各类商城或微店\n\n更多详情，欢迎咨询客服~\n\n邮件：hi@sk8.tech\n网址：https://sk8.tech\n微博：weibo.com/sk8tech\n←点击左边就可以联系客服了哦~'
    //     });
    //
    //   }
    //     break;
    //   case 2:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '我的App我做主！告诉我们你的想法，无论复杂简单，我们都能替你做出来！包括：\n\n原生App：可以在App Store中下载到的App\n网页App：可以通过二维码扫一扫即用的App\n小程序：微信生态圈中一次崭新尝试\n\n更多详情，欢迎咨询客服~\n\n邮件：hi@sk8.tech\n网址：https://sk8.tech\n微博：weibo.com/sk8tech\n←点击左边就可以联系客服了哦~'
    //     });
    //
    //   }
    //     break;
    //   case 3:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '让你的顾客找到你，不再擦肩而过！我们提供在线推广服务，包括：\n\n谷歌百度排名：让你的网站出现在第一页\n点击付费广告：付费将用户引流到你的网站\nASO：App Store 排名优化\n微信代运营：公众号代运营\n外媒代运营：Facebook，Twitter，Google+代运营\n\n更多详情，欢迎咨询客服~\n\n邮件：hi@sk8.tech\n网址：https://sk8.tech\n微博：weibo.com/sk8tech\n←点击左边就可以联系客服了哦~'
    //     });
    //
    //   }
    //     break;
    //   case 4:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '感谢您的兴趣~我们特别高兴能够成为你的左膀右臂！\n\n由于每个项目的范围，耗时，都不一样，报价得视项目详细而定，请联系我们热气的客服，我们将第一时间为您报价！\n\n只需复制黏贴以下文字，回复客服，我们将在48小时内给您一个报价~\n\n更多详情，欢迎咨询客服~\n\n邮件：hi@sk8.tech\n网址：https://sk8.tech\n微博：weibo.com/sk8tech\n\n←点击左边就可以联系客服了哦~亲~\n\n项目名称：\n联系邮箱：\n项目类型：设计/网站/App/微信/推广\n项目简介：'
    //     });
    //
    //   }
    //     break;
    //   case 5:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: 'SK8科技于13年创立在新加坡。4年内，我们跨越了3个国家，坐落于澳洲悉尼市中心及上海杨浦。\nSK8科技是一家跨国 IT 开发以及技术孵化公司，我们致力于为中小型企业，尤其是初创团队，提供一站式的技术服务。\n我们的服务包括品牌设计，官网建站，App开发，以及在线推广。\n对有潜力的初创公司，我们也提供技术孵化服务，为创业加速。'
    //     });
    //
    //   }
    //     break;
    //   case 6:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '初创团队往往需要最专业的团队，以最快的速度 完成从产品到推广。作为创业先驱，我们深刻体会初创公司的辛苦。\n我们立志为中小企业提供一站式技术服务。助力创业，技术孵化，荣辱与共，共创辉煌。'
    //     });
    //
    //   }
    //     break;
    //   case 7:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '工匠精神-我们的团队有着各式各样的人才大牛，包括商务分析，设计，开发，测试，市场 等。\n我们注重人才培养，并且提供学习条件。我们重视团建，因为一流的团队才能雕琢 一流的作品。\n同时，我们随时欢迎人才加入。请直接联系小编，或者将简历发至 hi@sk8.tech'
    //     });
    //
    //   }
    //     break;
    //   case 8:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: '对于有潜力的互联网项目，我们将以“技术孵化”的形式，以一定比例参股，并且提供\n1. 专业的创业导师\n2. 精锐的技术团队\n3. 轻松的办公氛围\n4. 丰富的运营经验\n截止17年2月，SK8科技已“技术孵化”海内外4个互联网公司，总估值超过3500万人民币。'
    //     });
    //
    //   }
    //     break;
    //   case 9:
    //   {
    //     res.reply({
    //       type: "text",
    //       content: 'SK8科技\n邮件：hi@sk8.tech\n网址：https://sk8.tech\n微博：weibo.com/sk8tech\n←点击左边就可以联系客服了哦~'
    //     });
    //
    //   }
    //     break;
    //   default:
    //     res.reply({
    //       type: "text",
    //       content: '呀～公众号悄悄开发中～小编稍后联系你哦～'
    //     });
    //     break;
    // }
  }

  //关注自动回复 + 用户名
  if (message.Event == 'subscribe') {
    console.log("收到新关注", message.FromUserName);

    var requestURL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + process.env.appid + "&secret=" + process.env.appsecret;
    console.log("requestURL", requestURL);
    request.get({
          url: requestURL,
          json: true,
          headers: {
            "Content-Type": "application/json"
          }
        },
        function(err, httpResponse, body) {
          if (err != null) {
            console.log('公众号授权 error:', err); // Print the error if one occurred
          } else {
            // console.log('公众号授权 statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received
            console.log('公众号授权 body:', body);

            var newToken = body.access_token;


            // 获取微信用户信息
            var userRequestURL = "https://api.weixin.qq.com/cgi-bin/user/info?access_token=" + newToken + "&openid=" + message.FromUserName;
            // console.log("userRequestURL", userRequestURL);
            request.get({
                  url: userRequestURL,
                  json: true,
                  headers: {
                    "Content-Type": "application/json"
                  }
                },
                function (err, httpResponse, body) {
                  if (err != null) {
                    console.log('用户数据 error:', err); // Print the error if one occurred
                  } else {
                    console.log('新关注用户数据 statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received
                    console.log('新关注用户数据 body:', body);
                   //用户名获取
                    var nickname = body.nickname;
                    res.reply({
                      type: "text",
                      content: '亲爱的' + nickname + '~，你怎么这么晚才来？你知道自己错过了多少互联网大事吗！！！\n\n想要看看SK8科技能够为你做些什么。。。\n赶快回复“作品”，或点这里试试\n\n↓↓↓↓↓\n↓↓↓↓↓\n↓↓↓↓↓\n↓↓↓↓\n↓↓↓↓\n↓↓↓↓\n↓↓↓\n↓↓↓\n↓↓↓\n↓↓\n↓↓\n↓↓\n↓'
                    });
                  }
                })
          }
        });
  }

}).device_text(function(message, req, res, next) {
  // message为设备文本消息内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'device_text',
  // DeviceType: 'gh_d3e07d51b513'
  // DeviceID: 'dev1234abcd',
  // Content: 'd2hvc3lvdXJkYWRkeQ==',
  // SessionID: '9394',
  // MsgId: '5837397520665436492',
  // OpenID: 'oPKu7jgOibOA-De4u8J2RuNKpZRw' }
  // TODO
}).device_event(function(message, req, res, next) {
  // message为设备事件内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125022',
  // MsgType: 'device_event',
  // Event: 'bind'
  // DeviceType: 'gh_d3e07d51b513'
  // DeviceID: 'dev1234abcd',
  // OpType : 0, //Event为subscribe_status/unsubscribe_status时存在
  // Content: 'd2hvc3lvdXJkYWRkeQ==', //Event不为subscribe_status/unsubscribe_status时存在
  // SessionID: '9394',
  // MsgId: '5837397520665436492',
  // OpenID: 'oPKu7jgOibOA-De4u8J2RuNKpZRw' }
  // TODO
}).middlewarify());

module.exports = router;