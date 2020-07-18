define(["jquery","store2"],function(e,r){return function(t,n){var o=e.Deferred();return null===r.get(t)?e.getJSON(n,function(e){r.set(t,e),o.resolve(r.get(t))}):o.resolve(r.get(t)),o.promise()}});
