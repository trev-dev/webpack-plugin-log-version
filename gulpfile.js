const { src, dest, watch, task, series } = require('gulp')

function moveTemplates() {
	return src('./src/templates/**/*.ejs')
    .pipe(dest('lib/templates'))
}

function watchTemplates() {
  watch('./src/templates/**/*.ejs', moveTemplates)
}

task('default', moveTemplates)
task('watch', series(moveTemplates, watchTemplates))