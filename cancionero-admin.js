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
    const byKey = new Map(incoming.map((song) => [keyFor(song), song]));
    const merged = songs.map((base) => {
      const saved = byKey.get(keyFor(base));
      return saved ? Object.assign({}, base, saved) : base;
    });
    const known = new Set(merged.map(keyFor));
    incoming.forEach((song) => {
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
    if (!detail.open || !song || !song.image) {
      if (image) image.remove();
      summary.classList.remove('has-cover');
      return;
    }
    if (!image) {
      image = document.createElement('img');
      image.className = 'song-cover-thumbnail';
      image.alt = 'Carátula de ' + song.title;
    }
    image.src = song.image;
    const text = summary.querySelector('.song-summary-text');
    if (text) summary.insertBefore(image, text);
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
      if (!saved || !Array.isArray(saved.songs)) return;
      songs = mergeSongs(saved.songs);
    } catch (error) {
      // The page remains usable if browser storage is unavailable.
    }
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
