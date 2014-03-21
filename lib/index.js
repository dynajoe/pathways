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

var escapeRegex = function (text) {
   return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

var Route = function (pattern, cb) {
   this.pattern = pattern;
   this.callback = cb;
   var callbackParams = paramGrabber(cb);

   if (pattern instanceof RegExp) {
      this.handle = function (url, context) {
         var matches = url.match(pattern);

         if (!matches) {
            return false;
         }

         this.callback.call(context, matches);

         return true;
      };
   }
   else if ('function' === typeof pattern) {
      this.handle = function (url, context) {
         var result = pattern(url);

         if (!result) {
            return false;
         }

         this.callback.call(context, result);

         return true;
      };
   }
   else if ('string' === typeof pattern) {
      var parts = urlSplitter(pattern);
      var regexParts = [];
      var matchGroups = [];

      for (var i = 0, length = parts.length; i < length; i++) {
         if (parts[i].indexOf(':') === 0) {
            regexParts.push('([^/]+)');
            matchGroups.push(parts[i].slice(1));
         }
         else if (parts[i] === '*') {
            regexParts.push('.*');
         }
         else {
            regexParts.push(escapeRegex(parts[i]));
         }
      }

      var urlPattern = new RegExp('/?' + regexParts.join('/') + '/?');

      this.handle = function (url, context) {
         var values = {};
         var matches = url.match(urlPattern);

         if (!matches) {
            return false;
         }

         for (var i = 0, length = matchGroups.length; i < length; i++) {
            values[matchGroups[i]] = matches[i + 1];
         }

         var mapped = [];

         for (i = 0, length = callbackParams.length; i < length; i++) {
            mapped.push(values[callbackParams[i]]);
         }

         this.callback.apply(context, mapped);

         return true;
      };
   }
   else {
      throw 'Unexpected pattern type. Expected: function, RegExp, or string. Got: ' + pattern;
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

            var handled = route.handle(parsedUrl.pathname, {
               request: req,
               response: res,
               router: this,
               params: parsedUrl.query
            });

            if (handled) {
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

   this.any = function (urlPattern, cb) {
      SupportedVerbs.forEach(function (verb) {
         this[verb](urlPattern, cb);
      }, this);
   };
};

module.exports = function () {
   var router = new Router();

   var x = function (req, res) {
      if (!router.route(req, res)) {
         res.statusCode = 404;
         res.end();
      }
   };

   Object.keys(router).forEach(function (k) {
      x[k] = router[k];
   });

   return x;
};