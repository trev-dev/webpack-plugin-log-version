const { src, dest, watch, task, series } = require('gulp')
const del = require('del')

function moveTemplates() {
	return src('./src/templates/**/*.ejs')
    .pipe(dest('lib/templates'))
}

function watchTemplates() {
  watch('./src/templates/**/*.ejs', moveTemplates)
}

function clean() {
  return del(['lib/**', '!lib'], {force: true})
}

task('default', series(clean, moveTemplates))
task('watch', series(moveTemplates, watchTemplates))