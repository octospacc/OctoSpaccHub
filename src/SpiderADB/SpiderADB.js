import * as Adb from '@yume-chan/adb';
import * as AdbDaemonWebUsb from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { DecodeUtf8Stream } from '@yume-chan/stream-extra';

// TODO:
// * warning on fail to claim USB interface (it may be because of other tabs, or a local adb server)
// * warn or gracefully handle debug permission not granted
// * package manager with install/uninstall/dump, debloat tool with default list and import/export
// * fastboot shell and tools? possible?

(async function(){

const deviceSelect = $('select$deviceSelect$');
const deviceConnect = $('button$deviceConnect$');
const terminalOutput = $('textarea$terminalOutput$');

function resizeTerminal () {
	terminalOutput.style.height = `${window.innerHeight - ((48 + 8) * 4)}px`;
}
resizeTerminal();

window.addEventListener('resize', (function(){
	resizeTerminal();
}));

$('input$terminalInput$').addEventListener('keydown', (async function(event){
	if (event.keyCode == 13) { // Enter
		const cmd = $('input$terminalInput$').value;
		terminalOutput.textContent += (cmd + '\n');
		const process = await Device.adb.subprocess.spawn(cmd);
		await process.stdout.pipeThrough(new DecodeUtf8Stream()).pipeTo(
			new WritableStream({ write(chunk) {
				terminalOutput.textContent += chunk;
				terminalOutput.scrollTop = terminalOutput.scrollHeight;
			} }),
		);
		terminalOutput.textContent += '\n> ';
		$('input$terminalInput$').value = null;
	};
}));

let Device = {};
const CredentialStore = new AdbWebCredentialStore();

const UsbManager = AdbDaemonWebUsb.AdbDaemonWebUsbDeviceManager.BROWSER;
if (!UsbManager) {
	$('div$browserWarning$').innerHTML = `<p>
		<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/API/USB#browser_compatibility">WebUSB is not supported</a> in this browser, so the app cannot work.
		Consider using an <a target="_blank" href="https://chromium.woolyss.com">up-to-date Chromium-based</a> one.
	</p><p>
		Otherwise, the following alternative ADB solutions might work for you:
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
	return; // kill the app
}

new AdbDaemonWebUsb.AdbDaemonWebUsbDeviceWatcher((async function(connectedDevice){
	if (!connectedDevice) {
		await disconnectDevice();
	}
	await refreshDeviceSection();
}), navigator.usb);

async function connectAuthorizeDevice () {
	if (deviceSelect.selectedIndex > 0) {
		Device.device = await getDevice();
		try {
			Device.connection = await Device.device.connect();
			Device.transport = await Adb.AdbDaemonTransport.authenticate({ connection: Device.connection, credentialStore: CredentialStore });
			Device.adb = new Adb.Adb(Device.transport);
		} catch (err) {
			$('[name="deviceStatus"]').innerHTML = 'An error occurred while trying to establish a device connection. Please ensure that no other processes or browser tabs on this system are currently using the device, then retry.';
		}
	}
}

async function getDevice () {
	const devices = await UsbManager.getDevices();
	const device = devices[deviceSelect.selectedIndex - 1];
	return device;
}

function disconnectDevice () {
	const connection = (Device.adb || Device.transport || Device.connection);
	if (connection) {
		Device = {};
		return connection.close();
	}
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
		deviceSelect.onchange = onSwitchDevice;
		deviceSelect.disabled = false;
	} else {
		deviceSelect.innerHTML = '<option>[📵️ No connected devices]</option>';
	}
}

async function onSwitchDevice () {
	await disconnectDevice();
	await connectAuthorizeDevice();
	await refreshDeviceInfo();
}

async function refreshDeviceInfo () {
	if (deviceSelect.selectedIndex > 0) {
		const device = await getDevice();
		$('$deviceOem$').innerHTML = `<b>Brand</b>: ${device.raw.manufacturerName}`;
		$('$deviceModel$').innerHTML = `<b>Model</b>: ${device.raw.productName}`;
		$('$deviceSerial$').innerHTML = `<b>Serial number</b>: ${device.raw.serialNumber}`;
		//$('[name="deviceStatus"]').innerHTML = 'Connected to device.';
		//$('$deviceInfo$').hidden = false;
		if (Device.adb) {
			$('$deviceStatus$').innerHTML = null;
			// $('$devicePropDump$').innerHTML = null;
			$('$androidVersion$').innerHTML = `<b>Android version</b>: ${await Device.adb.getProp('ro.build.version.release')}`;
			$('$androidApi$').innerHTML = `<b>API version</b>: ${await Device.adb.getProp('ro.build.version.sdk')}`;
			$('$androidInfo$').hidden = false;
			$('$connectReminder$').hidden = true;
			terminalOutput.disabled = false;
			terminalOutput.textContent += '> ';
			$('input$terminalInput$').disabled = false;
			/* for (const line of (await Device.adb.getProp()).split('\n')) {
				const elem = document.createElement('li');
				elem.textContent = line;
				$('$devicePropDump$').appendChild(elem);
			} */
		} else {
			$('$deviceInfo$').hidden = true;
		}
		$('$deviceInfo$').hidden = false;
	} else {
		$('$deviceStatus$').innerHTML = null;
		$('$connectReminder$').hidden = false;
		terminalOutput.disabled = true;
		$('input$terminalInput$').disabled = true;
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
	await disconnectDevice();
	await refreshDeviceSection();
	deviceSelect.selectedIndex = (deviceSelect.children.length - 1);
	deviceSelect.onchange();
});
deviceConnect.disabled = false;

})();
