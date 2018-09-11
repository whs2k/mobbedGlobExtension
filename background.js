// it starts here.
function init() {
    initDataStores().then(function() {
        return addListeners();
    }).then(function() {
        return initUi();
    });
}

// init data stores
function initDataStores() {
    initUsageData = new Promise(function(resolve, reject) {
        chrome.storage.local.get(['usage_data'], function(response) { 
            if (!response.usage_data) {
                chrome.storage.local.set({usage_data: []}, function() {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
    
    // add more data stores as needed here

    return Promise.all([initUsageData]);
}

// add listeners
function addListeners() {
    chrome.tabs.onCreated.addListener(function(tab) {
        console.log('created ', tab.id);
        console.log(tab.url);
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status !== 'complete') return;
        console.log('updated ', tab.id);
        console.log(tab.url);
    });

    chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
        console.log('removed ', tabId);
        console.log(removeInfo);
        return;
        var blob = new Blob([JSON.stringify(removeInfo, null, 4)], {type: "text/json"});
        var url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: "usage-stats.json"
        });
    })

    return Promise.resolve();
}

function initUi() {
    // pass
}

// fire up the grill
init();
