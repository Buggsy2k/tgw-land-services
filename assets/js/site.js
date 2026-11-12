const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
menu.hidden = false;
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    menu.focus();
  }
});
const contact = window.TGW_CONTACT || {};
document.querySelectorAll('[data-contact]').forEach(element => {
  const key = element.dataset.contact;
  const value = contact[key]?.trim();
  if (!value) return;
  if (key === 'email' || key === 'phone') {
    const link = document.createElement('a');
    link.textContent = value;
    link.href = key === 'email' ? `mailto:${value}` : `tel:${value.replace(/[^+\d]/g, '')}`;
    element.replaceChildren(link);
  } else element.textContent = value;
});
if (Object.values(contact).every(value => value.trim())) {
  document.querySelector('.contact-layout aside .notice')?.remove();
}