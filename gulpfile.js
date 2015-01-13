var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    minifyHtml = require('gulp-minify-html'),
    plumber = require('gulp-plumber'), // prevents pipe breaking caused by errors
    sass = require('gulp-ruby-sass'),
    concat = require('gulp-concat');

var srcPaths = {
  'templates': 'src/*.html',
  'js': 'src/js/files/*.js',
  'scss': 'src/scss/*.scss',
  'css': 'src/css/',
  'img': 'src/images/*'
};

var distPaths = {
  'templates': 'dist/',
  'js': 'dist/js/',
  'css': 'dist/css/',
  'img': 'dist/images/'
};

// Template Tasks
gulp.task('templates', function() {
  gulp.src(srcPaths.templates)
  .pipe(minifyHtml())
  .pipe(gulp.dest(distPaths.templates));
});

// Scripts Task (Uglifies JS files)
//   can be run separately with $ gulp scripts
gulp.task('scripts', function() {
  gulp.src(srcPaths.js)
    .pipe(plumber()) // placed before all other pipes
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('src/js'))
    .pipe(uglify())
    .pipe(gulp.dest(distPaths.js));
});

// Styles Task
// converts .scss to .css
//   from src into both src/css and dist/css
gulp.task('styles', function() {
  gulp.src(srcPaths.scss)
    .pipe(plumber()) // placed before all other pipes again
    .pipe(sass())
    .pipe(minifyCss())
    .pipe(gulp.dest(srcPaths.css))
    .pipe(gulp.dest(distPaths.css));
});

gulp.task('images', function() {
  gulp.src(srcPaths.img)
  .pipe(gulp.dest(distPaths.img));
});

// Watch JS (runs continuously)
// watches for changes in a specified folder
//   and runs tasks on them
gulp.task('watch', function() {
  gulp.watch(srcPaths.js, ['scripts']);
  gulp.watch(srcPaths.scss, ['styles']);
  gulp.watch(srcPaths.templates, ['templates']);
  gulp.watch(srcPaths.img, ['images']);
});

// default is required
gulp.task('default', ['templates','images', 'scripts', 'styles', 'watch']);