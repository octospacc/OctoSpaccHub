import * as Adb from '@yume-chan/adb';
import * as AdbDaemonWebUsb from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { DecodeUtf8Stream, WrapReadableStream, WrapConsumableStream } from '@yume-chan/stream-extra';
import { PackageManager } from '@yume-chan/android-bin';

// TODO:
// * warning on fail to claim USB interface (it may be because of other tabs, or a local adb server)
// * warn or gracefully handle debug permission not granted
// * package manager with install/uninstall/dump, debloat tool with default list and import/export
// * fastboot shell and tools? possible?
// * logs for Packages section?

(async function(){

const deviceSelect = $('select$deviceSelect$');
const terminalOutput = $('textarea$terminalOutput$');

$('button$apkInstall$').onclick = (async function(){
	// TODO show info popup before actually installing, also allow installing via drag&drop on packages section
	const fileInput = $('button$apkInstall$').querySelector('input');
	fileInput.onchange = (function(event){
		const count = event.target.files.length;
		if (!count > 0) {
			return;
		}
		alert(`Installing ${count} package(s)...`);
		const pm = new PackageManager(Device.adb);
		Array.from(event.target.files).forEach(async function(file, index){
			try {
				await pm.installStream(file.size, (new WrapReadableStream(file.stream())).pipeThrough(new WrapConsumableStream()));
				alert(`Successfully installed package ${index + 1} of ${count}.`);
				refreshPackagesList();
			} catch (err) {
				alert(err);
			}
		});
	});
	fileInput.click();
});

let Device = {};
const CredentialStore = new AdbWebCredentialStore();

function resizeTerminal () {
	const divider = (Device.adb ? 2 : 3);
	terminalOutput.style.height = `${window.innerHeight - ((48 + 8) * divider)}px`;
}
window.addEventListener('resize', resizeTerminal);
resizeTerminal();

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
			$('p$deviceStatus$').textContent = 'An error occurred while trying to establish a device connection. Please ensure that no other processes or browser tabs on this system are currently using the device, then retry.';
		}
	} else {
		$('p$deviceStatus$').textContent = null;
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
		$('p$deviceStatus$').textContent = null;
		deviceSelect.innerHTML = '<option>[📲️ Select a connected device]</option>';
		devices.forEach(function(device, index){
			const deviceOption = document.createElement('option');
			deviceOption.textContent = `${device.raw.productName} [${device.raw.serialNumber}]`;
			deviceSelect.appendChild(deviceOption);
		});
		deviceSelect.onchange = onSwitchDevice;
		deviceSelect.disabled = false;
	} else {
		// TODO probably put this warning elsewhere? because it seems like the browser can see even Androids with ADB disabled, obviously they won't be able to connect
		$('p$deviceStatus$').innerHTML = 'Connect a debuggable Android device via USB to continue. (Read "<a target="_blank" href="https://www.lifewire.com/enable-usb-debugging-android-4690927#toc-how-to-enable-usb-debugging-on-android">How to Enable USB Debugging on Android</a>" for help).';
		deviceSelect.innerHTML = '<option>[📵️ No connected devices]</option>';
	}
}

async function onSwitchDevice () {
	await disconnectDevice();
	await connectAuthorizeDevice();
	await refreshDeviceInfo();
}

