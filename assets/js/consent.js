/* =========================================================================
   Cookie-Hinweis (Soft Wall) — Consent Mode v2 (erweiterter Modus)

   Der Tag Manager laedt IMMER, der Default steht im <head> auf 'denied',
   noch bevor gtm.js geholt wird. Dieses Modul baut nur die Wand und meldet
   die Entscheidung an Google.

   Soft Wall heisst: Modal ueber der Seite, Schleier, Scroll gesperrt.
   Kein X, Klick daneben schliesst nicht — eine Entscheidung ist noetig.
   Zustimmen und Ablehnen sind gleichrangig und gleich breit, nichts ist
   vorausgewaehlt.

   Wichtig: Auch die ABLEHNUNG wird gemeldet. Erst dadurch endet
   wait_for_update und die wartenden Tags gehen als cookieloser Treffer
   raus (gcs=G100) — sonst kann Google Ads nichts modellieren.
   ========================================================================= */
(function () {
  'use strict';

  var BASIS = (function () {
    var s = document.currentScript;
    if (!s) {
      var alle = document.getElementsByTagName('script');
      for (var i = alle.length - 1; i >= 0; i--) {
        if (/consent\.js(\?|$)/.test(alle[i].src)) { s = alle[i]; break; }
      }
    }
    return s ? s.src.replace(/assets\/js\/consent\.js.*$/, '') : '';
  })();

  var CONFIG = {
    marke:       'Expert Reinigung',
    schluessel:  'expr_consent',
    logo:        BASIS + 'assets/img/expert-reinigung-logo.png',
    datenschutz: 'https://expert-reinigung.de/datenschutz',
    impressum:   'https://expert-reinigung.de/impressum'
  };

  var dl = window.dataLayer = window.dataLayer || [];
  function gtag() { dl.push(arguments); }

  var speicher = {
    lies: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    schreib: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    weg: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* --- Entscheidung an Google melden -------------------------------------- */
  function melden(erlaubt) {
    gtag('consent', 'update', {
      ad_storage:              erlaubt ? 'granted' : 'denied',
      ad_user_data:            erlaubt ? 'granted' : 'denied',
      ad_personalization:      erlaubt ? 'granted' : 'denied',
      analytics_storage:       erlaubt ? 'granted' : 'denied',
      functionality_storage:   erlaubt ? 'granted' : 'denied',
      personalization_storage: erlaubt ? 'granted' : 'denied'
    });
    gtag('set', 'ads_data_redaction', !erlaubt);
    dl.push({ event: 'er_consent', consent_given: !!erlaubt });
  }

  /* --- Die Wand ------------------------------------------------------------ */
  var wand, schalter;

  function bauen() {
    wand = document.createElement('div');
    wand.className = 'kekse';
    wand.id = 'kekse';
    wand.setAttribute('role', 'dialog');
    wand.setAttribute('aria-modal', 'true');
    wand.setAttribute('aria-labelledby', 'kekse-titel');
    wand.setAttribute('aria-describedby', 'kekse-text');
    wand.innerHTML =
      '<div class="kekse__karte">' +
        '<img class="kekse__logo" src="' + CONFIG.logo + '" alt="' + CONFIG.marke + '" width="208" height="208">' +
        '<h2 id="kekse-titel">Kurz zu den Cookies</h2>' +
        '<p id="kekse-text">Wir setzen Cookies ein, um zu verstehen, wie diese Seite genutzt wird, ' +
          'und um die Wirkung unserer Anzeigen zu messen. Notwendige Cookies laufen immer. ' +
          'Alles andere entscheiden Sie — und können es jederzeit ändern.</p>' +

        '<div class="kekse__panel" id="kekse-panel" hidden>' +
          '<div class="kekse__zeile">' +
            '<div><b>Notwendige Cookies</b><span>Für den Betrieb der Seite erforderlich</span></div>' +
            '<span class="kekse__fest">Immer aktiv</span>' +
          '</div>' +
          '<div class="kekse__zeile">' +
            '<div><b>Analyse &amp; Marketing</b><span>Google Analytics 4 und Google Ads</span></div>' +
            '<label class="schalter"><input type="checkbox" id="kekse-schalter">' +
              '<span class="schalter__bahn"><span class="schalter__punkt"></span></span>' +
              '<span class="schalter__text">aus</span></label>' +
          '</div>' +
          '<button type="button" class="kekse__knopf kekse__knopf--nein" data-kekse="auswahl">Auswahl speichern</button>' +
        '</div>' +

        '<div class="kekse__knoepfe">' +
          '<button type="button" class="kekse__knopf kekse__knopf--ja" data-kekse="alle">Alle akzeptieren</button>' +
          '<button type="button" class="kekse__knopf kekse__knopf--nein" data-kekse="ablehnen">Ablehnen</button>' +
        '</div>' +
        '<button type="button" class="kekse__knopf kekse__knopf--mehr" data-kekse="einstellungen" aria-expanded="false">Einstellungen</button>' +

        '<p class="kekse__links">' +
          '<a href="' + CONFIG.datenschutz + '">Datenschutz</a> · ' +
          '<a href="' + CONFIG.impressum + '">Impressum</a>' +
        '</p>' +
      '</div>';
    document.body.appendChild(wand);
    schalter = wand.querySelector('#kekse-schalter');

    wand.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kekse]');
      if (!b) return;                       // Klick daneben schliesst bewusst nicht
      var wahl = b.getAttribute('data-kekse');
      if (wahl === 'einstellungen') { panelUmschalten(b); return; }
      if (wahl === 'auswahl') { entscheiden(schalter && schalter.checked ? 'alle' : 'ablehnen'); return; }
      entscheiden(wahl);
    });

    if (schalter) schalter.addEventListener('change', function () {
      var t = wand.querySelector('.schalter__text');
      if (t) t.textContent = schalter.checked ? 'an' : 'aus';
    });

    // Fokus bleibt in der Wand, solange sie offen ist
    wand.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !wand.classList.contains('zeig')) return;
      var f = wand.querySelectorAll('button, a, input');
      if (!f.length) return;
      var erste = f[0], letzte = f[f.length - 1];
      if (e.shiftKey && document.activeElement === erste) { e.preventDefault(); letzte.focus(); }
      else if (!e.shiftKey && document.activeElement === letzte) { e.preventDefault(); erste.focus(); }
    });
  }

  function panelUmschalten(knopf) {
    var p = wand.querySelector('#kekse-panel');
    var auf = p.hasAttribute('hidden');
    if (auf) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
    knopf.setAttribute('aria-expanded', String(auf));
  }

  function zeigen() {
    if (!wand) bauen();
    wand.classList.add('zeig');
    document.body.classList.add('kekse-offen');
    var erste = wand.querySelector('button');
    if (erste) window.setTimeout(function () { erste.focus(); }, 60);
  }

  function verbergen() {
    if (!wand) return;
    wand.classList.remove('zeig');
    document.body.classList.remove('kekse-offen');
  }

  function entscheiden(wahl) {
    speicher.schreib(CONFIG.schluessel, wahl);
    verbergen();
    melden(wahl === 'alle');
    document.dispatchEvent(new CustomEvent('er:consent', { detail: { wahl: wahl } }));
  }

  /* --- Widerruf: von jeder Seite aus, so einfach wie die Einwilligung ------
     Art. 7 Abs. 3 DSGVO — der Weg zurueck darf nicht schwerer sein als hin. */
  window.erCookieEinstellungen = function () {
    if (!wand) bauen();
    var stand = speicher.lies(CONFIG.schluessel);
    if (schalter) {
      schalter.checked = stand === 'alle';
      var t = wand.querySelector('.schalter__text');
      if (t) t.textContent = schalter.checked ? 'an' : 'aus';
    }
    var p = wand.querySelector('#kekse-panel');
    if (p) p.removeAttribute('hidden');
    var mehr = wand.querySelector('[data-kekse="einstellungen"]');
    if (mehr) mehr.setAttribute('aria-expanded', 'true');
    zeigen();
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-keks-widerruf], [data-cookie-settings], [data-consent-widerruf]');
    if (a) { e.preventDefault(); window.erCookieEinstellungen(); }
  });

  /* Fuer das Pop-up: es darf nie ueber einer offenen Wand erscheinen */
  window.erConsentOffen = function () {
    return !!(wand && wand.classList.contains('zeig'));
  };

  /* --- Start -------------------------------------------------------------- */
  function start() {
    var stand = speicher.lies(CONFIG.schluessel);
    bauen();
    if (stand) { melden(stand === 'alle'); return; }
    if (document.body.classList.contains('rechtsseite')) return;
    window.setTimeout(zeigen, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
