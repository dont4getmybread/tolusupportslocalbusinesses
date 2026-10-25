'use strict';

(() => {
  const config = window.TSLB_SITE || {};
  const dialog = document.getElementById('site-dialog');
  const dialogTitle = document.getElementById('site-dialog-title');
  const dialogContent = document.getElementById('site-dialog-content');
  const referenceSubject = 'Reference Request – ToluSupportsLocalBusinesses';
  const referenceBody = "Hello,\n\nI came across Motley Consultancy on the ToluSupportsLocalBusinesses website.\n\nI'm considering working with them and would appreciate hearing about your experience.\n\nWould you recommend their services?\n\nThank you.";

  function showInformation(title, message, includeReference = false) {
    if (!dialog) return;
    dialogTitle.textContent = title;
    dialogContent.replaceChildren();
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    dialogContent.append(paragraph);
    if (includeReference) {
      const template = document.createElement('pre');
      template.className = 'email-template';
      template.textContent = `Subject: ${referenceSubject}\n\n${referenceBody}`;
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'glass-button';
      copy.textContent = 'Copy email text';
      const status = document.createElement('p');
      status.className = 'dialog-status';
      status.setAttribute('role', 'status');
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(template.textContent);
          status.textContent = 'Email text copied.';
        } catch {
          status.textContent = 'Select the email text above to copy it.';
        }
      });
      dialogContent.append(template, copy, status);
    }
    dialog.showModal();
  }

  dialog?.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  const safeHttps = value => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
    catch { return null; }
  };

  document.querySelectorAll('[data-motley]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.motley === 'website') {
        const url = safeHttps(config.motleyWebsite);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        else showInformation('Motley Consultancy', 'The client’s website link will be available here shortly.');
      } else {
        const email = config.motleyReferenceEmail;
        if (typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(referenceSubject)}&body=${encodeURIComponent(referenceBody)}`;
        } else {
          showInformation('Contact for recommendation', 'The client’s public reference email address will be available here shortly.', true);
        }
      }
    });
  });

  document.querySelectorAll('[data-social]').forEach(button => {
    button.addEventListener('click', () => {
      const service = button.dataset.social;
      const url = safeHttps(config.socialLinks?.[service]);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else showInformation(service, `Our ${service} profile will be linked here soon.`);
    });
  });

  document.querySelectorAll('[data-policy]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.policy;
      const url = safeHttps(config.policies?.[key]);
      if (url) location.href = url;
      else showInformation(key === 'terms' ? 'Terms' : 'Privacy', key === 'terms'
        ? 'Our terms of use will be published here before the store opens.'
        : 'Our privacy policy will be published here before subscriptions and the store open.');
    });
  });

  document.querySelectorAll('[data-current-year]').forEach(node => {
    node.textContent = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Africa/Lagos' }).format(new Date());
  });

  const player = document.getElementById('featured-podcast');
  if (!player) return;

  fetch('/podcasts.json').then(response => {
    if (!response.ok) throw new Error('Podcast recommendations unavailable');
    return response.json();
  }).then(shows => {
    if (!Array.isArray(shows) || !shows.length) return;
    // Select a different show each day, with the day starting at 06:00 Lagos time.
    // Native show embeds fetch the publisher's current episodes from Spotify.
    let selected = Math.floor((Date.now() - 5 * 60 * 60 * 1000) / 86400000) % shows.length;
    const counter = document.getElementById('podcast-counter');
    const label = document.getElementById('podcast-label');
    const link = document.getElementById('featured-podcast-link');
    const status = document.getElementById('podcast-status');

    function embedUrl(show) {
      if (!/^[a-zA-Z0-9]{22}$/.test(show.showId)) return null;
      return `https://open.spotify.com/embed/show/${show.showId}?utm_source=generator`;
    }

    function selectShow(index, announce = true) {
      selected = (index + shows.length) % shows.length;
      const show = shows[selected];
      const src = embedUrl(show);
      if (!src || !safeHttps(show.showUrl)) return;
      player.src = src;
      player.title = `${show.show} on Spotify`;
      link.href = show.showUrl;
      label.textContent = `${show.region} · ${show.show}`;
      counter.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(shows.length).padStart(2, '0')}`;
      if (announce) status.textContent = `Now showing ${show.show}.`;
    }

    selectShow(selected, false);
    document.getElementById('podcast-prev').addEventListener('click', () => selectShow(selected - 1));
    document.getElementById('podcast-next').addEventListener('click', () => selectShow(selected + 1));

    const directory = document.querySelector('.podcast-directory');
    directory.addEventListener('toggle', () => {
      const list = document.getElementById('podcast-directory');
      if (!directory.open || list.childElementCount) return;
      shows.forEach(show => {
        const src = embedUrl(show);
        if (!src || !safeHttps(show.showUrl)) return;
        const item = document.createElement('div');
        item.className = 'podcast-directory-item';
        const iframe = document.createElement('iframe');
        iframe.className = 'spotify-frame';
        iframe.src = src;
        iframe.title = `${show.show} on Spotify`;
        iframe.loading = 'lazy';
        iframe.height = '152';
        iframe.width = '100%';
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        const external = document.createElement('a');
        external.className = 'text-link';
        external.href = show.showUrl;
        external.target = '_blank';
        external.rel = 'noopener noreferrer';
        external.textContent = `${show.show} ↗`;
        item.append(iframe, external);
        list.append(item);
      });
    });
  }).catch(() => {
    // The initial native Spotify player and its listening link remain usable.
    document.getElementById('podcast-prev').hidden = true;
    document.getElementById('podcast-next').hidden = true;
    document.querySelector('.podcast-directory').hidden = true;
  });
})();
