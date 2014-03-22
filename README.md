# Pathways

A simple HTTP RESTful router.

## Examples

### Using string patterns

Provides a simple string pattern to match. The pattern can specify URL parameters in the form of ```:parameterName``` and wildcards using ```*```. If the handlerFunction has an argument that matches a URL parameter, the value is passed to the callback. For example, the url ```/collection/:id``` has a url parameter ```:id```. If the handler function takes ```id``` as a parameter it will automatically be bound i.e. ```function (id) { }```.

Usage:
```javascript
pathways.get(string, handlerFunction);
```

Example:
```javascript
var Pathways = require('pathways');
var http = require('http');

var pathways = Pathways();
var server = http.createServer(pathways);

pathways
.get('/', function () {
   this.response.write('Hello World!');
   this.response.end();
})
.get('/collection/:id', function (id) {
   this.response.write('Hello ' + id + '!');
   this.response.end();
})
.post('/collection/:id', function (id) {
   var data = '';

   this.request.on('data', function (b) {
      data += b;
   });

   this.request.on('end', function () {
      console.log(id, data);
      this.response.end();
   });
});

server.listen(3000);
```

### Using Regular Expressions

This is useful for more complicated matching scenarios. For example, ensuring that a url parameter is only digit characters or a certain length. The result of ```url.match(RegExp)``` is passed to the handler callback.

Usage:
```javascript
pathways.get(RegExp, handlerFunction);
```

Example:
```javascript
var Pathways = require('pathways');
var http = require('http');

var pathways = Pathways();
var server = http.createServer(pathways);

pathways
.get(/^\/$/i, function () {
   this.response.write('Hello World!');
   this.response.end();
})
.get(/^\/collection\/(\d+)$/i, function (matches) {
   var id = matches[1];
   this.response.write('Hello ' + id + '!');
   this.response.end();
})
.post(/^\/collection\/(\d+)$/i, function (matches) {
   var id = matches[1];
   var data = '';

   this.request.on('data', function (b) {
      data += b;
   });

   this.request.on('end', function () {
      console.log(id, data);
      this.response.end();
   });
});

server.listen(3000);
```

### Using a function

This is useful if you want to inspect things other than just the URL. You have access to the request and response just like the request handler callback.

Usage:
```javascript
pathways.get(filterFunction, handlerFunction);
```

Example:
```javascript
var Pathways = require('pathways');

var http = require('http');
var pathways = Pathways();
var server = http.createServer(pathways);

var rootRoute = function (cb) {
   cb(this.request.url === '/');
};

var collectionRoute = function (cb) {
   if (this.request.url.indexOf('/collection/') === 0) {
      var id = this.request.url.replace('/collection/', '');
      cb(true, id);
   }
   else {
      cb(false);
   }
};

pathways
.get(rootRoute, function () {
   this.response.write('Hello World!');
   this.response.end();
})
.get(collectionRoute, function (id) {
   this.response.write('Hello ' + id + '!');
   this.response.end();
})
.post(collectionRoute, function (id) {
   var data = '';

   this.request.on('data', function (b) {
      data += b;
   });

   this.request.on('end', function () {
      console.log(id, data);
      this.response.end();
   });
});

server.listen(3000);
```

## Handler callback

The handler callback is invoked for the first registered route that matches via string, function, or regular expression. If no routes match, the server responds with a 404 status code.

```javascript
pathways.get('/', function () {
   // This is the handler callback
});
```

The handler callback will be invoked with ```this``` set to an object with properties:

```javascript
{
   request: /* the HTTP request */,
   response: /* the HTTP response */,
   router: /* the pathways router */,
   params: /* the query parameters provided in the HTTP request */
}
```

The handler will be provided arguments depending on the filter.

*Using strings:*

Pathways will try to bind URL parameters to the callback functions with the same name.

*Using RegExp:*

The callback will have the match collection as its first argument.

*Using a function:*

The callback will be invoked with every argument provided to the filter callback after the first. For example ```cb(true, 1, 'a', 'b')``` will invoke the route handler with 3 arguments 1, 'a', and 'b'.