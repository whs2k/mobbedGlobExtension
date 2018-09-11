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

function addUsage(action, tabId, params) {
    chrome.storage.local.get(['usage_data'], function(response) { 
        response.usage_data.push({
            action: action,
            tabId: tabId,
            params: params
        });
        chrome.storage.local.set({usage_data: response.usage_data});
    });
}

// add listeners
function addListeners() {
    chrome.tabs.onCreated.addListener(function(tab) {
        // find tuple with same id which is active
        addUsage("created", tab.id);
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status !== 'complete') return;
        addUsage("updated", tab.id, {url: tab.url});
    });

    chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
        addUsage("removed", tabId);
    })

    return Promise.resolve();
}

function initUi() {
    // pass
}

// fire up the grill
init();
