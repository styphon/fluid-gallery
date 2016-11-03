;(function ($, window, document, undefined) {

	var pluginName = 'fluidGallery';

	function FluidGallery (element, options) {
		this.gallery = element;
		this.$gallery = $(element);

		this._activePointer = 0;
		this._defaults = $.fn.fluidGallery.defaults;
		this._id = "fg-";
		this._images = [];
		this._imagesLeftToLoad = 0;
		this._name = pluginName;
		this._controlsPos = 'none';

		this.options = $.extend( {}, this._defaults, options );

		this.init();
	}

	$.extend(FluidGallery.prototype, {

		// Initialization logic
		init: function () {
			//this.setId();
			/* @todo validate options */
			this.getImages();
			this.generateHtml();
			this.waitForImagesToLoad();
		},

		initAfterImagesHaveLoaded: function () {
			this.setDims();
			this.bindEvents();
		},

		// Remove plugin instance completely
		destroy: function() {
			this.unbindEvents();
			this.$gallery.removeData();
		},

		setId: function() {
			this._id += Math.random().toString(36).substr(2, 5);
		},

		getImages: function () {
			var gallery = this;
			gallery.$gallery.find('li').each(function () {
				var $img = $(this).children('img');
				gallery._images.push({
					src: $(this).data('image') ? $(this).data('image') : $img.attr('src'),
					title: $(this).data('title'),
					description: $(this).data('description')
				})
			});
			gallery._imagesLeftToLoad = gallery._images.length;
		},

		generateHtml: function () {
			var gallery = this;
			if (gallery.options.controlsPosition == "left" || gallery.options.controlsPosition == "right") {
				this._controlsPos = 'vertical';
			} else if (gallery.options.controlsPosition == "top" || gallery.options.controlsPosition == "bottom") {
				this._controlsPos = 'horizontal';
			}

			gallery.$wrap = $('<div />')
				.addClass('fluid-gallery-wrapper')
				.appendTo(gallery.$gallery);
			//.attr('id', gallery._id);

			gallery.$window = $('<div />')
				.addClass('fluid-gallery-window')
				.appendTo(gallery.$wrap);

			gallery.$activeSlide = $('<div />')
				.addClass('fluid-gallery-active-slide')
				.appendTo(gallery.$window);

			$('<img>')
				.attr('src', gallery._images[0].src)
				.appendTo(gallery.$activeSlide);

			gallery.$nextSlide = $('<div />')
				.addClass('fluid-gallery-next-slide')
				.appendTo(gallery.$window);

			$('<img>')
				.attr('src', gallery._images[1].src)
				.appendTo(gallery.$nextSlide);

			gallery.$controls = $('<div />')
				.addClass('fluid-gallery-controls ' + gallery._controlsPos + ' ' + gallery.options.controlsPosition);
			if (gallery.options.controlsPosition == "top" || gallery.options.controlsPosition == "left") {
				gallery.$controls.prependTo(gallery.$wrap);
			} else {
				gallery.$controls.appendTo(gallery.$wrap);
			}

			if (gallery.options.controlsPosition != "none") {
				gallery.$thumbnailsWindow = $('<div />')
					.addClass('fluid-gallery-thumbnails-window')
					.appendTo(gallery.$controls);

				gallery.$thumbnails = $('<div />')
					.addClass('fluid-gallery-thumbnails')
					.appendTo(gallery.$thumbnailsWindow)
					.append(gallery.$gallery.children('ul'));

				gallery.$thumbnails.find('li').first().addClass('active');
			}

			if (gallery.options.arrows != "none")
			{
				gallery.$previousArrow = $('<div />')
					.addClass('fluid-gallery-previous-arrow');
				gallery.$nextArrow = $('<div />')
					.addClass('fluid-gallery-next-arrow');

				if (gallery.options.arrows == "controls")
				{
					if (gallery._controlsPos == "horizontal")
					{
						gallery.$previousArrow.html('<span />')
							.addClass("glyphicon glyphicon-menu-left")
							.attr("aria-hidden", "true");
						gallery.$nextArrow.html('<span />')
							.addClass("glyphicon glyphicon-menu-right")
							.attr("aria-hidden", "true");
					}
					else if (gallery._controlsPos == "vertical")
					{
						gallery.$previousArrow.html('<span />', {"class": "glyphicon glyphicon-menu-up", "aria-hidden": "true"});
						gallery.$nextArrow.html('<span />', {"class": "glyphicon glyphicon-menu-down", "aria-hidden": "true"});
					}
					gallery.$controls.prepend(gallery.$previousArrow)
						.append(gallery.$nextArrow);
				}
			}
		},

		waitForImagesToLoad: function () {
			var gallery = this;

			gallery.$gallery.find('li').each(function (i) {
				var $img = $(this).children('img');

				if ( $img[0].complete ) {
					gallery.imageLoaded();
				} else {
					$img.one('load', function () {
						gallery.imageLoaded();
					});
				}
			});
		},

		imageLoaded: function () {
			if ( --this._imagesLeftToLoad == 0 ) {
				this.initAfterImagesHaveLoaded();
			}
		},

		setDims: function () {
			var gallery = this;
			var $firstLi = gallery.$thumbnails.find('li').first();
			var h = gallery.$thumbnailsWindow.outerHeight(true) - ($firstLi.outerHeight(true) - $firstLi.height());
			gallery.$thumbnails.find('li').each(function ()
			{
				var image = $('<img />').attr('src', $(this).find('img').attr('src'));
				var ratio = image[0].width / image[0].height;
				$(this).width(h * ratio);
			});


		},

		// Bind events that trigger methods
		bindEvents: function() {
			var gallery = this;

			if (gallery.options.arrows != "none")
			{
				gallery.$previousArrow.click($.proxy(gallery.previousSlide, gallery));
				gallery.$nextArrow.click($.proxy(gallery.nextSlide, gallery));
			}

			gallery.$window.swipe({
				swipeLeft: function (event)
				{
					gallery.nextSlide();
				},
				swipeRight: function (event)
				{
					gallery.previousSlide();
				}
			});

			gallery.$thumbnails.find('li').each(function (i)
			{
				$(this).click(function () {
					gallery._activePointer = i;
					gallery.$nextSlide.children('img').attr('src', gallery._images[gallery._activePointer].src);
					gallery.transitions[gallery.options.transition](gallery);
					$.proxy(gallery.setThumbnail(), gallery);
				});
			});
		},

		// Unbind events that trigger methods
		unbindEvents: function() {
			this.$gallery.off('.'+this._name);
		},

		previousSlide: function() {
			var gallery = this;
			if (--gallery._activePointer < 0)
			{
				gallery._activePointer = gallery._images.length - 1;
			}

			gallery.$nextSlide.css('right', '100%')
				.children('img').attr('src', gallery._images[gallery._activePointer].src);

			gallery.transitions[gallery.options.transition](gallery);
			$.proxy(gallery.setThumbnail(), gallery);
		},

		nextSlide: function() {
			var gallery = this;
			if (++gallery._activePointer == gallery._images.length)
			{
				gallery._activePointer = 0;
			}

			gallery.$nextSlide.children('img').attr('src', gallery._images[gallery._activePointer].src);

			gallery.transitions[gallery.options.transition](gallery);
			$.proxy(gallery.setThumbnail(), gallery);
		},

		transitions: {
			fade: function (gallery) {
				gallery.$nextSlide.css('right', 0)
					.animate({'opacity' : 1}, gallery.options.transitionSpeed, $.proxy(gallery.transitionComplete, gallery));
			},

			slide: function (gallery) {
				gallery.$nextSlide.css('opacity', 1)
					.animate({'right' : 0}, gallery.options.transitionSpeed, $.proxy(gallery.transitionComplete, gallery));
			}
		},

		transitionComplete: function () {
			var gallery = this;

			gallery.$activeSlide.children('img').attr('src', gallery._images[gallery._activePointer].src);
			gallery.$nextSlide.css({'opacity': 0, 'right': '-100%'});
		},

		setThumbnail: function () {
			var gallery = this;

			gallery.$thumbnails.find('.active').removeClass('active');
			var $thumb = gallery.$thumbnails.find('li:eq('+gallery._activePointer+')');
			$thumb.addClass('active');

			var width = $thumb.outerWidth();
			var offset = ( gallery.$thumbnailsWindow.width() - width ) / 2;
			var left = offset - $thumb.position().left;
			if (left > 0) {
				left = 0;
			}
			var max = - gallery.$thumbnails.width() + gallery.$thumbnailsWindow.width();
			if (left < max) {
				left = max;
			}

			gallery.$thumbnails.stop().animate({"left": left}, gallery.options.transitionSpeed);
		},

		callback: function() {
			// Cache onComplete option
			var onComplete = this.options.onComplete;

			if ( typeof onComplete === 'function' ) {
				onComplete.call(this.gallery);
			}
		}

	});

	$.fn.fluidGallery = function (options) {
		this.each(function() {
			if ( !$.data( this, "plugin_" + pluginName ) ) {
				$.data( this, "plugin_" + pluginName, new FluidGallery( this, options ) );
			}
		});
		return this;
	};

	$.fn.fluidGallery.defaults = {
		arrows: "controls",
		autoStart: true,

		/**
		 * Horizontal controls
		 * Percentage of window height, e.g. if the window is 400px high, controls will be 60px high.
		 */
		controlsHeight: 0.15,
		controlsPosition: "bottom",

		/**
		 * Vertical thumbnails
		 * Percentage of total wrapper width used, the rest is used by the window. E.g. if the wrapper is 1000px wide
		 * then the thumbnails will be 100px wide and the window will be 900px wide.
		 */
		controlsWidth: 0.1,
		play: true,
		speed: 4000,
		transition: "slide",
		transitionSpeed: 500,
		zoom: "fullscreen",
		onComplete: null
	};
	$.fn.fluidGallery.valid = {
		arrows: ["none", "controls", "image"],
		position: ["none", "bottom", "left", "right", "top"],
		transition: ["fade", "slide"],
		zoom: ["none", "fullscreen", "lightbox"]
	}

})( jQuery, window, document );