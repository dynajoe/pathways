var http = require('http');
var Stream = require('stream');
var pathways = require('../lib/index');
var assert = require('assert');

describe('multiple routers', function () {
   beforeEach(function () {
      this.routerA = pathways();
      this.routerB = pathways();
   });

   it('should not have the same route collection', function () {
      assert.notEqual(this.routerA.routes, this.routerB.routes);
   });
});

describe('router', function () {
   beforeEach(function () {
      this.pathways = pathways();
      this.server = http.createServer(this.pathways);
   });

   it('should have the expected methods', function () {
      ['get', 'put', 'post', 'delete', 'any'].forEach(function (m) {
         assert.equal('function', typeof this.pathways[m]);
      }, this);
   });

   describe('when a route is declared to accept any method', function () {
      it('should respond to any method', function (done) {
         var methods = ['get', 'put', 'post', 'delete'];
         var requestCount = 0;
         this.pathways.any('/test', function () {
            requestCount++;
            if (requestCount === methods.length) {
               done();
            }
         });

         methods.forEach(function (m) {
            makeRequest(this.server, m.toUpperCase(), '/test');
         }, this);
      });
   });

   describe('simple get requests with parameters', function () {
      it ('should map the id parameter in GET /collection/:id', function (done) {
         var expectedId = '123';
         this.pathways.get('/collection/:id', function (id) {
            assert.equal(expectedId, id);
            done();
         });

         makeRequest(this.server, 'GET', '/collection/' + expectedId);
      });

      it ('should map multiple parameters /collection/:id/:resource', function (done) {
         var expectedId = '123';
         var expectedResource = 'details';

         this.pathways.get('/collection/:id/:resource', function (id, resource) {
            assert.equal(expectedId, id);
            assert.equal(expectedResource, resource);
            done();
         });

         makeRequest(this.server, 'GET', '/collection/' + expectedId + '/' + expectedResource);
      });
   });

   describe('simple get requests', function () {

      it('should allow regex patterns', function (done) {
         this.pathways.get(/\/test/, function () {
            assert.equal('/test', this.request.url);
            done();
         });

         makeRequest(this.server, 'GET', '/test');
      });

      it('should allow chainable definitions', function (done) {
         var requestCount = 0;

         var onRequest = function () {
            requestCount++;

            if (requestCount == 2) {
               done();
            }
         };

         this.pathways
            .get('/', onRequest)
            .get('/test', onRequest);

         makeRequest(this.server, 'GET', '/');
         makeRequest(this.server, 'GET', '/test');
      });

      it('should route a GET request for /', function (done) {
         this.pathways.get('/', function () {
            done();
         });

         makeRequest(this.server, 'GET', '/');
      });

      it('should route a GET request for /test', function (done) {
         this.pathways.get('/test', function () {
            done();
         });

         makeRequest(this.server, 'GET', '/test');
      });

      it('should route a GET request for /test/abc', function (done) {
         this.pathways.get('/test/abc', function () {
            done();
         });

         makeRequest(this.server, 'GET', '/test/abc');
      });

      it('should not matter if theres a trailing slash in the pattern', function (done) {
         this.pathways.get('/test/abc/', function () {
            done();
         });

         makeRequest(this.server, 'GET', '/test/abc');
      });

   });

   describe('simple post requests', function () {

      it('should allow regex patterns', function (done) {
         this.pathways.post(/\/test/, function () {
            assert.equal('/test', this.request.url);
            done();
         });

         makeRequest(this.server, 'POST', '/test');
      });

      it('should allow simple parameterized patterns', function (done) {
         this.pathways.post('/test/:id', function (id) {
            assert.equal('123', id);
            done();
         });

         makeRequest(this.server, 'POST', '/test/123');
      });

      it('should have the request object', function (done) {
         this.pathways.post('/test', function () {
            assert.equal('/test', this.request.url);
            assert.equal('POST', this.request.method);
            done();
         });

         makeRequest(this.server, 'POST', '/test');
      });
   });
});

function makeRequest (server, method, path, callback) {
   var req = {
      method: method,
      path: path,
      url: path
   };

   var res = new Stream.PassThrough();

   res.result = '';

   res.on('readable', function () {
      res.result += res.read().toString();
   });

   server.emit('request', req, res);

   res.once('end', function () {
      callback(res);
   });
}
