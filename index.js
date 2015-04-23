var util = require('util'),
	request = require('request'),
	events = require('events'),
	cheerio = require('cheerio'),
	URI = require('uri-js');

var debug;

if (/\bmetainspector\b/.test(process.env.NODE_DEBUG)) {
  debug = function() {
    console.error('METAINSPECTOR %s', util.format.apply(util, arguments));
  };
} else {
  debug = function() {};
}

function withDefaultScheme(url){
	return URI.parse(url).scheme ? url : "http://" + url;
}

var MetaInspector = function(url, options){
	this.url = URI.normalize(withDefaultScheme(url));
	this.options = options || {};

	this.parsedUrl = URI.parse(this.url);
	this.scheme = this.parsedUrl.scheme;
	this.host = this.parsedUrl.host;
	this.rootUrl = this.scheme + "://" + this.host;
  
  //this.removeAllListeners();
};

//MetaInspector.prototype = new events.EventEmitter();
MetaInspector.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = MetaInspector;

MetaInspector.prototype.getTitle = function()
{
	debug("Parsing page title");

	if(this.title === undefined)
	{
		this.title = this.parsedDocument('title').text();
	}

	return this;
}

MetaInspector.prototype.getMetaDescription = function()
{
	debug("Parsing page description based on meta elements");

	if(!this.description)
	{
		this.description = this.parsedDocument("meta[name='description']").attr("content");
	}

	return this;
}

MetaInspector.prototype.getSecondaryDescription = function()
{
	debug("Parsing page secondary description");
	var _this = this;

	if(!this.description)
	{
		var minimumPLength = 120;

		this.parsedDocument("p").each(function(i, elem){
			if(_this.description){
				return;
			}

			var text = _this.parsedDocument(this).text();

			// If we found a paragraph with more than
			if(text.length >= minimumPLength) {
				_this.description = text;
			}
		});
	}

	return this;
}

MetaInspector.prototype.getDescription = function()
{
	debug("Parsing page description based on meta description or secondary description");
	this.getMetaDescription() && this.getSecondaryDescription();

	return this;
}

MetaInspector.prototype.getImage = function()
{
	debug("Parsing page image based on the Open Graph image");

	if(!this.image)
	{
		this.image = this.parsedDocument("meta[property='og:image']").attr("content");
	}

	return this;
}

MetaInspector.prototype.getKeywords = function()
{
	debug("Parsing page keywords based on meta elements");

	if(!this.keywords)
	{
		this.keywords = this.parsedDocument("meta[name='keywords']").attr("content");
	}

	return this;
}

MetaInspector.prototype.initAllProperties = function()
{
	// title of the page, as string
	this.getTitle()
			.getDescription()
			.getImage()
			.getKeywords();
}

MetaInspector.prototype.getAbsolutePath = function(href){
	if((/^(http:|https:)?\/\//i).test(href)) { return href; }
	if(!(/^\//).test(href)){ href = '/' + href; }
	return this.rootUrl + href;
};

MetaInspector.prototype.fetch = function(){
	var _this = this;
	var totalChunks = 0;

	var r = request({uri : this.url}, function(error, response, body){
		if(!error && response.statusCode === 200){
			_this.document = body;
			_this.parsedDocument = cheerio.load(body);
			_this.response = response;

			_this.initAllProperties();

			_this.emit("fetch");
		}
		else{
			_this.emit("error", error);
		}
	});

	if(_this.options.limit){
		r.on('data', function(chunk){
			totalChunks += chunk.length;
			if(totalChunks > _this.options.limit){
				_this.emit("limit");
				r.abort();
			}
		});
	}
};
