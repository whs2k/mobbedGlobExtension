// it starts here.
function init() {
    initDataStores().then(function() {
        return addListeners();
    }).then(function() {
        return initUi();
    });
}

var db;

// init data stores
function initDataStores() {

    const dbPromise = idb.open('mobbedGlob', 1, upgradeDB => {
        console.log('running onupgradeneeded');
        if (!upgradeDB.objectStoreNames.contains('usageStore')) {
            usageStore = upgradeDB.createObjectStore('usageStore',
                {keyPath: 'id', autoIncrement: true}
            );
            usageStore.createIndex('tabId', 'tabId', {unique: false});
        }
        // add more data stores as needed
    });

    dbPromise.then(function(resolved_db) {
        db = resolved_db;
        console.log('running onsuccess');
    }).catch(function(e) {
        console.error('onerror!');
        console.dir(e);
    });

    return Promise.all([dbPromise]);
}

function addUsage(action, tabId, params) {
    var transaction = db.transaction(['usageStore'], 'readwrite');
    var usageStore = transaction.objectStore('usageStore');
    var item = {
        action: action,
        tabId: tabId
    };

    for (let p in params) {
        item[p] = params[p];
    }

    var request = usageStore.add(item).then(function(e) {
        console.log('Woot! Did it');
    }).catch(function(e) {
        console.error('Error', e.name, e.message);
    });
}

// add listeners
function addListeners() {
    chrome.tabs.onCreated.addListener(function(tab) {
        // find tuple with same id which is active
        addUsage("created", tab.id, {url: tab.url, sessionId: tab.sessionId});
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status !== 'complete') return;
        addUsage("updated", tab.id, {url: tab.url, sessionId: tab.sessionId});
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
