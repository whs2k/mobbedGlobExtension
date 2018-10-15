var db;

upgradeNeeded = function(e) {
  var db = e.target.result;
  console.log('running onupgradeneeded');
  if (!db.objectStoreNames.contains('store')) {
    var storeOS = db.createObjectStore('store',
      {keyPath: 'name'});
  }
};

var openRequest = idb.open('test_db', 1, upgradeNeeded);

openRequest.then(function(e) {
  console.log('running onsuccess');
  db = e.target.result;
  addItem();
}).catch(function(e) {
  console.log('onerror!');
  console.dir(e);
});

function addItem() {
  var transaction = db.transaction(['store'], 'readwrite');
  var store = transaction.objectStore('store');
  var item = {
    name: 'apples',
    price: '$3.99',
    description: 'It is a yellow apple!',
    created: new Date().getTime()
  };

 var request = store.add(item).then(function(e) {
    console.log('Woot! Did it');
  }).catch(function(e) {
    console.log('Error', e.target.error.name);
  });
}



-------------------------------------------------
var transaction = db.transaction(['usageStore'], 'readwrite');
var usageStore = transaction.objectStore('usageStore');
usageStore.getAll().then(function(val) {console.log(val);});
-------------------------------------------------
var transaction = db.transaction(['usageStore'], 'readwrite');
var usageStore = transaction.objectStore('usageStore');
var usageIndex = usageStore.index('tabId');
usageIndex.getAll(IDBKeyRange.bound(100, 500)).then(function(v) { console.log(v); })
-------------------------------------------------
All keys ≤ x           IDBKeyRange.upperBound(x)
All keys < x           IDBKeyRange.upperBound(x, true)
All keys ≥ y           IDBKeyRange.lowerBound(y)
All keys > y           IDBKeyRange.lowerBound(y, true)
All keys ≥ x && ≤ y    IDBKeyRange.bound(x, y)
All keys > x &&< y     IDBKeyRange.bound(x, y, true, true)
All keys > x && ≤ y    IDBKeyRange.bound(x, y, true, false)
All keys ≥ x &&< y     IDBKeyRange.bound(x, y, false, true)
The key = z            IDBKeyRange.only(z)
-------------------------------------------------
usageStore /
var transaction = db.transaction(['usageStore'], 'readwrite');
var usageStore = transaction.objectStore('usageStore');
var usageIndex = usageStore.index('tabId');
usageIndex.openCursor(IDBKeyRange.bound(100, 500)).then(function cursorCallback(cursor) {
  if (!cursor) return;
  console.log(cursor.value); 
  return cursor.continue().then(cursorCallback);
}).then(function() { console.log("Done!"); });
-------------------------------------------------
var transaction = db.transaction(['usageStore'], 'readwrite');
var usageStore = transaction.objectStore('usageStore');
var usageIndex = usageStore.index('tabId');
usageIndex.openCursor(IDBKeyRange.only(24)).then(function cursorCallback(cursor) {
  if (!cursor) return;
  console.log(cursor.value);
  return cursor.continue().then(cursorCallback);
}).then(function() { console.log("Done!"); });
-------------------------------------------------
var transaction = db.transaction(['usageStore'], 'readwrite');
var usageStore = transaction.objectStore('usageStore');
var usageIndex = usageStore.index('tabId');
usageIndex.count(IDBKeyRange.only(24)).then(printAll)
-------------------------------------------------
-------------------------------------------------
-------------------------------------------------
-------------------------------------------------
-------------------------------------------------