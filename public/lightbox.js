(function () {
  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  var img = document.createElement('img');
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) close();
  });

  document.querySelectorAll('.prose img').forEach(function (el) {
    el.addEventListener('click', function () {
      img.src = el.src;
      img.alt = el.alt;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
})();
