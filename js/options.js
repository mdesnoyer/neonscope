function saveOptions() {
    var username = document.getElementById('username').value,
        password = document.getElementById('password').value,
        accountId = document.getElementById('accountId').value,
        winningSelector = document.getElementById('winningSelector').value
    ;
    chrome.storage.sync.set({
        neonscopeUsername: username,
        neonscopePassword: password,
        neonscopeAccountId: accountId,
        neonscopeWinningSelector: winningSelector
    }, function() {
        // empty
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function restoreOptions() {
    chrome.storage.sync.get({
        neonscopeUsername: '',
        neonscopePassword: '',
        neonscopeAccountId: '',
        neonscopeWinningSelector: ''
    }, function(items) {
        document.getElementById('username').value = items.neonscopeUsername;
        document.getElementById('password').value = items.neonscopePassword;
        document.getElementById('accountId').value = items.neonscopeAccountId;
        document.getElementById('winningSelector').value = items.neonscopeWinningSelector;
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
