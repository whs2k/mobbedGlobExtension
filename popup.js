var db;
usageBody = document.querySelector('#usageBody');
dateInput = document.querySelector('#dateInput');
btnRenderUsage = document.querySelector('#btnRenderUsage');
clearBtn = document.querySelector('#clearBtn');
downloadBtn = document.querySelector('#downloadBtn');

function init() {
    initUi().then(initDb).then(function () {
        renderUsageData();
        defineActions();
    });
}

function initUi() {
    dateInput.value = formatDate();

    btnRenderUsage.onclick = renderUsageData;

    return Promise.resolve();
}

function initDb() {
    var dbPromise = idb.open('mobbedGlob', 1);

    dbPromise.then(function (resolved_db) {
        db = resolved_db;
    }).catch(function (e) {
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

function formatDate(date) {
    var d, month, day, year;
    if (!date) {
        d = new Date()
    } else {
        d = new Date(date);
    }
    month = '' + (d.getMonth() + 1);
    day = '' + d.getDate();
    year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function millisecondsToStr(milliseconds) {
    if (!millisecondsToStr) {
        return "";
    }
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding(number) {
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

function getDataForSelectedDate() {
    var usageStore = getStore();
    var usageIndex = usageStore.index('date');
    var selectedDate = dateInput.value || formatDate();
    var usageData = [];
    var cursor = usageIndex.openCursor(IDBKeyRange.only(selectedDate)).then(function cursorCallback(cursor) {
        if (!cursor) {
            // fetch complete. now sort by -duration and return collected data
            usageData.sort(function(a, b) {
                if (a.duration < b.duration)
                    return 1;
                if (a.duration > b.duration)
                    return -1;
                return 0;
            });
            return usageData
        };
        usageData.push(cursor.value);
        return cursor.continue().then(cursorCallback);
    }, function (error) {
        console.error("Can't fetch all logs. ", error);
    });
    return cursor;
}

function renderUsageData() {
    getDataForSelectedDate().then(function (usageData) {
        usageBody.innerHTML = '';
        usageData.forEach(function (usage) {
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
        if (!usageData.length) {
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            var textnode = document.createTextNode("No logs to show.");
            td.setAttribute("colspan", 3);
            td.style.textAlign = "center";
            td.appendChild(textnode);
            tr.appendChild(td);
            usageBody.appendChild(tr);
        }
    }, function (error) {
        console.error("Can't render? all logs. ", error);
    });
}

function defineActions() {
    clearBtn.onclick = function () {
        var r = confirm("Are you sure you want to delete all logs?");
        if (r == true) {
            getStore('rw').clear().then(function () {
                renderUsageData();
            });
        }
    };

    downloadBtn.onclick = function () {
        getDataForSelectedDate().then(function (usage_data) {
            usage_data = usage_data.map(function (usage) {
                return {
                    domain: usage.domain,
                    duration: usage.duration,
                    title: usage.title,
                    url: usage.url,
                    windowId: usage.windowId,
                    tabId: usage.tabId,
                    date: usage.date,
                    startTime: usage.startTime,
                    endTime: usage.endTime,
                };
            });
            var blob = new Blob([JSON.stringify(usage_data, null, 4)], {type: "text/json"});
            var url = URL.createObjectURL(blob);
            chrome.downloads.download({
                url: url,
                filename: "usage-stats.json"
            });
        }, function (error) {
            console.error("Can't fetch all logs. ", error);
        });
    };
}

init();