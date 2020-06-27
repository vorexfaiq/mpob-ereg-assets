const fetchers = {};

function prefetchCleanup(e) {
  $(e.currentTarget).off('mouseleave', prefetchCleanup);
  clearTimeout(fetchers[$(e.currentTarget).attr('href')]);
}

$(document).on('mouseover', 'a', (e) => {
  if( typeof $(e.currentTarget).data('no-prefetch') !== 'undefined' )
    return;

  $(document).off('turbolinks:before-visit');

  let url = $(e.currentTarget).attr('href');
  clearTimeout(fetchers[url]);

  if (Turbolinks.controller.cache.has(url))
    return;

  $(e.currentTarget).on('mouseleave', prefetchCleanup);

  fetchers[url] = setTimeout(() => {
    $.ajax({
      url: url,
      xhr: () => {
        var xhr = jQuery.ajaxSettings.xhr();
        var setRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(name, value) {
            if( name == 'X-Requested-With' ) return;
            setRequestHeader.call(this, name, value);
        }
        return xhr;
      },
      success: (data) => {
        Turbolinks.controller.cache.put(
          url,
          Turbolinks.Snapshot.fromHTMLString( data )
        );

        console.log(Turbolinks.controller.cache);

        $(document).on('turbolinks:before-visit', (e) => {
          e.preventDefault();
          $(document).off('turbolinks:before-visit');
          Turbolinks.controller.historyPoppedToLocationWithRestorationIdentifier(url, Turbolinks.uuid());
        });

        prefetchCleanup(e);
      }
    });


  }, 600);
});
