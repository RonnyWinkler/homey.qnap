'use strict';

const Homey = require('homey');

class qnapApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('qnapApp has been initialized');
    this.diagLog = "";

  }

  writeLog(message){
    if (!this.homey.settings.get('logEnabled')){
      return;
    }

    const tz  = this.homey.clock.getTimezone();
    const nowTime = new Date();
    const now = nowTime.toLocaleString('de-DE', 
        { 
            hour12: false, 
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    let date = now.split(", ")[0];
    date = date.split("/")[2] + "-" + date.split("/")[0] + "-" + date.split("/")[1]; 
    let time = now.split(", ")[1];
    
    this.diagLog += "\r\n* ";
    this.diagLog += date + " " + time + ":";
    this.diagLog += nowTime.getSeconds();
    this.diagLog += ".";
    let milliSeconds = nowTime.getMilliseconds().toString();
    if (milliSeconds.length == 2)
    {
        this.diagLog += '0';
    }
    else if (milliSeconds.length == 1)
    {
        this.diagLog += '00';
    }
    this.diagLog += milliSeconds;
    this.diagLog += "\r\n";

    this.diagLog += JSON.stringify(message);
    this.diagLog += "\r\n";
    if (this.diagLog.length > 60000)
    {
        this.diagLog = this.diagLog.substr(this.diagLog.length - 60000);
    }

    this.homey.api.realtime('com.qnap.logupdated', { 'log': this.diagLog });
  }

}

module.exports = qnapApp;
