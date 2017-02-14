const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin'); // docs: https://github.com/jonschlinkert/gulp-htmlmin

const baseDir = 'src/';

gulp.src(baseDir + '**/*.html')
    // minify HTML
    .pipe(htmlmin({
        collapseWhitespace: true,
        removeComments: true,
        removeAttributeQuotes: true,
        minifyCSS: true
    }))
    .pipe(gulp.dest('dist/'));