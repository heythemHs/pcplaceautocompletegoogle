/**
 * Admin JavaScript for Google Places Autocomplete Module (New API)
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
                .html('<i class="icon-refresh icon-spin"></i> Testing API key with new Places API...')
                .show();

            testButton.prop('disabled', true);

            // Test the API key using our AJAX endpoint
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
     * Test Google API Key using new Places API
     */
    function testGoogleApiKey(apiKey, callback) {
        // Check if ajax URL is available
        if (typeof pcplace_ajax_url === 'undefined') {
            callback(false, 'Configuration error: AJAX URL not found');
            return;
        }

        $.ajax({
            url: pcplace_ajax_url,
            type: 'POST',
            data: {
                action: 'testApiKey',
                apiKey: apiKey
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    callback(true, response.message || 'API Key is valid and Places API (New) is enabled!');
                } else {
                    callback(false, response.error || 'API Key test failed');
                }
            },
            error: function(xhr, status, error) {
                callback(false, 'Request failed: ' + error);
            }
        });
    }
});
