var Pathways = require('../lib/index');
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