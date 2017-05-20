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
var wechatReply = require('../settings/reply');


// 引用 node-slack 库，详细请查看 https://github.com/xoxco/node-slack
//@see 设置:https://github.com/xoxco/node-slack/blob/master/slack.js
var Slack = require('node-slack');


// router.use('/', wechat(config, function (req, res, next) {
//   // 微信输入信息都在req.weixin上
//   console.log(req.query.openid);
//   console.log(req.res._events)
// }));

/**
 * Use this function to updateMenu
 *
 * @author Yitta
 * @see https://mp.weixin.qq.com/wiki/10/0234e39a2025342c17a7d23595c6b40a.html
 */
function updateMenu() {

  //1. Get Access token
  getAccessToken({
    success: function(accessToken) {
      
      //2. 创建表单并发送
      var menuRequestURL = "https://api.weixin.qq.com/cgi-bin/menu/create?access_token=" + accessToken;
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
      
    },
    error:function(error) {
      
      console.log("菜单更新 EEEEEor ", error);
      
    }
  });
}
updateMenu();

/**
 * Use this function to get AccessToken from WeChat
 * 
 * @author Yitta
 * @see https://mp.weixin.qq.com/wiki/11/0e4b294685f817b95cbed85ba5e82b8f.html
 * 
 * @param callback
 */
function getAccessToken(callback) {

  // Get Access token
  var requestURL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + process.env.appid + "&secret=" + process.env.appsecret;
  console.log("requestURL", requestURL);
  request.get({
        url: requestURL,
        json: true,
        headers: {
          "Content-Type": "application/json"
        }
      },
      function (err, httpResponse, body) {
        if (err != null) {
          console.log('公众号授权 error:', err); // Print the error if one occurred
          callback.error(err);
        } else {
          console.log('公众号授权 success, token: ', body.access_token);
          callback.success(body.access_token);
        }
      });
}
//获取slack发出的消息
//可成功获取但存在和用户发消息之间的先后问题, 以及路由问题
// (目前此位置可以实现实时接收到消息,但warning信息为:  请求超时: url=/wechat/slack/slash-commands/send-me-message, timeout=15000, 请确认方法执行耗时很长，或没有正确的 response 回调。)
function getMessageFromSlack() {
// 1. 由slack发送信息至URL
var incomingHook = "https://hooks.slack.com/services/" + process.env.incomingWebHook;
var options = "http://sk8tech.leanapp.cn/wechat";
var slack = new Slack(incomingHook, options);
router.post('/slack/slash-commands/send-me-message',function(req,res) {

    var reply = slack.respond(req.body,function(hook) {

        return {
            text: 'Reply success , ' + hook.user_name,
            username: 'Bot'
        };

    });

    // res.json(reply);
    console.log("slack message", req.body.text);
    //
    // return req.body.text;
});
}
getMessageFromSlack();

// //获取interactive button的信息
function sendMessageToSlackResponseURL(responseURL, JSONmessage){
       var postOptions = {
                uri: responseURL,
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
            json: JSONmessage
        }
        request(postOptions, function(error, response, body) {
                if (error){
                        // handle errors as you see fit
                    console.log('send message error', error);
                    }
                else console.log('send message success', body);
            });
    }

router.post('/slack/actions', function (req, res) {
        res.status(200).end(); // best practice to respond with 200 status
        var actionJSONPayload = JSON.parse(req.body.payload); // parse URL-encoded payload JSON string
        var message = {
            "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].value,
            "replace_original": false
        }
    console.log('success', message.text);
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
});

// router.post('/slack/actions',function(req,res) {
//
//     console.log("slack button", req);
//
//     res.success();
// });

