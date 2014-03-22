var Pathways = require('../lib/index');
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