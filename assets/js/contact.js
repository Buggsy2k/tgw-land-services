const form = document.querySelector('#contact-form');
const launch = document.querySelector('#open-email');
const status = document.querySelector('#form-status');
const draft = document.querySelector('#draft');
const recipient = window.TGW_CONTACT?.email?.trim();
if (recipient && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
  launch.disabled = false;
  document.querySelector('#email-notice').textContent = 'Your email app will open with a prepared message. Review and send it there.';
}
const selected = new URLSearchParams(location.search).get('service');
if ([...form.elements.service.options].some(option => option.value === selected)) form.elements.service.value = selected;
function prepare() {
  for (const field of form.querySelectorAll('[required]')) {
    field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.');
  }
  if (!form.reportValidity()) return null;
  const data = Object.fromEntries(new FormData(form));
  const subject = data.subject.trim();
  const body = `Name: ${data.name.trim()}\r\nEmail: ${data.email.trim()}\r\nPhone: ${data.phone.trim() || 'Not provided'}\r\nService: ${data.service || 'Not specified'}\r\nProject location: ${data.location.trim() || 'Not provided'}\r\n\r\n${data.details.trim().replace(/\r?\n/g, '\r\n')}`;
  draft.value = `To: ${recipient || '[Contact email coming soon]'}\nSubject: ${subject}\n\n${body}`;
  document.querySelector('#draft-panel').hidden = false;
  return { subject, body };
}
form.addEventListener('input', event => event.target.setCustomValidity?.(''));
function buildEmailLink(result) {
  return `mailto:${recipient}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`;
}
document.querySelector('#preview-draft').addEventListener('click', () => {
  if (prepare()) status.textContent = 'Draft prepared. Nothing has been sent.';
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const result = prepare();
  if (!result) return;
  if (launch.disabled) { status.textContent = 'Contact email coming soon. Please copy your draft for now.'; return; }
  const href = buildEmailLink(result);
  if (href.length > 1900) { status.textContent = 'This draft may be too long for an email link. Copy it into your email app instead.'; return; }
  status.textContent = 'Email draft requested. Nothing has been sent. If no email app opens, copy the draft below.';
  location.href = href;
});
document.querySelector('#copy-draft').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(draft.value); status.textContent = 'Draft copied. Paste it into your email app; nothing has been sent.'; }
  catch { draft.focus(); draft.select(); status.textContent = 'Select the draft and copy it manually using your device’s copy command.'; }
});