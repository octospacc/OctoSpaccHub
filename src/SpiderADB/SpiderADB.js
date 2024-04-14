import * as Adb from "../../node_modules/@yume-chan/adb/esm/index.js";
import * as AdbDaemonWebUsb from "../../node_modules/@yume-chan/adb-daemon-webusb/esm/index.js";
import AdbWebCredentialStore from "../../node_modules/@yume-chan/adb-credential-web/esm/index.js";
//window.WebADB = { Adb, AdbDaemonWebUsb, AdbWebCredentialStore };

(async function(){

const deviceSelect = $('select$deviceSelect$');
const deviceConnect = $('button$deviceConnect$');

const CredentialStore = new AdbWebCredentialStore();

const UsbManager = AdbDaemonWebUsb.AdbDaemonWebUsbDeviceManager.BROWSER;
if (!UsbManager) {
	$('div$browserWarning$').innerHTML = `<p>
		<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/API/USB#browser_compatibility">WebUSB is not supported</a> in this browser, so the app cannot work.
		Consider using an <a target="_blank" href="https://chromium.woolyss.com">up-to-date Chromium-based</a> one.
	</p><p>
		Alternatively, these alternative ADB solutions might work for you:
	</p><ul>
		<li><a target="_blank" href="https://www.makeuseof.com/use-adb-over-wifi-android/">
			How to Set Up and Use ADB Wirelessly With Android
		</a></li>
		<li><a target="_blank" href="https://play.google.com/store/apps/details?id=com.htetznaing.adbotg">
			ADB⚡OTG - Android Debug Bridge
		</a></li>
		<li><a target="_blank" href="https://play.google.com/store/apps/details?id=com.draco.ladb">
			LADB — Local ADB Shell
		</a></li>
	</ul>`;
	return;
}

new AdbDaemonWebUsb.AdbDaemonWebUsbDeviceWatcher(refreshDeviceSection, navigator.usb);

async function connectAuthorizeDevice () {
	const devices = await UsbManager.getDevices();
	const connection = await devices[deviceSelect.selectedIndex - 1].connect();
	const transport = await Adb.AdbDaemonTransport.authenticate({ connection, credentialStore: CredentialStore });
	const adb = new Adb.Adb(transport);
	$('$androidVersion$').innerHTML = `<b>Android version</b>: ${await adb.getProp("ro.build.version.release")}`;
}

async function refreshDeviceSelect () {
	deviceSelect.disabled = true;
	deviceSelect.innerHTML = null;
	const devices = await UsbManager.getDevices();
	if (devices.length) {
		deviceSelect.innerHTML = '<option>[📲️ Select a connected device]</option>';
		devices.forEach(function(device, index){
			var deviceOption = document.createElement('option');
			deviceOption.textContent = `${device.raw.productName} [${device.raw.serialNumber}]`;
			deviceSelect.appendChild(deviceOption);
		});
		deviceSelect.onchange = refreshDeviceInfo;
		deviceSelect.disabled = false;
	} else {
		deviceSelect.innerHTML = '<option>[📵️ No connected devices]</option>';
	}
}

async function refreshDeviceInfo () {
	if (deviceSelect.selectedIndex > 0) {
		const devices = await UsbManager.getDevices();
		const device = devices[deviceSelect.selectedIndex - 1];
		$('$deviceOem$').innerHTML = `<b>Brand</b>: ${device.raw.manufacturerName}`;
		$('$deviceModel$').innerHTML = `<b>Model</b>: ${device.raw.productName}`;
		$('$deviceSerial$').innerHTML = `<b>Serial number</b>: ${device.raw.serialNumber}`;
		//$('[name="deviceStatus"]').innerHTML = 'Connected to device.';
		$('$deviceInfo$').hidden = false;
	} else {
		//$('[name="deviceStatus"]').innerHTML = null;
		$('$deviceInfo$').hidden = true;
	}
}

async function refreshDeviceSection () {
	await refreshDeviceSelect();
	await refreshDeviceInfo();
}
refreshDeviceSection();

deviceConnect.onclick = (async function(){
	const device = await UsbManager.requestDevice();
	if (!device) {
		return;
	}
	await refreshDeviceSection();
	deviceSelect.selectedIndex = (deviceSelect.children.length - 1);
	deviceSelect.onchange();
	await connectAuthorizeDevice();
});
deviceConnect.disabled = false;

})();
