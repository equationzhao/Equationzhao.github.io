(function () {
  var prose = document.querySelector('.prose');
  if (!prose) return;

  var headings = prose.querySelectorAll('h2, h3');
  if (headings.length < 3) return;

  var toc = document.createElement('nav');
  toc.className = 'toc';
  toc.setAttribute('aria-label', 'Table of contents');
  var list = document.createElement('ul');

  headings.forEach(function (h, i) {
    if (!h.id) h.id = 'heading-' + i;
    var li = document.createElement('li');
    li.className = 'toc-' + h.tagName.toLowerCase();
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    list.appendChild(li);
  });

  toc.appendChild(list);

  var article = document.querySelector('article');
  if (article) article.insertBefore(toc, article.querySelector('.prose'));

  var links = toc.querySelectorAll('a');
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          var active = toc.querySelector('a[href="#' + e.target.id + '"]');
          if (active) active.classList.add('active');
        }
      });
    },
    { rootMargin: '-80px 0px -60% 0px' }
  );
  headings.forEach(function (h) { observer.observe(h); });
})();
