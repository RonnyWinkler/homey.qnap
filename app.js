'use strict';

const Homey = require('homey');

class qnapApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('qnapApp has been initialized');
  }

}

module.exports = qnapApp;