//收到文字消息
router.use('/', wechat(config).text(function(message, req, res, next) {
  // message为文本内容
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125035',
  // MsgType: 'text',
  // Content: 'http',
  // MsgId: '5837397576500011341' }
  console.log("收到文字消息 ", message.Content);

//关键词自动回复
  var keyword;
  
  for (keyword in wechatReply.keywords) {
    if (message.Content.search(keyword) != -1) {

      var reply = wechatReply.keywords[keyword].reply;
      res.reply(reply);
    }
  }

 /**
  * 转发消息至slack
  *
  * @author Jack
  */
  function sendMessageToSlack() {
      getAccessToken({
          success: function (accessToken) {

              // 获取微信用户信息
              // @author Jack
              // @see https://mp.weixin.qq.com/wiki/14/bb5031008f1494a59c6f71fa0f319c66.html
              var userRequestURL = "https://api.weixin.qq.com/cgi-bin/user/info?access_token=" + accessToken + "&openid=" + message.FromUserName;
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
                              function (err, httpResponse, body) { /* ... */
                                  if (err != null) {
                                      console.log('Slack error:', err); // Print the error if one occurred

                                  } else {
                                      console.log('Slack statusCode:', httpResponse && httpResponse.statusCode); // Print the response status code if a response was received


                                  }
                              });

                      }
                  });

          },
          error: function (error) {

              console.log("信息转发 EEEEEor ", error);

          }
      });
  }
    sendMessageToSlack();

    /**
     * 由slack发送信息至Wechat
     * @author Yitta
     *
     * @see https://github.com/xoxco/node-slack
     * @see 设置:https://github.com/xoxco/node-slack/blob/master/slack.js
     *
     * @see https://mp.weixin.qq.com/wiki/11/c88c270ae8935291626538f9c64bd123.html#.E5.AE.A2.E6.9C.8D.E6.8E.A5.E5.8F.A3-.E5.8F.91.E6.B6.88.E6.81.AF
     */
    //get message from slack
    // function getMessageFromSlack() {
    //// 1. 由slack发送信息至URL
    // var incomingHook = "https://hooks.slack.com/services/" + process.env.incomingWebHook;
    // var options = "http://sk8tech.leanapp.cn/wechat";
    // var slack = new Slack(incomingHook, options);
    // router.post('/',function(req,res) {
    //
    //     var reply = slack.respond(req.body,function(hook) {
    //
    //         return {
    //             text: 'Reply success , ' + hook.user_name,
    //             username: 'Bot'
    //         };
    //
    //     });
    //
    //     // res.json(reply);
    //     console.log("slack message", req.body.text);
    //
    //     //2. 信息发送至wechat
    //     getAccessToken({
    //         success: function(accessToken) {
    //
    //             var messageRequestURL = "https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=" + accessToken;
    //             request.post({
    //                     url: messageRequestURL,
    //                     json: true,
    //                     headers: {
    //                         "content-type": "application/json"
    //                     },
    //                     body: {
    //                         "touser": message.FromUserName,
    //                         "msgtype":"text",
    //                         "text":
    //                         {
    //                             "content": req.body.text
    //                         }
    //                     }
    //                 },
    //                 function (err, httpResponse, body) {
    //                     if (err != null) {
    //                         console.log("发送至wechat EEEEEor ", err);
    //                     } else {
    //                         console.log("发送至wechat Success ");
    //                     }
    //                 })
    //
    //         },
    //         error:function(error) {
    //
    //             console.log("发送至wechat 失败 ", error);
    //
    //         }
    //     });
    //
    // });
    //
    // }





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
  //@author Yitta
  //@see https://mp.weixin.qq.com/wiki/7/9f89d962eba4c5924ed95b513ba69d9b.html
  if (message.Event == 'CLICK') {

    console.log("收到点击事件 ", message.EventKey);

    var eventKey = message.EventKey;

    var primaryKey,
        secondaryKey;

    for (primaryKey in wechatMenu.buttons) {

      var primaryButton = wechatMenu.buttons[primaryKey];

      for (secondaryKey in primaryButton.sub_button) {

        var secondaryButton = primaryButton.sub_button[secondaryKey];

        if (eventKey == secondaryButton.key) {
          res.reply(secondaryButton.reply);

        }
      }
    }
  }

  //关注自动回复 + 用户名
  //@author Yitta
  //@see https://mp.weixin.qq.com/wiki/7/9f89d962eba4c5924ed95b513ba69d9b.html
  if (message.Event == 'subscribe') {
    console.log("收到新关注", message.FromUserName);

      getAccessToken({
          success: function(accessToken) {
              // 获取用户信息
              var userRequestURL = "https://api.weixin.qq.com/cgi-bin/user/info?access_token=" + accessToken + "&openid=" + message.FromUserName;
              request.get({
                      url: userRequestURL,
                      json: true,
                      headers: {
                          "Content-Type": "application/json"
                      }
                  },
                  function (err, httpResponse, body) {
                      if (err != null) {
                          console.log('新关注用户数据 error:', err); // Print the error if one occurred
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

          },
          error:function(error) {

              console.log("关注自动回复 EEEEEor ", error);

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