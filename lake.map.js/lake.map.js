// Lake 20160304
// https://github.com/hellolake/lake.js

var bmap_ak = {
	key:"5yG2Ep6NoV7OWUErStfE73El",		//Baidu Map API Key for test, not sure its stability. 测试用AK,不保证其稳定性.
	ver:"2.0"							//Version of API. API版本
};

(function(){

    if(!window.lake) window.lake = {};

	lake.map = function (fn,options) {
		if(!this.map.ak){
			this.map.ak = bmap_ak
		}
		if(options){
			for(var k in options){
				this.map.ak[k] = options[k]
			}
		}
		if(!this.map.loaded) {
			this.map.fns.push(fn)
		}else{
			fn.call(this.map)
		}
		if(!this.map.script){
			this.map.script = document.createElement("script");
			this.map.script.type = "text/javascript";
			this.map.script.src = "http://api.map.baidu.com/api?v="+this.map.ak.ver+"&ak="+this.map.ak.key+"&callback=lake.map.callback";
			document.body.appendChild(this.map.script);
		}
	};
	lake.map.loaded = false;
	lake.map.fns = [];
	lake.map.callback = function(){
		window.located = document.createEvent("HTMLEvents");
		window.located.initEvent("located",false,false);

		var _this = this;

		if(!this.bmap){
			this.bmap = function(wrapper,options){

				BMap.Map.call(this,wrapper,options);

				this.inited = false;
				this.fns = [];
				this.resolution = null;

				var _map = this,_user = _map.user;

				_map.addEventListener("moveend",resolve,true);
				_map.addEventListener("zoomend",resolve,true);

				function resolve(){
					var bounds = _map.getBounds(),
						lb = bounds.getSouthWest(),
						rt = bounds.getNorthEast(),
						distance = _map.getDistance(lb,rt);
					var size = _map.getSize(),
						diagonal = Math.sqrt(Math.pow(size.width,2)+Math.pow(size.height,2));
					_map.resolution = distance/diagonal;
				}

				var _marker = document.createElement("div");
				_marker.style.cssText = "padding:8px;background-color:#0af;border:.125em solid #fff;border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,.3);position;absolute;z-index:909;-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);display:none;";
				_user.marker = _this.overlay(_marker,{oninit:init_marker});
				var _circle = document.createElement("div");
				_circle.style.cssText = "padding:0;background-color:rgba(0,0,0,.125);border-radius:50%;position;absolute;z-index:808;-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);display:none;";
				_user.circle = _this.overlay(_circle,{oninit:init_circle});

				if(!lake.map.location){
					document.addEventListener("located",add,true);
				}else{
					add()
				}
				function add(){
					_map.addOverlay(_user.marker);
					_map.addOverlay(_user.circle);
					document.removeEventListener("located",add,true);
				}

				function init_marker(){
					this.update = function(type,location){
						if(type == "located"){
							this.setPosition(location)
						}
					}
				}

				function init_circle(){
					this.update = function(type,location,accuracy){
						if(type == "located"){
							this.setPosition(location)
						}
						this.obj.style.padding = accuracy/this.map.resolution + "px"
					}
				}

				document.addEventListener("located",update_user);
				_map.addEventListener("moveend",update_user);
				_map.addEventListener("zoomend",update_user);

				function update_user(e){
					if(typeof _user.marker.update == "function")_user.marker.update(e.type,lake.map.location,lake.map.accuracy);
					if(typeof _user.circle.update == "function")_user.circle.update(e.type,lake.map.location,lake.map.accuracy);
				}
			};
			this.bmap.prototype = new BMap.Map();
			this.bmap.prototype.constructor = this.bmap;

			this.bmap.prototype.setCenter = function(p){
				var _this = this;
				function center(){
					BMap.Map.prototype.setCenter.call(_this,p)
				}
				if(!_this.inited){
					_this.fns.push(center)
				}else{
					center()
				}
			};
			this.bmap.prototype.setZoom = function(z){
				var _this = this;
				function zoom(){
					BMap.Map.prototype.setZoom.call(_this,z)
				}
				if(!_this.inited){
					_this.fns.push(zoom)
				}else{
					zoom()
				}
			};

			this.bmap.prototype.user = function(marker,circle){
				var _map = this,_user = _map.user;
				if(marker instanceof BMap.Overlay){
					_map.removeOverlay(_user.marker);
					_user.marker = marker;
					addoverlay(_user.marker);
				}
				if(circle instanceof BMap.Overlay){
					_map.removeOverlay(_user.circle);
					_user.circle = circle;
					addoverlay(_user.circle);
				}
				if(marker === false){
					_map.removeOverlay(_user.marker);
					_user.marker = null;
				}
				if(circle === false){
					_map.removeOverlay(_user.circle);
					_user.circle = null;
				}
				function addoverlay(overlay){
					if(!lake.map.location){
						document.addEventListener("located",add,true);
						function add(){
							_map.addOverlay(overlay);
							document.removeEventListener("located",add,true);
						}
					}else{
						_map.addOverlay(overlay);
					}
				}
			};


		}

		this.loaded = true;
		for(var j = 0, k = this.fns.length; j < k; j++){
			this.fns[j].call(this)
		}
	};

	//create new map
	lake.map.new = function (container,location,zoom,options) {
		if(!this.loaded){
			console.error("Create map must run in callback fn with 'lake.map(callback)'.");
			return;
		}
		if(Object.prototype.toString.call(zoom) === "[object Object]"){
			options = zoom;
			zoom = undefined;
		}
		if(typeof location == "number"){
			zoom = location;
			location = undefined;
		}
		if(Object.prototype.toString.call(location) === "[object Object]" && !(location instanceof BMap.Point)){
			options = location;
			location = undefined;
		}
		if(!zoom){
			zoom = 15
		}
		var wrapper;
		if(typeof container == "string"){
			wrapper = document.querySelector(container)
		}else if (container.nodeType == 1){
			wrapper = container
		}else{
			console.error("Arg[0]:Container must be a selector string or an element.");
			return;
		}
		var map = new this.bmap(wrapper,options);
		map.enableScrollWheelZoom();
		map.enableContinuousZoom();
		if(location instanceof BMap.Point){
			map.centerAndZoom(location,zoom);
			map.inited = true;
		}else{
			map.centerAndZoom(new BMap.Point(116.404, 39.915),10);
			if(!location){
				map.inited = true;
			}else if(typeof location == "string"){
				var inner = map.getContainer().firstChild;
				inner.style.display = "none";
				var search = new BMap.LocalSearch("中国");
				search.setSearchCompleteCallback(function(r){
					if(search.getStatus() !== 0){
						console.error("Arg[1]:Unknown location.");
					}else{
						map.centerAndZoom(r.getPoi(0).point,zoom);
						inner.style.display = "";
						map.inited = true;
						var n = map.fns.length;
						if(n > 0){
							for(var i=0;i<n;i++){
								map.fns[i]()
							}
							map.fns = []
						}
					}
				});
				search.search(location);
			}else{
				console.error("Arg[1]:Location must be a location name or BMap Point.");
			}
		}

		return map;
	};

	//locate by BMap.Geolocation
	lake.map.gps = function(success,error,options){
		if(!lake.map.loaded){
			console.error("BMap Geolocation must run in callback fn with 'lake.map(callback)'.");
			return;
		}

		var _this = this.gps;
		_this.enableHighAccuracy = true;
		_this.timeout = 30000;
		_this.maximumAge = 7000;
		_this.success = [];
		_this.error = [];

		if(Object.prototype.toString.call(error) === "[object Object]"){
			options = error;
			error = undefined;
		}
		if(Object.prototype.toString.call(success) === "[object Object]"){
			options = success;
			success = undefined;
			error = undefined;
		}
		if(Object.prototype.toString.call(options) === "[object Object]"){
			for(var k in options){
				_this[k] = options[k]
			}
		}
		if(typeof error == "function"){
			_this.error = [error]
		}
		if(typeof success == "function"){
			_this.success = [success]
		}
		if(!_this.geo){
			_this.geo = new BMap.Geolocation()
		}
		if(_this.interval){
			_this.stop();
		}
	};
	lake.map.gps.locate = function(){
		if(!this.geo){
			console.error("Use 'lake.map.gps(success,error,options)' to initialize the GPS first.");
			return;
		}
		var _this = this;
		_this.geo.getCurrentPosition(function(r){
			if(this.getStatus() == BMAP_STATUS_SUCCESS){
				lake.map.location = r.point;
				lake.map.accuracy = r.accuracy;
				document.dispatchEvent(located);
				for(var i=0,j=_this.success.length;i<j;i++){
					_this.success[i].call(_this,r)
				}
			}else{
				for(var n=0,m=_this.error.length;n<m;n++){
					_this.error[n].call(_this,this.getStatus())
				}
			}
		},{enableHighAccuracy:_this.enableHighAccuracy,timeout:_this.timeout,maximumAge:_this.maximumAge})
	};
	lake.map.gps.run = function (){
		if(!this.geo){
			console.error("Use 'lake.map.gps(success,error,options)' to initialize the GPS first.");
			return;
		}
		if(this.interval){
			this.stop()
		}else{
			this.locate()
		}
		var _this = this;
		this.interval = setInterval(function(){_this.locate()},_this.maximumAge+100);
	};
	lake.map.gps.stop = function (){
		clearInterval(this.interval);
		this.interval = null;
	};
	lake.map.gps.add = function(type,fn){
		if(typeof type == "string"){
			if(typeof fn == "function"){
				if(type === "success"){
					this.success.indexOf(fn)<0 && this.success.push(fn)
				}else if(type === "error"){
					this.error.indexOf(fn)<0 && this.error.push(fn)
				}
			}
		}

	};
	lake.map.gps.del = function(type,fn){
		if(typeof type == "string"){
			if(typeof fn == "function"){
				if(type === "success"){
					this.success.splice(this.success.indexOf(fn),1);
				}else if(type === "error"){
					this.error.splice(this.error.indexOf(fn),1);
				}
			}else if(!fn){
				if(type === "success"){
					this.success = []
				}else if(type === "error"){
					this.error = []
				}
			}
		}
	};

	//locate by navigator.geolocation
	lake.map.geo = function(success,error,options){
		this.geo.enableHighAccuracy = true;
		this.geo.timeout = 30000;
		this.geo.maximumAge = 7000;
		this.geo.success = [];
		this.geo.error = [];
		if(Object.prototype.toString.call(error) === "[object Object]"){
			options = error;
			error = undefined;
		}
		if(Object.prototype.toString.call(success) === "[object Object]"){
			options = success;
			success = undefined;
			error = undefined;
		}
		if(Object.prototype.toString.call(options) === "[object Object]"){
			for(var k in options){
				this.geo[k] = options[k]
			}
		}
		if(typeof error == "function"){
			this.geo.error = [error]
		}
		if(typeof success == "function"){
			this.geo.success = [success]
		}
		if(this.geo.watch){
			this.geo.stop();
		}
	};
	lake.map.geo._success = function (result) {
		var _this = lake.map.geo;
		if(lake.map.loaded){
			lake.map.c2bp(result.coords,function(p){
				lake.map.location = p;
				document.dispatchEvent(located);
			});
			lake.map.accuracy = result.coords.accuracy;
		}
		for(var i=0,j=_this.success.length;i<j;i++){
			_this.success[i].call(_this,result)
		}
	};
	lake.map.geo._error = function (error){
		var _this = lake.map.geo;
		for(var n=0,m=_this.error.length;n<m;n++){
			_this.error[n].call(_this,error)
		}
	};
	lake.map.geo.locate = function (){
		if(this.watch){
			this.stop();
		}
		navigator.geolocation.getCurrentPosition(this._success, this._error, {enableHighAccuracy:this.enableHighAccuracy,timeout:this.timeout,maximumAge:this.maximumAge});
	};
	lake.map.geo.run = function (){
		if(this.watch){
			this.stop();
		}
		this.watch = navigator.geolocation.watchPosition(this._success, this._error, {enableHighAccuracy:this.enableHighAccuracy,timeout:this.timeout,maximumAge:this.maximumAge});
	};
	lake.map.geo.stop = function (){
		navigator.geolocation.clearWatch(this.watch);
		this.watch = null;
	};
	lake.map.geo.add = function(type,fn){
		if(typeof type == "string"){
			if(typeof fn == "function"){
				if(type === "success"){
					this.success.indexOf(fn)<0 && this.success.push(fn)
				}else if(type === "error"){
					this.error.indexOf(fn)<0 && this.error.push(fn)
				}
			}
		}

	};
	lake.map.geo.del = function(type,fn){
		if(typeof type == "string"){
			if(typeof fn == "function"){
				if(type === "success"){
					this.success.splice(this.success.indexOf(fn),1);
				}else if(type === "error"){
					this.error.splice(this.error.indexOf(fn),1);
				}
			}else if(!fn){
				if(type === "success"){
					this.success = []
				}else if(type === "error"){
					this.error = []
				}
			}
		}
	};

	//convert coordinate to BMap point
	lake.map.c2bp = function(coords,success,error){
		var ok = true, points = [];
		(function make(coords){
			if(coords.length == 2 && typeof coords[0] == "number" && typeof coords[1] == "number"){
				points.push(new BMap.Point(coords[0],coords[1]));
			}else if(coords.lng && coords.lat){
				points.push(new BMap.Point(coords.lng,coords.lat));
			}else if(coords.longitude && coords.latitude){
				points.push(new BMap.Point(coords.longitude,coords.latitude));
			}else if(coords.length){
				for (var i=0,j=coords.length;i<j;i++){
					if(!ok) break;
					make(coords[i]);
				}
			}else{
				ok = false;
				console.error("Can not convert "+coords+".");
			}
		})(coords);
		if(!ok) return;

		var convertor = new BMap.Convertor();

		convertor.translate(points, 1, 5, callback);
		function callback(data){
			if(data.status === 0) {
				for (var i = 0,j = data.points.length; i < j; i++) {
					success(data.points[i])
				}
			}else if(error){
				error(data.message);
			}
		}
	};

	//Convert element to BMap overlay
	lake.map.overlay = function(obj,point,option){
		var o, p, init = null, draw = null, drag = false, selectable = false;
		if(Object.prototype.toString.call(point) === "[object Object]" && !(point instanceof BMap.Point)){
				option = point;
				point = undefined;
		}
		if(option && option.drag === true){
			drag = true
		}
		if(option && option.selectable === true){
			selectable = true
		}
		if(option && typeof option.oninit == "function"){
			init = option.oninit
		}
		if(option && typeof option.ondraw == "function"){
			draw = option.ondraw
		}
		if(point instanceof BMap.Point){
			p = point
		}else if(!point){
			p = new BMap.Point(0,0);
		}else{
			console.error("Arg[1]:point must be a BMap Point or empty.");
			return;
		}
		if(obj.nodeType == 1){
			o = obj
		}else if(typeof obj == "string"){
			o = document.querySelector(obj)
		}else{
			console.error("Arg[0]:obj must be a selector string or an element.");
			return;
		}
		if(!this.overlay._overlay){
			this.overlay._overlay = function(obj,point,oninit,ondraw,drag,selectable){
				this.obj = obj;
				this.point = point;
				this.drag = drag;
				this.selectable = selectable;
				this.oninit = oninit;
				this.ondraw = ondraw;
			};
			this.overlay._overlay.prototype = new BMap.Overlay();
			this.overlay._overlay.prototype.constructor = this.overlay._overlay;
			this.overlay._overlay.prototype.initialize = function(map){
				this.map = map;
				map.getPanes().labelPane.appendChild(this.obj);
				//this.obj.style.zIndex = BMap.Overlay.getZIndex(this.point.lat);
				this.obj.style.position = "absolute";

				var _this = this;

				this.obj.addEventListener("click",function(e){if(_this.selectable===true){e.stopImmediatePropagation()}_this.dispatchEvent("click")});
				this.obj.addEventListener("dblclick",function(e){if(_this.selectable===true){e.stopImmediatePropagation()}_this.dispatchEvent("dblclick")});
				this.obj.addEventListener("mousedown",function(e){if(_this.selectable===true){e.stopImmediatePropagation()}_this.dispatchEvent("mousedown")});
				this.obj.addEventListener("mouseup",function(e){if(_this.selectable===true){e.stopImmediatePropagation()}_this.dispatchEvent("mouseup")});
				this.obj.addEventListener("mouseout",function(e){if(_this.selectable===true){e.stopImmediatePropagation()}_this.dispatchEvent("mouseout")});
				this.obj.addEventListener("mouseover",function(e){if(_this.selectable===true){e.stopImmediatePropagation()}_this.dispatchEvent("mouseover")});

				if(this.oninit)this.oninit.call(this,this);
				return this.obj;
			};
			this.overlay._overlay.prototype.draw = function(){
				var pixel = this.map.pointToOverlayPixel(this.point);
				this.obj.style.left = pixel.x + "px";
				this.obj.style.top  = pixel.y + "px";
				if(this.ondraw)this.ondraw.call(this,this);
			};
			this.overlay._overlay.prototype.setPosition = function(p){
				if(p instanceof BMap.Point){
					this.point = p;
					if(this.map) this.draw();
				}
			};
			this.overlay._overlay.prototype.getPosition = function(){
				return this.point
			};
			this.overlay._overlay.prototype.getMap = function(){
				return this.map
			};
			this.overlay._overlay.prototype.getObj = function(){
				return this.obj
			};


		}
		return new this.overlay._overlay(o,p,init,draw,drag,selectable);
	};

})();
