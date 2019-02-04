var COOKIE_NAME = "access_token";
var HEADER_NAME = "Authorization";
var HEADER_PREFIX = "Bearer ";

// Regex to find (signed) jwts of the format:
// Begins with optional "s:"
// Then 3 parts b64 allowed characters separated by ".", (ignoring the optional 4th part which is the cookie signature)
// example: s:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c.FM8vht9Oxfnn3B9XudJr9gkh671ltlpfi1U3lxV4oAsov
var JWT_FINDING_REGEX = /^[s:]*([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_+\/=]*)/;

var PAIR_SPLIT_REGEX = /; */;

function parse(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }

  var obj = {};
  var opt = options || {};
  var pairs = str.split(PAIR_SPLIT_REGEX);
  var dec = opt.decode || decodeURIComponent;

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var eq_idx = pair.indexOf("=");

    // skip things that don't look like key=value
    if (eq_idx < 0) {
      continue;
    }

    var key = pair.substr(0, eq_idx).trim();
    var val = pair.substr(++eq_idx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    if (undefined == obj[key]) {
      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}

function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}

function strip(str) {
  if (!str) {
    return;
  }
  var result = str.match(JWT_FINDING_REGEX);
  if (result) {
    return result[1];
  }
}

function find(array, fn) {
  for (var i = 0; i < array.length; i += 1) {
    if (fn(array[i])) {
      return array[i];
    }
  }
}

var rewriteCookie = new TykJS.TykMiddleware.NewMiddleware({});

rewriteCookie.NewProcessRequest(function(request, session, spec) {
  try {
    var cookies = request.Headers.Cookie.map(function(c) {
      return parse(c);
    });
    if (cookies.length) {
      var cookie = find(cookies, function(c) {
        return c[COOKIE_NAME];
      });
      var accessToken = strip(cookie[COOKIE_NAME]);
      if (accessToken) {
        request.SetHeaders[HEADER_NAME] = HEADER_PREFIX + accessToken;
      }
    }
  } catch (error) {
    console.error(error);
  }

  return rewriteCookie.ReturnData(request, session.meta_data);
});
