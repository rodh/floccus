var gulp = require('gulp')
var fs = require('fs')
var browserify = require('browserify')
var babelify = require('babelify')
var tap = require('gulp-tap')
var zip = require('gulp-zip')
var crx = require('./lib/gulp-crx')
var run = require('gulp-run-command').default

const VERSION = require('./package.json').version
const paths = {
  zip: [
    '**',
    '!builds/**',
    '!src/**',
    '!node_modules/**',
    '!img/**',
    '!ISSUE_TEMPLATE.md',
    '!gulpfile.js',
    '!key.pem'
  ],
  views: './views/*.html',
  entries: 'src/entries/*.js',
  js: 'src/**',
  builds: './builds/'
}

gulp.task('default', ['html', 'js', '3rd-party'])

gulp.task('js', function() {
  return (
    gulp
      .src(paths.entries, { read: false }) // no need of reading file because browserify does.
      // transform file objects using gulp-tap plugin
      .pipe(
        tap(function(file) {
          // replace file contents with browserify's bundle stream
          file.contents = browserify(file.path, {
            debug: true
          })
            .transform(babelify, {
              presets: ['es2015'],
              plugins: [
                'transform-object-rest-spread',
                'syntax-jsx',
                ['transform-react-jsx', { pragma: 'h' }],
                'transform-async-to-generator'
              ]
            })
            .bundle()
        })
      )
      .pipe(gulp.dest('./dist/js/'))
  )
})

gulp.task('html', function() {
  return gulp.src(paths.views).pipe(gulp.dest('./dist/html/'))
})

gulp.task('3rd-party', ['polyfill', 'mocha'])

gulp.task('polyfill', function() {
  return gulp
    .src('./node_modules/babel-polyfill/dist/polyfill.js')
    .pipe(gulp.dest('./dist/js/'))
})

gulp.task('mocha', ['mochajs', 'mochacss'])

gulp.task('mochajs', function() {
  return gulp.src('./node_modules/mocha/mocha.js').pipe(gulp.dest('./dist/js/'))
})
gulp.task('mochacss', function() {
  return gulp
    .src('./node_modules/mocha/mocha.css')
    .pipe(gulp.dest('./dist/css/'))
})

gulp.task('release', ['zip', 'xpi', 'crx'])

gulp.task('zip', ['default'], function() {
  return gulp
    .src(paths.zip)
    .pipe(zip(`floccus-build-v${VERSION}.zip`))
    .pipe(gulp.dest(paths.builds))
})

gulp.task('xpi', ['default'], function() {
  return gulp
    .src(paths.zip)
    .pipe(zip(`floccus-build-v${VERSION}.xpi`))
    .pipe(gulp.dest(paths.builds))
})

gulp.task(
  'keygen',
  run(
    'openssl genpkey' +
      ' -algorithm RSA -out ./key.pem -pkeyopt rsa_keygen_bits:2048'
  )
)

gulp.task('crx', ['default'], function() {
  return gulp
    .src(paths.zip)
    .pipe(
      crx({
        privateKey: fs.readFileSync('./key.pem', 'utf8'),
        filename: `floccus-build-v${VERSION}.crx`
      })
    )
    .pipe(gulp.dest(paths.builds))
})

gulp.task('watch', function() {
  let jsWatcher = gulp.watch(paths.js, ['js'])
  let viewsWatcher = gulp.watch(paths.views, ['html'])

  jsWatcher.on('change', onWatchEvent)
  viewsWatcher.on('change', onWatchEvent)
})

function onWatchEvent(event) {
  console.log(
    'File ' + event.path + ' was ' + event.type + ', running tasks...'
  )
}
