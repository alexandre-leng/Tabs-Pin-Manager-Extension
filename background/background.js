/**
 * Background entry point (Firefox event page / Chrome service worker module).
 */

import { TabsPinBackground } from './controller.js';

new TabsPinBackground().start();
