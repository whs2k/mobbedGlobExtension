var db;
usageBody = document.querySelector('#usageBody')
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

function getStore(mode) {
    mode = (mode == 'rw') ? 'readwrite' : 'readonly';
    var transaction = db.transaction(['usageStore'], mode);
    var usageStore = transaction.objectStore('usageStore');
    return usageStore;
}

function millisecondsToStr (milliseconds) {
    if (!millisecondsToStr) {
        return "";
    }
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second'; //'just now' //or other string you like;
}

function renderUsageData() {
    getStore().getAll().then(function(usage_data) {
        usageBody.innerHTML = '';
        usage_data.forEach(function(usage) {
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var textnode = document.createTextNode(usage.domain);
            td.appendChild(textnode);
            tr.appendChild(td);
            
            td = document.createElement("td");
            textnode = document.createTextNode(millisecondsToStr(usage.duration));
            td.appendChild(textnode);
            tr.appendChild(td);
            
            td = document.createElement("td");
            textnode = document.createTextNode(usage.url);
            td.appendChild(textnode);
            tr.appendChild(td);

            usageBody.appendChild(tr);
        });

        if (usage_data.length == 0) {
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var textnode = document.createTextNode("Your logs will show up here.");
            td.setAttribute("colspan", 3);
            td.style.textAlign = "center";
            td.appendChild(textnode);
            tr.appendChild(td);
            usageBody.appendChild(tr);
        }
    });
}

function defineActions() {
    clearBtn.onclick = function() {
        var r = confirm("Are you sure you want to delete all logs?");
        if (r == true) {
            getStore('rw').clear().then(function() {
                renderUsageData();
            });
        }
    };

    downloadBtn.onclick = function() {
        getStore().getAll().then(function(usage_data) {
            var blob = new Blob([JSON.stringify(usage_data, null, 4)], { type: "text/json" });
            var url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: "usage-stats.json"
            });
        });
    };
}

init();