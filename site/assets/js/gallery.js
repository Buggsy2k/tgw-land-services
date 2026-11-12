const items = [...document.querySelectorAll('.gallery-item')];
const filters = document.querySelector('.filters');
const more = document.querySelector('.load-more');
const count = document.querySelector('#gallery-count');
const dialog = document.querySelector('.lightbox');
let matching = items;
let shown = 12;
let current = 0;
let opener;
function render() {
  items.forEach(item => { item.hidden = true; });
  matching.slice(0, shown).forEach(item => { item.hidden = false; });
  more.hidden = shown >= matching.length;
  count.textContent = `${Math.min(shown, matching.length)} of ${matching.length} photographs`;
}
filters.hidden = false;
filters.addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  matching = items.filter(item => button.dataset.filter === 'All' || item.dataset.category === button.dataset.filter);
  shown = 12;
  render();
});
more.addEventListener('click', () => {
  const firstNew = matching[shown];
  shown += 12;
  render();
  firstNew?.focus();
});
function display() {
  const item = matching[current];
  const img = document.querySelector('#large-photo');
  img.src = item.href;
  img.alt = item.querySelector('img').alt;
  document.querySelector('#photo-caption').textContent = item.dataset.category;
  document.querySelector('#photo-position').textContent = `${current + 1} / ${matching.length}`;
}
document.querySelector('.gallery-grid').addEventListener('click', event => {
  const item = event.target.closest('.gallery-item');
  if (!item || typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  opener = item;
  current = matching.indexOf(item);
  display();
  dialog.showModal();
  document.body.classList.add('viewer-open');
});
function step(offset) { current = (current + offset + matching.length) % matching.length; display(); }
document.querySelector('.previous-photo').addEventListener('click', () => step(-1));
document.querySelector('.next-photo').addEventListener('click', () => step(1));
document.querySelector('.close-viewer').addEventListener('click', () => dialog.close());
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1);
  }
});
dialog.addEventListener('close', () => { document.body.classList.remove('viewer-open'); opener?.focus(); });
render();