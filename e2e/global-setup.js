import { stage } from '../scripts/stage.js';

// Build the unpacked Chrome extension the tests load
export default function globalSetup() {
  stage('chrome');
}
