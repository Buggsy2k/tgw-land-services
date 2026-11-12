// Replace empty strings with verified company details before publishing.
window.TGW_CONTACT = Object.freeze({
  email: 'tgwlandservice@gmail.com',
  phone: '(978) 604-4915',
  address: 'Ravenna, TX 75476',
  // Cloudflare Worker that sends the email. Empty disables it and uses the email app only.
  emailEndpoint: '/api/contact',
  // Cloudflare Turnstile sitekey (public). Empty hides the widget and skips the check.
  turnstileSiteKey: '0x4AAAAAAF-0d_8vNnTYnIQU'
});