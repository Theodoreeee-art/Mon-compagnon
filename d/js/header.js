document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('header-placeholder');
  if (!placeholder) return;
  fetch('header.html')
    .then(res => res.text())
    .then(html => {
      placeholder.innerHTML = html;
      const current = window.location.pathname.split('/').pop();
      const active = placeholder.querySelector(`nav a[href="${current}"]`);
      if (active) {
        active.classList.add('active');
      }
    })
    .catch(err => console.error('Erreur lors du chargement du header:', err));
});
