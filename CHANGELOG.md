# Changelog

All notable changes to this project will be documented in this file.

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

- **GitHub Repository** : [Tabs-Pin-Firefox-Extension](https://github.com/alexandre-leng/Tabs-Pin-Firefox-Extension)
- **Firefox Add-ons** : [Page officielle AMO](https://addons.mozilla.org/firefox/addon/tabs-pin/)
- **Documentation** : [Wiki du projet](https://github.com/alexandre-leng/Tabs-Pin-Firefox-Extension/wiki)
- **Support** : [Issues GitHub](https://github.com/alexandre-leng/Tabs-Pin-Firefox-Extension/issues) 