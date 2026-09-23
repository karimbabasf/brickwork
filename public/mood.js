// Pick the set's lighting before first paint so night users never see a light flash.
;(function () {
  var q = location.search
  var m = /[?&]night\b/.test(q) ? 'night' : /[?&]day\b/.test(q) ? 'day' : matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
  document.documentElement.dataset.mood = m
})()
