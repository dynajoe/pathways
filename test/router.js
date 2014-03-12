var http = require('http');
var Stream = require('stream');
var pathways = require('../lib/index');
var assert = require('assert');

describe('router', function () {

   beforeEach(function () {
      this.pathways = pathways();
      this.server = http.createServer(this.pathways);
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
