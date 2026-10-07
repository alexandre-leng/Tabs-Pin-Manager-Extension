/**
 * Settings import and export.
 * Mixed into OptionsManager.prototype; loaded after the class definition.
 */

'use strict';

Object.assign(OptionsManager.prototype, {
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
      
      this.showToast('success', '✅', browser.i18n.getMessage('settingsExported') || 'Settings exported successfully!');
    } catch (error) {
      console.error('Error exporting settings:', error);
      const errorMessage = browser.i18n.getMessage('errorGeneral') || 'Failed to export settings';
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
      
      this.showToast('success', '✅', browser.i18n.getMessage('settingsImported') || 'Settings imported successfully!');
    } catch (error) {
      console.error('Error importing settings:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('invalidFile') || 'Invalid file format');
    }
    
    // Clear file input
    event.target.value = '';
  }
});
