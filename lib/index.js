var Url = require('url');
var SupportedVerbs = ['get','put','post','delete'];
var Route = require('./route');

var generator = function (items) {
   var i = 0;
   // Because this is used in an async way let's ensure items doesn't change under us.
   items = items.slice(0);
   return function () {
      return items[i++];
   };
};

var Router = function () {
   this.routes = {};

   this.route = function (req, res, cb) {
      var routes = this.routes[req.method];
      var route;
      var parsedUrl = Url.parse(req.url, true);

      if (routes) {
         var routeGenerator = generator(routes);

         var nextRoute = function () {
            var next = routeGenerator();

            if (!next) {
               return cb(false);
            }

            next.handle(parsedUrl.pathname, {
               request: req,
               response: res,
               router: this,
               params: parsedUrl.query
            }, function (handled) {
               if (handled) {
                  return cb(true);
               }

               nextRoute();
            });
         };

         nextRoute();
      }
   };

   var pushRoute = function (method) {
      method = method.toUpperCase();
      this.routes[method] = this.routes[method] || [];
      return function (urlPattern, cb) {
         this.routes[method].push(new Route(urlPattern, cb));
         return this;
      }.bind(this);
   }.bind(this);

   SupportedVerbs.forEach(function (verb) {
      this[verb] = pushRoute(verb);
   }, this);

   this.any = function (urlPattern, cb) {
      SupportedVerbs.forEach(function (verb) {
         this[verb](urlPattern, cb);
      }, this);
   };
};

module.exports = function () {
   var router = new Router();

   var handler = function (req, res) {
      router.route(req, res, function (handled) {
         if (!handled) {
            res.statusCode = 404;
            res.end();
         }
      });
   };

   Object.keys(router).forEach(function (k) {
      handler[k] = router[k];
   });

   return handler;
};