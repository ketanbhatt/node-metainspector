## Node-Metainspector

NPM package for scraping given URL and give its title, image and description as a JSON.

minimal-metainspector is forked and modified from the node-metainspector package by [gabceb](http://github.com/gabceb/node-metainspector)

### Scraped data

```
client.url                	# URL of the page
client.scheme             	# Scheme of the page (http, https)
client.host               	# Hostname of the page (like, markupvalidator.com, without the scheme)
client.rootUrl 			  	# Root url (scheme + host, i.e http://simple.com/)
client.title              	# title of the page, as string
client.description        	# returns the meta description, or the first long paragraph if no meta description is found
client.image              	# Most relevant image, if defined with og:image

```

## Usage

```javascript
var MetaInspector = require('minimal-metainspector');
var client = new MetaInspector("http://www.google.com", {});

client.on("fetch", function(){
    console.log(client.image);
});

client.on("error", function(err){
	console.log(error);
});

client.fetch();

```

Copyright (c) 2015 Ketan Bhatt, released under the MIT license

