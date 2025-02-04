const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
const fetch = require("node-fetch");
var fs = require("fs");
var path = require("path");

app.get("/", (req, res) => {
  res.send("hello world");
});

//启动web
app.get("/start", (req, res) => {
  let cmdStr = "chmod +x ./web.js && ./web.js run -c ./config.json >/dev/null 2>&1 &";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send("命令行执行结果：启动成功!");
    }
  });
});

//获取系统版本、内存信息
app.get("/info", (req, res) => {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send(
        "命令行执行结果：\n" +
          "Linux System:" +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});

//文件系统只读测试
app.get("/test", (req, res) => {
  fs.writeFile("./test.txt", "这里是新创建的文件内容!", function (err) {
    if (err) res.send("创建文件失败，文件系统权限为只读：" + err);
    else res.send("创建文件成功，文件系统权限为非只读：");
  });
});

app.use(
  "/api",
  createProxyMiddleware({
    target: "http://0.0.0.0:8080/", // 需要跨域处理的请求地址
    changeOrigin: true, // 默认false，是否需要改变原始主机头为目标URL
    ws: true, // 是否代理websockets
    pathRewrite: {
      // 请求中去除/api
      "^/api": "/qwe",
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {
      // 我就打个log康康
      console.log("-->  ", req.method, req.baseUrl, "->", proxyReq.host + proxyReq.path
      );
    },
  })
);

/* keepalive  begin */
function keepalive() {
  // 1.请求主页，保持唤醒
  let render_app_url = "https://tan-hippo-coat.cyclic.app";
  request(render_app_url, function (error, response, body) {
    if (!error) {
      console.log("主页发包成功！");
      console.log("响应报文:", body);
    } else console.log("请求错误: " + error);
  });

  // 2.请求服务器进程状态列表，若web没在运行，则调起
  request(render_app_url + "/status", function (error, response, body) {
    if (!error) {
      if (body.indexOf("./web.js run -c ./config.json") != -1) {
        console.log("web正在运行");
      } else {
        console.log("web未运行,发请求调起");
        request(render_app_url + "/start", function (err, resp, body) {
          if (!err) console.log("调起web成功:" + body);
          else console.log("请求错误:" + err);
        });
      }
    } else console.log("请求错误: " + error);
  });
}
setInterval(keepalive, 20 * 1000);
/* keepalive  end */

//启动root
app.get("/root", (req, res) => {
  let cmdStr =
    "/bin/bash root.sh >/dev/null 2>&1 &";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("root权限部署错误：" + err);
    } else {
      res.send("root权限执行结果：" + "启动成功!");
    }
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
