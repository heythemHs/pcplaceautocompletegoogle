/**
 * Admin JavaScript for Google Places Autocomplete Module
 */

$(document).ready(function() {
    // Add test button after the API key input
    var apiKeyInput = $('input[name="PCPLACE_GOOGLE_API_KEY"]');

    if (apiKeyInput.length) {
        var testButton = $('<button type="button" class="btn btn-info pcplace-test-btn">' +
            '<i class="icon-check"></i> Test API Key' +
            '</button>');

        var resultDiv = $('<div class="pcplace-test-result" style="display:none;"></div>');

        apiKeyInput.parent().append(testButton);
        apiKeyInput.parent().append(resultDiv);

        // Test button click handler
        testButton.on('click', function(e) {
            e.preventDefault();

            var apiKey = apiKeyInput.val();

            if (!apiKey || apiKey.trim() === '') {
                resultDiv
                    .removeClass('success loading')
                    .addClass('error')
                    .html('<i class="icon-remove"></i> Please enter an API key first.')
                    .show();
                return;
            }

            // Show loading state
            resultDiv
                .removeClass('success error')
                .addClass('loading')
                .html('<i class="icon-refresh icon-spin"></i> Testing API key...')
                .show();

            testButton.prop('disabled', true);

            // Test the API key by loading the Google Maps API
            testGoogleApiKey(apiKey, function(success, message) {
                testButton.prop('disabled', false);

                if (success) {
                    resultDiv
                        .removeClass('error loading')
                        .addClass('success')
                        .html('<i class="icon-check"></i> ' + message);
                } else {
                    resultDiv
                        .removeClass('success loading')
                        .addClass('error')
                        .html('<i class="icon-remove"></i> ' + message);
                }
            });
        });
    }

    /**
     * Test Google API Key
     */
    function testGoogleApiKey(apiKey, callback) {
        // Create a temporary script element to load Google Maps API
        var script = document.createElement('script');
        var callbackName = 'googleMapsCallback_' + Date.now();

        // Set up success callback
        window[callbackName] = function() {
            // Check if google.maps.places is available
            if (typeof google !== 'undefined' &&
                typeof google.maps !== 'undefined' &&
                typeof google.maps.places !== 'undefined') {
                callback(true, 'API Key is valid and Places API is enabled!');
            } else {
                callback(false, 'API Key is valid but Places API is not enabled.');
            }

            // Cleanup
            delete window[callbackName];
            document.body.removeChild(script);
        };

        // Set up error callback
        script.onerror = function() {
            callback(false, 'API Key is invalid or there was an error loading the API.');
            delete window[callbackName];
            document.body.removeChild(script);
        };

        // Load the API
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey +
                     '&libraries=places&callback=' + callbackName;
        document.body.appendChild(script);
    }
});
