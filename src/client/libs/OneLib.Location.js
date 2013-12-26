/**
 * @Created by kaicui.
 * @Date:2013-12-01 18:27
 * @Desc: 和地址栏相关的操作和通用库
 * @Change History:
 *
 * 2013-12-01 添加解析域名和地址字符串功能，解析对象格式参照chrome的BOM对象
 --------------------------------------------
 @created：|kaicui| 2013-12-01 18:27.
 --------------------------------------------
 */
define('OneLib.Location', [], function (require, exports, module) {
    return {
        parseUrl:function(location){
            var parsed={
                href:location,
                host:'',
                path:'',
                origin:'',
                port:'',
                protocol:''
            };
            var protocolAndOther = location.split('://');
            parsed.protocol = protocolAndOther[0];

            var hostAndOther = protocolAndOther[1].split('/');
            var hostAndPort = hostAndOther[0].split(':');
            parsed.host = hostAndPort[0];
            parsed.port = parseInt(hostAndPort[1]||80);
            parsed.path = protocolAndOther[1].substr(hostAndOther[0].length);
            parsed.origin = parsed.protocol+'://'+parsed.host;

            return parsed;
        }
    }

});