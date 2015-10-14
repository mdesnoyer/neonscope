// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

var injected = injected || (function() {

    var methods = {};

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    methods.toggleNeonscope = function(args) {
        var htmlElement = document.getElementsByTagName('HTML')[0];
        htmlElement.classList.remove('neonscope-' + args.powered);
        htmlElement.classList.add('neonscope-' + !args.powered);

        // Loop through elements on the page
        var neonImages = $('img[src*="neon-images.com"]'),
            neonBackgroundImages = $('*[style*="neon-images.com"]'),
            image_count = neonImages.length + neonBackgroundImages.length;
        ;
        return {image_count: image_count};
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        var data = {};
        if (methods.hasOwnProperty(request.method)) {
            data = methods[request.method](request.args);
        }
        sendResponse({ data: data });
        return true;
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    return true;

})();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
