var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    sass = require('gulp-ruby-sass');

var paths = {
  'js': 'src/js/*.js',
  'scss': 'src/scss/*.scss',
  'css': 'src/css/'
};

// Scripts Task (Uglifies JS files)
//    can be run separately with $ gulp scripts
gulp.task('scripts', function() {
  gulp.src(paths.js)
  .pipe(uglify())
  .pipe(gulp.dest('dist/js'));
});

// Styles Task
gulp.task('styles', function() {
  gulp.src(paths.scss)
  .pipe(sass())
  .pipe(minifyCss({ keepBreaks:true }))
  .pipe(gulp.dest(paths.css));
});

// Watch JS (runs continuously)
// watches for changes in a specified folder
//   and runs tasks on them
gulp.task('watch', function() {
  gulp.watch(paths.js, ['scripts']);
  gulp.watch(paths.scss, ['styles']);
});

// default is required
gulp.task('default', ['scripts', 'styles', 'watch']);