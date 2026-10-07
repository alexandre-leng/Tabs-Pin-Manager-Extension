/**
 * Settings import and export.
 * Methods mixed into OptionsManager (see options.js).
 */

import { browser } from '../lib/browser-api.js';

export const importExport = {
  // Import/Export functionality
  exportSettings() {
    try {
      const exportData = {
        tabs: this.tabs,
      categories: this.categories,
      settings: this.settings,
      exportDate: new Date().toISOString(),
        version: browser.runtime.getManifest().version
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `tabsflow-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      
      this.showToast('success', '✅', browser.i18n.getMessage('settingsExported'));
    } catch (error) {
      console.error('Error exporting settings:', error);
      const errorMessage = browser.i18n.getMessage('exportFailed');
      this.showToast('error', '❌', errorMessage);
    }
  },

  importSettings() {
    this.elements.importFileInput.click();
  },

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data
      if (!Array.isArray(importData.tabs) || !Array.isArray(importData.categories) || !importData.settings) {
        throw new Error('Invalid file format');
      }
      
      // Import data via background script in one operation
      const response = await this.sendMessageWithRetry({ 
        action: 'importAllData', 
        data: importData 
      });
      
      if (!response || !response.success) {
        throw new Error(response?.error || browser.i18n.getMessage('failedToImportData'));
      }
      
      // Reload and render
      await this.loadData();
      this.render();
      
      this.showToast('success', '✅', browser.i18n.getMessage('settingsImported'));
    } catch (error) {
      console.error('Error importing settings:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('invalidFile'));
    }
    
    // Clear file input
    event.target.value = '';
  }
};
