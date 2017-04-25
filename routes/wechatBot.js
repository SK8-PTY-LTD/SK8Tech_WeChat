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

// router.use('/', wechat(config, function (req, res, next) {
//   // 微信输入信息都在req.weixin上
//   console.log(req.query.openid);
//   console.log(req.res._events)
// }));

router.use('/', wechat(config).text(function(message, req, res, next) {

  console.log("收到文字消息 ", message.Content);

  // message为文本内容
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125035',
  // MsgType: 'text',
  // Content: 'http',
  // MsgId: '5837397576500011341' }

  var keyArray = ['你好', '约吗'];
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
    default:
      res.reply({
        type: "text",
        content: '呀～公众号悄悄开发中～小编稍后联系你哦～'
      });
      break;
  }

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
              console.log('用户数据 body:', body)

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
              var profileImageURL = body.headimageurl;

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
                    "text": nickname + "," + sex + "," + city + "：" + message.Content,
                    "attachments": [{
                      "text": "头像照片: " + profileImageURL
                    }, {
                      "text": "点击回复: mp.weixin.qq.com"
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
  // Event: 'LOCATION',
  // Latitude: '23.137466',
  // Longitude: '113.352425',
  // Precision: '119.385040',
  // MsgId: '5837397520665436492' }
  // TODO
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