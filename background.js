// it starts here.
function init() {
    initDataStores().then(function() {
        // return addListeners();
        return setupTimer();
    }).then(function() {
        return initUi();
    });
}

var db, timer;
var timer_interval = 60000;

// init data stores
function initDataStores() {

    const dbPromise = idb.open('mobbedGlob', 1, upgradeDB => {
        console.log('running onupgradeneeded');
        if (!upgradeDB.objectStoreNames.contains('usageStore')) {
            usageStore = upgradeDB.createObjectStore('usageStore',
                {keyPath: 'pk', autoIncrement: true}
            );
            usageStore.createIndex('tabId', 'tabId', {unique: false});
            usageStore.createIndex('windowId', 'windowId', {unique: false});
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

count = 0;
function addUsage(action, tabId, params) {
    count += 1;
    var transaction = db.transaction(['usageStore'], 'readwrite');
    var usageStore = transaction.objectStore('usageStore');
    var item = {
        action: action,
        tabId: tabId,
        windowId: count
    };

    for (let p in params) {
        item[p] = params[p];
    }

    var request = usageStore.add(item).then(function(e) {
        // console.log('Woot! Did it');
    }).catch(function(e) {
        // console.error('Error', e.name, e.message);
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

function getStore(mode) {
    mode = (mode == 'rw') ? 'readwrite' : 'readonly';
    var transaction = db.transaction(['usageStore'], mode);
    var usageStore = transaction.objectStore('usageStore');
    return usageStore;
}

function getSavedTab(tabId, windowId) {
    return new Promise(function(resolve, reject) {
        var usageIndex = getStore().index('tabId');
        usageIndex.getAll(IDBKeyRange.only(tabId)).then(function(tabs) {
            for (let tab of tabs) {
                if (tab.windowId == windowId) {
                    resolve(tab);
                    return;
                }
            }
            reject();
        }, function() {
            reject();
        });
    });
}

function addTabUsage(tab) {
    tab.startTime = Date.now() - timer_interval;
    tab.endTime = Date.now();
    tab.duration = tab.endTime - tab.startTime;
    var request = getStore('rw').add(tab).then(function(e) {
        // console.log('Woot! Did it');
    }).catch(function(e) {
        // console.log('Error', e.name, e.message);
    });
    // console.log("Added ", tab.url, " with duration ", tab.duration);
}

function updateTabUsage(tab, new_tab) {
    if (!tab.startTime) {
        tab.startTime = Date.now() - timer_interval;
    }
    tab.endTime = Date.now();
    tab.duration = tab.endTime - tab.startTime;
    tab.url = new_tab.url || tab.url;
    var request = getStore('rw').put(tab).then(function(e) {
        // console.log('Woot! Did it');
    }).catch(function(e) {
        // console.log('Error', e.name, e.message);
    });
    // console.log("Updated ", tab.url, " with duration ", tab.duration);
}

function getDomain(url) {
    var getLocation = function(href) {
        var l = document.createElement("a");
        l.href = href;
        return l;
    };
    var l = getLocation(url);
    // l.hostname + l.pathname
    return l.hostname;
}

// reviewTabs captures all tabs then updates the data stores
function reviewTabs() {
    chrome.tabs.query({}, function(tabs) { 
        tabs.forEach(function(tab) {
            tab.tabId = tab.id;
            tab.domain = getDomain(tab.url);
            getSavedTab(tab.tabId, tab.windowId).then(function(saved_tab) {
                // tab found. 
                // now if same domain - update the time period, else create new entry
                if (tab.domain == saved_tab.domain) {
                    updateTabUsage(saved_tab, tab);
                } else {
                    addTabUsage(tab);
                }
            }, function() {
                // tab not found - create new entry
                addTabUsage(tab);
            })
        });
    });
}

function initUi() {
    // pass
}

// timer runs every minute.
function setupTimer() {
    timer = setInterval(reviewTabs, timer_interval)
}

// fire up the grill
init();
