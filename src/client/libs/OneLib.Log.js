/*
作者： kaicui

依赖： 无
使用说明：
1、自定义的日志输出类
-----------
版本历史：

2012年3月25日10:18:02      版本创建
//////////////////////////////////////////////////////////////////*/

var global = global||window;
var OneLib = (function (my) {return my;} (global['OneLib'] || (global['OneLib']={})));

OneLib.Log = (function (my) {
    my.configs = {
        enable: undefined //全局是否启用日志标志,为undefined则不影响内部配置,为true则无视内部配置，全部有效，为false则全部无效
    };
    /**
     * 修改全局日志配置
     * @param configs
     */
    my.config = function (configs) {
        for (var i in configs){
            my.configs[i] = configs[i];
        }
    };

    /**
     * 类定义：日志记录器
     * @constructor
     */
    my.Logger = function(enable){
        var self = this;//save the this ref

        self.enable = enable;
        self.count=0;
        var _style="color:red;",
            _logMethod,
        /**
         * 根据传入类型，获取对应的log方法
         * @param type:0代表console,1代表DOM
         * @return {Function}
         * @private
         */
        _getRewrittenLog =function (type){
            if(type ===0 && (window.console&&window.console.log)){
                var _l= function (msg){
                    self.count++;//增加次数
                    console.log(msg);
                };
                return _l;
            }
            else{
                var _l2= function (msg){
                    self.count++;//增加次数
                    var h3 = document.createElement('h3');
                    h3.style.cssText = _style;
                    h3.className ='__log__';
                    if(h3.hasOwnProperty('innerText')){
                        h3.innerText = msg;
                    }
                    else{
                        h3.textContent = msg;
                    }
                    document.body.appendChild(h3);
                };
                return _l2;
            }
        };

        /**
         * 写一行日志
         * @param msg
         */
        self.writeLine = function (msg) {
            if (OneLib.Log.configs.enable===true || (self.enable === true && OneLib.Log.configs.enable!==false)){
                _logMethod(msg);
            }
        };

        /**
         * 清除所有日志
         */
        self.clear = function(){
            //todo:如何在没有jquery的情况下一次删除所有的DOM日志，需要考虑
        };
        /**
         * 设置采用body文本时的样式
         * @param style:
         */
        self.setStyle=function(style){
            _style = style;
        };

        /**
         * 设置写log方式：
         * @param mode:0代表console,1代表DOM
         */
        self.setMode=function(mode){
            _logMethod = _getRewrittenLog(mode)
        };
        self.setMode(1);
    };
    return my;
} (OneLib.Log || {}));
