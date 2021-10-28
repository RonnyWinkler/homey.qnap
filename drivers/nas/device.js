'use strict';

const { Device } = require('homey');

const qnapApi = require('../../qnapApi');
const qnap = new qnapApi();
const defaultScanInterval = 5;

class nas extends Device {
    /**
     * onInit is called when the device is initialized.
     */
      async onInit() {
        this.log('NAS has been initialized');
  
        await this.updateCapabilities();
  
        // Start update-loop
        this.updateDevice();
      }
  
      async updateCapabilities(){
          // Add new capabilities (if not already added)
          if (!this.hasCapability('measure_last_update')){
              this.addCapability('measure_last_update');
          }
      }
    
    async setDeviceAvailable(){
        this.setAvailable();
        let hddList = this.homey.drivers.getDriver('hdd').getDevices();
        for (let i=0; i<hddList.length; i++){
            hddList[i].setAvailable();
        }
        let ethList = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<ethList.length; i++){
            ethList[i].setAvailable();
        }
    }

    async setDeviceUnavailable(){
        this.setUnavailable();
        let hddList = this.homey.drivers.getDriver('hdd').getDevices();
        for (let i=0; i<hddList.length; i++){
            hddList[i].setUnavailable();
        }
        let ethList = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<ethList.length; i++){
            ethList[i].setUnavailable();
        }
    }   

      async updateDevice(){
        this.log("updateDevice() NAS-ID: "+this.getData().id+' Name: '+this.getName());
        let scanInterval = await this.getSetting('scan_interval');
        if (!scanInterval || scanInterval <= 0){
            scanInterval = defaultScanInterval;
            await this.setSettings({'scan_interval': scanInterval});
        }
        this.log('scanInterval: '+scanInterval);
        
        this.homey.clearTimeout(this.timeoutupdateDevice);
        this.timeoutupdateDevice = this.homey.setTimeout(() => 
            this.updateDevice(),  scanInterval * 1000 * 60 );

        if (!qnap.isLoggedin()){
            try{
                let loggedIn = await qnap.login(
                        this.getStoreValue('ip'), 
                        this.getStoreValue('port'), 
                        this.getStoreValue('user'), 
                        this.getStoreValue('pw'));
                if (!loggedIn){
                    this.error('Login-Error, set devices unavailable. Retry at next scan interval.');
                    // Not logged in: Set device unavailable
                    this.setDeviceUnavailable();
                    //throw 'Login-Error, retry at next scan interval.';
                    return false;
                }
            }
            catch(error){
                this.error('Login-Error: '+error+' Set devices unavailable.');
                // Not logged in: Set device unavailable
                this.setDeviceUnavailable();
                //throw 'Login-Error: '+error;
                return false;
            }
        }
        // Proceed with getting device data.
        let sysInfo = await qnap.getSystemInfo();
        this.log(sysInfo);
        //check for auth or user rights...
        if (sysInfo.QDocRoot.authPassed == '0'){
            this.error('Login/Auth/Right-Error. Set devices unavailable.');
            this.setDeviceUnavailable();
            return false;
        }
        // Logged in: Set device available
        this.setDeviceAvailable();
        // Set device data...
        this.setCapabilityValue('measure_last_update', await this.convertDateToString(new Date()));
        this.setCapabilityValue('measure_model_name', sysInfo.QDocRoot.model.displayModelName);
        this.setCapabilityValue('measure_firmware', sysInfo.QDocRoot.firmware.version + '.' + sysInfo.QDocRoot.firmware.number);
        this.setCapabilityValue('measure_firmware_build_time', sysInfo.QDocRoot.firmware.buildTime);
        this.setCapabilityValue('measure_cpu_usage', parseFloat(parseFloat(sysInfo.QDocRoot.func.ownContent.root.cpu_usage.split(' ')[0]).toFixed(2)));
        let total_memory = parseFloat(sysInfo.QDocRoot.func.ownContent.root.total_memory);
        let free_memory = parseFloat(sysInfo.QDocRoot.func.ownContent.root.free_memory);
        let used_memory = total_memory - free_memory;
        let memory_usage = used_memory * 100 / total_memory;  
        this.setCapabilityValue('measure_mem_usage', parseFloat((memory_usage).toFixed(2)));
        this.setCapabilityValue('measure_mem_used', parseFloat((used_memory/1024).toFixed(2)));
        this.setCapabilityValue('measure_mem_free', parseFloat((free_memory/1024).toFixed(2)));
        this.setCapabilityValue('measure_mem_total', parseFloat((total_memory/1024).toFixed(2)));
        this.setCapabilityValue('measure_cpu_temp', parseInt(sysInfo.QDocRoot.func.ownContent.root.cpu_tempc));
        this.setCapabilityValue('measure_sys_temp', parseInt(sysInfo.QDocRoot.func.ownContent.root.sys_tempc));
        this.setCapabilityValue('measure_fan_speed', parseInt(sysInfo.QDocRoot.func.ownContent.root.sysfan1));
    
        // Update child devices: Ethernet eth0...eth3
        await this.updateChildEth(sysInfo.QDocRoot.func.ownContent.root);

        // Get Volume info
        let volInfo = await qnap.getVolumeInfo();

        // Get Disk info
        this.updateChildHdd( await qnap.getDiskInfo() );

        return true;
      }
     
      async getSystemInfo(){
          return await qnap.getSystemInfo();
      }

      async getDiskInfo(){
        return await qnap.getDiskInfo();
      }

      async getVolumeInfo(){
        return await qnap.getVolumeInfo();
      }

      async updateChildEth(data){
        let devices = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<devices.length; i++){
            if (devices[i].getData().nasId = this.getData().id){
                //this.log("Device eth NasID: "+devices[i].getData().nasId +" ethID: "+devices[i].getData().ethId) ;
                let ethId = devices[i].getData().ethId + 1;
                let ethData = {
                        ifname:         data['ifname'+ethId],
                        dname:          data['dname'+ethId],
                        rx_packet:      data['rx_packet'+ethId],
                        tx_packet:      data['tx_packet'+ethId],
                        err_packet:     data['err_packet'+ethId],
                        eth_max_speed:  data['eth_max_speed'+ethId],
                        eth_ip:         data['eth_ip'+ethId],
                        eth_mask:       data['eth_mask'+ethId],
                        eth_mac:        data['eth_mac'+ethId],
                        eth_usage:      data['eth_usage'+ethId],
                        dns1:           data['dnsinfo'+ethId].dns1,
                        dns2:           data['dnsinfo'+ethId].dns2,
                        eth_status:     data['eth_status'+ethId]
                    }
                devices[i].updateDevice(ethData)
            }
        }
      }

      async updateChildHdd(data){
        let devices = this.homey.drivers.getDriver('hdd').getDevices();
        for (let i=0; i<devices.length; i++){
            if (devices[i].getData().nasId = this.getData().id){
                //this.log("Device hdd NasID: "+devices[i].getData().nasId +" hddID: "+devices[i].getData().hddId);
                for (let j=0; j < data.entry.length; j++){
                    if (data.entry[j].HDNo == devices[i].getData().hddId){
                        devices[i].updateDevice(data.entry[j]);
                    }
                }
            }
        }
      }

      async convertDateToString(dateObj){
        const tz  = this.homey.clock.getTimezone();
        const nowTime = dateObj;
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
        
        let result = date + " " + time;
        return result;
      }
  
    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
      this.log('NAS has been added');
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
        this.log('NAS settings where changed');
        if (changedKeys.indexOf("scan_interval") >= 0){
            this.updateDevice();
        }
    }
  
    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('NAS was renamed');
    }
  
    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('NAS has been deleted');
    }
  }
  
  module.exports = nas;
  