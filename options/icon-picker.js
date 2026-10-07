/**
 * Icon picker used by the category editor.
 * Extends OptionsManager.prototype; loaded after the class definition.
 */

'use strict';

// Icon data for the picker
const ICON_DATA = {
  recent: [],
  objects: [
    { icon: '📁', keywords: ['folder', 'dossier', 'carpeta', 'cartella'] },
    { icon: '📂', keywords: ['open folder', 'dossier ouvert', 'carpeta abierta', 'cartella aperta'] },
    { icon: '📄', keywords: ['document', 'page', 'file', 'documento', 'fichier', 'archivo'] },
    { icon: '📊', keywords: ['chart', 'graph', 'analytics', 'graphique', 'análisis', 'grafico'] },
    { icon: '📈', keywords: ['trending up', 'growth', 'croissance', 'crecimiento', 'crescita'] },
    { icon: '📉', keywords: ['trending down', 'decline', 'déclin', 'declive', 'declino'] },
    { icon: '📋', keywords: ['clipboard', 'presse-papiers', 'portapapeles', 'appunti'] },
    { icon: '📌', keywords: ['pin', 'pushpin', 'épingle', 'chincheta', 'puntina'] },
    { icon: '📍', keywords: ['location', 'pin', 'lieu', 'ubicación', 'posizione'] },
    { icon: '🗂️', keywords: ['folder dividers', 'separateurs', 'separadores', 'divisori'] },
    { icon: '🗃️', keywords: ['file cabinet', 'classeur', 'archivador', 'schedario'] },
    { icon: '🗄️', keywords: ['file cabinet', 'meuble classeur', 'archivero', 'armadietto'] },
    { icon: '📦', keywords: ['box', 'package', 'boîte', 'caja', 'scatola'] },
    { icon: '📮', keywords: ['postbox', 'mail', 'boîte lettres', 'buzón', 'cassetta postale'] },
    { icon: '📭', keywords: ['mailbox', 'empty', 'boîte vide', 'buzón vacío', 'cassetta vuota'] },
    { icon: '📬', keywords: ['mailbox', 'mail', 'courrier', 'correo', 'posta'] },
    { icon: '📪', keywords: ['mailbox', 'closed', 'fermée', 'cerrado', 'chiusa'] },
    { icon: '📫', keywords: ['mailbox', 'flag up', 'drapeau levé', 'bandera arriba', 'bandiera alzata'] },
    { icon: '🗳️', keywords: ['ballot', 'vote', 'scrutin', 'votación', 'voto'] },
    { icon: '📝', keywords: ['memo', 'note', 'writing', 'écriture', 'escritura', 'scrittura'] },
    { icon: '✂️', keywords: ['scissors', 'cut', 'ciseaux', 'tijeras', 'forbici'] },
    { icon: '📐', keywords: ['ruler', 'triangle', 'règle', 'regla', 'righello'] },
    { icon: '📏', keywords: ['ruler', 'straight', 'règle droite', 'regla recta', 'righello dritto'] },
    { icon: '📎', keywords: ['paperclip', 'clip', 'trombone', 'clip papel', 'graffetta'] },
    { icon: '🖇️', keywords: ['paperclips', 'linked', 'trombones liés', 'clips unidos', 'graffette collegate'] },
    { icon: '📙', keywords: ['orange book', 'livre orange', 'libro naranja', 'libro arancione'] },
    { icon: '📗', keywords: ['green book', 'livre vert', 'libro verde', 'libro verde'] },
    { icon: '📘', keywords: ['blue book', 'livre bleu', 'libro azul', 'libro blu'] },
    { icon: '📓', keywords: ['notebook', 'carnet', 'cuaderno', 'quaderno'] },
    { icon: '📔', keywords: ['notebook', 'decorative', 'carnet décoratif', 'cuaderno decorativo', 'quaderno decorativo'] },
    { icon: '📒', keywords: ['ledger', 'grand livre', 'libro mayor', 'registro'] },
    { icon: '📚', keywords: ['books', 'library', 'livres', 'libros', 'libri'] },
    { icon: '🔖', keywords: ['bookmark', 'signet', 'marcador', 'segnalibro'] },
    { icon: '🧷', keywords: ['safety pin', 'épingle sûreté', 'imperdible', 'spilla sicurezza'] },
    { icon: '🔗', keywords: ['link', 'chain', 'lien', 'enlace', 'collegamento'] }
  ],
  symbols: [
    { icon: '⭐', keywords: ['star', 'favorite', 'étoile', 'estrella', 'stella'] },
    { icon: '🌟', keywords: ['glowing star', 'étoile brillante', 'estrella brillante', 'stella brillante'] },
    { icon: '✨', keywords: ['sparkles', 'magic', 'étincelles', 'chispas', 'scintille'] },
    { icon: '💫', keywords: ['dizzy', 'comet', 'vertige', 'mareo', 'vertigini'] },
    { icon: '🔥', keywords: ['fire', 'hot', 'feu', 'fuego', 'fuoco'] },
    { icon: '💎', keywords: ['diamond', 'gem', 'diamant', 'diamante', 'diamante'] },
    { icon: '🏆', keywords: ['trophy', 'award', 'trophée', 'trofeo', 'trofeo'] },
    { icon: '🎯', keywords: ['target', 'bullseye', 'cible', 'objetivo', 'bersaglio'] },
    { icon: '🎪', keywords: ['circus', 'tent', 'cirque', 'circo', 'circo'] },
    { icon: '🎨', keywords: ['art', 'palette', 'artist', 'artiste', 'artista', 'artista'] },
    { icon: '🎭', keywords: ['theater', 'drama', 'théâtre', 'teatro', 'teatro'] },
    { icon: '⚡', keywords: ['lightning', 'electric', 'foudre', 'rayo', 'fulmine'] },
    { icon: '☀️', keywords: ['sun', 'sunny', 'soleil', 'sol', 'sole'] },
    { icon: '🌙', keywords: ['moon', 'night', 'lune', 'luna', 'luna'] },
    { icon: '🌈', keywords: ['rainbow', 'arc-en-ciel', 'arcoíris', 'arcobaleno'] },
    { icon: '🔔', keywords: ['bell', 'notification', 'cloche', 'campana', 'campana'] },
    { icon: '🔕', keywords: ['no bell', 'mute', 'silencieux', 'silencio', 'silenzioso'] },
    { icon: '🔊', keywords: ['speaker', 'volume', 'haut-parleur', 'altavoz', 'altoparlante'] },
    { icon: '🔇', keywords: ['muted', 'silent', 'muet', 'silenciado', 'silenziato'] },
    { icon: '📢', keywords: ['megaphone', 'announcement', 'mégaphone', 'megáfono', 'megafono'] },
    { icon: '📣', keywords: ['cheering', 'megaphone', 'encouragement', 'ánimo', 'incoraggiamento'] },
    { icon: '📯', keywords: ['horn', 'postal', 'cor', 'cuerno', 'corno'] },
    { icon: '🎵', keywords: ['music note', 'note musique', 'nota musical', 'nota musicale'] },
    { icon: '🎶', keywords: ['musical notes', 'notes musique', 'notas musicales', 'note musicali'] },
    { icon: '🎼', keywords: ['musical score', 'partition', 'partitura', 'partitura'] },
    { icon: '🎹', keywords: ['piano', 'keyboard', 'clavier', 'teclado', 'tastiera'] },
    { icon: '🥁', keywords: ['drum', 'tambour', 'tambor', 'tamburo'] },
    { icon: '🎺', keywords: ['trumpet', 'trompette', 'trompeta', 'tromba'] },
    { icon: '🎸', keywords: ['guitar', 'guitare', 'guitarra', 'chitarra'] },
    { icon: '🎻', keywords: ['violin', 'violon', 'violín', 'violino'] },
    { icon: '🎷', keywords: ['saxophone', 'sax', 'saxofón', 'sassofono'] },
    { icon: '🎤', keywords: ['microphone', 'mic', 'micro', 'micrófono', 'microfono'] },
    { icon: '🎧', keywords: ['headphones', 'casque', 'auriculares', 'cuffie'] },
    { icon: '📻', keywords: ['radio', 'broadcast', 'diffusion', 'transmisión', 'trasmissione'] }
  ],
  activities: [
    { icon: '💼', keywords: ['briefcase', 'business', 'work', 'mallette', 'maletín', 'valigetta', 'travail', 'trabajo', 'lavoro'] },
    { icon: '👔', keywords: ['necktie', 'business', 'cravate', 'corbata', 'cravatta'] },
    { icon: '🎯', keywords: ['target', 'goal', 'cible', 'objetivo', 'bersaglio'] },
    { icon: '📊', keywords: ['chart', 'statistics', 'graphique', 'gráfico', 'grafico'] },
    { icon: '💻', keywords: ['laptop', 'computer', 'ordinateur', 'computadora', 'computer'] },
    { icon: '⌨️', keywords: ['keyboard', 'clavier', 'teclado', 'tastiera'] },
    { icon: '🖱️', keywords: ['mouse', 'souris', 'ratón', 'mouse'] },
    { icon: '🖥️', keywords: ['desktop', 'monitor', 'ordinateur bureau', 'computadora escritorio', 'computer desktop'] },
    { icon: '💾', keywords: ['floppy disk', 'save', 'disquette', 'disquete', 'dischetto'] },
    { icon: '💿', keywords: ['optical disk', 'cd', 'disque optique', 'disco óptico', 'disco ottico'] },
    { icon: '📀', keywords: ['dvd', 'disk', 'disque', 'disco', 'disco'] },
    { icon: '💽', keywords: ['minidisc', 'mini disque', 'minidisco', 'minidisco'] },
    { icon: '⚙️', keywords: ['gear', 'settings', 'engrenage', 'configuración', 'impostazioni'] },
    { icon: '🔧', keywords: ['wrench', 'tool', 'clé', 'llave', 'chiave'] },
    { icon: '🔨', keywords: ['hammer', 'marteau', 'martillo', 'martello'] },
    { icon: '⚒️', keywords: ['hammer pick', 'tools', 'outils', 'herramientas', 'strumenti'] },
    { icon: '🛠️', keywords: ['tools', 'repair', 'outils', 'herramientas', 'strumenti'] },
    { icon: '⛏️', keywords: ['pick', 'mining', 'pioche', 'pico', 'piccone'] },
    { icon: '🔩', keywords: ['nut bolt', 'écrou boulon', 'tuerca perno', 'dado bullone'] },
    { icon: '⚡', keywords: ['lightning', 'power', 'foudre', 'rayo', 'fulmine'] },
    { icon: '🔌', keywords: ['plug', 'electric', 'prise', 'enchufe', 'spina'] },
    { icon: '💡', keywords: ['bulb', 'idea', 'ampoule', 'bombilla', 'lampadina'] },
    { icon: '🔦', keywords: ['flashlight', 'torch', 'lampe torche', 'linterna', 'torcia'] },
    { icon: '🕯️', keywords: ['candle', 'bougie', 'vela', 'candela'] },
    { icon: '🧮', keywords: ['abacus', 'calculate', 'boulier', 'ábaco', 'abaco'] },
    { icon: '📐', keywords: ['ruler', 'triangle', 'règle', 'regla', 'righello'] },
    { icon: '📏', keywords: ['ruler', 'straight', 'règle droite', 'regla recta', 'righello dritto'] },
    { icon: '✏️', keywords: ['pencil', 'crayon', 'lápiz', 'matita'] },
    { icon: '✒️', keywords: ['pen', 'black nib', 'plume noire', 'pluma negra', 'penna nera'] },
    { icon: '🖊️', keywords: ['pen', 'stylo', 'bolígrafo', 'penna'] },
    { icon: '🖋️', keywords: ['fountain pen', 'stylo plume', 'pluma estilográfica', 'penna stilografica'] },
    { icon: '📝', keywords: ['memo', 'note', 'mémo', 'nota', 'promemoria'] },
    { icon: '📋', keywords: ['clipboard', 'presse-papiers', 'portapapeles', 'appunti'] },
    { icon: '📊', keywords: ['chart', 'graph', 'graphique', 'gráfico', 'grafico'] },
    { icon: '📈', keywords: ['trending up', 'growth', 'croissance', 'crecimiento', 'crescita'] }
  ],
  nature: [
    { icon: '🌱', keywords: ['seedling', 'plant', 'pousse', 'plántula', 'piantina'] },
    { icon: '🌿', keywords: ['herb', 'leaf', 'herbe', 'hierba', 'erba'] },
    { icon: '🍀', keywords: ['clover', 'luck', 'trèfle', 'trébol', 'trifoglio'] },
    { icon: '🌾', keywords: ['wheat', 'grain', 'blé', 'trigo', 'grano'] },
    { icon: '🌳', keywords: ['tree', 'arbre', 'árbol', 'albero'] },
    { icon: '🌲', keywords: ['evergreen', 'conifer', 'conifère', 'conífera', 'conifera'] },
    { icon: '🌴', keywords: ['palm tree', 'palmier', 'palmera', 'palma'] },
    { icon: '🌵', keywords: ['cactus', 'desert', 'désert', 'desierto', 'deserto'] },
    { icon: '🌷', keywords: ['tulip', 'flower', 'tulipe', 'tulipán', 'tulipano'] },
    { icon: '🌸', keywords: ['cherry blossom', 'spring', 'cerisier', 'cerezo', 'ciliegio'] },
    { icon: '🌺', keywords: ['hibiscus', 'tropical', 'hibiscus', 'hibisco', 'ibisco'] },
    { icon: '🌻', keywords: ['sunflower', 'yellow', 'tournesol', 'girasol', 'girasole'] },
    { icon: '🌹', keywords: ['rose', 'love', 'amour', 'amor', 'amore'] },
    { icon: '🥀', keywords: ['wilted flower', 'sad', 'fleur fanée', 'flor marchita', 'fiore appassito'] },
    { icon: '🌼', keywords: ['daisy', 'flower', 'pâquerette', 'margarita', 'margherita'] },
    { icon: '☘️', keywords: ['shamrock', 'ireland', 'trèfle', 'trébol', 'trifoglio'] },
    { icon: '🍁', keywords: ['maple leaf', 'autumn', 'érable', 'arce', 'acero'] },
    { icon: '🍂', keywords: ['fallen leaves', 'autumn', 'feuilles mortes', 'hojas caídas', 'foglie cadute'] },
    { icon: '🍃', keywords: ['leaf wind', 'nature', 'feuille vent', 'hoja viento', 'foglia vento'] },
    { icon: '🌊', keywords: ['wave', 'ocean', 'vague', 'ola', 'onda'] },
    { icon: '🏔️', keywords: ['mountain', 'snow', 'montagne', 'montaña', 'montagna'] },
    { icon: '⛰️', keywords: ['mountain', 'peak', 'montagne', 'montaña', 'montagna'] },
    { icon: '🌋', keywords: ['volcano', 'volcan', 'volcán', 'vulcano'] },
    { icon: '🗻', keywords: ['mount fuji', 'mountain', 'mont fuji', 'monte fuji', 'monte fuji'] },
    { icon: '🏕️', keywords: ['camping', 'tent', 'campement', 'campamento', 'campeggio'] },
    { icon: '🏞️', keywords: ['park', 'nature', 'parc', 'parque', 'parco'] },
    { icon: '🏜️', keywords: ['desert', 'dry', 'désert', 'desierto', 'deserto'] },
    { icon: '🏝️', keywords: ['island', 'tropical', 'île', 'isla', 'isola'] },
    { icon: '🏖️', keywords: ['beach', 'sand', 'plage', 'playa', 'spiaggia'] },
    { icon: '⛱️', keywords: ['umbrella beach', 'parasol', 'sombrilla', 'ombrellone'] },
    { icon: '🌤️', keywords: ['sun cloud', 'partly cloudy', 'soleil nuage', 'sol nube', 'sole nuvola'] },
    { icon: '⛅', keywords: ['cloud', 'partly cloudy', 'nuage', 'nube', 'nuvola'] }
  ],
  food: [
    { icon: '🍎', keywords: ['apple', 'red', 'pomme', 'manzana', 'mela'] },
    { icon: '🍊', keywords: ['orange', 'citrus', 'agrume', 'cítrico', 'agrume'] },
    { icon: '🍋', keywords: ['lemon', 'yellow', 'citron', 'limón', 'limone'] },
    { icon: '🍌', keywords: ['banana', 'yellow', 'banane', 'plátano', 'banana'] },
    { icon: '🍉', keywords: ['watermelon', 'summer', 'pastèque', 'sandía', 'anguria'] },
    { icon: '🍇', keywords: ['grapes', 'wine', 'raisins', 'uvas', 'uva'] },
    { icon: '🍓', keywords: ['strawberry', 'red', 'fraise', 'fresa', 'fragola'] },
    { icon: '🫐', keywords: ['blueberry', 'blue', 'myrtille', 'arándano', 'mirtillo'] },
    { icon: '🍈', keywords: ['melon', 'cantaloupe', 'melon', 'melón', 'melone'] },
    { icon: '🍒', keywords: ['cherry', 'red', 'cerise', 'cereza', 'ciliegia'] },
    { icon: '🍑', keywords: ['peach', 'orange', 'pêche', 'durazno', 'pesca'] },
    { icon: '🥭', keywords: ['mango', 'tropical', 'mangue', 'mango', 'mango'] },
    { icon: '🍍', keywords: ['pineapple', 'tropical', 'ananas', 'piña', 'ananas'] },
    { icon: '🥥', keywords: ['coconut', 'tropical', 'noix coco', 'coco', 'cocco'] },
    { icon: '🥝', keywords: ['kiwi', 'green', 'kiwi', 'kiwi', 'kiwi'] },
    { icon: '🍅', keywords: ['tomato', 'red', 'tomate', 'tomate', 'pomodoro'] },
    { icon: '🍆', keywords: ['eggplant', 'purple', 'aubergine', 'berenjena', 'melanzana'] },
    { icon: '🥑', keywords: ['avocado', 'green', 'avocat', 'aguacate', 'avocado'] },
    { icon: '🥦', keywords: ['broccoli', 'green', 'brocoli', 'brócoli', 'broccolo'] },
    { icon: '🥬', keywords: ['leafy greens', 'lettuce', 'légumes verts', 'verduras', 'verdure'] },
    { icon: '🥒', keywords: ['cucumber', 'green', 'concombre', 'pepino', 'cetriolo'] },
    { icon: '🌶️', keywords: ['pepper', 'hot', 'piment', 'chile', 'peperoncino'] },
    { icon: '🫑', keywords: ['bell pepper', 'poivron', 'pimiento', 'peperone'] },
    { icon: '🌽', keywords: ['corn', 'yellow', 'maïs', 'maíz', 'mais'] },
    { icon: '🥕', keywords: ['carrot', 'orange', 'carotte', 'zanahoria', 'carota'] },
    { icon: '🫒', keywords: ['olive', 'green', 'olive', 'aceituna', 'oliva'] },
    { icon: '🧄', keywords: ['garlic', 'white', 'ail', 'ajo', 'aglio'] },
    { icon: '🧅', keywords: ['onion', 'oignon', 'cebolla', 'cipolla'] },
    { icon: '🥔', keywords: ['potato', 'pomme terre', 'papa', 'patata'] },
    { icon: '🍠', keywords: ['sweet potato', 'patate douce', 'batata', 'patata dolce'] },
    { icon: '🥐', keywords: ['croissant', 'french', 'français', 'francés', 'francese'] },
    { icon: '🥖', keywords: ['baguette', 'bread', 'pain', 'pan', 'pane'] },
    { icon: '🍞', keywords: ['bread', 'loaf', 'pain', 'pan', 'pane'] },
    { icon: '🥨', keywords: ['pretzel', 'bretzel', 'pretzel', 'pretzel'] },
    { icon: '🥯', keywords: ['bagel', 'bagel', 'bagel', 'bagel'] },
    { icon: '🧀', keywords: ['cheese', 'fromage', 'queso', 'formaggio'] }
  ]
};

