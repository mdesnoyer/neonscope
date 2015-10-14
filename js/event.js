// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function injectedMethod(tab, method, args, callback) {
    chrome.tabs.executeScript(tab.id, { file: 'js/inject.js' }, function() {
        chrome.tabs.sendMessage(tab.id, { method: method, args: args}, callback);
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function insertStyle(tid, flag) {
    setCSSInserted(flag);
    if (flag) {
        chrome.tabs.insertCSS(tid, { file: 'css/style.css' });
    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function setIcon(flag) {
    chrome.browserAction.setIcon({
        path: 'img/icon-' + flag + '.png'
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function setPowered(flag) {
    chrome.storage.sync.set({
        'powered': flag
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function setCSSInserted(flag) {
    chrome.storage.sync.set({
        'css': flag
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function setNotificationCount(flag, number) {
    if (flag) {
        chrome.browserAction.setBadgeText({text: number.toString()});
    }
    else {
        chrome.browserAction.setBadgeText({text: ''});
    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function toggleNeonscope(tab) {
    chrome.storage.sync.get(['powered', 'css'], function(result) {
        var powered = result.powered,
            css = result.css
        ;
        injectedMethod(tab, 'toggleNeonscope', { powered: powered }, function(response) {
            insertStyle(tab.id, !css && !powered);
            setIcon(!powered);
            setPowered(!powered);
            setNotificationCount(!powered, response.data.image_count);
        });
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function crankUp(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.active) {
        chrome.storage.sync.get('powered', function(result) {
            var powered = result.powered || false;
            injectedMethod(tab, 'toggleNeonscope', { powered: !powered }, function(response) {
                setIcon(powered);
                insertStyle(tabId, powered);
                setNotificationCount(powered, response.data.image_count);
            });
        });
    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

chrome.browserAction.onClicked.addListener(toggleNeonscope);
chrome.tabs.onUpdated.addListener(crankUp);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
