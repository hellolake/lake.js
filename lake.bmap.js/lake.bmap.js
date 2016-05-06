// Lake 20160503
// https://hellolake.duapp.com
// https://github.com/hellolake/lake.js

var bmap_ak = {
	key:"5yG2Ep6NoV7OWUErStfE73El",		//Baidu Map API Key for test, not sure its stability. 测试用AK,不保证其稳定性.
	ver:"2.0"							//Version of API. API版本
};

(function(){

    if(!window.lake) window.lake = {};

	lake.bmap = function (fn,options) {
		if(options && options.key){
			bmap_ak.key = options.key
		}
		if(options && options.ver){
			bmap_ak.ver = options.ver
		}

		var _this = this.bmap;
		_this.ak = bmap_ak;

		if(!_this.loaded) {
			_this.fns.push(fn)
		}else{
			fn.call(_this)
		}
		if(!_this.script){
			_this.script = document.createElement("script");
			_this.script.type = "text/javascript";
			_this.script.src = "http://api.map.baidu.com/api?v="+_this.ak.ver+"&ak="+_this.ak.key+"&callback=lake.bmap.callback";
			document.body.appendChild(_this.script);
		}
	};
	lake.bmap.loaded = false;
	lake.bmap.fns = [];
	lake.bmap.callback = function(){
		window.located = document.createEvent("HTMLEvents");
		window.located.initEvent("located",false,false);

		var _this = this;

		if(!this._bmap){
			this._bmap = function(wrapper,options){

				BMap.Map.call(this,wrapper,options);

				this.container = wrapper;
				this.dblzoom = true;
				this.inited = false;
				this.fns = [];
				this.resolution = null;
				this.lngres = null;
				this.latres = null;
				this.marker = null;
				this.circle = null;

				var _map = this;

				document.addEventListener("located",function () {
					_map.dispatchEvent("located",{location:lake.bmap.location,accuracy:lake.bmap.accuracy});
				});

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
					_map.lngres = (rt.lng-lb.lng)/size.width;
					_map.latres = (rt.lat-lb.lat)/size.height;
				}

				var _marker = document.createElement("div");
				_marker.style.cssText = "padding:8px;background-color:#0af;border:.125em solid #fff;border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,.3);position:absolute;z-index:909;-webkit-transform:translate3d(-50%,-50%,0);transform:translate3d(-50%,-50%,0);display:none;";
				_map.marker = _this.overlay(_marker,{oninit:init_marker});
				var _circle = document.createElement("div");
				_circle.style.cssText = "padding:0;background-color:rgba(0,0,0,.125);border-radius:50%;position:absolute;z-index:808;-webkit-transform:translate3d(-50%,-50%,0);transform:translate3d(-50%,-50%,0);display:none;";
				_map.circle = _this.overlay(_circle,{oninit:init_circle});

				if(!lake.bmap.location){
					document.addEventListener("located",add,true);
				}else{
					add()
				}
				function add(){
					document.removeEventListener("located",add,true);
					_map.addOverlay(_map.marker);
					_map.addOverlay(_map.circle);
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
						this.element.style.padding = accuracy/this.map.resolution + "px"
					}
				}

				document.addEventListener("located",update_user);
				_map.addEventListener("moveend",update_user);
				_map.addEventListener("zoomend",update_user);

				function update_user(e){
					_map.marker&&_map.marker.update&&_map.marker.update(e.type,lake.bmap.location,lake.bmap.accuracy);
					_map.circle&&_map.circle.update&&_map.circle.update(e.type,lake.bmap.location,lake.bmap.accuracy);
				}
			};
			this._bmap.prototype = new BMap.Map();
			this._bmap.prototype.constructor = this._bmap;

			this._bmap.prototype.setCenter = function(point){
				var _this = this;
				function center(){
					BMap.Map.prototype.setCenter.call(_this,point)
				}
				if(!_this.inited){
					_this.fns.push(center)
				}else{
					center()
				}
			};
			this._bmap.prototype.setZoom = function(level){
				var _this = this;
				function zoom(){
					BMap.Map.prototype.setZoom.call(_this,level)
				}
				if(!_this.inited){
					_this.fns.push(zoom)
				}else{
					zoom()
				}
			};
			this._bmap.prototype.addOverlay = function(overlay){
				var _this = this;
				function add(){
					BMap.Map.prototype.addOverlay.call(_this,overlay)
				}
				if(!_this.inited){
					_this.fns.push(add)
				}else{
					add()
				}
			};
			this._bmap.prototype.enableDoubleClickZoom = function(){
				this.dblzoom = true;
			};
			this._bmap.prototype.disableDoubleClickZoom = function(){
				this.dblzoom = false;
			};

			this._bmap.prototype.user = function(marker,circle){
				var _map = this;
				if(marker instanceof BMap.Overlay){
					_map.removeOverlay(_map.marker);
					_map.marker = marker;
					addoverlay(_map.marker);
				}
				if(circle instanceof BMap.Overlay){
					_map.removeOverlay(_map.circle);
					_map.circle = circle;
					addoverlay(_map.circle);
				}
				if(marker === false){
					_map.removeOverlay(_map.marker);
					_map.marker = null;
				}
				if(circle === false){
					_map.removeOverlay(_map.circle);
					_map.circle = null;
				}
				function addoverlay(overlay){
					if(!lake.bmap.location){
						document.addEventListener("located",add,true);
						function add(){
							document.removeEventListener("located",add,true);
							_map.addOverlay(overlay);
						}
					}else{
						_map.addOverlay(overlay);
					}
				}
			};
			this._bmap.prototype.path = function(points,onprocess,onerror,option){
				var path =  new _path(this);
				path.draw(points,onprocess,onerror,option);
				return path;
			}
		}
		function _path(map){
			this.map = map;
			this.policy = 1;
			this.color = "#FF3300";
			this.opacity = 0.65;
			this.width = 4;
			this.style = "solid";
			this.exist = true;
			this.visible = true;
			this.focus = true;
		}
		_path.prototype.draw = function(points,onprocess,onerror,option){
			if(Object.prototype.toString.call(onerror) == "[object Object]"){
				option = onerror;
				onerror = undefined;
			}
			if(Object.prototype.toString.call(onprocess) == "[object Object]"){
				option = onprocess;
				onprocess = undefined;
				onerror = undefined;
			}
			if(typeof onerror != "function"){
				onerror = undefined
			}
			if(typeof onprocess != "function"){
				onprocess = undefined
			}
			if(option&&option.color){
				this.color = option.color
			}
			if(option&&option.opacity){
				this.opacity = option.opacity
			}
			if(option&&option.width){
				this.width = option.width
			}
			if(option&&option.style){
				this.style = option.style
			}
			if(option&&option.policy){
				this.policy = option.policy
			}
			if(option&&typeof option.focus == "boolean"){
				this.focus = option.focus
			}

			if(Object.prototype.toString.call(points) == "[object Array]"){
				this.points = points
			}
			if(!this.points||this.points.length==0){
				console.error("Arg[0]:points must be a location/point array.");
				return;
			}

			if(!this.role)this.role = new BMap.DrivingRoute(this.map,{renderOptions:{map: this.map, autoViewport: false}});
			this.role.setPolicy(this.policy);
			this.role.setSearchCompleteCallback(process);

			if(this.lines)this.remove();
			this.exist = true;
			this.lines = [];
			this.waypoints = [];
			this.distance = 0;
			var _this = this,i = 0;
			function process(result){
				var max = _this.points.length;
				if(i<max){
					if(i < max-1){
						var code = _this.role.getStatus();
						if(code != 0){
							for(i;i<max;i++){
								_this.waypoints[i] = _this.points[i]
							}
							onerror.call(_this,code,i,_this.waypoints[i]);
							return;
						}else{
							var route = result.getPlan(0).getRoute(0),arr = route.getPath();
							i==0&&_this.waypoints.push(arr[0]);
							_this.waypoints.push(arr[arr.length-1]);
							var line = new BMap.Polyline(arr,{strokeColor:_this.color,strokeOpacity:_this.opacity,strokeWeight:_this.width,strokeStyle:_this.style});
							_this.exist&&_this.map.addOverlay(line);
							!_this.visible&&line.hide();
							_this.lines.push(line);
							_this.distance += route.getDistance(false);
							_this.role.clearResults();
						}
					}
					onprocess&&onprocess.call(_this,i,_this.waypoints[i]);
					i++;
					if(i < max-1){
						_this.role.search(_this.waypoints[i], _this.points[i+1]);
					}else if(i == max-1){
						process();
						_this.focus&&_this.map.setViewport(_this.waypoints,{margins:[24,24,24,24]})
					}
				}
			}
			function search(){_this.role.search(_this.points[i], _this.points[i+1]);}
			this.map.inited?search():this.map.fns.push(search);
		};
		_path.prototype.setPolicy = function(policy){
			this.policy = policy;
			this.role&&this.role.setPolicy(policy)
		};
		_path.prototype.setColor = function(color){
			this.color = color;
			if(this.lines){
				for(var i=0,j=this.lines.length;i<j;i++){
					this.lines[i].setStrokeColor(color);
					if(lake.bmap.touchable){this.remove();this.add()}
				}
			}
		};
		_path.prototype.setOpacity = function(opacity){
			this.opacity = opacity;
			if(this.lines){
				for(var i=0,j=this.lines.length;i<j;i++){
					this.lines[i].setStrokeOpacity(opacity);
					if(lake.bmap.touchable){this.remove();this.add()}
				}
			}
		};
		_path.prototype.setWidth = function(width){
			this.width = width;
			if(this.lines){
				for(var i=0,j=this.lines.length;i<j;i++){
					this.lines[i].setStrokeWeight(width);
				}
				if(lake.bmap.touchable){this.remove();this.add()}
			}
		};
		_path.prototype.setStyle = function(style){
			this.style = style;
			if(this.lines){
				for(var i=0,j=this.lines.length;i<j;i++){
					this.lines[i].setStrokeStyle(style);
					if(lake.bmap.touchable){this.remove();this.add()}
				}
			}
		};
		_path.prototype.enableFocus = function(){
			this.focus = true
		};
		_path.prototype.disableFocus = function(){
			this.focus = false
		};
		_path.prototype.show = function(){
			this.visible = true;
			if(this.lines)for(var i=0,j=this.lines.length;i<j;i++)this.lines[i].show()
		};
		_path.prototype.hide = function(){
			this.visible = false;
			if(this.lines)for(var i=0,j=this.lines.length;i<j;i++)this.lines[i].hide()
		};
		_path.prototype.add = function(){
			this.exist = true;
			if(this.lines)for(var i=0,j=this.lines.length;i<j;i++)this.map.addOverlay(this.lines[i])
		};
		_path.prototype.remove = function(){
			this.exist = false;
			if(this.lines)for(var i=0,j=this.lines.length;i<j;i++)this.map.removeOverlay(this.lines[i])
		};

		this.loaded = true;
		for(var j = 0, k = this.fns.length; j < k; j++){
			this.fns[j].call(this)
		}
	};

	//create new map
	lake.bmap.new = function (container,location,zoom,options) {
		if(!this.loaded){
			console.error("Create map must run in callback fn with 'lake.bmap(callback)'.");
			return;
		}
		if(Object.prototype.toString.call(zoom) == "[object Object]"){
			options = zoom;
			zoom = undefined;
		}
		if(typeof location == "number"){
			zoom = location;
			location = undefined;
		}
		if(Object.prototype.toString.call(location) == "[object Object]" && !(location instanceof BMap.Point)){
			options = location;
			location = undefined;
		}
		if(!zoom){
			zoom = 13
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
		if(!this.count){
			this.count = 1
		}else{
			this.count++
		}

		var map = new this._bmap(wrapper,options);

		map.enableScrollWheelZoom();
		BMap.Map.prototype.disableDoubleClickZoom.call(map);
		map.addEventListener("dblclick",function(e){this.dblzoom&&this.centerAndZoom(e.point, this.getZoom()+1)});

		function inits(){
			var n = map.fns.length;
			if(n > 0){
				for(var i=0;i<n;i++){
					map.fns[i]()
				}
				map.fns = []
			}
		}

		if(typeof location == "string"){
			var _this = this,search = new BMap.LocalSearch("ȫ��");
			map.addEventListener("moving",function(){_this.count>1&&map.dispatchEvent("onloadcode")});
			search.setSearchCompleteCallback(function(r){
				if(search.getStatus() !== 0){
					console.error("Arg[1]:Unknown location.");
				}else{
					map.centerAndZoom(r.getPoi(0).point,zoom);
					map.inited = true;
					inits();
				}
			});
			if(this.count == 1){
				search.search(location)
			}else{
				setTimeout(function(){search.search(location)},30*this.count)
			}
		}else{
			if(location instanceof BMap.Point){
				map.centerAndZoom(location,zoom)
			}else if(!location){
				map.centerAndZoom(new BMap.Point(116.404, 39.915),zoom)
			}else{
				console.error("Arg[1]:Location must be a location name or BMap Point.");
				return;
			}
			map.inited = true;
			inits();
		}

		return map;
	};

	//locate by BMap.Geolocation
	lake.bmap.gps = function(success,error,options){
		if(!lake.bmap.loaded){
			console.error("BMap Geolocation must run in callback fn with 'lake.bmap(callback)'.");
			return;
		}

		var _this = this.gps;
		_this.enableHighAccuracy = true;
		_this.timeout = 30000;
		_this.maximumAge = 7000;
		_this.success = [];
		_this.error = [];

		if(Object.prototype.toString.call(error) == "[object Object]"){
			options = error;
			error = undefined;
		}
		if(Object.prototype.toString.call(success) == "[object Object]"){
			options = success;
			success = undefined;
			error = undefined;
		}
		if(Object.prototype.toString.call(options) == "[object Object]"){
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
	lake.bmap.gps.locate = function(){
		if(!this.geo){
			console.error("Use 'lake.bmap.gps(success,error,options)' to initialize the GPS first.");
			return;
		}
		var _this = this;
		_this.geo.getCurrentPosition(function(r){
			if(this.getStatus() == 0){
				lake.bmap.location = r.point;
				lake.bmap.accuracy = r.accuracy;
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
	lake.bmap.gps.run = function (){
		if(!this.geo){
			console.error("Use 'lake.bmap.gps(success,error,options)' to initialize the GPS first.");
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
	lake.bmap.gps.stop = function (){
		clearInterval(this.interval);
		this.interval = null;
	};
	lake.bmap.gps.add = function(type,fn){
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
	lake.bmap.gps.del = function(type,fn){
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
	lake.bmap.c2p = function(coords,success,error,directly){
		if(typeof error == "boolean"){
			directly = error;
			error = undefined;
		}
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
		if(directly === true){
			success(points);
			return points;
		}

		var convertor = new BMap.Convertor();

		convertor.translate(points, 1, 5, callback);
		function callback(data){
			if(data.status === 0) {
				success(data.points)
			}else if(error){
				error&&error(data.message);
			}
		}
	};

	lake.bmap.touchable = "ontouchstart" in window;

    if(lake.bmap.touchable){
		lake.bmap.platform = {
			type: "Mobile",
			start : "touchstart",
			move : "touchmove",
			end : "touchend",
			cancel: "touchcancel"
		}
	}else{
		lake.bmap.platform = {
			type: "PC",
			start : "mousedown",
			move : "mousemove",
			end : "mouseup",
			cancel : "mouseup"
		}
	}

	//Convert element to BMap overlay
	lake.bmap.overlay = function(element,point,option){
		var o, p, init = null, draw = null, drag = false, slip = false;
		if(Object.prototype.toString.call(point) == "[object Object]" && !(point instanceof BMap.Point)){
				option = point;
				point = undefined;
		}
		if(option && option.slip === true){
			slip = true
		}
		if(option && option.draggable === true){
			drag = true
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
		if(element.nodeType == 1){
			o = element
		}else if(typeof element == "string"){
			o = document.querySelector(element)
		}else{
			console.error("Arg[0]:element must be a selector string or an element.");
			return;
		}

		if(!this.overlay._event){
			this.overlay._event = function(e){
				if(e.touches){
					var touch = e.touches[0] || e.changedTouches[0];
					this.clientX = touch.clientX;
					this.clientY = touch.clientY;
					this.screenX = touch.screenX;
					this.screenY = touch.screenY;
					this.pageX = touch.pageX;
					this.pageY = touch.pageY;
					this.touches = e.touches;
					this.targetTouches = e.targetTouches;
					this.changedTouches = e.changedTouches;
				}else{
					this.clientX = e.clientX;
					this.clientY = e.clientY;
					this.screenX = e.screenX;
					this.screenY = e.screenY;
					this.pageX = e.pageX;
					this.pageY = e.pageY;
				}
				this.srcElement = e.srcElement;
				this.domEvent = e;
			};
			this.overlay._event.prototype = {
				preventDefault: function () {
					this.domEvent.preventDefault()
				},
				stopImmediatePropagation: function () {
					this.domEvent.stopImmediatePropagation()
				},
				stopPropagation: function () {
					this.domEvent.stopPropagation()
				}
			}
		}

		if(!this.overlay._overlay){
			this.overlay._overlay = function(element,point,oninit,ondraw,drag,slip){
				this.element = element;
				this.point = point;
				this.slip = slip;
				this.draggable = drag;
				this.oninit = oninit;
				this.ondraw = ondraw;
				this.inited = false;
				this.dragging = false;
			};
			this.overlay._overlay.prototype = new BMap.Overlay();
			this.overlay._overlay.prototype.constructor = this.overlay._overlay;
			this.overlay._overlay.prototype.initialize = function(map){
				this.map = map;
				this.map.getPanes().labelPane.appendChild(this.element);

				var _this = this,_obj = this.element,start = false,click = true,hover = false,
					platform = lake.bmap.platform,props = lake.bmap.overlay._event;

				//_obj.style.zIndex = BMap.Overlay.getZIndex(this.point.lat);
				_obj.style.position = "absolute";
				_obj.style.cursor = "pointer";

				if(!this.inited){
					_obj.addEventListener("click",function(e){e.stopPropagation()});
					_obj.addEventListener("dblclick",function(e){_this.dispatchEvent("dblclick",new props(e))});
					_obj.addEventListener(platform.start,function(e){_this.slip&&e.stopPropagation();e.preventDefault();_this.dispatchEvent(platform.start,new props(e));start=click=true});
					_obj.addEventListener(platform.move,function(e){_this.slip&&e.stopPropagation();_this.dispatchEvent(platform.move,new props(e));start&&(click=false)});
					_obj.addEventListener(platform.end,function(e){_this.slip&&e.stopPropagation();_this.dispatchEvent(platform.end,new props(e));click&&_this.dispatchEvent("click",new props(e));click=true});
					_obj.addEventListener("touchcancel",function(e){_this.dispatchEvent("touchcancel",new props(e))});
					_obj.addEventListener("mouseenter",function(e){_this.dispatchEvent("mouseover",new props(e));hover=true});
					_obj.addEventListener("mouseleave",function(e){_this.dispatchEvent("mouseout",new props(e));hover=false});
					_obj.addEventListener("mouseover",function(e){_this.dispatchEvent("mouseover",new props(e))});
					_obj.addEventListener("mouseout",function(e){_this.dispatchEvent("mouseout",new props(e))});

					!lake.bmap.touchable&&document.addEventListener("click",function(e){start&&!hover&&e.stopPropagation();start=false},true)
				}

				if(this.oninit)this.oninit.call(this,this);
				this.inited = true;
				if(this.draggable === true) this.enableDragging();
				return _obj;
			};
			this.overlay._overlay.prototype.draw = function(){
				var pixel = this.map.pointToOverlayPixel(this.point);
				this.element.style.left = pixel.x + "px";
				this.element.style.top  = pixel.y + "px";
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
			this.overlay._overlay.prototype.getElement = function(){
				return this.element
			};
			this.overlay._overlay.prototype._dragmappan = function(){
				this._dragoverlaymove(-this.panx,-this.pany);
				this.map.panBy(this.panx,this.pany,{noAnimation:true});
			};
			this.overlay._overlay.prototype._dragoverlaymove = function(x,y){
				var _obj = this.element;
				if(x != 0)_obj.style.left = _obj.offsetLeft + x + "px";
				if(y != 0)_obj.style.top = _obj.offsetTop + y + "px";
				this.point = this.map.overlayPixelToPoint({x:_obj.offsetLeft,y:_obj.offsetTop});
			};
			this.overlay._overlay.prototype._dragstartfn = function(e){
                if(this.draggable === true){
					e.preventDefault();
					e.stopPropagation();
					this.dragstart = true;
					this.maprect = this.map.getContainer().getBoundingClientRect();
					this.mapleft = this.maprect.left;
					this.mapright = this.maprect.right;
					this.maptop = this.maprect.top;
					this.mapbottom = this.maprect.bottom;
					this._oldX = e.touches?e.touches[0].clientX:e.clientX;
					this._oldY = e.touches?e.touches[0].clientY:e.clientY;
				}
			};
			this.overlay._overlay.prototype._dragmovefn = function(e){
                if(this.dragstart === true) {
					e.preventDefault();
					e.stopPropagation();

                    var props = lake.bmap.overlay._event;
                    if(!this.dragging){
                        this.dispatchEvent("dragstart",new props(e));
                    }
					this.dragging = true;
					this.dispatchEvent("dragging",new props(e));

					var x = e.touches?e.touches[0].clientX:e.clientX,y = e.touches?e.touches[0].clientY:e.clientY,left = this.mapleft,right = this.mapright,top = this.maptop,bottom = this.mapbottom;

					if(x > left && x < right){
						this.movex = x-this._oldX;
					}else{
						this.movex = 0;
					}
					if(x <= left+32){
						this.panx = 8;
					}else if(x >= right-32){
						this.panx = -8;
					}else{
						this.panx = 0;
					}

					if(y > top && y < bottom){
						this.movey = y-this._oldY;
					}else{
						this.movey = 0;
					}
					if(y <= top+32){
						this.pany = 8;
					}else if(y >= bottom-32){
						this.pany = -8;
					}else{
						this.pany = 0;
					}

					this._oldX = x;
					this._oldY = y;

					this._dragoverlaymove(this.movex,this.movey);

					if(this.panx == 0 && this.pany == 0){
						if(this.paning){
							this.paning = false;
							clearInterval(this.interval);
						}
					}else{
						if(!this.paning){
							this.paning = true;
							var _this = this;
							function pan(){
								_this._dragmappan()
							}
							this.interval = setInterval(pan,32)
						}
					}
				}
			};
			this.overlay._overlay.prototype._dragendfn = function(e){
				if(this.dragstart === true){
					this.dragstart = false;
					if(this.paning){
						this.paning = false;
						clearInterval(this.interval);
					}
					if(this.dragging){
						e.preventDefault();
						e.stopPropagation();
						this.dragging = false;
						this.dispatchEvent("dragend",new lake.bmap.overlay._event(e));
					}
				}
			};

			this.overlay._overlay.prototype.enableDragging = function(){
                if(this.inited){
					this.draggable = true;
					var _this = this, platform = lake.bmap.platform;
					if(!this.dragstartfn){
						this.dragstartfn = function(e){
							_this._dragstartfn.call(_this,e)
						};
						this.dragmovefn = function(e){
							_this._dragmovefn.call(_this,e)
						};
						this.dragendfn = function(e){
							_this._dragendfn.call(_this,e)
						};
					}
                    if(!this._attach){
                        this.addEventListener(platform.start,this.dragstartfn);
						document.addEventListener(platform.move,this.dragmovefn,true);
						document.addEventListener(platform.end,this.dragendfn,true);
                        this._attach = true;
					}
				}else{
					console.error("Enable dragging must put overlay into map first.");
				}
			};
			this.overlay._overlay.prototype.disableDragging = function() {
				if(this.inited){
					this.draggable = this._attach = false;
					var platform = lake.bmap.platform;
					this.removeEventListener(platform.start,this.dragstartfn);
					document.removeEventListener(platform.move,this.dragmovefn,true);
					document.removeEventListener(platform.end,this.dragendfn,true);
                }
			};
			this.overlay._overlay.prototype.enableSlip = function() {
				this.slip = true
			};
			this.overlay._overlay.prototype.disableSlip = function() {
				this.slip = false
			}
		}
		return new this.overlay._overlay(o,p,init,draw,drag,slip);
	};

	//Input tips
	lake.bmap.tips = function(target,location,option){
		var input = document.querySelector(target),
			opt = {input:input,location:location},
			select,hover;

		if(option){
			option.types&&(opt.types = option.types);
			option.oncomplete&&(opt.onSearchComplete = option.oncomplete);
			typeof option.onselect == "function"&&(select = option.onselect);
			typeof option.onhover == "function"&&(hover = option.onhover);
		}

		var ac = new BMap.Autocomplete(opt);

		select&&ac.addEventListener("onconfirm",function(e){select.call(this,e)});
		hover&&ac.addEventListener("onhighlight",function(e){hover.call(this,e)});

		return ac;
	}

})();
