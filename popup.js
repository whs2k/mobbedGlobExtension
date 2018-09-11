activitiesList = document.querySelector('#activitiesList')
clearBtn = document.querySelector('#clearBtn');
downloadBtn = document.querySelector('#downloadBtn');

function init() {
    renderUsageData();
    defineActions();
}

function renderUsageData() {
    chrome.storage.local.get(['usage_data'], function(response) {
        activitiesList.innerHTML = '';
        response.usage_data.forEach(function(usage) {
            var text = usage.action + " " + usage.tabId;
            if (usage.params) {
                text += " (" + JSON.stringify(usage.params) + ")"
            }
            var node = document.createElement("li");
            var textnode = document.createTextNode(text); 
            node.appendChild(textnode);   
            activitiesList.appendChild(node);
        });

        if (response.usage_data.length == 0) {
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
            chrome.storage.local.set({usage_data: []});
        }
        renderUsageData();
    };

    downloadBtn.onclick = function() {
        chrome.storage.local.get(['usage_data'], function(response) {
            var blob = new Blob([JSON.stringify(response.usage_data, null, 4)], {type: "text/json"});
            var url = URL.createObjectURL(blob);
            chrome.downloads.download({
              url: url,
              filename: "usage-stats.json"
            });
        });
    };
}

init();