var db;
activitiesList = document.querySelector('#activitiesList')
clearBtn = document.querySelector('#clearBtn');
downloadBtn = document.querySelector('#downloadBtn');

function init() {
    initDb().then(function() {
        renderUsageData();
        defineActions();
    });
}

function initDb() {
    var dbPromise = idb.open('mobbedGlob', 1);

    dbPromise.then(function(resolved_db) {
        db = resolved_db;
    }).catch(function(e) {
        console.log('onerror!');
        console.dir(e);
    });

    return dbPromise;
}

function renderUsageData() {
    var transaction = db.transaction(['usageStore'], 'readonly');
    var usageStore = transaction.objectStore('usageStore');
    usageStore.getAll().then(function(usage_data) {
        activitiesList.innerHTML = '';
        usage_data.forEach(function(usage) {
            var text = usage.action + " " + usage.tabId;

            delete usage.action;
            delete usage.tabId;

            if (Object.keys(usage).length) {
                text += " (" + JSON.stringify(usage) + ")"
            }
            
            var node = document.createElement("li");
            var textnode = document.createTextNode(text);
            node.appendChild(textnode);
            activitiesList.appendChild(node);
        });

        if (usage_data.length == 0) {
            var node = document.createElement("center");
            var textnode = document.createTextNode("Your logs will show up here.");
            node.appendChild(textnode);
            activitiesList.appendChild(node);
        }
    });
}

function defineActions() {
    clearBtn.onclick = function() {
        var r = confirm("Are you sure you want to delete all logs?");
        if (r == true) {
            chrome.storage.local.set({ usage_data: [] });
        }
        renderUsageData();
    };

    downloadBtn.onclick = function() {
        chrome.storage.local.get(['usage_data'], function(response) {
            var blob = new Blob([JSON.stringify(response.usage_data, null, 4)], { type: "text/json" });
            var url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: "usage-stats.json"
            });
        });
    };
}

init();