# SpiderADB

🕷️ **<https://hub.octt.eu.org/SpiderADB/>**

---

<p>
    <b>SpiderADB</b> is an user-friendly webapp for connecting to devices via the Android Debug Bridge, straight from a browser.
    The aim of this is to be kind of a swiss army knife that can be used from any platform, with minimal hassle,
    to do a number of advanced administration and debugging task on Android devices. These are the current features:
</p><ul>
    <li><b>Devices</b>: Allows connecting new devices, shows a list of the paired ones, and lists basic useful information about various parts of the system.</li>
    <li><b>Terminal</b>: Provides a basic terminal shell for inputting commands and reading their output. (Currently doesn't support any teletype features, so only basic commands can be run properly.)</li>
    <li><b>Packages</b>: Displays a list of the currently installed packages, allowing for multiple to be uninstalled, and also allows uploading APK files for installation.</li>
</ul>
<p>Here are some additional tips and tricks you might find useful to make the most out of this app:</p><ul>
    <li><a target="_blank" href="https://dev.to/larsonzhong/most-complete-adb-commands-4pcg">Most complete ADB command manual</a></li>
</ul>
<h3>Open-Source and Licensing</h3><p>
    This app is open-source and made with mostly-vanilla web technologies.
    You can find the full source code on my Git repo:
    <a href="https://gitlab.com/octospacc/octospacc.gitlab.io/-/tree/master/source/SpiderADB/">https://gitlab.com/octospacc/octospacc.gitlab.io/-/tree/master/source/SpiderADB/</a>.
</p><p>Copyright (C) 2024, OctoSpacc
    <br/>This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    <br/>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
    <br/>You should have received a copy of the GNU Affero General Public License along with this program. If not, see <a target="_blank" href="https://www.gnu.org/licenses/">https://www.gnu.org/licenses/</a>.
</p>
<h3>Third-Parties and Credits</h3><p>
    This app wouldn't have been possible without these third-party components, of which the license is specified in brackets:
</p><ul>
    <li><a target="_blank" href="https://github.com/yume-chan/ya-webadb">Tango</a> [MIT]: ADB port for the web</li>
    <li><a target="_blank" href="https://github.com/tango-adb/old-demo">Tango Demo (Old)</a> [MIT]: the previous official Tango demo webapp, helpful for writing my app since the Tango documentation is pretty lacking</li>
    <li><a target="_blank" href="https://github.com/zmyaro/holo-web">Holo Web</a> [MIT]: stylesheets for recreating the Android Holo theme on the web</li>
</ul>
