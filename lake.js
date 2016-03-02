// Lake 20160116

(function(){

    if(!window.lake) window.lake = {};

    lake.whats = function(obj,further){
        if(further!==true&&obj.nodeType==1) return "HTMLElement";
        else return Object.prototype.toString.call(obj).replace(/[\[\]\s]|object/g,"")
    };
    lake.select = function(obj){
        if(obj===window||obj.nodeType==9||obj.nodeType==1){
            return obj
        }else if(/(window|document)/.test(obj)){
            return eval(obj)
        }else{
            var objs,arr=[];
            if(typeof(obj)=="string"){
                objs=document.querySelectorAll(obj)
            }else if(this.whats(obj)=="HTMLCollection"||this.whats(obj)=="NodeList"){
                objs=obj
            }else if(this.whats(obj)=="Array"||this.whats(obj)=="Object"){
                this.each(obj,function(ele){ele.nodeType==1&&arr.push(ele)});
                objs = arr;
            }else{
                console.error("'obj':"+obj+" can not be selected.");
                return null;
            }
            if(objs.length==1){
                return objs[0]
            }else if(objs.length>1){
                return objs
            }else{
                console.error("No selectable element in 'obj':"+obj+".");
                return null;
            }
        }
    };
    lake.each = function(obj,fn,reverse){
        if(obj.length){
            var i;
            if(reverse === true) {
                i = obj.length;
                while(i--){
                    fn(obj[i], i)
                }
            }else{
                for (i = 0; i < obj.length; i++) {
                    fn(obj[i], i)
                }
            }
        }else if(this.whats(obj)=="Object"){
            for(var k in obj){
                if(obj.hasOwnProperty(k)){
                    fn(obj[k],k)
                }
            }
        }else{console.error("'obj' can not be traversed.")}
    };
    lake.offset = function(obj,target){
        var o = this.select(obj),
            t = target?this.select(target):undefined;
        if(o.nodeType == 1){
            var o_bcr = o.getBoundingClientRect();
            if (!t || t.nodeType==9) {
                var o_doc_top = o.ownerDocument.body.scrollTop,
                    o_doc_left = o.ownerDocument.body.scrollLeft;
                return {top: o_bcr.top + o_doc_top, left: o_bcr.left + o_doc_left};
            }else if(t === window){
                return {top: o_bcr.top, left: o_bcr.left}
            }else if (t.nodeType == 1) {
                var t_bcr = t.getBoundingClientRect();
                return {top: t_bcr.top-o_bcr.top, left: t_bcr.left-o_bcr.left};
            }else{
                console.error("'target':"+target+" is not an element.")
            }
        }else{
            console.error("'obj':"+obj+"is not an element.")
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
                console.error("'obj':"+obj+" must be a string.")
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
                if (/^\.\w+$/.test(selector)){
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
                    i = str2.length;
                while(i--){
                    var _target = target,
                        str3 = str2[i].match(/[>\+~]|[#.]?\w+(?::\S+|\[\S+])?/g),
                        j = str3.length;
                    while(j--){
                        var str4 = str3[j];
                        if(/^[\.#]?\w+(?::\S+|\[\S+])?$/.test(str4)){
                            if(_target.nodeType){
                                if(!test(_target,str4)){
                                    result = false;
                                    break;
                                }
                            }else if(_target.length){
                                result = false;
                                for(var k=0;k<_target.length;k++) {
                                    if (test(_target[k], str4)) {
                                        _target = _target[k];
                                        result = true;
                                        break;
                                    }
                                }
                                break;
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
                    if (!result || target === base){
                        break;
                    }else{
                        target = target.parentNode
                    }
                }
                output[str1] = result;
                if (fn && typeof fn == "function"){
                    fn(result,str1)
                }
            });
            return output;
        }else{
            console.error("'selector' must be a selector string.")
        }
    };
    lake.listen = function(target,event,fn,capture){
        var t = this.select(target);
        if(t.length){
            this.each(t, function (ele){
                ele.addEventListener(event, fn, capture===true)
            })
        }else{
            t.addEventListener(event, fn, capture===true)
        }
    };
    lake.deaf = function(target,event,fn){
        var t = this.select(target);
        if(t.length){
            this.each(t, function (ele){
                ele.removeEventListener(event, fn)
            })
        }else{
            t.removeEventListener(event, fn)
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
//      }
    lake.ajax = function(method,url,options){

        var xhr = new XMLHttpRequest(),
            action = method.toUpperCase(),
            data = options.data?options.data:null,
            base = data===null?xhr:xhr.upload,
            asyn = options.asyn?options.asyn:true,
            name="",password="";

        if(options.onload){
            base.addEventListener('load',function(event){
                options.onload(xhr,event)
            },false)
        }
        if(options.onprogress){
            base.addEventListener('progress',function(event){
                options.onprogress(xhr,event)
            },false)
        }
        if(options.onabort){
            base.addEventListener('abort',function(event){
                options.onabort(xhr,event)
            },false)
        }
        if(options.onerror){
            base.addEventListener('error',function(event){
                options.onabort(xhr,event)
            },false)
        }
        if(options.ontimeout){
            base.addEventListener('timeout',function(event){
                options.ontimeout(xhr,event)
            },false)
        }

        if(options.type){xhr.responseType=options.type}
        if(options.credentials){xhr.withCredentials=options.credentials}
        if(options.name&&options.password){name=options.name;password=options.password;}

        xhr.open(action,url,asyn,name,password);
        xhr.timeout = options.timeout?options.timeout:5000;
        if(options.header){
            for (var k in options.header){
                xhr.setRequestHeader(k,options.header[k])
            }
        }

        xhr.send(data);

        return xhr;
    };

    // Mutation Observer
    //Lake 20160223

    var _mo = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    _mo.prototype.add = function (obj, config) {
        var target = lake.select(obj);
        var cfg = config ? config : {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false /*,attributeFilter:null*/
        };
        var __this = this;
        if (!__this.objs) __this.objs = [];
        if (target.length) {
            lake.each(target, function (ele) {
                __this.observe(ele, cfg);
                __this.objs.indexOf(ele) < 0 && lake.objs.push(ele);
            })
        }else{
            __this.observe(target, cfg);
            __this.objs.indexOf(target) < 0 && __this.objs.push(target);
        }
    };
    _mo.prototype.del = function (obj) {
        this.disconnect();
        if (obj && this.objs) {
            var target = lake.select(obj);
            var __this = this;
            if (target.length) {
                lake.each(target, function (ele) {
                    __this.objs = __this.objs.filter(function (o) {
                        return o !== ele
                    });
                })
            }else{
                __this.objs = __this.objs.filter(function (o) {
                    return o !== target
                });
            }
            __this.objs.length > 0 && __this.on(__this.objs);
        }
    };
    lake.mutation = function(fn){
        return new _mo(fn)
    };

    //Listener
    //Lake 20160301

    var _listener = function(selector,event,fn,capture){
        var __this = this;
        __this.base = typeof selector == "string"?selector.trim().replace(/\s+/g," ").replace(/\s*([>\+~])\s*/g,"$1"):selector;
        __this.event = {};
        __this.target = {};
        __this.main = function(e){
            var ___this = this;
            if(JSON.stringify(__this.event) != "{}"){
                if(__this.event[e.type].length > 0) lake.each(__this.event[e.type],function(f){f(e)})
            }
            if(JSON.stringify(__this.target) != "{}"){
                if (__this.target[e.type]){
                    lake.each(__this.target[e.type],function(ele,key){
                        if (ele.length > 0){
                            lake.match(e.target, key, function (result) {
                                result && lake.each(ele, function (f){f(e)})
                            }, ___this)
                        }
                    })
                }
            }
        };
        if(event && fn) {
            __this.event[event] = [fn];
            lake.listen(__this.base,event,__this.main,capture);
        }
    };
    _listener.prototype = {
        add:function(target,event,fn,capture){
            if(typeof target == "string" && typeof event == "string" && typeof fn == "function"){
                if(!document.querySelector(target)){
                    console.error("'target':"+target+" must be an available selector string.");
                    return false;
                }
                target = target.trim().replace(/\s+/g," ").replace(/\s*([>+~])\s*/g,"$1");
            }else if(typeof target == "string" && typeof event == "function"){
                capture = fn; fn = event; event = target;target = undefined
            }else{
                console.error("arguments must be like : (target,event,fn[,capture]) or (event,fn[,capture])");
                return false;
            }
            var __this = this;
            if (!__this.event[event]){
                __this.event[event] = [];
                lake.listen(__this.base,event,__this.main,capture);
            }
            if(target && target !== __this.base) {
                if (!__this.target[event]) {
                    __this.target[event] = {};
                    __this.target[event][target] = [fn];
                }else if (!__this.target[event][target]){
                    __this.target[event][target] = [fn]
                }else{
                    __this.target[event][target].indexOf(fn) < 0 && __this.target[event][target].push(fn)
                }
            }else if(!target || target === __this.base){
                __this.event[event].indexOf(fn) < 0 && __this.event[event].push(fn)
            }
        },
        del:function(target,event,fn){
            var __this = this, fns, index;
            if(!target){
                lake.each(__this.event,function(e,key){
                    lake.deaf(__this.base,key,__this.main);
                    delete __this.event[key];
                    delete __this.target[key];
                })
            }else if(typeof target == "string" && !!document.querySelector(target)){
                if(typeof event == "string" && typeof fn == "function"){
                    fns = __this.target[event][target];
                    index = fns.indexOf(fn);
                    index > -1 && fns.splice(index,1);
                }else if(typeof event == "string" && !fn){
                    delete __this.target[event][target]
                }else if(!event){
                    lake.each(__this.target,function(event){
                        event[target] && delete event[target]
                    })
                }
            }else if(typeof target == "string"){
                if(typeof event == "function"){
                    fns = __this.event[target];
                    index = fns.indexOf(event);
                    index > -1 && fns.splice(index,1);
                }else if(!event){
                    __this.event[target].splice(0)
                }
            }else{
                console.error("arguments must be like: (target,event,fn) or (target,event) or (target) to delete child event. (event,fn) or (event) to delete self event.")
            }
        }
    };
    lake.listener = function(selector,event,fn,capture){
        return new _listener(selector,event,fn,capture)
    };

})();
