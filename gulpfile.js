var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

function scripts() {
  return gulp.src('js/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
}
gulp.task('scripts', function() {
  return scripts();
});

function images() {
  return gulp.src('*.png')
    .pipe(gulp.dest('dist/'));
}
gulp.task('images', function() {
  return images();
});