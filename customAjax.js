/** 
  * @author Pedro Carrazco fzn.webdesign@gmail.com
  * @desc this class is a shortcut to make quick Ajax calls
  *
*/

"use strict";
var Ajax = function(e){
	this.method = null;
	this.endpoint = null;
	this.ready = false;
	this.validations = {
		rest:{
			"index":  {m:"GET"},
			"show":   {m:"GET",   id:true},
			"create": {m:"POST",          data:true},
			"update": {m:"PUT",   id:true,data:true},
			"remove": {m:"DELETE",id:true},
		},
		methods: [],
		allMethods: ["GET","HEAD","POST","PUT","DELETE","CONNECT","OPTIONS"]
	};
	this.callbacks = {
		success: null,
		error: null,
		always: null
	}
	this.req = null;
	this.init(e);
	return this;
}
Ajax.prototype = {
	init: function(e){
		if(this.ready)
			return this;
		if (window.XMLHttpRequest) {
			this.req = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			this.req = new ActiveXObject("Microsoft.XMLHTTP");
		}
		this.setEndpoint(e);
		/* FU IE */
		Array.prototype.includes = Array.prototype.includes || function includes(el){var i,l,f=0;for(i=0,l=this.length;i<l;i++){if(this[i]==el){f=1;break;}}return f;};
		this.ready = true;
	},
	setEndpoint: function(e){
		var e = e || false;
		if(typeof e != "string")
			return this;
		this.endpoint = e;
		return this;
	},
	setMethods: function(arr){
		var arr = arr instanceof Array ? arr : [],
			i,len;
		this.validations.methods = [];
		for(i = 0, len = arr.length; i < len; i++){
			if(typeof arr[i] == "string" && this.validations.allMethods){
				this.validations.methods.push(arr[i].toUpperCase());
			};
		}
		return this;
	},
	send: function(op,id,data){
		var op = op || false,
			id = id || false,
			data = data || false,
			rest = this.validations.rest[op] || false,
			m = false,
			allM = this.validations.methods.length && this.validations.methods.length > 0 ? this.validations.methods : this.validations.allMethods,
			url = this.endpoint || false,
			err = new Error(),
			me = this;
		if(!url){
			err.message = "No endpoint specified, set the endpoint by calling setEndpoint() method";
			throw err;
			return this;
		}
		m = typeof op != "string" ? false : rest ? rest.m || false : op;
		if(!m || !allM.includes(m.toUpperCase())){
			if(rest){
				err.message = "The REST Operation " + op.toString().toUpperCase() + " is not recognied as a valid REST call";
			}else{
				err.message = "The method " + m.toString().toUpperCase() + " is not included on the allowed methods list: " + allM.join(",");
			}
			throw err;
			return this;
		}
		m = m.toUpperCase();
		if(rest && !this.validateRest(rest,id,data)){
			err.message = "The REST operation " + op.toString().toUpperCase() + " is invalid or there's an id/data missing." ;
			throw err;
			return this;
		}
		if(id){
			url += url.charAt(url.length - 1) == "/" ? + id : "/" + id;
		}
		data = data ? this.prepareData(data) : null;
		url += m == "GET" && data ? "?" + data : "";
		this.req.open(m, url, true);
		this.req.onreadystatechange = function(){
			var res = me.req.response;
			try{
				res = JSON.parse(res);
			}catch(e){}
			if (me.req.readyState === XMLHttpRequest.DONE) {
				if(me.req.status == 1 || me.req.status == 200){
					if(me.callbacks.success instanceof Function)
						me.callbacks.success.call(me.req,res);
				}else{
					if(me.callbacks.error instanceof Function)
						me.callbacks.error.call(me.req,res);
				}
				if(me.callbacks.always instanceof Function)
					me.callbacks.always.call(me.req,res);
			}
		};
		this.req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		this.req.send(data);
		return this;
	},
	validateRest: function(rest,id,data){
		var rest = rest || {},
			id = id || false,
			data = data || false;
		return !((rest.id && !id) || (rest.data && !data));
	},
	prepareData: function(data){
		var d = data || false,
			t = typeof d,
			res = null,
			i,len,a,b;
		switch(t){
			case "string":
				res = d;
			break;
			case "object":
				res = "";
				if(d instanceof Array){
					for(i = 0, len = d.length; i < len; i = i + 2){
						a = d[i] || "";
						b = d[i+1] || "";
						res += encodeURIComponent(a) + "=" + encodeURIComponent(b) + "&";
					}
				}else{					
					for(i in d){
						a = i || "";
						b = d[i] ? d[i].toString() : "";
						res += encodeURIComponent(a) + "=" + encodeURIComponent(b) + "&";
					}
				}
			break;
		}
		return res;
	},
	/* Callbacks */
	onSuccess: function(f){
		var f = f instanceof Function ? f : false;
		this.callbacks.success = f || null;
		return this;
	},
	onError: function(f){
		var f = f instanceof Function ? f : false;
		this.callbacks.error = f || null;
		return this;
	},
	then: function(f){
		var f = f instanceof Function ? f : false;
		this.callbacks.always = f || null;
		return this;
	},
	/* Shortcuts */
	index: function(){ this.send("index"); return this;},
	show: function(id){ this.send("show",id); return this;},
	create: function(data){ this.send("create",false,data); return this;},
	update: function(id,data){ this.send("update",id,data); return this;},
	remove: function(id){ this.send("remove",id); return this;},
	post: function(data){ this.send("post",false,data); return this;},
	get: function(data){ this.send("get",false,data); return this;}
}

// Add a / as the first character on the next line to uncomment:
/*
var test = new Ajax("http://demo4196005.mockable.io/sometests");
//test.get();					// Basic get request
test.post({some:"thing"}).then(function(res){console.log(this.status);});	// Basic post request

var test2 = new Ajax();

test2
	.setEndpoint("http://demo4196005.mockable.io/sometests")
//	.setMethods(["post"]) // Set a array of allowed methods
	.onSuccess(function(res){console.log("success",res)})
	.onError(function(res){console.log("error:",this.status)})
	.then(function(res){console.log("executed after success or fail.")})
	.show(1);
	
// test2.index();					// Rest Index operation (GET - Endpoint)
// test2.show(1);					// Rest Show operation (GET - Endpoint/id)
// test2.create({foo:"bar"});		// Rest Create operation (POST - Endpoint > data)
// test2.update(2, {foo:"bar"});	// Rest Update operation (PUT - Endpoint/id > data)
// test2.remove("3");				// Rest Show operation (REMOVE - Endpoint/id)
// */
