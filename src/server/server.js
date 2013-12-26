/**
 * @Created by kaicui.
 * @Date:2013-12-01 15:10
 * @Desc: 时间同步server端服务器
 * 1、支持跨域获取时间服务
 * 2、使用head头，如果请求为get,则表示使用jsonp方式获取时间，如果请求为head,则表示使用ajax方式获取时间
 * @Change History:
 --------------------------------------------
 @created：|kaicui| 2013-12-01 15:10.
 --------------------------------------------
 */

/*
 todo:imports
 */
var Http = require('http');
var url = require('url');


var port = process.argv[2]||require('./config').port;


console.log('Server will running at http://0.0.0.0:%s/',port);

var server = Http.createServer(function(req,res){
    //如果是head,则表示同域同步时间
    if(req.method.toUpperCase() ==='HEAD'){
        res.writeHead(200, {'Content-Type': 'text/plain',s_t:Date.now()});
        res.end();
    }
    //否则jsonp方式
    else {
        //下面的代码用来测试客户端超时
//        setTimeout(function(){
//            res.writeHead(200, {'Content-Type': 'text/javascript; charset=UTF-8'});
//            res.end('OneLib.CMDSyntax.require("OneTime").exports.JSONP('+Date.now()+')');
//        },parseInt(131+Math.random()*10));

        res.writeHead(200, {'Content-Type': 'text/javascript; charset=UTF-8'});
        res.end('OneLib.CMDSyntax.require("OneTime").exports.JSONP('+Date.now()+')');
    }

}).listen(port, '0.0.0.0');


console.log('Server running at http://0.0.0.0:%s/',port);