var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    plumber = require('gulp-plumber'), // prevents pipe breaking caused by errors 
    sass = require('gulp-ruby-sass');

var srcPaths = {
  'js': 'src/js/*.js',
  'scss': 'src/scss/*.scss',
  'css': 'src/css/',
  'img': 'src/images/*'
};

var distPaths = {
  'js': 'dist/js/',
  'css': 'dist/css/',
  'img': 'dist/images/'
};

// Scripts Task (Uglifies JS files)
//    can be run separately with $ gulp scripts
gulp.task('scripts', function() {
  gulp.src(srcPaths.js)
    .pipe(plumber()) // placed before all other pipes
    .pipe(uglify())
    .pipe(gulp.dest(distPaths.js));
});

// Styles Task
// converts .scss to .css 
//  from src into both src/css and dist/css
gulp.task('styles', function() {
  gulp.src(srcPaths.scss)
    .pipe(plumber()) // placed before all other pipes again
    .pipe(sass())
    .pipe(minifyCss({ keepBreaks:true }))
    .pipe(gulp.dest(srcPaths.css))
    .pipe(gulp.dest(distPaths.css));
});

// Watch JS (runs continuously)
// watches for changes in a specified folder
//   and runs tasks on them
gulp.task('watch', function() {
  gulp.watch(srcPaths.js, ['scripts']);
  gulp.watch(srcPaths.scss, ['styles']);
  // gulp.watch(srcPaths.img, ['image']);
});

// default is required
gulp.task('default', ['scripts', 'styles', 'watch']);