function saveOptions() {
    var username = document.getElementById('username').value,
        password = document.getElementById('password').value,
        aid = document.getElementById('aid').value,
        winningSelector = document.getElementById('winning-selector').value
    ;
    chrome.storage.sync.set({
        neonscopeUsername: username,
        neonscopePassword: password,
        neonscopeAid: aid,
        neonscopeWinningSelector: winningSelector
    }, function() {
        
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function restoreOptions() {
    chrome.storage.sync.get({
        neonscopeUsername: '',
        neonscopePassword: '',
        neonscopeAid: '',
        neonscopeWinningSelector: ''
    }, function(items) {
        document.getElementById('username').value = items.neonscopeUsername;
        document.getElementById('password').value = items.neonscopePassword;
        document.getElementById('aid').value = items.neonscopeAid;
        document.getElementById('winning-selector').value = items.neonscopeWinningSelector;
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
