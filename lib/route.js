var escapeRegex = function (text) {
   return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

var urlSplitter = function (url) {
   return url.split(/\/+/).filter(function (e) {
      return e;
   });
};

var paramGrabber = (function () {
   var regex = /^function[^\(]*\(([^)]*)\)/i;
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

   if (pattern instanceof RegExp) {
      this.handle = function (url, context, cb) {
         var matches = url.match(pattern);

         if (!matches) {
            return cb(false);
         }

         this.callback.call(context, matches);

         return cb(true);
      };
   }
   else if ('function' === typeof pattern) {
      this.handle = function (url, context, cb) {
         pattern.call(context, function (result) {
            if (!result) {
               return cb(false);
            }

            var args = Array.prototype.slice.call(arguments, 1);

            this.callback.apply(context, args);

            return cb(true);
         }.bind(this));
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

      var urlPattern = new RegExp('^/?' + regexParts.join('/') + '/?$');

      this.handle = function (url, context, cb) {
         var values = {};
         var matches = url.match(urlPattern);

         if (!matches) {
            return cb(false);
         }

         for (var i = 0, length = matchGroups.length; i < length; i++) {
            values[matchGroups[i]] = matches[i + 1];
         }

         var mapped = [];

         for (i = 0, length = callbackParams.length; i < length; i++) {
            mapped.push(values[callbackParams[i]]);
         }

         this.callback.apply(context, mapped);

         return cb(true);
      };
   }
   else {
      throw 'Unexpected pattern type. Expected: function, RegExp, or string. Got: ' + pattern;
   }
};

module.exports = Route;