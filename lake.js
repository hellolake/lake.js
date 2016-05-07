// Lake 20160507
// http://hellolake.duapp.com/
// https://github.com/hellolake/lake.js

(function(){

    if(!window.lake) window.lake = {};

    lake.whats = function(obj,further){
        if(further!==true&&obj&&obj.nodeType==1) return "HTMLElement";
        else return Object.prototype.toString.call(obj).replace(/[\[\]\s]|object/g,"")
    };
    lake.select = function(obj){
        if(obj===window||obj.nodeType==9||obj.nodeType==1){
            return obj
        }else if(/(window|document)/.test(obj)){
            return eval(obj)
        }else{
            var objs;
            if(typeof(obj)=="string"){
                objs=document.querySelectorAll(obj)
            }else if(this.whats(obj)=="HTMLCollection"||this.whats(obj)=="NodeList"){
                objs=obj
            }else{
                console.error("Argument:"+obj+" can not be selected.");
                return null;
            }
            if(objs.length==1){
                return objs[0]
            }else if(objs.length>1){
                return objs;
            }else{
                console.error("No selectable element in: "+obj+".");
                return null;
            }
        }
    };
    lake.each = function(obj,fn,reverse){
        if(obj.length){
            var i,j;
            if(reverse === true) {
                i = obj.length;
                while(i--){
                    fn(obj[i], i)
                }
            }else{
                for (i = 0, j = obj.length; i < j; i++) {
                    fn.call(obj[i],obj[i], i)
                }
            }
        }else if(this.whats(obj)=="Object"){
            for(var k in obj){
                if(obj.hasOwnProperty(k)){
                    fn.call(obj[k],obj[k],k)
                }
            }
        }else{console.error("Arg[0]:"+obj+" can not be traversed.")}
    };
    lake.offset = function(obj,target){
        var o = this.select(obj),
            t = target?this.select(target):undefined;
        if(o.nodeType == 1){
            var t_bcr,o_bcr = o.getBoundingClientRect();
            if (!t || t.nodeType==9) {
                t_bcr = o.ownerDocument.documentElement.getBoundingClientRect();
                return {top: o_bcr.top-t_bcr.top, left: o_bcr.left-t_bcr.left};
            }else if(t === window){
                return {top: o_bcr.top, left: o_bcr.left}
            }else if (t.nodeType == 1) {
                t_bcr = t.getBoundingClientRect();
                return {top: o_bcr.top-t_bcr.top, left: o_bcr.left-t_bcr.left};
            }else{
                console.error("Arg[1]:"+target+" is not an element.")
            }
        }else{
            console.error("Arg[0]:"+obj+"is not an element.")
        }
    };
    lake.css = function(obj,css,internal){
        if(internal!==true){
            var o = this.select(obj);
            if(o.length){
                this.each(o,function(ele){ele.style.cssText += ";"+css})
            }else{
                o.style.cssText += ";"+css
            }
        }else{
            if(typeof(obj)=="string") {
                if (!this.style) {
                    this.style = document.createElement("style");
                    document.head.appendChild(this.style);
                }
                this.style.innerHTML += obj + "{" + css + "}"
            }else{
                console.error("Arg[0]:obj must be a selector string when enable internal.")
            }
        }
    };
    lake.match = function(element,selector,fn,basement){
        if(typeof selector == "string"){
            var _this = this,
                base = basement?basement:document,
                output = {};
            if(fn && fn.nodeType) base = fn;
            function test(obj,selector){
                if(obj.nodeType && obj.nodeType == 9){
                    return false
                }else if (/^\.\w+$/.test(selector)){
                    return obj.classList.contains(selector.replace(/\./,""))
                }else if (/^#\w+$/.test(selector)){
                    return obj.id == (selector.replace(/#/,""))
                }else if (/^\w+$/.test(selector)){
                    return obj.tagName == selector.toUpperCase()
                }else if(/:first-child$/.test(selector)){
                    return test(obj,selector.replace(/:first-child$/,"")) && obj.parentNode.firstElementChild === obj
                }else if(/:last-child$/.test(selector)){
                    return test(obj,selector.replace(/:last-child$/,"")) && obj.parentNode.lastElementChild === obj
                }
            }
            _this.each(selector.split(","),function(str1){
                var target = element,
                    result = true,
                    str2 = (str1.replace(/\s*([>\+~])\s*/g,"$1")).match(/\S+/g),
                    len = str2.length,
                    i = len;
                while(i--){
                    var _target = target,
                        str3 = str2[i].match(/[>\+~]|[#.]?\w+(?::\S+|\[\S+])?/g),
                        j = str3.length;
                    while(j--){
                        var str4 = str3[j];
                        if(/^[\.#]?\w+(?::\S+|\[\S+])?$/.test(str4)){
                            if(_target.nodeType){
                                if(!test(_target,str4)){
                                    if(i < len-1 && _target !== base){
                                        _target = _target.parentNode;
                                        j++;
                                    }else{
                                        result = false;
                                        break;
                                    }
                                }
                            }else if(_target.length){
                                result = false;
                                for(var k=0,n=_target.length;k<n;k++) {
                                    if (test(_target[k], str4)) {
                                        _target = _target[k];
                                        result = true;
                                        break;
                                    }
                                }
                            }
                        }else if(/^>$/.test(str4)){
                            _target = _target.parentNode
                        }else if(/^\+$/.test(str4)){
                            _target = _target.previousElementSibling
                        }else if(/^~$/.test(str4)){
                            var prevs = [],
                                prev_t = _target.previousElementSibling;
                            while (!prev_t){
                                prevs.push(prev_t);
                                prev_t = prev_t.previousElementSibling;
                            }
                            _target = prevs
                        }
                    }
                    if (!result || _target === base){
                        break;
                    }else{
                        _target = _target.parentNode
                    }
                }
                output[str1] = result;
                if (fn && typeof fn == "function"){
                    fn.call(target,result,str1)
                }
            });
            return output;
        }else{
            console.error("Arg[1]:selector must be a selector string.")
        }
    };
    lake.listen = function(target,event,fn,capture){
        var t = this.select(target);
        if(t.length){
            this.each(t, function (ele){
                ele.addEventListener(event,fn,capture===true)
            })
        }else{
            t.addEventListener(event,fn,capture===true)
        }
    };
    lake.deaf = function(target,event,fn,capture){
        var t = this.select(target);
        if(t.length){
            this.each(t, function (ele){
                ele.removeEventListener(event,fn,capture===true)
            })
        }else{
            t.removeEventListener(event,fn,capture===true)
        }
    };

//  lake.ajax
//  options:
//      {
//      type:(responseType)['arraybuffer'|'blob'|'document'|'json']
//      data:(data to send)
//      onload:[function]
//      onprogress:[function]
//      onabort:[function]
//      onerror:[function]
//      timeout:[number]
//      ontimeout:[function]
//      asyn:(asynchronously)[boolean]
//      credentials:[boolean]
//      name:[string]
//      password:[string]
//      header:{key1:value1,key2:value2...}
//      mime:[string]
//      }
    lake.ajax = function(method,url,options){
        var pars = {
            type:'',
            data:null,
            onloadstart:null,
            onload:null,
            onloadend:null,
            onprogress:null,
            onabort:null,
            onerror:null,
            timeout:5000,
            ontimeout:null,
            asyn:true,
            credentials:false,
            name:'',
            password:'',
            header:null,
            mime:null
        };
        if (options){
            for(var k in options){
                pars[k] = options[k]
            }
        }

        var xhr = new XMLHttpRequest(),
            action = method.toUpperCase(),
            base = !pars.data ? xhr : xhr.upload;

        if(pars.onloadstart){
            base.addEventListener('loadstart',function(event){
                pars.onloadstart(xhr,event)
            },false)
        }
        if(pars.onload){
            base.addEventListener('load',function(event){
                pars.onload(xhr,event)
            },false)
        }
        if(pars.onloadend){
            base.addEventListener('loadend',function(event){
                pars.onloadend(xhr,event)
            },false)
        }
        if(pars.onprogress){
            base.addEventListener('progress',function(event){
                pars.onprogress(xhr,event)
            },false)
        }
        if(pars.onabort){
            base.addEventListener('abort',function(event){
                pars.onabort(xhr,event)
            },false)
        }
        if(pars.onerror){
            base.addEventListener('error',function(event){
                pars.onabort(xhr,event)
            },false)
        }
        if(pars.ontimeout){
            base.addEventListener('timeout',function(event){
                pars.ontimeout(xhr,event)
            },false)
        }

        xhr.responseType = pars.type;
        xhr.withCredentials = pars.credentials;

        xhr.open(action,url,pars.asyn,pars.name,pars.password);
        xhr.timeout = pars.timeout;

        if(pars.header){
            for (var j in pars.header){
                xhr.setRequestHeader(j,pars.header[j])
            }
        }
        if(pars.mime){
            xhr.overrideMimeType(pars.mime)
        }

        xhr.send(pars.data);

        return xhr;
    };

    // Mutation Observer
    //Lake 20160223

    var _mo = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    _mo.prototype.add = function (obj, config) {
        var _this = this,target = lake.select(obj);
        var cfg, pars = {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false /*,attributeFilter:undefined*/
        };
        if(lake.whats(config) == "Object"){
            cfg = config;
        }
        if (!this.objs) this.objs = [];
        if (target.length) {
            lake.each(target, function (ele) {on(ele)})
        }else{
            on(target)
        }
        function on(element) {
            if(cfg){
                _this.observe(element,cfg);
                element._mo_cfg = cfg;
            }else if(element._mo_cfg){
                _this.observe(element,element._mo_cfg);
            }else{
                _this.observe(element,pars);
                element._mo_cfg = pars;
            }
            _this.objs.indexOf(element) < 0 && _this.objs.push(element);
        }
    };
    _mo.prototype.del = function (obj) {
        this.disconnect();
        if (obj && this.objs) {
            var target = lake.select(obj);
            var _this = this;
            if (target.length) {
                lake.each(target, function (ele) {off(ele)})
            }else{
                off(target)
            }
            function off(element) {
                element._mo_cfg && delete element._mo_cfg;
                _this.objs = _this.objs.filter(function (o) {
                    return o !== element
                })
            }
            _this.objs.length > 0 && _this.add(_this.objs);
        }
    };
    lake.mutation = function(fn){
        return new _mo(fn)
    };

    //Listener
    //Lake 20160301

    var _listener = function(selector,basement){
        var _this = this;
        this.listener = typeof selector == "string"?selector.trim().replace(/\s+/g," ").replace(/\s*([>\+~])\s*/g,"$1"):selector;
        this.basement = basement;
        this.event = {};
        this.target = {};
        this.main = function(e){
            _this.processor.call(this,e,_this)
        };
    };
    _listener.prototype = {
        processor:function (e,listener) {
            var _this = this,
                base = listener.basement === true ? _this : listener.basement.nodeType ? listener.basement : undefined;
            if(JSON.stringify(listener.event) != "{}"){
                if(listener.event[e.type].length > 0) lake.each(listener.event[e.type],function(f){f.call(e.target,e)})
            }
            if(JSON.stringify(listener.target) != "{}"){
                if (listener.target[e.type]){
                    lake.each(listener.target[e.type],function(ele,key){
                        if (ele.length > 0){
                            lake.match(e.target, key, function (result) {
                                result && lake.each(ele, function (f){f.call(e.target,e)})
                            }, base)
                        }
                    })
                }
            }
        },
        add:function(target,event,fn,capture){
            if(typeof fn == "boolean"){
                capture = fn;
                fn = undefined;
            }
            if(typeof target == "string" && typeof event == "function"){
                fn = event;
                event = target;
                target = undefined;
            }
            if(typeof target == "string" && typeof event == "string"){
                if(!document.querySelector(target)){
                    console.error("Arg[0]:target must be an available selector string.");
                    return;
                }else{
                    target = target.trim().replace(/\s+/g," ").replace(/\s*([>+~])\s*/g,"$1");
                }
            }
            var _this = this;
            if (!_this.event[event]){
                _this.event[event] = [];
                lake.listen(_this.listener,event,_this.main,capture);
            }
            if(target && target !== _this.listener) {
                if (!_this.target[event]) {
                    _this.target[event] = {};
                    _this.target[event][target] = [fn];
                }else if (!_this.target[event][target]){
                    _this.target[event][target] = [fn]
                }else{
                    _this.target[event][target].indexOf(fn) < 0 && _this.target[event][target].push(fn)
                }
            }else if(!target || target === _this.listener){
                _this.event[event].indexOf(fn) < 0 && _this.event[event].push(fn)
            }
        },
        del:function(target,event,fn,capture){
            var _this = this, fns, index;
            if(!target){
                lake.each(_this.event,function(e,key){
                    lake.deaf(_this.listener,key,_this.main,capture);
                    delete _this.event[key];
                    delete _this.target[key];
                })
            }else if(typeof target == "string" && !!document.querySelector(target)){
                if(typeof event == "string" && typeof fn == "function"){
                    fns = _this.target[event][target];
                    index = fns.indexOf(fn);
                    index > -1 && fns.splice(index,1);
                }else if(typeof event == "string" && !fn){
                    delete _this.target[event][target]
                }else if(!event){
                    lake.each(_this.target,function(event){
                        event[target] && delete event[target]
                    })
                }
            }else if(typeof target == "string"){
                if(typeof event == "function"){
                    fns = _this.event[target];
                    index = fns.indexOf(event);
                    index > -1 && fns.splice(index,1);
                }else if(!event){
                    _this.event[target].splice(0)
                }
            }else{
                console.error("Arguments must be like: (target,event,fn) or (target,event) or (target) to delete child event. (event,fn) or (event) to delete self event.")
            }
        }
    };
    lake.listener = function(selector,basement){
        return new _listener(selector,basement)
    };

})();