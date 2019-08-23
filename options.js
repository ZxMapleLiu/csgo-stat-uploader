function saveOptions() {
    var customapikey = document.getElementById('customapikey').value;
    if (document.getElementById('radioCustom').checked && customapikey != '') {
        //use custom key
        chrome.storage.sync.set({ customapikey: customapikey }, function () {

            var status = document.getElementById('statusSaved');
            status.style.visibility = 'visible';
            setTimeout(function () {
                status.style.visibility = 'hidden';
            }, 750);
        });
    } else if (
        document.getElementById('radioDefault').checked ||
        customapikey == ''
    ) {
        //use default key
        chrome.storage.sync.remove('customapikey', function () {
            var status = document.getElementById('statusSaved');
            status.style.visibility = 'visible';
            document.getElementById('radioDefault').checked = true;
            document.getElementById('customapikey').value = '';
            setTimeout(function () {
                status.style.visibility = 'hidden';
            }, 750);
        }
        );
    }
}

function restoreOptions() {
    chrome.storage.sync.get(['customapikey'], function (data) {
        if (typeof data['customapikey'] == 'undefined') {
        } else {
            document.getElementById('customapikey').value = data['customapikey'];
            document.getElementById('radioCustom').checked = true;
        }
    });
}

function initOptions() {
    restoreOptions();
    document.getElementById('save').addEventListener('click', saveOptions);
}

if (
    document.location.protocol != 'http:' &&
    document.location.protocol != 'https:'
) {
    document.addEventListener('DOMContentLoaded', initOptions);
}
