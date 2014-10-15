var gulp = require('gulp'),
    changed = require('gulp-changed'),
    concat = require('gulp-concat'),
    imagemin = require('gulp-imagemin'),
    notify = require('gulp-notify'),
    uglify = require('gulp-uglify'),
    inject = require('gulp-inject'),
    addsrc = require('gulp-add-src');

function scripts() {
  return gulp.src('src/js/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
}
gulp.task('scripts', function() {
  return scripts();
});


gulp.task('js', function() {
  var vendor = './src/js/vendor/*.js',
      src = './src/js/*.js',
      dst = './dist/js/';

  return gulp.src(vendor)
          .pipe(addsrc(src)) // add dependant js last
          .pipe(uglify())
          .pipe(concat('main.min.js'))
          .pipe(gulp.dest(dst));
});

/*
gulp.task('dev-js', function() {
  var dev = './src/js/dev/*.js',
      src = './src/js/*.js',
      dst = './dist/js/';

  return gulp.src(dev)
          .pipe(addsrc(src)) // add dependant js last
          .pipe(uglify())
          .pipe(concat('main.min.js'))
          .pipe(gulp.dest(dst));
});
*/

gulp.task('css', function() {
  var src = './src/css/*',
      dst = './dist/css/';

  return gulp.src(src)
          .pipe(changed(dst))
          .pipe(gulp.dest(dst));
});


gulp.task('images', function() {
  var src = './src/images/*',
      dst = './dist/images/';

  return gulp.src(src)
          .pipe(changed(dst))
          .pipe(imagemin())
          .pipe(gulp.dest(dst));
});

gulp.task('inject-dev', function() {
  var src = './src/*.html',
      dst = './src/';

  var sources = gulp.src(['./src/js/*.js','./src/css/*.css'], {read: false});

  return gulp.src(src)
          .pipe(inject(sources))
          .pipe(gulp.dest('./src/'));
});

gulp.task('html', function() {
  var src = './src/index.html',
      dst = './dist/';

  return gulp.src(src)
          .pipe(gulp.dest(dst));
});


gulp.task('inject', function() {
  var target = gulp.src('./dist/index.html');
  var sources = gulp.src(['./dist/js/*.js', './dist/css/*.css'], {read: false});

  return target.pipe(inject(sources, {relative: true}))
          .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['js', 'css', 'images', 'html']);

gulp.task('default', ['js', 'css', 'images', 'inject-dev']);