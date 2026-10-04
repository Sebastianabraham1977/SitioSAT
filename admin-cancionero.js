(() => {
  'use strict';

  const DB_URL = './cancionero.json';
  const STORAGE_KEY = 'sat-songbook-admin-db-v1';
  const list = document.querySelector('#song-list');
  const editor = document.querySelector('#editor-content');
  const search = document.querySelector('#search');
  const filter = document.querySelector('#filter');
  const counts = document.querySelector('#counts');
  let songs = [];
  let selectedKey = '';
  let statusTimer;

  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const keyFor = (song) => `${normalize(song.title)}||${normalize(song.artist)}`;
  const hasLyrics = (song) => typeof song.lyrics === 'string' && song.lyrics.trim().length > 0;
  const cleanSong = (song) => Object.assign({}, song, {
    title: String(song.title || '').trim(),
    artist: String(song.artist || '').trim(),
    lyrics: typeof song.lyrics === 'string' ? song.lyrics : '',
    externalUrl: song.externalUrl || null,
    image: song.image || null
  });

  function announce(message, error = false) {
    const status = document.querySelector('#status');
    if (!status) return;
    status.style.color = error ? 'var(--red)' : 'var(--green)';
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 6500);
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, songs }));
      return true;
    } catch (error) {
      announce('El navegador se quedó sin espacio local. Descarga el JSON para conservar los cambios.', true);
      return false;
    }
  }

  function updateCounts() {
    const missing = songs.filter((song) => !hasLyrics(song)).length;
    counts.textContent = `${songs.length} canciones · ${missing} sin texto desplegable`;
  }

  function renderList() {
    const query = normalize(search.value);
    const mode = filter.value;
    const visible = songs.filter((song) => {
      if (mode === 'missing' && hasLyrics(song)) return false;
      if (mode === 'complete' && !hasLyrics(song)) return false;
      return !query || normalize(`${song.title} ${song.artist}`).includes(query);
    });
    list.replaceChildren();
    visible.forEach((song) => {
      const key = keyFor(song);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `song-row ${hasLyrics(song) ? 'complete' : 'pending'}${key === selectedKey ? ' active' : ''}`;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(key === selectedKey));
      button.innerHTML = `${escapeHtml(song.title)}<small>${escapeHtml(song.artist)} · ${hasLyrics(song) ? 'texto agregado' : 'falta texto'}</small>`;
      button.addEventListener('click', () => selectSong(key));
      list.append(button);
    });
    if (!visible.length) list.innerHTML = '<p class="empty">No hay resultados.</p>';
    updateCounts();
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function selectedSong() { return songs.find((song) => keyFor(song) === selectedKey); }

  function selectSong(key) {
    selectedKey = key;
    renderList();
    renderEditor();
  }

  function renderEditor() {
    const song = selectedSong();
    if (!song) {
      editor.className = 'empty';
      editor.textContent = 'Elige una canción de la lista o crea una nueva.';
      return;
    }
    editor.className = '';
    editor.innerHTML = `
      <div class="editor-top"><h2>Editar canción</h2><div class="toolbar">
        <button type="button" id="export-json" class="primary">Descargar JSON</button>
        <label class="button file-button">Importar JSON<input id="import-json" type="file" accept="application/json,.json" aria-label="Importar archivo JSON"></label>
      </div></div>
      <div class="fields">
        <div class="field"><label for="song-title">Título</label><input id="song-title" type="text" value="${escapeHtml(song.title)}"></div>
        <div class="field"><label for="song-artist">Artista</label><input id="song-artist" type="text" value="${escapeHtml(song.artist)}"></div>
        <div class="field full"><label for="song-lyrics">Letra o texto autorizado</label><textarea id="song-lyrics" placeholder="Pega aquí una letra propia, de dominio público o autorizada para publicar">${escapeHtml(song.lyrics)}</textarea><p class="lyrics-help">Los saltos de línea se conservan al exportar.</p></div>
        <div class="field full"><label for="song-source">Enlace a fuente autorizada (si no vas a guardar el texto)</label><input id="song-source" type="url" value="${escapeHtml(song.externalUrl || '')}" placeholder="https://…"></div>
        <div class="field full"><label>Foto o carátula</label><div class="cover-line"><img id="cover-preview" class="cover-preview" src="${escapeHtml(song.image || '')}" alt="Vista previa" ${song.image ? '' : 'hidden'}><div class="cover-actions"><input id="cover-file" type="file" accept="image/jpeg,image/png,image/webp"><p class="help">La imagen se reduce para que el JSON siga liviano. Queda guardada como datos dentro del archivo exportado.</p><button type="button" id="clear-cover">Quitar foto</button></div></div></div>
        <div class="field"><label for="image-credit">Crédito de imagen (opcional)</label><input id="image-credit" type="text" value="${escapeHtml(song.imageCredit || '')}"></div>
        <div class="field"><label for="image-source">Fuente de la foto (opcional)</label><input id="image-source" type="url" value="${escapeHtml(song.imageSource || '')}" placeholder="https://…"></div>
        <div class="field full"><label for="image-license">Licencia de la foto (opcional)</label><input id="image-license" type="url" value="${escapeHtml(song.imageLicenseUrl || '')}" placeholder="https://…"></div>
      </div>
      <div class="actions"><button type="button" id="save-song" class="primary">Guardar canción en este navegador</button><span id="status" role="status" aria-live="polite"></span></div>
      ${song.externalUrl ? `<a class="source-link" href="${escapeHtml(song.externalUrl)}" target="_blank" rel="noopener">Abrir enlace actual de la canción ↗</a>` : ''}`;

    document.querySelector('#save-song').addEventListener('click', saveSelectedSong);
    document.querySelector('#export-json').addEventListener('click', exportDatabase);
    document.querySelector('#import-json').addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) importDatabase(file);
      event.target.value = '';
    });
    document.querySelector('#cover-file').addEventListener('change', loadCover);
    document.querySelector('#clear-cover').addEventListener('click', () => {
      const preview = document.querySelector('#cover-preview');
      preview.removeAttribute('src'); preview.hidden = true;
      const file = document.querySelector('#cover-file'); if (file) file.value = '';
      song.image = null; persist(); announce('Foto quitada de esta ficha. Guarda y exporta el JSON para conservarlo.');
    });
  }

  function saveSelectedSong() {
    const song = selectedSong();
    if (!song) return;
    const title = document.querySelector('#song-title').value.trim();
    const artist = document.querySelector('#song-artist').value.trim();
    if (!title || !artist) return announce('Completa el título y el artista.', true);
    const duplicate = songs.find((item) => item !== song && keyFor(item) === keyFor({ title, artist }));
    if (duplicate) return announce('Ya existe otra ficha con ese título y artista.', true);
    song.title = title;
    song.artist = artist;
    song.lyrics = document.querySelector('#song-lyrics').value.trim();
    song.externalUrl = document.querySelector('#song-source').value.trim() || null;
    song.imageCredit = document.querySelector('#image-credit').value.trim();
    song.imageSource = document.querySelector('#image-source').value.trim();
    song.imageLicenseUrl = document.querySelector('#image-license').value.trim();
    selectedKey = keyFor(song);
    const saved = persist();
    renderList();
    renderEditor();
    announce(saved ? 'Guardado en este navegador. Descarga el JSON para hacer una copia en el proyecto.' : 'No se pudo guardar localmente; descarga el JSON ahora.', !saved);
  }

  function downsizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la foto'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Archivo de imagen inválido'));
        image.onload = () => {
          const max = 360;
          const scale = Math.min(1, max / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const context = canvas.getContext('2d');
          context.fillStyle = '#101010'; context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.76));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function loadCover(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return announce('Elige una foto JPG, PNG o WebP.', true);
    try {
      const dataUrl = await downsizeImage(file);
      const song = selectedSong();
      song.image = dataUrl;
      const preview = document.querySelector('#cover-preview');
      preview.src = dataUrl; preview.hidden = false;
      persist();
      announce('Foto añadida. Guarda y descarga el JSON para conservarla en el proyecto.');
    } catch (error) { announce('No pude procesar esa imagen.', true); }
  }

  function exportDatabase() {
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, songs }, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'cancionero.json';
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    announce('Descargando cancionero.json. Reemplaza la base del proyecto con ese archivo para conservarlo allí.');
  }

  function importDatabase(file) {
    const reader = new FileReader();
    reader.onerror = () => announce('No se pudo leer ese JSON.', true);
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (!incoming || !Array.isArray(incoming.songs)) throw new Error('invalid');
        const byKey = new Map(incoming.songs.filter((song) => song.title && song.artist).map((song) => [keyFor(song), cleanSong(song)]));
        const base = songs.map((song) => byKey.get(keyFor(song)) || song);
        const existing = new Set(base.map(keyFor));
        incoming.songs.forEach((song) => { if (song.title && song.artist && !existing.has(keyFor(song))) base.push(cleanSong(song)); });
        songs = base; selectedKey = songs[0] ? keyFor(songs[0]) : '';
        persist(); renderList(); renderEditor();
        announce(`JSON importado: ${songs.length} canciones. Se combinaron sus fichas con esta base.`);
      } catch (error) { announce('El archivo debe ser un JSON del Cancionero con una lista songs.', true); }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function addSong() {
    const song = { title: 'NUEVA CANCIÓN', artist: 'Artista', lyrics: '', externalUrl: null, image: null };
    let suffix = 2;
    while (songs.some((item) => keyFor(item) === keyFor(song))) song.title = `NUEVA CANCIÓN ${suffix++}`;
    songs.push(song); selectedKey = keyFor(song); persist(); renderList(); renderEditor();
    document.querySelector('#song-title').focus(); document.querySelector('#song-title').select();
  }

  async function initialize() {
    try {
      const response = await fetch(DB_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar cancionero.json');
      const db = await response.json();
      if (!Array.isArray(db.songs)) throw new Error('Formato inválido');
      songs = db.songs.filter((song) => song.title && song.artist).map(cleanSong);
      try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (local && Array.isArray(local.songs)) {
          const byKey = new Map(local.songs.map((song) => [keyFor(song), cleanSong(song)]));
          songs = songs.map((song) => byKey.get(keyFor(song)) || song);
          const keys = new Set(songs.map(keyFor));
          local.songs.forEach((song) => { if (song.title && song.artist && !keys.has(keyFor(song))) songs.push(cleanSong(song)); });
        }
      } catch (error) { /* Continue with the project JSON. */ }
      selectedKey = songs[0] ? keyFor(songs[0]) : '';
      renderList(); renderEditor();
    } catch (error) {
      editor.innerHTML = '<h2>No se pudo abrir cancionero.json</h2><p>Para que el navegador pueda leer la base del proyecto, abre el sitio desde su dirección web o inicia un servidor local en la carpeta del proyecto. Luego recarga esta página.</p><p>Si ya tienes un JSON exportado, usa Importar JSON después de elegir una canción.</p>';
      counts.textContent = 'Base de datos no disponible';
    }
  }

  search.addEventListener('input', renderList);
  filter.addEventListener('change', renderList);
  document.querySelector('#new-song').addEventListener('click', addSong);
  initialize();
})();
