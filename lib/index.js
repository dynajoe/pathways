var Url = require('url');
var SupportedVerbs = ['get','put','post','delete'];

var urlSplitter = function (url) {
   return url.split(/\/+/).filter(function (e) {
      return e;
   });
};

var paramGrabber = (function () {
   var regex = /^function\s*\(([^)]*)\)/i;
   var split = /[\s,]+/;
   return function (fn) {
      var r = regex.exec(fn.toString());
      return r[1].split(split);
   };
})();

var Route = function (pattern, cb) {
   this.pattern = pattern;
   this.callback = cb;
   var callbackParams = paramGrabber(cb);

   if ('function' === typeof pattern.test) {
      this.test = function (url) {
         pattern.test(url);
      };
   }
   else {
      this.test = (function () {
         var parts = urlSplitter(pattern);

         for (var i = 0, length = parts.length; i < length; i++) {
            if (parts[i].indexOf(':') === 0) {
               parts[i] = {
                  key: parts[i].slice(1)
               };
            }
            else {
               parts[i] = {
                  match: parts[i]
               };
            }
         }

         return function (url) {
            var urlParts = urlSplitter(url);

            if (urlParts.length !== parts.length)
               return false;

            var values = {};

            for (var i = 0, length = parts.length; i < length; i++) {
               if (parts[i].match) {
                  if (parts[i].match !== urlParts[i]) {
                     return false;
                  }
               } else {
                  values[parts[i].key] = urlParts[i];
               }
            }

            var mapped = [];

            for (i = 0, length = callbackParams.length; i < length; i++) {
               mapped.push(values[callbackParams[i]]);
            }

            return mapped;
         };
      })();
   }
};

var Router = function () {
   this.routes = {};

   this.route = function (req, res) {
      var routes = this.routes[req.method];
      var route;
      var parsedUrl = Url.parse(req.url, true);

      if (routes) {
         for (var i = 0, length = routes.length; i < length; i++) {
            route = routes[i];

            var testResult = route.test(parsedUrl.pathname);

            if (testResult) {
               route.callback.apply({
                  request: req,
                  response: res,
                  router: this,
                  params: parsedUrl.query
               }, testResult ? testResult : undfined);

               return true;
            }
         }
      }

      return false;
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
};

module.exports = function () {
   var router = new Router();

   var x = function (req, res) {
      router.route(req, res);
   };

   Object.keys(router).forEach(function (k) {
      x[k] = router[k];
   });

   return x;
};