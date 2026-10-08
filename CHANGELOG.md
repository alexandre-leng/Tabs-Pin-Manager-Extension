# Changelog

All notable changes to this project will be documented in this file.

## [1.4.2] - 2026-10-08

### 📝 Documentation
- README : tirets cadratins remplacés par une ponctuation simple.

## [1.4.1] - 2026-10-08

### 🛠️ Corrections
- **Onglets ouverts en double après une redirection** : un site qui redirige (`a.com` → `www.a.com`, `http` → `https`) n'était jamais reconnu, et chaque « Ouvrir tout » ajoutait un nouvel onglet épinglé.
- **Firefox, onglets en chargement** : un onglet encore vide (`about:blank`) n'était pas reconnu : « Fermer » l'ignorait et « Ouvrir tout » le dupliquait.
- **Renommage annulé à chaque mise à jour** : une catégorie renommée avec son nom anglais par défaut (ex. « Development » dans un navigateur en français) reprenait son nom traduit à chaque mise à jour ; les noms par défaut ne sont plus traduits qu'une fois.
- **Onglets cachés après la mise à jour** : les onglets laissés sans catégorie valide par les anciennes versions sont rattachés à la première catégorie lors de la mise à jour, et une liste de catégories vide est remplacée par les catégories par défaut.
- **Adresse refusée à tort** : deux pages différenciées par un paramètre (`?sku=1` / `?sku=2`) étaient considérées comme la même adresse et la seconde ne pouvait pas être enregistrée.
- **Comparaison d'adresses** : la route racine `#/` et l'ordre des paramètres ne changent plus la page reconnue.
- **Catégorie importée sans icône** : elle bloquait toute modification de catégorie ; une icône par défaut lui est donnée.
- **Popup** : « 1 onglet ouvert / épinglé » au singulier ; « Ouverture… » et le bouton de fermeture du dialogue traduits ; la confirmation de fermeture annonce bien le nombre d'onglets épinglés fermés ; un double-clic dans « Épingler dans une catégorie » n'affiche plus d'erreur ; le séparateur entre catégories utilisées et vides s'affiche.
- **Options** : sélectionner du texte dans un champ et relâcher la souris hors du dialogue ne le ferme plus (et n'efface plus la saisie) ; le sélecteur rapide de catégorie se ferme quand une autre action s'ouvre et ne sort plus de l'écran ; le focus clavier reste sur la carte après « Monter / Descendre », « Supprimer » et l'enregistrement d'un dialogue.
- **Accessibilité et langues** : les messages (toasts) sont annoncés par les lecteurs d'écran ; la langue et le sens d'écriture de la page suivent celle du navigateur (l'arabe s'affiche de droite à gauche) ; les noms de domaine internationaux s'affichent en clair (`bücher.ch` au lieu de `xn--bcher-kva.ch`).
- **Stockage** : un changement de l'horloge système ne peut plus bloquer les opérations de stockage.
- **Doublons existants non modifiables** (régression de 1.4.0) : un onglet enregistré en double par une ancienne version ne pouvait plus être renommé ni changé de catégorie (« adresse déjà enregistrée ») ; seul l'ajout d'une adresse déjà enregistrée est maintenant refusé.

### 📝 Documentation
- README réécrit : stockage 100 % local, permissions expliquées, appel aux services de favicons indiqué, format de sauvegarde, versions minimales, architecture à jour, procédure de release.

## [1.4.0] - 2026-10-07

### 🛠️ Corrections
- **Onglets invisibles après « Réinitialiser les catégories »** : les onglets d'une catégorie supprimée (par exemple importée) n'apparaissaient plus dans le popup ; ils sont maintenant rattachés à la première catégorie. Un onglet enregistré avec une catégorie inconnue l'est aussi.
- **Catégories bloquées après un import** : un fichier importé pouvait contenir une catégorie sans nom ; ensuite, renommer n'importe quelle catégorie échouait (« données invalides ») jusqu'à une réinitialisation. Ces catégories sont maintenant écartées à l'import.
- **Onglet enregistré en double** : un double-clic dans la fenêtre « Épingler dans une catégorie » enregistrait deux fois l'onglet ; le popup ignore le second clic et l'arrière-plan refuse une adresse déjà enregistrée.
- **Date d'ouverture importée** : une valeur invalide (« il y a 20 733 jours ») n'est plus importée.
- **Pages confondues** : deux vidéos YouTube (`?v=`), deux listes (`list`) ou deux routes d'une application web (`#/a`, `#/b`) étaient considérées comme le même onglet, et le second n'était jamais ouvert ; ces paramètres et routes sont maintenant pris en compte.
- **Modification perdue** : une lecture lancée pendant une sauvegarde pouvait remettre en mémoire d'anciennes données, que la sauvegarde suivante réécrivait ; la lecture est maintenant ignorée dans ce cas.
- **Arrière-plan bloqué** : une erreur de stockage au démarrage faisait échouer tous les messages jusqu'au rechargement de l'extension ; l'initialisation est maintenant retentée au message suivant.
- **Mémoire incohérente** : si une écriture échouait (quota…), la mémoire gardait des données absentes du stockage ; elle n'est plus modifiée qu'après une écriture réussie.
- **Popup** : le bouton « Ouvrir N onglets » et l'ouverture d'une catégorie ignorent maintenant les onglets désactivés, et la confirmation de fermeture annonce le nombre d'onglets réellement fermés (rien n'est demandé s'il n'y en a aucun).
- **Options** : enregistrer deux fois la même adresse est refusé.
- **Stockage** : la limitation de débit espace maintenant aussi les appels simultanés, et la clé de cache n'est plus ambiguë pour une lecture avec valeurs par défaut.
- **« Dernière ouverture » mal traduite** : le temps écoulé était assemblé à la main (« ago 3 days », « vor 3 Stundes », « 前 3 日s »…) ; il est maintenant formaté par le navigateur dans la langue de l'utilisateur (« il y a 3 heures », « vor 3 Stunden », « 3 時間前 »).
- **« Onglet déjà épinglé »** : le popup comparait les adresses autrement que le script d'arrière-plan, et pouvait donc annoncer un onglet comme épinglé (ou non) à tort ; une seule fonction de comparaison est partagée.
- **Ordre des catégories** : la catégorie « Développement » était reconnue par son nom (toute catégorie contenant « dev », comme « Devis », passait en dernier, et la règle échouait dans les autres langues) ; elle l'est maintenant par son identifiant.
- **Données importées effacées** : un import fait juste après l'installation pouvait être écrasé par l'initialisation des données par défaut, et une lecture lente pouvait remettre en mémoire d'anciennes données. Les opérations sur les données sont désormais exécutées une par une, et une lecture qui chevauche une écriture n'est plus utilisée ni mise en cache.
- **Onglets en cours de chargement** : un onglet pas encore chargé n'était pas reconnu (adresse vide) : « Fermer » une catégorie l'ignorait et « Ouvrir » pouvait le dupliquer.
- **Accessibilité** : contraste insuffisant corrigé (bouton « Fermer » du popup, textes secondaires) ; les fenêtres de dialogue sont annoncées comme telles, prennent le focus à l'ouverture et le rendent à la fermeture ; Échap ferme seulement la fenêtre du dessus ; cartes et badges de catégorie utilisables au clavier ; préférence « réduire les animations » respectée ; styles de contraste élevé réactivés (`prefers-contrast: high` n'existe pas, remplacé par `more`).
- **Traductions manquantes** : Les textes de fermeture d'une catégorie (« Fermer », confirmation, messages de résultat) manquaient dans 12 langues et s'affichaient en anglais.
- **Message français** : « Certains onglets étaient déjà ouverts » n'affichait plus les nombres d'onglets ouverts et créés.
- **Vérification du stockage** : Le contrôle de santé vérifie maintenant que la valeur relue correspond à celle écrite.
- **Import sécurisé** : Un fichier importé ne peut plus enregistrer d'onglets sans URL http(s) (`javascript:`, `file:`…) ni de données mal formées ; les identifiants en double sont corrigés et les onglets ignorés sont comptés.
- **Traduction du popup** : Les textes du popup sont traduits dès l'ouverture, même si le script d'arrière-plan tarde à répondre ou échoue.
- **Échec d'ouverture signalé** : Quand aucun onglet n'a pu être ouvert, le popup affichait « Tous les onglets sont déjà ouverts » ; il affiche maintenant une erreur.
- **Page d'options** : Le modèle du sélecteur rapide de catégorie était placé après `</html>` (HTML invalide) ; ses boutons et celui du choix d'icône ont désormais un libellé traduit, aussi lu par les lecteurs d'écran.
- **Titres non traduits** : Le titre « Modifier l'onglet » et le message d'échec d'export utilisaient des clés inexistantes et restaient en anglais dans toutes les langues ; un test vérifie désormais que chaque texte demandé existe.
- **Icônes exposées aux sites** : Le manifeste rendait les icônes de l'extension accessibles à toutes les pages web, ce qui permettait de détecter l'extension ; cette exposition inutile est retirée.
- **Liens du dépôt** : Les liens du manifeste, du README et du changelog pointent vers le bon dépôt.