async function refreshDeviceInfo () {
	let onDevice = (deviceSelect.selectedIndex > 0);
	if (onDevice) {
		const device = await getDevice();
		$('$deviceOem$').innerHTML = `<b>Brand</b>: ${device.raw.manufacturerName}`;
		$('$deviceModel$').innerHTML = `<b>Model</b>: ${device.raw.productName}`;
		$('$deviceSerial$').innerHTML = `<b>Serial number</b>: ${device.raw.serialNumber}`;
		//$('[name="deviceStatus"]').innerHTML = 'Connected to device.';
		//$('$deviceInfo$').hidden = false;
		if (Device.adb) {
			$('$deviceStatus$').innerHTML = null;
			// $('$devicePropDump$').innerHTML = null;
			$('$deviceCpuAbis$').innerHTML = `<b>CPU ABIs</b>: ${await Device.adb.getProp('ro.system.product.cpu.abilist')}`;
			$('$androidVersion$').innerHTML = `<b>Android version</b>: ${await Device.adb.getProp('ro.build.version.release')}`;
			$('$androidApi$').innerHTML = `<b>SDK API version</b>: ${await Device.adb.getProp('ro.build.version.sdk')}`;
			//$('$androidNickname$').innerHTML = `<b>Device name</b>: ${await Device.adb.getProp('persist.sys.device_name')}`;
			$('$androidBuildDate$').innerHTML = `<b>Build date</b>: ${await Device.adb.getProp('ro.vendor.build.date')}`;
			$('$androidBuildFingerprint$').innerHTML = `<b>Build fingerprint</b>: ${await Device.adb.getProp('ro.vendor.build.fingerprint')}`;
			$('$androidInfo$').hidden = false;
			$('$connectReminder$').hidden = true;
			terminalOutput.disabled = false;
			terminalOutput.textContent += (terminalOutput.textContent ? '\n> ' : '> ');
			$('button$clearTerminal$').disabled = false;
			/* for (const line of (await Device.adb.getProp()).split('\n')) {
				const elem = document.createElement('li');
				elem.textContent = line;
				$('$devicePropDump$').appendChild(elem);
			} */
		} else {
			onDevice = false;
		}
	} else {
		//$('$deviceStatus$').innerHTML = null;
		$('$connectReminder$').hidden = false;
		terminalOutput.disabled = true;
	}
	toggleDeviceElems(onDevice);
}

function toggleDeviceElems (enabled) {
	$('$deviceInfo$').hidden = !enabled;
	$('button$apkInstall$').disabled = !enabled;
	$('input$terminalInput$').disabled = !enabled;
	resizeTerminal();
}

async function refreshDeviceSection () {
	await refreshDeviceSelect();
	await refreshDeviceInfo();
}
refreshDeviceSection();

$('button$deviceConnect$').onclick = (async function(){
	const device = await UsbManager.requestDevice();
	if (!device) {
		return;
	}
	await disconnectDevice();
	await refreshDeviceSection();
	deviceSelect.selectedIndex = (deviceSelect.children.length - 1);
	deviceSelect.onchange();
});
$('button$deviceConnect$').disabled = false;

$('input$terminalInput$').addEventListener('keydown', (async function(event){
	if (event.keyCode == 13) { // Enter
		const cmd = $('input$terminalInput$').value;
		if (!terminalOutput.textContent) {
			terminalOutput.textContent += '> ';
		}
		terminalOutput.textContent += (cmd + '\n');
		const process = await Device.adb.subprocess.spawn(cmd);
		const processWriteToTerminal = () => new WritableStream({ write(chunk) {
			terminalOutput.textContent += chunk;
			terminalOutput.scrollTop = terminalOutput.scrollHeight;
			$('button$clearTerminal$').disabled = false;
		} });
		await process.stdout.pipeThrough(new DecodeUtf8Stream()).pipeTo(processWriteToTerminal());
		await process.stderr.pipeThrough(new DecodeUtf8Stream()).pipeTo(processWriteToTerminal());
		terminalOutput.textContent += '\n> ';
		terminalOutput.scrollTop = terminalOutput.scrollHeight;
		$('input$terminalInput$').value = null;
	};
}));

$('button$clearTerminal$').onclick = (function(){
	terminalOutput.textContent = '';
	$('button$clearTerminal$').disabled = true;
});

$('button$wrapTerminal$').onclick = (function(){
	terminalOutput.style.textWrap = (terminalOutput.style.textWrap ? '' : 'nowrap');
	terminalOutput.scrollTop = terminalOutput.scrollHeight;
});

async function refreshPackagesList () {
	$('ul$packageList$').innerHTML = null;
	const pm = new PackageManager(Device.adb);
	const list = await pm.listPackages();
	let result = await list.next();
	while (!result.done) {
		var packageElem = document.createElement('li');
		packageElem.innerHTML = `${result.value.packageName}<!-- <input type="checkbox" class="floatRight"/>-->`;
		/* packageElem.querySelector('input').onclick = (function(){
			// TODO: hide or show action buttons that do actions on selected elements if there is none or at least one
		}); */
		$('ul$packageList$').appendChild(packageElem);
		result = await list.next();
	}
}

window.addEventListener('hashchange', (async function(){
	const sectionHash = location.hash.slice(2).split('/')[0];
	if (Device.adb && sectionHash === 'packages' /* && !$('ul$packageList$').innerHTML */) {
		refreshPackagesList();
	}
}));

})();
