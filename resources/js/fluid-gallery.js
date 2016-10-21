;(function ($, window, document, undefined) {

	var pluginName = 'fluidGallery';

	function FluidGallery (element, options) {
		this.gallery = element;
		this.$gallery = $(element);

		this._activePointer = 0;
		this._defaults = $.fn.fluidGallery.defaults;
		this._dims = {
			"controls": {
				"height": 0,
				"width": 0
			},
			"thumbnails": {
				"height": 0,
				width: 0
			},
			"thumbnailsWindow": {
				"height": 0,
				"width": 0
			},
			"width": 0,
			"window": {
				"height": 0,
				"width": 0
			}
		};
		this._id = "fg-";
		this._images = [];
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
				gallery._images.push({
					src: $(this).children('img').attr('src'),
					title: $(this).data('title'),
					description: $(this).data('description')
				})
			});
		},

		generateHtml: function () {
			var gallery = this;
			if (gallery.options.controlsPosition == "left" || gallery.options.controlsPosition == "right") {
				this._controlsPos = 'vertical';
			} else if (gallery.options.controlsPosition == "top" || gallery.options.controlsPosition == "bottom") {
				this._controlsPos = 'horizontal';
			}

			gallery.$wrap = $('<div></div>')
				.addClass('fluid-gallery-wrapper');
			//.attr('id', gallery._id);

			gallery.$window = $('<div></div>')
				.addClass('fluid-gallery-window')
				.appendTo(gallery.$wrap);

			gallery.$activeSlide = $('<div></div>')
				.addClass('fluid-gallery-active-slide')
				.appendTo(gallery.$window);

			$('<img>')
				.attr('src', gallery._images[0].src)
				.appendTo(gallery.$activeSlide);

			gallery.$nextSlide = $('<div></div>')
				.addClass('fluid-gallery-next-slide')
				.appendTo(gallery.$window);

			$('<img>')
				.attr('src', gallery._images[1].src)
				.appendTo(gallery.$nextSlide);

			gallery.$controls = $('<div></div>')
				.addClass('fluid-gallery-controls ' + gallery._controlsPos + ' ' + gallery.options.controlsPosition);
			if (gallery.options.controlsPosition == "top" || gallery.options.controlsPosition == "left") {
				gallery.$controls.prependTo(gallery.$wrap);
			} else {
				gallery.$controls.appendTo(gallery.$wrap);
			}

			if (gallery.options.controlsPosition != "none") {
				gallery.$thumbnailsWindow = $('<div></div>')
					.addClass('fluid-gallery-thumbnails-window')
					.appendTo(gallery.$controls);

				gallery.$thumbnails = $('<div></div>')
					.addClass('fluid-gallery-thumbnails')
					.appendTo(gallery.$thumbnailsWindow);

				$.each(gallery._images, function () {
					$('<img>')
						.attr('src', this.src)
						.appendTo(gallery.$thumbnails);
				});
				gallery.$thumbnails.find('img').first().addClass('active');
			}

			if (gallery.options.arrows != "none")
			{
				gallery.$previousArrow = $('<div></div>')
					.addClass('fluid-gallery-previous-arrow');
				gallery.$nextArrow = $('<div></div>')
					.addClass('fluid-gallery-next-arrow');

				if (gallery.options.arrows == "controls")
				{
					if (gallery._controlsPos == "horizontal")
					{
						gallery.$previousArrow.html('<i class="icon-chevron-left"></i>');
						gallery.$nextArrow.html('<i class="icon-chevron-right"></i>');
					}
					else if (gallery._controlsPos == "vertical")
					{
						gallery.$previousArrow.html('<i class="icon-chevron-up"></i>');
						gallery.$nextArrow.html('<i class="icon-chevron-down"></i>');
					}
					gallery.$controls.prepend(gallery.$previousArrow)
						.append(gallery.$nextArrow);
				}
			}

			gallery.$gallery.html(gallery.$wrap);

		},

		setDims: function () {
			var gallery = this;
			gallery._dims.width = gallery.$wrap.outerWidth();

			if (gallery.options.controlsPosition == "top" || gallery.options.controlsPosition == "bottom") {
				gallery._dims.window.width = gallery._dims.width;
				gallery._dims.window.height = Math.ceil(gallery.options.height > 10 ? gallery.options.height : gallery._dims.window.width * gallery.options.height);
				gallery.$window.width(gallery._dims.window.width);
				gallery.$window.height(gallery._dims.window.height);
				gallery.$activeSlide.height(gallery._dims.window.height);
				gallery.$nextSlide.height(gallery._dims.window.height);

				gallery._dims.controls.width = gallery._dims.width;
				gallery._dims.controls.height = Math.ceil(gallery._dims.controls.width * gallery.options.controlsHeight);
				gallery.$controls.height(gallery._dims.controls.height);

				var arrowsWidth = 0;
				if (gallery.options.arrows == "controls")
				{
					arrowsWidth += gallery.$previousArrow.outerWidth() + gallery.$nextArrow.outerWidth();
				}
				gallery._dims.thumbnailsWindow.width = gallery._dims.controls.width - arrowsWidth;
				gallery._dims.thumbnailsWindow.height = gallery._dims.controls.height;
				gallery.$thumbnailsWindow.width(gallery._dims.thumbnailsWindow.width);

				gallery.$thumbnails.find('img').each(function () {
					console.log($(this).outerWidth(true), gallery._dims.thumbnailsWindow.height, $(this).outerHeight(true), Math.ceil( $(this).outerWidth(true) * ( gallery._dims.thumbnailsWindow.height / $(this).outerHeight(true) ) ));
					gallery._dims.thumbnails.width += Math.ceil( $(this).width() * ( gallery._dims.thumbnailsWindow.height / $(this).height() ) );
				});
				gallery._dims.thumbnails.height = gallery._dims.thumbnailsWindow.height;
				gallery.$thumbnails.width(gallery._dims.thumbnails.width);
				gallery.$thumbnails.height(gallery._dims.thumbnails.height);
			}
		},

		// Bind events that trigger methods
		bindEvents: function() {
			var gallery = this;

			if (gallery.options.arrows != "none")
			{
				gallery.$previousArrow.click($.proxy(gallery.previousSlide, gallery));
				gallery.$nextArrow.click($.proxy(gallery.nextSlide, gallery));
			}
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
			var $thumb = gallery.$thumbnails.find('img:eq('+gallery._activePointer+')');
			$thumb.addClass('active');

			var width = $thumb.outerWidth();
			var offset = ( gallery._dims.thumbnailsWindow.width - width ) / 2;
			var left = offset - $thumb.position().left;
			if (left > 0) {
				left = 0;
			}
			var max = - gallery._dims.thumbnails.width + gallery._dims.thumbnailsWindow.width;
			if (left < max) {
				left = max;
			}

			gallery.$thumbnails.animate({"left": left}, gallery.options.transitionSpeed);
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
		height: 0.5625,
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