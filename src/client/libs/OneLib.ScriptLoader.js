/**
 * @Created by kaicui(https://github.com/wbpmrck).
 * @Date:2013-08-17 21:19
 * @Desc: 用于异步加载js文件
 * @Change History:
 --------------------------------------------
 @created：|kaicui| 2013-08-17 21:19.
 --------------------------------------------
 */

var global = global||window;
var OneLib = (function (my) {return my;} (global['OneLib'] ||(global['OneLib']={})));

OneLib.ScriptLoader = (function (my) {
    var _allQueue={

    };

    /**
     * 不分先后顺序的下载并执行外部js
     *
     * @param url
     * @param callback:参数里会有当时下载的url带出（url,beginAt,endAt）
     */
    my.loadScript = function(url,callback,charset){
        var beginAt,backCall=function(){
            callback&&callback(url, beginAt,new Date());
        };

        var head = document.getElementsByTagName('head')[0];
        var clear=function(){
            _script.onload=_script.onreadystatechange=_script.onerror=null;
            head.removeChild(_script);
//            head=_script=null;
            _script=null;
        };
        var _script = document.createElement('script');
        _script.type ='text/javascript';
        _script.charset =charset||'utf-8';
        if (_script.readyState) {//IE
            _script.onreadystatechange =function(){
                if (_script.readyState=='loaded'||_script.readyState=='complete') {
//                    _script.onreadystatechange == null;
                    clear();
                    backCall();
                };

            }
        }
        else{
            _script.onload = function(){
                clear();
                backCall();
            };
        }
        //append a script tag into the html document's body tag.and download the script
        _script.src=url;

        beginAt = new Date();
        head.appendChild(_script);
    };


    /**
     * 类：脚本队列。（一个队列内部的脚本按照声明的顺序挨个下载，完成一个下载另外一个。可以动态在后面追加）
     * @param fileUrls:可以直接传入一个队列文件列表
     * @constructor
     */
    function ScriptQueue(name,fileUrls){
        var self = this;//save the this ref

        self.name = name;
        self.fileUrls = []; //所有待下载的文件列表 每个项目:{url:'http://xxx/js',state:0/1,desc:'下载出错',beginAt:Date,endAt:Date}
        var urlArray = fileUrls||[];
        self.load(urlArray);

        self.running = false;//当前是否在现在
        self.runAt = -1;//当前下载到的节点下标
        self.loaded =0; //已经成下载的文件个数

        self.callbacks={
            onOne:[],
            onFinish:[]
        };
    };

    /**
     * 添加一个项目到当前待下载队列尾部
     * @param url:可以是一个string,或者是一个array
     */
    ScriptQueue.prototype.load = function(url){
        var self = this;//save the this ref

        if(url.constructor === Array){
            for(var i=0,j=url.length;i<j;i++){
                var _item = url[i];
                self.fileUrls.push({
                    url:_item,
                    state:0,
                    desc:'初始化',
                    beginAt:undefined,//开始下载时间
                    endAt:undefined//下载完成时间
                });
            }
        }
        else{
            self.fileUrls.push({
                url:url,
                state:0,
                desc:'初始化',
                beginAt:undefined,//开始下载时间
                endAt:undefined//下载完成时间
            });
        }
        return self;
    };
    /**
     * 注册加载完成事件，队列里每一个脚本加载完，都会回调
     * 回调参数:cb(url,beginAt,endAt)
     * 注意：要保证回调函数不出异常，否则其他的下载动作将不会执行。因为现在回调是同步调用的
     * @param callback
     */
    ScriptQueue.prototype.onLoadedOne = function(callback){
        callback&&this.callbacks.onOne.push(callback);
        return this;
    };

    /**
     * 注册全部完成事件，该队列已经加载到队尾的时候触发。
     * 如果多次追加项目到队列，并调用队列的start,会在每次全部完成后触发该事件。
     * 回调参数:cb(beginAt,endAt)
     * @param callback
     */
    ScriptQueue.prototype.onFinish = function(callback){
        callback&&this.callbacks.onFinish.push(callback);
        return this;
    };

    ScriptQueue.prototype.clearCallbacks = function(){
        var self = this;//save the this ref
        self.callbacks.onOne=[];
        self.callbacks.onFinish=[];
        return self;
    };

    /**
     * 开始队列的异步下载行为(如果已经在下载，则不处理)
     */
    ScriptQueue.prototype.asyncStart = function(){
        var self = this;//save the this ref

        //如果正在下载，则什么都不做
        if(self.running){
            return;
        }
//        var _oldStart =-1;
        //如果有需要下载的文件，才触发下载循环
        if(self.runAt<self.fileUrls.length-1){
//            _oldStart = self.runAt;
            _asyncDownloadOne();
        }

        function _asyncDownloadOne(){
            //看是否有要下载的文件
            if(self.runAt<self.fileUrls.length-1){
                //开始下载下一个文件
                self.running = true;
                self.runAt+=1;

                var _nowFile = self.fileUrls[self.runAt];
                my.loadScript(_nowFile.url,function(url,begin,end){
                    _nowFile.beginAt = begin;
                    _nowFile.endAt = end;
                    self.loaded++;

                    //每个下载完成之后，触发对应的事件
                    for(var m=0,n=self.callbacks.onOne.length;m<n;m++){
                        var _item = self.callbacks.onOne[m];
                        _item(url,begin,end);
                    }

                    //如果已经下载成功的个数等于所有文件个数
                    if(self.loaded===self.fileUrls.length){
                        for(var m2=0,n2=self.callbacks.onFinish.length;m2<n2;m2++){
                            var _item2 = self.callbacks.onFinish[m2];
                            _item2(self.fileUrls[self.runAt].beginAt,self.fileUrls[self.runAt].endAt);
                        }
                    }
                });
                _asyncDownloadOne(); //继续触发下一次调用
            }
            //队列全部下载完，触发finish
            else{
                self.running = false;//异步模式下，只要所有文件都开始下载了，running就恢复false.而不是全部下载成功才为false
            }
        }

    };

    /**
     * 开始队列的同步下载行为(如果已经在下载，则不处理)
     */
    ScriptQueue.prototype.start = function(){
        var self = this;//save the this ref

        //如果正在下载，则什么都不做
        if(self.running){
            return;
        }
//        var _oldStart =-1;
        //如果有需要下载的文件，才触发下载循环
        if(self.runAt<self.fileUrls.length-1){
//            _oldStart = self.runAt;
            _downloadOne();
        }

        function _downloadOne(){
            //看是否有要下载的文件
            if(self.runAt<self.fileUrls.length-1){
                //开始下载下一个文件
                self.running = true;
                self.runAt+=1;

                var _nowFile = self.fileUrls[self.runAt];
                my.loadScript(_nowFile.url,function(url,begin,end){
                    _nowFile.beginAt = begin;
                    _nowFile.endAt = end;

                    self.loaded++;

                    //每个下载完成之后，触发对应的事件
                    for(var m=0,n=self.callbacks.onOne.length;m<n;m++){
                        var _item = self.callbacks.onOne[m];
                        _item(url,begin,end);
                    }
                    _downloadOne();
                });

            }
            //队列全部下载完，触发finish
            else{
                self.running = false;

                for(var m=0,n=self.callbacks.onFinish.length;m<n;m++){
                    var _item = self.callbacks.onFinish[m];
//                    _item(self.fileUrls[_oldStart+1].beginAt,self.fileUrls[_oldStart+1].endAt);
                    _item(self.fileUrls[self.runAt].beginAt,self.fileUrls[self.runAt].endAt);
                }

            }
        }

    };


    /**
     * create a queue
     * @param queueName
     */
    my.beginQueue = function(queueName,initFiles){
        var q = _allQueue[queueName] = new ScriptQueue(queueName,initFiles);
        return q;
    };
    /**
     * find a exist queue
     * @param queueName
     */
    my.theQueue = function(queueName){
        return _allQueue[queueName];
    };

    return my;
} (OneLib.ScriptLoader || {}));
