/**
 * @Created by kaicui.
 * @Date:2013-12-01 21:25
 * @Desc: 提供类似node.js的eventEmitter的事件发布处理机制
 * 1、
 * 2、
 * @Change History:
 --------------------------------------------
 @created：|kaicui| 2013-12-01 21:25.
 --------------------------------------------
 */

define('OneLib.EventEmitter', [], function (require, exports, module) {

    function EventEmitter(){};
    EventEmitter.prototype	= {
        on	: function(event, fct){
            this._events = this._events || {};
            this._events[event] = this._events[event]	|| [];
            this._events[event].push(fct);
        },
        off	: function(event, fct){
            this._events = this._events || {};
            if( event in this._events === false  )	return;
            for(var i=this._events[event].length-1;i>=0;i--){
                var _item = this._events[event][i];
                if(_item.toString() === fct.toString()){
                    this._events[event].splice(i, 1);
                }
            }
        },
        emit	: function(event /* , args... */){
            this._events = this._events || {};
            if( event in this._events === false  )	return;
            for(var i = 0; i < this._events[event].length; i++){
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    };


    exports.EventEmitter	= EventEmitter;
    exports.mixin	= function(destObject){
        var props	= ['on', 'off', 'emit'];
        for(var i = 0; i < props.length; i ++){
            if( typeof destObject === 'function' ){
                destObject.prototype[props[i]]	= EventEmitter.prototype[props[i]];
            }else{
                destObject[props[i]] = EventEmitter.prototype[props[i]];
            }
        }
    }

});