// Initialize icon picker functionality
OptionsManager.prototype.initIconData = function() {
  // Load recent icons from storage
  const recentIcons = JSON.parse(localStorage.getItem('recentIcons') || '[]');
  ICON_DATA.recent = recentIcons.slice(0, 16).map(icon => ({ icon, keywords: [] }));
};

OptionsManager.prototype.openIconPicker = function() {
  this.initIconData();
  this.elements.iconPickerOverlay.style.display = 'flex'; // Ensure it is display:flex before adding show
  this.elements.iconSelectorBtn.classList.add('active');
  
  requestAnimationFrame(() => {
    this.elements.iconPickerOverlay.classList.add('show');
  });
  
  // Show recent icons by default
  this.switchIconCategory('objects');
  
  // Focus search input
  setTimeout(() => {
    this.elements.iconSearchInput?.focus();
  }, 200);
};

OptionsManager.prototype.closeIconPicker = function() {
  this.elements.iconSelectorBtn.classList.remove('active');
  this.hideOverlay(this.elements.iconPickerOverlay);
};

OptionsManager.prototype.switchIconCategory = function(category) {
  // Update active category button
  document.querySelectorAll('.icon-category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
  
  // Clear search
  if (this.elements.iconSearchInput) {
    this.elements.iconSearchInput.value = '';
  }
  
  // Render icons for the selected category
  this.renderIconGrid(ICON_DATA[category] || [], category);
};

OptionsManager.prototype.searchIcons = function(query) {
  if (!query.trim()) {
    // If search is empty, show current category
    const activeCategory = document.querySelector('.icon-category-btn.active')?.dataset.category || 'recent';
    this.renderIconGrid(ICON_DATA[activeCategory] || [], activeCategory);
    return;
  }
  
  // Normalize query for better matching
  const normalizedQuery = query.toLowerCase().trim();
  
  // Search through all categories
  const allIconsData = [
    ...ICON_DATA.objects,
    ...ICON_DATA.symbols,
    ...ICON_DATA.activities,
    ...ICON_DATA.nature,
    ...ICON_DATA.food
  ];
  
  // Filter icons based on keywords
  const filteredIcons = allIconsData.filter(iconData => {
    // Check if query matches any keyword
    return iconData.keywords.some(keyword => 
      keyword.toLowerCase().includes(normalizedQuery)
    );
  });
  
  // Render filtered results
  this.renderIconGrid(filteredIcons, 'search');
};

OptionsManager.prototype.renderIconGrid = function(iconsData, category) {
  if (!this.elements.iconGrid) return;
  
  if (iconsData.length === 0) {
    // Clear existing content safely
    while (this.elements.iconGrid.firstChild) {
      this.elements.iconGrid.removeChild(this.elements.iconGrid.firstChild);
    }
    
    // Create empty state container
    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'icon-grid empty';
    
    const emptyText = document.createElement('div');
    emptyText.className = 'icon-empty-text';
    emptyText.textContent = category === 'recent' ? 
            (browser.i18n.getMessage('noRecentIcons') || 'No recent icons') : 
            category === 'search' ?
            (browser.i18n.getMessage('noIconsFound') || 'No icons found') :
      (browser.i18n.getMessage('noIconsFound') || 'No icons found');
    
    emptyContainer.appendChild(emptyText);
    this.elements.iconGrid.appendChild(emptyContainer);
    return;
  }
  
  // Clear existing content safely
  while (this.elements.iconGrid.firstChild) {
    this.elements.iconGrid.removeChild(this.elements.iconGrid.firstChild);
  }
  
  iconsData.forEach(iconData => {
    const icon = iconData.icon || iconData; // Support both formats
    const iconElement = document.createElement('button');
    iconElement.className = 'icon-item';
    iconElement.textContent = icon;
    iconElement.type = 'button';
    iconElement.addEventListener('click', () => this.selectIcon(icon));
    
    // Mark recent icons
    if (category !== 'recent' && ICON_DATA.recent.some(recentData => (recentData.icon || recentData) === icon)) {
      iconElement.classList.add('recent');
    }
    
    this.elements.iconGrid.appendChild(iconElement);
  });
};

OptionsManager.prototype.selectIcon = function(icon) {
  // Update the selected icon display
  if (this.elements.selectedIcon) {
    this.elements.selectedIcon.textContent = icon;
  }
  
  // Add to recent icons
  this.addToRecentIcons(icon);
  
  // Close the picker
  this.closeIconPicker();
  
  // Visual feedback
  this.elements.iconSelectorBtn.style.transform = 'scale(1.05)';
  setTimeout(() => {
    this.elements.iconSelectorBtn.style.transform = '';
  }, 150);
};

OptionsManager.prototype.addToRecentIcons = function(icon) {
  let recentIcons = JSON.parse(localStorage.getItem('recentIcons') || '[]');
  
  // Remove if already exists
  recentIcons = recentIcons.filter(i => i !== icon);
  
  // Add to beginning
  recentIcons.unshift(icon);
  
  // Limit to 16 icons
  recentIcons = recentIcons.slice(0, 16);
  
  // Save to localStorage
  localStorage.setItem('recentIcons', JSON.stringify(recentIcons));
  
  // Update in memory
  ICON_DATA.recent = recentIcons.map(recent => ({ icon: recent, keywords: [] }));
};

OptionsManager.prototype.getSelectedIcon = function() {
  return this.elements.selectedIcon?.textContent || '📁';
};