### 🧹 Qualité
- Versions minimales déclarées : Firefox 115 (ESR) et Chrome 104, d'après les fonctions utilisées ; Node 20.11 pour les outils (`engines`, `.nvmrc`) ; mises à jour des dépendances proposées par Dependabot.
- `popup.js` (≈ 480 lignes) et `options.js` (≈ 380) allégés : liste des catégories, ordre des catégories et cartes d'onglet passent dans leurs propres modules.
- **Tests d'interface** : Playwright charge la vraie extension dans Chromium et teste le popup et la page d'options (ouverture, fermeture, ajout, modification, suppression, flèches, glisser-déposer, changement de catégorie, icônes, export / import), avec un audit d'accessibilité axe-core (clair et sombre) et des tests au clavier ; exécutés dans la CI.
- **Textes de secours retirés** : les 63 textes anglais en dur après `getMessage(...)` sont supprimés ; le test des traductions garantit que chaque texte demandé existe.
- **Stylelint** : configuration standard, corrections (doublons, propriétés inexistantes, animations en double, notations), exécuté dans la CI.
- **Modules ES** : tout le code (arrière-plan, popup, options, `lib/`) est passé en modules ES natifs avec des imports explicites. Il n'y a plus de variables globales partagées ni de dépendance à l'ordre des balises `<script>` : chaque page charge un seul module d'entrée, et l'arrière-plan est déclaré `type: module` (Firefox et Chrome).
- **Arrière-plan découpé** : la classe unique d'environ 1000 lignes devient 7 modules (contrôleur des messages, stockage des données, actions sur les onglets, validation de l'import, utilitaires), le plus gros faisant 177 lignes ; un état jamais lu (`tabUrlsById`) est supprimé. Chaque module a ses propres tests.
- Envoi de messages au script d'arrière-plan centralisé dans `UiUtils.sendMessage` (deux variantes divergentes auparavant) ; le popup ne relance plus une action que le script d'arrière-plan a refusée.
- CSS : 29 règles jamais utilisées et 55 variables recopiées à l'identique de `shared.css` supprimées (≈ 280 lignes), sans aucun changement visuel (16 captures clair/sombre comparées pixel par pixel) ; un test empêche de réintroduire des styles morts.
- Messages d'ouverture d'onglets du popup regroupés dans `reportOpenResult` ; carte d'onglet des options et validation de l'import découpées en petites fonctions ; ESLint limite la complexité et la longueur des fonctions, sans avertissement toléré en CI.
- `StorageManager` simplifié : une seule boucle de reprise pour lecture et écriture, suppression d'une fausse déduplication (identifiants horodatés jamais identiques) et de méthodes inutilisées ; le cache renvoie des copies pour qu'une modification par l'appelant ne le corrompe pas.
- Code mort retiré : actions `updateSettings` / `updateTab` jamais envoyées, fonctions inutilisées d'`I18nHelper`, 8 textes de traduction inutilisés (un test empêche d'en réintroduire).
- Prise en charge des conteneurs Firefox retirée (`lib/container-utils.js`) : sans la permission `contextualIdentities`, elle n'était jamais active. Les identifiants de conteneur des anciennes sauvegardes sont ignorés à l'import.
- Logique d'ouverture des onglets factorisée (`openTabConfigs`), journaux de débogage désactivés par défaut, helpers partagés popup/options (`lib/ui-utils.js`).
- `popup.js` et `options.js` découpés par fonctionnalité (édition et réorganisation des onglets, catégories, sélecteur d'icônes, import/export, actions du popup, sélection de catégorie) ; une méthode `getSelectedIcon` définie en double supprimée.
- Traduction des pages centralisée dans `I18nHelper.localizePage` (le module n'était utilisé que par les tests) ; textes de secours du HTML et commentaires en anglais.
- Tests ajoutés : validation de l'import, `localizePage`, cohérence des versions `package.json` / `manifest.json`.
- Build, lint et dev travaillent sur une copie dans `build/<navigateur>/` : `manifest.json` n'est plus réécrit à chaque commande, et seuls les fichiers de l'extension sont empaquetés (`eslint.config.js` ne part plus dans les zips). La liste des scripts d'arrière-plan Firefox est lue depuis `background.js`.
- README corrigé (dossier du dépôt, commandes, permissions) ; nom du paquet npm valide.
- ESLint, `.editorconfig` et tests (ouverture des onglets, helpers, cohérence des traductions) exécutés dans la CI.

## [1.3.5] - 2026-10-06

### 🛠️ Corrections
- **Glisser-déposer dans la grille** : Déplacer un onglet du haut tout en bas le plaçait en deuxième position. La position de dépôt tient désormais compte des colonnes (ligne puis colonne), et la carte se déplace directement pendant le glissement au lieu d'un emplacement « Drop here » qui décalait toute la grille.
- **Annulation du déplacement** : Annuler un glisser-déposer (Échap ou lâcher hors de la grille) rétablit l'ordre d'origine.

### ✨ Nouvelles Fonctionnalités
- **Boutons Monter / Descendre** : Chaque onglet épinglé a des flèches ↑ / ↓ pour le réorganiser sans glisser-déposer.
- **Liens GitHub** : Liens « Signaler un bug » et « Demande de fonctionnalité » dans le popup et la page d'options, traduits dans toutes les langues.

## [1.3.4] - 2026-10-06

### 🛠️ Corrections
- **Réorganisation des onglets** : Le glisser-déposer place désormais l'onglet à la bonne position. Le message « Tab order updated! » s'affichait mais l'ordre enregistré était faux (mauvais calcul de position, onglet déplacé renvoyé en tête de liste).
- **Ordre complet enregistré** : Tous les onglets reçoivent un ordre explicite lors d'un déplacement, via une nouvelle action `reorderTabs`.
- **Modales qui disparaissaient** : Les fenêtres de la page d'options ne se ferment plus toutes seules juste après leur ouverture (par exemple après un appui sur Échap).
- **Service Worker Chrome** : Les écouteurs d'événements sont enregistrés immédiatement, pour ne plus perdre de messages ni l'événement d'installation au réveil du service worker.
- **Catégories renommées** : Les noms de catégories personnalisés ne sont plus réinitialisés à chaque mise à jour de l'extension.
- **Installation** : Les données existantes ne sont plus écrasées à l'installation.
- **Popup** : Le popup reste utilisable si le script d'arrière-plan ne répond pas, et n'écrase plus les réglages avec une copie périmée.
- **Sélecteur de catégorie** : Ouvrir le sélecteur rapide de catégorie pendant la fermeture d'un autre ne supprime plus le mauvais.
- **Édition d'un onglet** : Modifier un onglet ne le réactive plus s'il était désactivé.
- **Export** : Le téléchargement de l'export n'est plus annulé sous Firefox.
- **Notifications** : Un nouveau message n'est plus masqué trop tôt par le précédent.
- **Cache de stockage** : Le cache est invalidé dès qu'une autre partie de l'extension modifie les données.
- **Import** : Les fichiers d'import mal formés sont rejetés.

## [1.3.1] - 2026-05-19

### 🛠️ Corrections
- **Pipeline de release** : Automatisation du build, tag et publication GitHub pour Firefox et Chrome.

## [1.3.0] - 2026-04-08

### 🛠️ Corrections
- **Fix deletion bug** : Résolution du bug de suppression des favoris. L'interface se met désormais à jour instantanément après une suppression (`fixed issue: allow deleting pinned tabs from dashboard`).
- **Correction Manifest** : Suppression d'un champ invalide dans le `manifest.json` qui bloquait le chargement sous Firefox.

### ✨ Nouvelles Fonctionnalités
- **Support Cross-Browser complet** : Architecture unifiée permettant à l'extension de fonctionner nativement sur Chrome et Firefox avec le même code source.
- **Support des containers Firefox** : Ajout de la permission `contextualIdentities` pour un support complet des conteneurs Multi-Account.
- **Service Worker Chrome** : Mise en place d'un wrapper pour supporter le cycle de vie des extensions Chrome MV3.

## [1.2.9] - 2026-04-08

### 🔧 Améliorations
- Préparation de l'architecture pour le support multi-navigateur.

# Changelog - TabsFlow Firefox Extension

Toutes les modifications notables de cette extension seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet respecte le [Versioning Sémantique](https://semver.org/lang/fr/).

## [1.2.4] - 2025-01-XX

### 🛠️ Corrections Critiques IndexedDB
- **🗂️ Nouveau StorageManager** : Gestionnaire de stockage robuste pour éliminer les erreurs `IndexedDB UnknownErr: ActorsParent.cpp`
- **🔄 Mécanisme de retry intelligent** : Jusqu'à 3 tentatives avec backoff exponentiel pour les opérations échouées
- **⏱️ Throttling des opérations** : Délai minimum de 50ms entre les accès au stockage pour éviter la surcharge
- **💾 Cache intelligent** : Cache de 5 secondes pour réduire les accès répétés au stockage
- **🔒 Protection timeout** : Timeout de 10 secondes pour éviter les blocages d'opérations

### ✨ Nouvelles Fonctionnalités Stockage
- **📊 Health Check automatique** : Diagnostic de santé du système de stockage au démarrage
- **🧹 Déduplication d'opérations** : Évite les opérations concurrentes identiques
- **📈 Monitoring de performance** : Métriques de temps de réponse et taux de succès
- **⚡ Fallback intelligent** : Basculement automatique entre background script et stockage direct

### 🔧 Améliorations Techniques
- **🏗️ Architecture modulaire** : Séparation claire entre gestion du stockage et logique métier
- **🛡️ Gestion d'erreurs avancée** : Distinction entre erreurs critiques et temporaires
- **📝 Logs détaillés** : Messages informatifs pour le debugging et le support technique
- **🎯 Optimisation Firefox** : Paramètres spécifiquement optimisés pour Firefox IndexedDB

### 📊 Impact Performance
- **✅ Élimination des erreurs IndexedDB** : Plus d'erreurs `ActorsParent.cpp` dans la console
- **⚡ Amélioration des temps de réponse** : Chargement plus rapide grâce au cache intelligent
- **🔄 Fiabilité accrue** : Recovery automatique en cas d'échec temporaire
- **📉 Réduction de la charge système** : Throttling pour éviter la surcharge du moteur IndexedDB

---

## [1.2.3] - 2025-01-XX (Version précédente)

### 🛠️ Corrections Importantes
- **Correction des erreurs d'IDs d'onglets invalides** : Plus d'erreurs `"Invalid tab ID: X"` dans la console
- **Amélioration de la communication popup-background** : Résolution des erreurs de promesses hors de portée
- **Validation systématique des onglets** : Vérification de l'existence avant manipulation
- **Nettoyage automatique** : Suppression des références d'onglets invalides

### ✨ Nouvelles Fonctionnalités
- **Gestion intelligente des redirections** : Détection automatique des URLs de redirection Google Auth
- **Normalisation avancée d'URLs** : Reconnaissance des patterns complexes d'authentification
- **Support containers amélioré** : Validation et délais de sécurité pour Firefox Multi-Account Containers
- **Mécanisme de retry robuste** : Communication fiable avec tentatives automatiques

### 🌐 Internationalisation
- **Traductions complètes** : Ajout des nouvelles clés pour l'italien et l'espagnol
- **Messages containers** : Support multilingue pour les fonctionnalités containers
- **Messages d'erreur** : Localisation complète des erreurs et confirmations

### 🔧 Améliorations Techniques
- **ContainerUtils renforcé** : Délais adaptatifs et validation containers
- **Communication asynchrone** : Gestion correcte des promesses avec `sendResponse`
- **Logs détaillés** : Messages informatifs pour le débogage et le support
- **Performance optimisée** : Réduction des erreurs de ~95%

---

## [1.2.2] - 2025-01-XX

### 🛠️ Corrections Importantes
- **Correction des erreurs d'IDs d'onglets invalides** : Plus d'erreurs `"Invalid tab ID: X"` dans la console
- **Amélioration de la communication popup-background** : Résolution des erreurs de promesses hors de portée
- **Validation systématique des onglets** : Vérification de l'existence avant manipulation
- **Nettoyage automatique** : Suppression des références d'onglets invalides

### ✨ Nouvelles Fonctionnalités
- **Gestion intelligente des redirections** : Détection automatique des URLs de redirection Google Auth
- **Normalisation avancée d'URLs** : Reconnaissance des patterns complexes d'authentification
- **Support containers amélioré** : Validation et délais de sécurité pour Firefox Multi-Account Containers
- **Mécanisme de retry robuste** : Communication fiable avec tentatives automatiques

### 🌐 Internationalisation
- **Traductions complètes** : Ajout des nouvelles clés pour l'italien et l'espagnol
- **Messages containers** : Support multilingue pour les fonctionnalités containers
- **Messages d'erreur** : Localisation complète des erreurs et confirmations

### 🔧 Améliorations Techniques
- **ContainerUtils renforcé** : Délais adaptatifs et validation containers
- **Communication asynchrone** : Gestion correcte des promesses avec `sendResponse`
- **Logs détaillés** : Messages informatifs pour le débogage et le support
- **Performance optimisée** : Réduction des erreurs de ~95%

---

## [1.2.1] - 2024-12-XX

### 🔧 Corrections de Bugs
- **Support Firefox Multi-Account Containers** : Ajout des permissions `contextualIdentities` et `cookies`
- **Gestion des containers** : Intégration complète avec Firefox Multi-Account Containers
- **Scripts background** : Restructuration pour supporter les containers

### ✨ Améliorations
- **Détection automatique** : Vérification du support containers au démarrage
- **Container par défaut** : Fallback gracieux si containers indisponibles
- **Logs enrichis** : Messages informatifs pour les opérations containers

---

## [1.2.0] - 2024-11-XX

### ✨ Fonctionnalités Majeures
- **Interface utilisateur repensée** : Design moderne inspiré de Firefox Proton
- **Système de catégories** : Organisation des onglets par catégories personnalisables
- **Drag & Drop** : Réorganisation intuitive des onglets par glisser-déposer
- **Gestion des doublons** : Détection intelligente des onglets déjà ouverts

### 🎨 Interface Utilisateur
- **Popup moderne** : Interface claire avec aperçu des onglets
- **Options améliorées** : Page de configuration complètement repensée
- **Thème adaptatif** : Support automatique du mode sombre/clair
- **Animations fluides** : Transitions et feedback visuel améliorés

### 🌐 Internationalisation Complète
- **14 langues supportées** : Français, Anglais, Espagnol, Italien, Allemand, Néerlandais, Portugais, Russe, Chinois, Japonais, Coréen, Hindi, Indonésien, Arabe
- **Localisation native** : Messages contextuels et descriptions complètes
- **RTL Support** : Support des langues de droite à gauche (Arabe)

### 🔧 Améliorations Techniques
- **Architecture modulaire** : Code organisé en modules distincts
- **Gestion d'erreurs robuste** : Handling complet des cas d'échec
- **Performance optimisée** : Chargement plus rapide et moins de ressources
- **API Firefox moderne** : Utilisation des dernières APIs WebExtensions

---

## [1.1.0] - 2024-10-XX

### ✨ Nouvelles Fonctionnalités
- **Ouverture automatique** : Option pour ouvrir les onglets lors de nouvelles fenêtres
- **Import/Export** : Sauvegarde et restauration des configurations
- **Épinglage de l'onglet actuel** : Ajout rapide depuis le popup
- **Statistiques d'utilisation** : Informations sur la dernière ouverture

### 🔧 Améliorations
- **Validation d'URLs** : Vérification automatique des URLs saisies
- **Messages de feedback** : Notifications de succès et d'erreur
- **Interface responsive** : Adaptation aux différentes tailles d'écran

---

## [1.0.0] - 2024-09-XX

### 🎉 Version Initiale
- **Gestion d'onglets épinglés** : Création et gestion d'une liste d'URLs favorites
- **Ouverture en un clic** : Ouverture simultanée de tous les onglets configurés
- **Épinglage automatique** : Les onglets s'ouvrent directement épinglés
- **Configuration simple** : Interface basique pour ajouter/supprimer des onglets

### 🛠️ Fonctionnalités de Base
- **Storage local** : Sauvegarde sécurisée des configurations
- **Permissions minimales** : Seulement les permissions nécessaires
- **Compatible Firefox** : Support des versions Firefox 78.0+
- **Manifest v2** : Conformité aux standards Firefox

---

## 📋 Types de Changements

- **✨ Nouvelles Fonctionnalités** : Ajouts de fonctionnalités
- **🛠️ Corrections** : Corrections de bugs
- **🔧 Améliorations** : Améliorations de fonctionnalités existantes
- **🎨 Interface** : Changements d'interface utilisateur
- **🌐 Internationalisation** : Ajouts/modifications de traductions
- **⚡ Performance** : Améliorations de performance
- **🔒 Sécurité** : Corrections liées à la sécurité
- **📚 Documentation** : Mises à jour de documentation

---

## 🔗 Liens Utiles

- **GitHub Repository** : [Tabs-Pin-Manager-Extension](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension)
- **Firefox Add-ons** : [Page officielle AMO](https://addons.mozilla.org/firefox/addon/tabs-pin/)
- **Documentation** : [Wiki du projet](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/wiki)
- **Support** : [Issues GitHub](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/issues) 