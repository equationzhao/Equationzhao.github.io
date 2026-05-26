(function() {
  var reveals = document.querySelectorAll('.reveal');
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function(el) { io.observe(el); });

  var bars = document.querySelectorAll('.token-bar-inner');
  var barIO = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var w = e.target.getAttribute('data-width');
        e.target.style.width = Math.max(w, 2.8) + '%';
        barIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(function(el) { barIO.observe(el); });
})();
