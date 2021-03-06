/**
 * Basic gulp file for static site development.
 * 
 */
/* eslint-env node */

'use strict'

var gulp = require('gulp')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var prefix = require('gulp-autoprefixer')
var connect = require('gulp-connect')
var eyeglass = require("eyeglass")
var eslint = require('gulp-eslint')
var babel = require('gulp-babel')
var concat = require('gulp-concat')
var htmlmin = require('gulp-htmlmin')
var uglify = require('gulp-uglify')
var imagemin = require('gulp-imagemin')
var runSequence = require('run-sequence')
var workbox = require('workbox-build') // i dont remember who works it

//
// Begin Gulp Tasks.
//

//
// HTML Dev Workflow.
//
gulp.task('html:dev', function () {
  return gulp.src(['src/**/*html', 'src/**/*.php', '!src/sass/**/*'])
    .pipe(gulp.dest('.tmp'))
    .pipe(connect.reload())
})

//
// HTML Prod Workflow.
//
gulp.task('html:prod', function () {
  return gulp.src(['src/**/*html', '!src/sass/**/*'])
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('dist'))
})

//
// php Prod Workflow.
//
gulp.task('php:prod', function () {
  return gulp.src(['src/**/*.php'])
    .pipe(gulp.dest('dist'))
})

//
// HTML Dev Manifest.
//
gulp.task('manifest:dev', function () {
  return gulp.src(['src/manifest.json'])
    .pipe(gulp.dest('.tmp'))
    .pipe(connect.reload())
})

//
// HTML Prod Manifest.
//
gulp.task('manifest:prod', function () {
  return gulp.src(['src/manifest/manifest.json'])
    .pipe(gulp.dest('dist/manifest'))
    .pipe(connect.reload())
})

//
// Images Dev Workflow.
//
gulp.task('images:dev', function () {
  return gulp.src('src/**/*.{png,jpg,jpeg,gif,svg,pdf}')
    .pipe(gulp.dest('.tmp'))
    .pipe(connect.reload())
})

//
// Images Prod Workflow.
//
gulp.task('images:prod', function () {
  return gulp.src('src/**/*.{png,jpg,jpeg,gif,svg,pdf}')
    .pipe(imagemin())
    .pipe(gulp.dest('dist'))
})

//
// CSS Dev Workflow.
//
gulp.task('styles:dev', function () {
  return gulp.src('src/sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass(eyeglass({
      outputStyle: 'expanded',
      eyeglass: {
        enableImportOnce: false
      }
    })).on('error', sass.logError))
    .pipe(prefix(['last 2 versions']))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.tmp/css'))
    .pipe(connect.reload())
})

//
// CSS Prod Workflow.
//
gulp.task('styles:prod', function () {
  return gulp.src('src/sass/**/*.scss')
    .pipe(sass(eyeglass({
      outputStyle: 'compressed',
      eyeglass: {
        enableImportOnce: false
      }
    })).on('error', sass.logError))
    .pipe(prefix(['last 2 versions']))
    .pipe(gulp.dest('dist/css'))
})

//
// Javascript Dev Workflow.
//
gulp.task('js:dev', function () {
  return gulp.src('src/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(concat('script.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.tmp/js'))
})

//
// Javascript Prod Workflow.
//
gulp.task('js:prod', function () {
  return gulp.src('src/js/**/*.js')
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(concat('script.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
})

//
// Javascript linting.
//
gulp.task('lint', function () {
  return gulp.src('src/js/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

//
// Dev server.
//
gulp.task('connect:dev', function () {
  connect.server({
    livereload: true,
    root: '.tmp'
  })
})

//
// Prod server.
//
gulp.task('connect', function () {
  connect.server({
    livereload: true,
    root: 'dist'
  })
})

//
// Watch task.
//
gulp.task('watch', function () {
  gulp.watch('src/sass/**/*.scss', ['styles:dev'])
  gulp.watch('src/**/*.html', ['html:dev'])
  gulp.watch('src/**/*.(png|jpe?g|gif)', ['images:dev'])
  gulp.watch('src/js/**/*.js', ['lint', 'js:dev'])
})

//
// Generate SW.
//
gulp.task('sw:generate', () => {
  return workbox.generateSW({
    globDirectory: './dist',
    globPatterns: ['**\/*.{html,js,css,jpg,png,svg}'], // Patron que dice que agarrar
    swDest: './dist/sw.js',
    clientsClaim: true,
    skipWaiting: true
  }).then(() => {
    console.info('Service worker generation completed.');
  }).catch((error) => {
    console.warn('Service worker generation failed: ' + error);
  });
});

//
// Composite Task declarations.
//
gulp.task('dev', ['html:dev', 'images:dev', 'styles:dev', 'js:dev', 'connect:dev', 'manifest:dev', 'watch'])
gulp.task('build', function() {
  runSequence(['html:prod', 'images:prod', 'styles:prod', 'js:prod', 'connect', 'manifest:prod', 'php:prod'], 'sw:generate')
})