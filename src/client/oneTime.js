define('OneTime', ['OneLib.Location', 'OneLib.EventEmitter','global'], function (require, exports, module) {
    var locationParser = require('OneLib.Location');
    var eventEmitter = require('OneLib.EventEmitter');
    var window = require('global');

    Date.now = Date.now || function () {
        retrun (new Date()).valueOf();
    };


    var configs={
        syncTimes:5,//总共尝试向服务端发送同步请求的次数
        thresholdTime:150//请求的最大返回时间，超过此阈值的响应将不被处理
    };
    var currentJSONPCallback;//保存当前生效的JSONP回调函数
    //类定义
    function SynchronizeManager(){
        var self = this;//save the this ref

        self.serverLocation =undefined;
        self.progress=[];//时间同步的过程数据
        self.timeDiff =undefined;//最后算出来的客户端时间和服务端时间差(serverTime - clientTime),单位ms
    }

    /**
     * 批量计算每次同步尝试中的时间差，并取最小的为实际时间差
     */
    SynchronizeManager.prototype.calculateDiff = function(){
        var self = this;//save the this ref
        var minIndex= -1,min=undefined;
        for(var i=self.progress.length-1;i>=0;i--){
            var _item = self.progress[i];
            if(_item.t_clientRecv - _item.t_clientSend > configs.thresholdTime){
                _item.isTimeout = true;
                continue;
            }
            else{
                _item.isTimeout = false;
                //服务端与客户端时间差=服务端时间-客户端时间-（数据包从client传输到server端的时间）
                _item.timeDiff = _item.t_serverRecv - _item.t_clientSend -parseInt((_item.t_clientRecv-_item.t_clientSend )/2)

//                console.log('i=%s,_item.timeDiff = %s,min=%s',i,_item.timeDiff,min)
                //整体时间差取每次步骤中绝对值最小的：
                if(minIndex===-1||Math.abs(_item.timeDiff)<Math.abs(min)){
                    minIndex = i;
                    min = _item.timeDiff;
                }
            }
        }
        if(minIndex!==-1){
            self.timeDiff = min;
        }
    }

    /**
     * 开始同步时间
     * @param url
     */
    SynchronizeManager.prototype.begin = function(url){
        var self = this;//save the this ref
        //初始化操作
        self.serverLocation = locationParser.parseUrl(url);
        self.timeDiff = undefined;
        self.progress =[];

        var currentLocation = locationParser.parseUrl(document.location.href);

        function _xhrPolling(){

            //判断当前polling次数是否已经到了配置次数
            if(self.progress.length>=configs.syncTimes){
                self.calculateDiff();//计算时间差,得到最终结果
                self.emit('finish',self.timeDiff,self.progress);
            }
            else{
//                console.log('_xhrPolling...');
                var xhrRequest;
                function changeHandler () {
                    console.log('xhrRequest.readyState:%s',xhrRequest.readyState);
                    if (xhrRequest.readyState == 2) {
                        if (xhrRequest.status == 200) {
                            self.progress[self.progress.length-1].t_serverRecv = parseInt(xhrRequest.getResponseHeader('s_t')) ;
                            self.progress[self.progress.length-1].t_clientRecv = Date.now() ;
                        }
                    }
                    _xhrPolling()
                }

                if (window.XMLHttpRequest) {
                    //Firefox, Opera, IE7, and other browsers will use the native object
                    xhrRequest = new XMLHttpRequest();
                } else {
                    //IE 5 and 6 will use the ActiveX control
                    xhrRequest = new ActiveXObject("Microsoft.XMLHTTP");
                }

                xhrRequest.onreadystatechange = changeHandler;
                xhrRequest.open('HEAD', url+'?r='+Math.random(), true);

                xhrRequest.send(null);
                //初始化步骤
                self.progress.push({
                    isTimeout:undefined,//是否是超过阈值的请求，不予处理
                    timeDiff:undefined,//本次测试得到的时间差结果
                    t_clientSend:Date.now(),//客户端发送的时间
                    t_serverRecv:undefined,//服务端收到的时间
                    t_clientRecv:undefined//服务端回发到客户端的时间
                });
            }
        }
        function _jsonpPolling(){
            //判断当前polling次数是否已经到了配置次数
            if(self.progress.length>=configs.syncTimes){
                self.calculateDiff();//计算时间差,得到最终结果
                self.emit('finish',self.timeDiff,self.progress);
            }
            else{
//                console.log('_jsonpPolling...');

                var _script = document.createElement('script');
                var head = document.getElementsByTagName('head')[0];
                var clear=function(){
                    head.removeChild(_script);
                    _script=null;
                };
                _script.type ='text/javascript';
                _script.charset ='utf-8';
                currentJSONPCallback = function (time){
                    self.progress[self.progress.length-1].t_serverRecv = parseInt(time) ;
                    self.progress[self.progress.length-1].t_clientRecv = Date.now() ;
                    clear();
                    _jsonpPolling();
                }

                //append a script tag into the html document's body tag.and download the script
                _script.src=url+'?r='+Math.random();

                head.appendChild(_script);
                //初始化步骤
                self.progress.push({
                    isTimeout:undefined,//是否是超过阈值的请求，不予处理
                    timeDiff:undefined,//本次测试得到的时间差结果
                    t_clientSend:Date.now(),//客户端发送的时间
                    t_serverRecv:undefined,//服务端收到的时间
                    t_clientRecv:undefined//服务端回发到客户端的时间
                });
            }
        }

        //判断目标域名是不是和脚本所在域名一致，如果一致，则发送ajax请求，使用head方法
        if(self.serverLocation.host.toLowerCase() === currentLocation.host.toLowerCase()){
            _xhrPolling();
        }
        //如果不一致，则使用jsonp方式请求目标域名的时间数据
        else{
            _jsonpPolling();
        }

    };

    eventEmitter.mixin(SynchronizeManager);
    exports.SynchronizeManager = SynchronizeManager;
    exports.JSONP = function(time){
        currentJSONPCallback&&currentJSONPCallback(time)
    }
    exports.setConfigs = function(cfg){
        for( i in cfg){
            if(configs.hasOwnProperty(i)){
                configs[i] = cfg[i]
            }
        }
    }
});
