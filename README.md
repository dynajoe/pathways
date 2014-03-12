# Pathways

A simple HTTP RESTful router.

Usage
-----

```javascript
var Pathways = require('pathways');
var http = require('http');

var pathways = Pathways();

http.createServer(pathways);

pathways
.get('/', function () {
   this.response.write('Hello World!');
   this.response.end();
})
.get('/collection/:id', function (id) {
   this.response.write('Hello ' + id + '!');
   this.response.end();
});
```