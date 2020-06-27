(function($) {

    'use strict';

    $(document).ready(function() {
      $.ajaxSetup({
          headers: {'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content')}
      });

      var MailModule = Stapes.subclass({

        getThread : () => {
          this.thread.infiniteScroll({
            path : () => {
              return '/mailbox';
            },
            responseType: 'text',
            history: false,
          });
        },

        renderThread : ( response ) => {
          var _this    = this;

          var data     = JSON.parse( response );
          var template = $('#thread-items').html();
          Mustache.parse(template);

          $.each( data, (k,v) => {
            v.json_participants = JSON.stringify(v.participants);
            v.json_user = JSON.stringify(v.user);
          });

          var render = Mustache.render(template, { threads : data });

          this.thread.infiniteScroll( 'appendItems', $(render) );

          this.thread.on('click', 'li.item', function () {
            _this._.getMessage( $(this) );
          });
        },

        newThread : () => {
          var _this = this;

          var template = $('#thread-new').html();
          Mustache.parse(template);

          var render = Mustache.render(template, {});

          $('.message-list').html(render);
          $('.email-content-wrapper').show();
          $('.email-content-wrapper').siblings('.no-result').remove();

          this.message.find('select.tagsinput').tagsinput();

          this.message.on('click', '.new-message .btn-send', function () {
            _this._.sendThread();
          });
        },

        sendThread : () => {
          $.post('/mailbox', {
            subject : this.message.find('input[name="subject"]').val(),
            send_to : this.message.find('select.tagsinput').tagsinput('items'),
            message : this.message.find('textarea[name="message"]').val()
          }, (data) => {

            var template = $('#thread-item').html();
            Mustache.parse(template);

            var render = Mustache.render(template, data);

            var el = $(render);
            $('.thread-list .actions-wrapper').after(el);

            el.trigger('click');
          })
        },

        deleteThread : (thread_id) => {

        },

        getMessage : (el) => {
          var _this = this;

          $.getJSON('/mailbox/' + el.data('thread-id'), (data) => {
            _this._.renderMessage(data, el);
          });
        },

        renderMessage : (data, el) => {
          var _this = this;

          var template = $('#message-items').html();
          Mustache.parse(template);

          this.message.off('click');

          var render = Mustache.render(template, {
            messages : data,
            participants : el.data('participants'),
            subject : el.data('thread-subject')
          });

          $('.message-list').html(render);
          $('.email-content-wrapper').show();
          $('.email-content-wrapper').siblings('.no-result').remove();

          $('.email-content-wrapper').scrollTop($('.message-list').height());

          autosize($('.message-list .thread-reply textarea'));

          this.message.on('click', '.thread-reply .btn-send', function () {
            _this._.replyMessage(el.data('thread-id'), _this.message.find('.thread-reply textarea').val());
          });
        },

        replyMessage : (thread_id, message) => {
          var _this = this;

          $.ajax({
              url: '/mailbox/' + thread_id,
              type: 'PUT',
              data: {message : message},
              success: function(data) {
                _this.message.find('.thread-reply textarea').val('');

                var template = $('#message-item').html();
                Mustache.parse(template);

                var render = Mustache.render(template, data);
                $('.message-list .thread-reply').before(render);

                _this.message.find('.thread-reply textarea').height(25);
                $('.email-content-wrapper').scrollTop($('.message-list').height());
              }
          });
        },

        deleteMessage : (message_id) => {

        }

      });

      var MailLauncher = MailModule.subclass({
          constructor : (el) => {
              this._ = MailModule.prototype;
              this.el = el;
              this.thread = this.el.find('.thread-list');
              this.message = this.el.find('.message-list');
          },

          init : () => {

            this.thread.on( 'load.infiniteScroll', ( event, response ) => {
              this._.renderThread( response );
            });

            this._.getThread();
            this.thread.infiniteScroll('loadNextPage');

            this.thread.on('click', '.btn-new', () => {
              this._.newThread();
            });
          },

          events : () => {

          }
      });



      ( new MailLauncher( $('#mailContainer') ) ).init();

    });

})(window.jQuery);
