'use strict';

const { Device } = require('homey');

class eth extends Device {
    /**
     * onInit is called when the device is initialized.
     */
      async onInit() {
        this.log('Eth has been initialized');
        await this.updateCapabilities();
      }
  
      async updateCapabilities(){
          // Add new capabilities (if not already added)
      }
    
      async updateDevice(ethData){
        this.log("updateDevice() NAS-ID"+ this.getData().nasId +" Eth-ID: "+this.getData().ethId+' Name: '+this.getName());
        this.log(ethData);

        this.setCapabilityValue('measure_eth_id', ethData.ifname);
        this.setCapabilityValue('measure_eth_name', ethData.dname);
        this.setCapabilityValue('measure_eth_mac', ethData.eth_mac);
        this.setCapabilityValue('measure_eth_ip_alloc', ethData.eth_usage);
        this.setCapabilityValue('measure_eth_ip', ethData.eth_ip);
        this.setCapabilityValue('measure_eth_mask', ethData.eth_mask);
        this.setCapabilityValue('measure_eth_rx_packet', parseInt(ethData.rx_packet));
        this.setCapabilityValue('measure_eth_tx_packet', parseInt(ethData.tx_packet));
        this.setCapabilityValue('measure_eth_err_packet', parseInt(ethData.err_packet));
        this.setCapabilityValue('measure_eth_max_speed', parseInt(ethData.eth_max_speed));
        if (ethData.dns1){
          this.setCapabilityValue('measure_eth_dns1', ethData.dns1);
        }
        else{
          this.setCapabilityValue('measure_eth_dns1', '-');
        }
        if (ethData.dns2){
          this.setCapabilityValue('measure_eth_dns2', ethData.dns2);
        }
        else{
          this.setCapabilityValue('measure_eth_dns2', '-');
        }
        if (ethData.eth_status == '1'){
          this.setCapabilityValue('measure_eth_status', 'Online');
        }
        else{
          this.setCapabilityValue('measure_eth_status', 'Offline');
        }
    
        return true;
      }
    
    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
      this.log('Eth has been added');
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
        this.log('Eth settings where changed');
    }
  
    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('Eth was renamed');
    }
  
    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Eth has been deleted');
    }
  }
  
  module.exports = eth;
  