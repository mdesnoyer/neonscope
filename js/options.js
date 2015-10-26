function saveOptions() {
    var username = document.getElementById('username').value,
        password = document.getElementById('password').value,
        aid = document.getElementById('aid').value
    ;
    chrome.storage.sync.set({
        neonscopeUsername: username,
        neonscopePassword: password,
        neonscopeAid: aid
    }, function() {
        
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

function restoreOptions() {
    chrome.storage.sync.get({
        neonscopeUsername: '',
        neonscopePassword: '',
        neonscopeAid: ''
    }, function(items) {
        document.getElementById('username').value = items.neonscopeUsername;
        document.getElementById('password').value = items.neonscopePassword;
        document.getElementById('aid').value = items.neonscopeAid;
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
