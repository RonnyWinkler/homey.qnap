'use strict';

const { Device } = require('homey');

class hdd extends Device {
    /**
     * onInit is called when the device is initialized.
     */
      async onInit() {
        this.log('HDD has been initialized');
        await this.updateCapabilities();
      }
  
      async updateCapabilities(){
          // Add new capabilities (if not already added)
      }
    
      async updateDevice(hddData){
        this.log("updateDevice() NAS-ID"+ this.getData().nasId +" HSS-ID: "+this.getData().hddId+' Name: '+this.getName());
        this.log(hddData);

        this.setCapabilityValue('measure_hdd_hdno', hddData.HDNo);
        this.setCapabilityValue('measure_hdd_capacity', hddData.Capacity);
        this.setCapabilityValue('measure_hdd_health', hddData.Health);
        if (hddData.Health!='OK'){
          this.setCapabilityValue('alarm_hdd_health', true);
        }
        else{
          this.setCapabilityValue('alarm_hdd_health', false);
        }
        this.setCapabilityValue('measure_hdd_temp', parseInt(hddData.Temperature.oC));
        if (hddData.temp_alert!='0'){
          this.setCapabilityValue('alarm_hdd_temp', true);
        }
        else{
          this.setCapabilityValue('alarm_hdd_temp', false);
        }
        this.setCapabilityValue('measure_hdd_model', hddData.Model);
        this.setCapabilityValue('measure_hdd_serial', hddData.Serial);
        if (hddData.hd_is_ssd == '1'){
          this.setCapabilityValue('measure_hdd_type', 'SSD');
        }
        else{
          this.setCapabilityValue('measure_hdd_type', 'HDD');
        }
    
        return true;
      }
    
    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
      this.log('HDD has been added');
    }
  
    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({ oldSettings, newSettings, changedKeys }) {
        this.log('HDD settings where changed');
    }
  
    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('HDD was renamed');
    }
  
    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('HDD has been deleted');
    }
  }
  
  module.exports = hdd;
  