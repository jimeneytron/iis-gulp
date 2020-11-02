const gulp = require('gulp'),
    del = require('del'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    browsersync = require('browser-sync').create(),
    autoprefixer = require('autoprefixer'),
    cssnano = require('cssnano'),
    inlinesource = require('gulp-inline-source'),
    htmlmin = require('gulp-htmlmin'),
    // image = require('gulp-image'),
    webp = require('gulp-webp'),
    sourcemaps = require('gulp-sourcemaps'),
    replace = require('gulp-replace'),
    fileinclude = require('gulp-file-include'),
    proxy = require('http-proxy-middleware')
    browserify = require('gulp-browserify');

sass.compiler = require('node-sass');

const paths = {
    styles: {
      src: 'src/scss/**/*.scss',
      dest: 'site/css/'
    },
    js : {
        src: 'src/js/**/*.js',
        dest: 'site/js/'
    },
    img: {
        src: 'src/img/**/*',
        dest: 'site/img/'
    },
    html: {
        src: 'src/*.html',
        srcWatch: 'src/**/*.html',
        dest: 'site/'
    }
  };

// postcss plugins
var pcssplugins = [
    autoprefixer(),
    cssnano()
];

// BrowserSync
function browserSync(done) {
    browsersync.init({
        server: {
            baseDir: './site/',
            middleware: [
                proxy.createProxyMiddleware(['/api/v1', '/img/fonts', '/doc'], {
                    target: 'http://dev.fins.t-global.bcs/',
                    changeOrigin: true   // for vhosted sites
                  })
            ]
        },
        port: 3000
    });
    done();
}

// BrowserSync Reload
function browserSyncReload(done) {
    browsersync.reload();
    done();
}

function clean() {
    return del([ 'site' ]);
  }

function styles() {
    return gulp.src(paths.styles.src)
        .pipe(sass())
        .pipe(postcss(pcssplugins))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browsersync.stream());
}

function stylesWatch() {
    return gulp.src(paths.styles.src)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browsersync.stream());
}

function img() {
    return gulp.src(paths.img.src)
    // .pipe(image())
    .pipe(gulp.dest(paths.img.dest));
}

function imgWebp() {
    return gulp.src(paths.img.src)
    // .pipe(image())
    .pipe(webp({quality: 100}))
    .pipe(gulp.dest(paths.img.dest));
}

function html() {
    return gulp.src(paths.html.src)
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
    }))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(inlinesource())
    .pipe(htmlmin({
        collapseWhitespace: true,
        removeComments: true
    }))
    .pipe(gulp.dest(paths.html.dest));
}

function htmlWatch() {
    return gulp.src(paths.html.src)
    .pipe(replace('%%content%%', '@@include("./partials/pardot-form.html")'))
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
      }))
    .pipe(gulp.dest(paths.html.dest));
}

function js() {
    return gulp.src(paths.js.src)
    .pipe(browserify({
        insertGlobals : true,
        // debug : !gulp.env.production
    }))
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browsersync.stream());
}

// Watch files
function watchFiles() {
    gulp.watch(paths.styles.src, stylesWatch);
    gulp.watch(paths.js.src, js);
    gulp.watch(paths.html.srcWatch,
        gulp.series(htmlWatch, browserSyncReload)
    );
    gulp.watch(paths.img.src, img);
    gulp.watch(paths.img.src, imgWebp);
}

var build = gulp.series(clean, styles, js, img, imgWebp, html);
var preWatch = gulp.series(clean, stylesWatch, img, js, imgWebp, htmlWatch);
var watchActual = gulp.parallel(watchFiles, browserSync);
var watch = gulp.series(preWatch, watchActual);

exports.watch = watch;
exports.default = build;