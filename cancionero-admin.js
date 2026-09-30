(function () {
  'use strict';

  const STORAGE_KEY = 'sat-cancionero-cover-images-v1';
  const section = document.getElementById('all-songs');
  const selector = document.getElementById('cover-song-select');
  const fileInput = document.getElementById('cover-image-file');
  const preview = document.getElementById('cover-image-preview');
  const saveButton = document.getElementById('save-cover-button');
  const exportButton = document.getElementById('download-songbook-json');
  const importInput = document.getElementById('import-songbook');
  const status = document.getElementById('cover-admin-status');

  if (!section || !selector || !fileInput || !saveButton) return;

  const normalize = (text) => String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const keyFor = (song) => normalize(song.title) + '||' + normalize(song.artist);
  const defaultCoverOverrides = new Map([
    [keyFor({ title: 'HALO', artist: 'Beyoncé' }), './assets/covers/beyonce.jpg?v=face-ea627ca'],
    [keyFor({ title: 'BAD ROMANCE', artist: 'Lady Gaga' }), './assets/covers/lady-gaga.jpg?v=bad-romance-20260928'],
    [keyFor({ title: 'ALWAYS REMEMBER US THIS WAY', artist: 'Lady Gaga' }), './assets/covers/lady-gaga.jpg?v=bad-romance-20260928'],
    [keyFor({ title: 'SHALLOW (FEAT. BRADLEY COOPER)', artist: 'Lady Gaga' }), './assets/covers/lady-gaga.jpg?v=bad-romance-20260928'],
    [keyFor({ title: 'A FUEGO LENTO', artist: 'Rosana Arbelo' }), './assets/covers/rosana-arbelo.jpg?v=rosana-face-20260927'],
    [keyFor({ title: 'CHICA LIGHT', artist: 'Glup!' }), './assets/covers/glup.jpg?v=glup-band-20260927'],
    [keyFor({ title: 'ENAMORADO DE TI', artist: 'Glup!' }), './assets/covers/glup.jpg?v=glup-band-20260927'],
    [keyFor({ title: 'ARMONIA DE AMOR', artist: 'Gondwana' }), './assets/covers/gondwana-band-portrait.jpg?v=close-band-20260928'],
    [keyFor({ title: 'CON UNA PALA Y UN SOMBRERO', artist: 'Gervasio' }), './assets/covers/gervasio.jpg?v=artist-focus-20260927'],
    [keyFor({ title: 'CRAZY LITTLE THING CALLED LOVE', artist: 'Queen' }), './assets/covers/queen.jpg?v=artist-focus-20260927'],
    [keyFor({ title: "DON'T STOP ME NOW", artist: 'Queen' }), './assets/covers/queen.jpg?v=artist-focus-20260927'],
    [keyFor({ title: 'WE ARE THE CHAMPIONS', artist: 'Queen' }), './assets/covers/queen.jpg?v=artist-focus-20260927'],
    [keyFor({ title: 'DULCE CONDENA', artist: 'Los Rodríguez' }), './assets/covers/los-rodriguez-close.jpg?v=portraits-20260928'],
    [keyFor({ title: 'MI ENFERMEDAD', artist: 'Los Rodríguez' }), './assets/covers/los-rodriguez-close.jpg?v=portraits-20260928'],
    [keyFor({ title: 'SIN DOCUMENTOS', artist: 'Los Rodríguez' }), './assets/covers/los-rodriguez-close.jpg?v=portraits-20260928'],
    [keyFor({ title: 'DE MÚSICA LIGERA', artist: 'Soda Stereo' }), './assets/covers/soda-stereo-studio.jpg?v=three-faces-close-20260928'],
    [keyFor({ title: 'PERSIANA AMERICANA', artist: 'Soda Stereo' }), './assets/covers/soda-stereo-studio.jpg?v=three-faces-close-20260928'],
    [keyFor({ title: 'TRÁTAME SUAVEMENTE', artist: 'Soda Stereo' }), './assets/covers/soda-stereo-studio.jpg?v=three-faces-close-20260928'],
    [keyFor({ title: 'EL HOMBRE DEL PIANO', artist: 'Ana Belén' }), './assets/covers/ana-belen-geminis.jpg?v=portraits-20260928'],
    [keyFor({ title: 'HEAL THE WORLD', artist: 'Michael Jackson' }), './assets/covers/michael-jackson-close.jpg?v=portrait-close-20260928'],
    [keyFor({ title: 'FLY ME TO THE MOON', artist: 'Bart Howard' }), './assets/covers/bart-howard-portrait.jpg?v=portrait-20260928'],
    [keyFor({ title: 'HOTEL CALIFORNIA', artist: 'Eagles' }), './assets/covers/eagles.jpg?v=artist-focus-20260927'],
    [keyFor({ title: 'MAMMA MIA', artist: 'ABBA' }), './assets/covers/abba.jpg?v=artist-focus-20260927'],
    [keyFor({ title: 'MI GRAN NOCHE', artist: 'RAPHAEL' }), './assets/covers/raphael.jpg?v=artist-focus-20260927'],
    [keyFor({ title: 'OYE COMO VA', artist: 'Santana' }), './assets/covers/carlos-santana-1971.jpg?v=young-face-priority-20260929'],
    [keyFor({ title: 'PRONTA ENTREGA', artist: 'Virus' }), './assets/covers/virus.jpg?v=artist-focus-20260927'],
    [keyFor({ title: 'HIJO DE LA LUNA', artist: 'Mecano' }), 'https://musitecadiscos.com/wp-content/uploads/2025/06/mecano-descanso-dominical-lado-a-lpu.jpg?v=artist-focus-3-20260927'],
    [keyFor({ title: 'ME CUESTA TANTO OLVIDARTE', artist: 'Mecano' }), 'https://musitecadiscos.com/wp-content/uploads/2025/06/mecano-descanso-dominical-lado-a-lpu.jpg?v=artist-focus-3-20260927'],
    [keyFor({ title: 'COMO HEMOS CAMBIADO', artist: 'Presuntos Implicados' }), './assets/covers/presuntos-implicados.webp?v=artist-focus-4-20260927'],
    [keyFor({ title: 'LA JOYA DEL PACIFICO', artist: 'Lucho Barrios' }), './assets/covers/lucho-barrios.jpg?v=artist-focus-2-20260927'],
    [keyFor({ title: 'MALDITO AMOR', artist: 'Supernova' }), './assets/covers/supernova.jpg?v=artist-focus-2-20260927'],
    [keyFor({ title: 'MORE THAN WORDS', artist: 'Xtreme' }), 'https://iscale.iheart.com/catalog/album/836315?v=artist-focus-2-20260927'],
    [keyFor({ title: 'SIGUES DANDO VUELTAS', artist: 'La Rue Morgue' }), './assets/covers/la-rue-morgue.jpg?v=artist-focus-2-20260927'],
    [keyFor({ title: 'LA CHICA DE HUMO', artist: 'Emmanuel' }), './assets/covers/emmanuel-singer.jpg?v=face-close-20260929'],
    [keyFor({ title: 'TODA LA VIDA', artist: 'Emmanuel' }), './assets/covers/emmanuel-singer.jpg?v=face-close-20260929'],
    [keyFor({ title: 'THE SCIENTIST', artist: 'Coldplay' }), './assets/covers/coldplay-band-close.jpg?v=all-members-close-20260929'],
    [keyFor({ title: 'STARMAN', artist: 'David Bowie' }), './assets/covers/david-bowie-aladdin-sane.jpg?v=painted-face-20260929'],
    [keyFor({ title: 'TABACO Y CHANEL', artist: 'Bacilos' }), './assets/covers/bacilos-trio-close.jpg?v=trio-portrait-20260929'],
    [keyFor({ title: 'PRONTA ENTREGA', artist: 'Virus' }), './assets/covers/virus-80s-band.jpg?v=1980s-lineup-20260929'],
    [keyFor({ title: 'OTRA COMO TÚ', artist: 'Eros Ramazzotti' }), './assets/covers/eros-ramazzotti.jpg?v=full-head-20260929'],
    [keyFor({ title: 'BÉSAME MUCHO', artist: 'Los Panchos' }), './assets/covers/los-panchos-1954-cropped.jpg?v=los-panchos-trio-20260928'],
    [keyFor({ title: 'SABOR A MÍ ( LUIS MIGUEL)', artist: 'Los Panchos' }), './assets/covers/los-panchos-1954-cropped.jpg?v=los-panchos-trio-20260928'],
    [keyFor({ title: 'SOLAMENTE UNA VEZ', artist: 'Los Panchos' }), './assets/covers/los-panchos-1954-cropped.jpg?v=los-panchos-trio-20260928'],
    [keyFor({ title: 'COLD HEART (FEAT. DUA LIPA)', artist: 'Elton John' }), 'https://commons.wikimedia.org/wiki/Special:FilePath/Elton_john_cher_show_1975.JPG?width=500&v=artist-focus-3-20260927'],
    [keyFor({ title: 'ROCKET MAN', artist: 'Elton John' }), 'https://commons.wikimedia.org/wiki/Special:FilePath/Elton_john_cher_show_1975.JPG?width=500&v=artist-focus-3-20260927'],
    [keyFor({ title: 'YOUR SONG', artist: 'Elton John' }), 'https://commons.wikimedia.org/wiki/Special:FilePath/Elton_john_cher_show_1975.JPG?width=500&v=artist-focus-3-20260927'],
    [keyFor({ title: 'ASÍ FUE', artist: 'Juan Gabriel' }), './assets/covers/juan-gabriel-1985.jpg?v=full-face-20260927']
  ]);
  const artistCoverOverrides = new Map([
    ['fito paez', './assets/covers/fito-paez-1992.jpg?v=full-face-20260927'],
    ['luis miguel', './assets/covers/luis-miguel-young.jpg?v=close-face-20260927'],
    ['los tres', './assets/covers/los-tres-full-band.jpg?v=all-members-20260927'],
    ['amy winehouse', './assets/covers/amy-winehouse.jpg?v=face-focus-20260927'],
    ['cecilia', './assets/covers/cecilia-pantoja-early-years.jpg?v=cecilia-centered-20260928'],
    ['juan luis guerra 4.40', './assets/covers/juan-luis-guerra-ac.jpg?v=juan-luis-guerra-20260928'],
    ['los panchos', './assets/covers/los-panchos-1954-cropped.jpg?v=los-panchos-trio-20260928'],
    ['miguel bose', './assets/covers/miguel-bose-young.jpg?v=young-face-20260929'],
    ['charly garcia', './assets/covers/charly-garcia-1982-close.jpg?v=close-portrait-20260929'],
    ['duo dinamico', './assets/covers/duo-dinamico-close.png?v=duo-portrait-20260929'],
    ['silvio rodriguez', './assets/covers/silvio-rodriguez-1969.jpg?v=young-face-20260929'],
    ['stone temple pilots', './assets/covers/stone-temple-pilots-1993.jpg?v=1993-band-portrait-20260929'],
    ['billy joel', './assets/covers/billy-joel-young.jpg?v=young-face-20260929'],
    ['francisca valenzuela', './assets/covers/francisca-valenzuela-full-face.jpg?v=full-face-20260929'],
    ['santana', './assets/covers/carlos-santana-1971.jpg?v=young-face-20260929'],
    ["guns n' roses", './assets/covers/guns-n-roses-1987.jpg?v=classic-lineup-20260929']
  ]);
  let songs = readSongsFromPage();
  let pendingImage = '';

  function readSongsFromPage() {
    const result = [];
    section.querySelectorAll('details.song-details').forEach((detail) => {
      const summary = detail.querySelector('summary');
      const title = summary && summary.querySelector('span:not(.artist)');
      const artist = summary && summary.querySelector('.artist');
      const lyrics = detail.querySelector('.song-lyrics');
      if (!title || !artist || !lyrics) return;
      result.push({
        title: title.textContent.trim(),
        artist: artist.textContent.trim(),
        lyrics: lyrics.textContent.trim(),
        externalUrl: null,
        image: null
      });
    });

    section.querySelectorAll('div.song a').forEach((link) => {
      const title = link.querySelector('span');
      const artist = link.querySelector('.artist');
      if (!title || !artist) return;
      result.push({
        title: title.textContent.trim(),
        artist: artist.textContent.trim(),
        lyrics: null,
        externalUrl: link.href,
        image: null
      });
    });
    return result;
  }

  function mergeSongs(incoming) {
    if (!Array.isArray(incoming)) return songs;
    const validIncoming = incoming.filter((song) => keyFor(song) !== keyFor({
      title: 'ARMONÍA DE AMOR',
      artist: 'Godwana'
    }) && keyFor(song) !== keyFor({
      title: 'COLD HEART (FEAT. DUA LIPA)',
      artist: 'Elton John'
    }));
    const byKey = new Map(validIncoming.map((song) => [keyFor(song), song]));
    const merged = songs.map((base) => {
      const saved = byKey.get(keyFor(base));
      return saved ? Object.assign({}, base, saved) : base;
    });
    const known = new Set(merged.map(keyFor));
    validIncoming.forEach((song) => {
      if (song && !known.has(keyFor(song))) merged.push(song);
    });
    return merged;
  }

  function findSong(key) {
    return songs.find((song) => keyFor(song) === key);
  }

  function findDetails(song) {
    return Array.from(section.querySelectorAll('details.song-details')).filter((detail) => {
      const summary = detail.querySelector('summary');
      const title = summary && summary.querySelector('.song-title');
      const artist = summary && summary.querySelector('.artist');
      return title && artist && keyFor({ title: title.textContent, artist: artist.textContent }) === keyFor(song);
    });
  }

  function setupSummary(detail) {
    const summary = detail.querySelector('summary');
    if (!summary || summary.querySelector('.song-summary-text')) return;
    const title = summary.querySelector('span:not(.artist)');
    const artist = summary.querySelector('.artist');
    if (!title || !artist) return;
    title.classList.add('song-title');
    const text = document.createElement('span');
    text.className = 'song-summary-text';
    summary.insertBefore(text, title);
    text.appendChild(title);
    text.appendChild(artist);
    detail.addEventListener('toggle', () => {
      const song = songs.find((item) => keyFor(item) === keyFor({
        title: title.textContent,
        artist: artist.textContent
      }));
      showCover(detail, song);
    });
  }

  function showCover(detail, song) {
    const summary = detail.querySelector('summary');
    if (!summary) return;
    let image = summary.querySelector('.song-cover-thumbnail');
    let frame = summary.querySelector('.song-cover-frame');
    if (!detail.open || !song || !song.image) {
      if (frame) frame.remove();
      else if (image) image.remove();
      summary.classList.remove('has-cover');
      return;
    }
    if (!image) {
      image = document.createElement('img');
      image.className = 'song-cover-thumbnail';
      image.alt = 'Carátula de ' + song.title;
    }
    if (!frame) {
      frame = document.createElement('span');
      frame.className = 'song-cover-frame';
      frame.appendChild(image);
    }
    image.src = song.image;
    const artistKey = normalize(song.artist);
    image.classList.toggle('song-cover-amy-face', artistKey === 'amy winehouse');
    image.classList.toggle('song-cover-juan-face', artistKey === 'juan gabriel');
    image.classList.toggle('song-cover-cerati-face', artistKey === 'gustavo cerati');
    image.classList.toggle('song-cover-lucho-face', artistKey === 'lucho barrios');
    image.classList.toggle('song-cover-paulina-face', artistKey === 'paulina rubio');
    image.classList.toggle('song-cover-emmanuel-face', artistKey === 'emmanuel');
    image.classList.toggle('song-cover-christina-face', artistKey === 'cristina y los subterraneos');
    image.classList.toggle('song-cover-sabina-face', artistKey === 'joaquin sabina');
    image.classList.toggle('song-cover-nino-face', artistKey === 'nino bravo');
    image.classList.toggle('song-cover-group-portrait', ['faith no more', 'los rodriguez', 'cafe tacvba', 'cafe tacuba', 'miranda!', 'soda stereo', 'coldplay', 'duo dinamico', 'stone temple pilots', 'virus', "guns n' roses"].includes(artistKey));
    image.classList.toggle('song-cover-full-band', artistKey === 'los tres' || artistKey === 'los panchos');
    image.classList.toggle('song-cover-bacilos', artistKey === 'bacilos');
    image.classList.toggle('song-cover-miguel-face', artistKey === 'miguel bose');
    image.classList.toggle('song-cover-silvio-face', artistKey === 'silvio rodriguez');
    image.classList.toggle('song-cover-eros-head', artistKey === 'eros ramazzotti');
    image.classList.toggle('song-cover-billy-face', artistKey === 'billy joel');
    image.classList.toggle('song-cover-francisca-face', artistKey === 'francisca valenzuela');
    const text = summary.querySelector('.song-summary-text');
    if (text) summary.insertBefore(frame, text);
    summary.classList.add('has-cover');
  }

  function refreshCovers() {
    section.querySelectorAll('details.song-details').forEach((detail) => {
      setupSummary(detail);
      const summary = detail.querySelector('summary');
      const title = summary && summary.querySelector('.song-title');
      const artist = summary && summary.querySelector('.artist');
      const song = title && artist && songs.find((item) => keyFor(item) === keyFor({
        title: title.textContent,
        artist: artist.textContent
      }));
      showCover(detail, song);
    });
  }

  function populateSelector() {
    const current = selector.value;
    selector.replaceChildren();
    songs.filter((song) => song.lyrics).forEach((song) => {
      const option = document.createElement('option');
      option.value = keyFor(song);
      option.textContent = song.title + ' — ' + song.artist;
      selector.appendChild(option);
    });
    if (Array.from(selector.options).some((option) => option.value === current)) selector.value = current;
    updatePreview();
  }

  function updatePreview() {
    const song = findSong(selector.value);
    if (preview && song && song.image) {
      preview.src = song.image;
      preview.hidden = false;
      return;
    }
    if (preview) {
      preview.removeAttribute('src');
      preview.hidden = true;
    }
  }

  function saveLocalImages() {
    const imageRecords = songs
      .filter((song) => song.image)
      .map((song) => ({ title: song.title, artist: song.artist, image: song.image }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ songs: imageRecords }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function applyLocalImages() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.songs)) songs = mergeSongs(saved.songs);
    } catch (error) {
      // The page remains usable if browser storage is unavailable.
    }
    songs.forEach((song) => {
      const artistCover = artistCoverOverrides.get(normalize(song.artist));
      if (artistCover) song.image = artistCover;
      const defaultCover = defaultCoverOverrides.get(keyFor(song));
      if (defaultCover) song.image = defaultCover;
    });
    if (defaultCoverOverrides.size) saveLocalImages();
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function squareThumbnail(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const size = 280;
          const scale = Math.max(size / image.width, size / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext('2d');
          context.fillStyle = '#111';
          context.fillRect(0, 0, size, size);
          context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.74));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, songs }, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cancionero.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onerror = () => setStatus('No se pudo leer el archivo JSON.');
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.songs)) throw new Error('Formato inesperado');
        songs = mergeSongs(parsed.songs);
        const stored = saveLocalImages();
        populateSelector();
        refreshCovers();
        setStatus(stored
          ? 'JSON importado. Las carátulas quedaron guardadas en este navegador.'
          : 'JSON importado para esta sesión. Descárgalo para conservar las carátulas.');
      } catch (error) {
        setStatus('Ese archivo no parece ser un JSON válido del cancionero.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  selector.addEventListener('change', updatePreview);
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    pendingImage = '';
    if (!file) {
      updatePreview();
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    setStatus('Imagen elegida. Pulsa “Guardar carátula” para asignarla a la canción.');
  });

  saveButton.addEventListener('click', async () => {
    const file = fileInput.files && fileInput.files[0];
    const song = findSong(selector.value);
    if (!song) return setStatus('Elige una canción que ya tenga letra.');
    if (!file) return setStatus('Elige primero una foto o carátula.');
    saveButton.disabled = true;
    try {
      pendingImage = await squareThumbnail(file);
      song.image = pendingImage;
      const stored = saveLocalImages();
      refreshCovers();
      updatePreview();
      setStatus(stored
        ? 'Carátula guardada. Descarga el JSON actualizado para conservarla en el proyecto.'
        : 'Carátula aplicada en esta sesión. Descarga el JSON actualizado para conservarla.');
      fileInput.value = '';
    } catch (error) {
      setStatus('No se pudo procesar esa imagen. Prueba con JPG, PNG o WebP.');
    } finally {
      saveButton.disabled = false;
    }
  });

  if (exportButton) exportButton.addEventListener('click', exportJson);
  if (importInput) importInput.addEventListener('change', () => {
    const file = importInput.files && importInput.files[0];
    if (file) importJson(file);
    importInput.value = '';
  });

  applyLocalImages();
  populateSelector();
  refreshCovers();

  if (location.protocol === 'http:' || location.protocol === 'https:') {
    fetch('./cancionero.json', { cache: 'no-cache' })
      .then((response) => response.ok ? response.json() : null)
      .then((database) => {
        if (!database || !Array.isArray(database.songs)) return;
        songs = mergeSongs(database.songs);
        applyLocalImages();
        populateSelector();
        refreshCovers();
      })
      .catch(() => {});
  }
})();
