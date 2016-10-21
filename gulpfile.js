'use strict';

var browserify = require('browserify'),
	buffer = require('vinyl-buffer'),
	gulp = require('gulp'),
	gutil = require('gulp-util'),
	notify = require('gulp-notify'),
	sass = require('gulp-sass'),
	source = require('vinyl-source-stream'),
	sourcemaps = require('gulp-sourcemaps'),
	tap = require('gulp-tap'),
	uglify = require('gulp-uglify');

gulp.task('javascript', function ()
{
	return gulp.src('./resources/js/**/*.js', {read: false})
		.pipe(tap(function (file)
		{
			gutil.log('bundling ' + file.path);

			file.contents = browserify(file.path, {debug: true})
				.bundle();
		}))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(uglify())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./public/js/'));
});

gulp.task('sass', function ()
{
	return gulp.src('./resources/sass/**/*.scss')
		.pipe(sass.sync().on('error', sass.logError))
		.pipe(gulp.dest('./public/css'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./public/css'))
		.pipe(notify({ message: 'Sass compiled' }));
});

gulp.task('watch', function ()
{
	gulp.watch('./resources/js/**/*.js', ['javascript']);
	gulp.watch('./resources/sass/**/*.scss', ['sass']);
});

gulp.task('default', ['javascript', 'sass']);