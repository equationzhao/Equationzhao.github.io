(function () {
  document.querySelectorAll('pre > code').forEach(function (code) {
    var pre = code.parentElement;
    if (!pre || pre.querySelector('.copy-btn')) return;
    pre.style.position = 'relative';
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code');
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(code.textContent).then(function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
      });
    });
    pre.appendChild(btn);
  });
})();
