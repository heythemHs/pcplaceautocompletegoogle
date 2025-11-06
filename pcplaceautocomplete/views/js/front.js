/**
 * Frontend JavaScript for Google Places Autocomplete (New API)
 */

document.addEventListener('DOMContentLoaded', function() {
    initGooglePlacesAutocomplete();
});

// Also init when prestashop updates the DOM
if (typeof prestashop !== 'undefined') {
    prestashop.on('updatedAddressForm', function() {
        initGooglePlacesAutocomplete();
    });
}

/**
 * Initialize Google Places Autocomplete using New API
 */
function initGooglePlacesAutocomplete() {
    // Check if AJAX URL is defined
    if (typeof pcplace_ajax_url === 'undefined') {
        console.error('Places Autocomplete: AJAX URL not defined');
        return;
    }

    // Find address input fields
    var addressInputs = document.querySelectorAll('input[name="address1"], input[id*="address1"], input[id*="field-address1"]');

    if (addressInputs.length === 0) {
        // Try other common selectors
        addressInputs = document.querySelectorAll('#field-address1, [name="address"]');
    }

    if (addressInputs.length === 0) {
        console.log('Places Autocomplete: No address input found');
        return;
    }

    // Initialize autocomplete for each address input
    addressInputs.forEach(function(addressInput) {
        // Check if already initialized
        if (addressInput.getAttribute('data-autocomplete-initialized') === 'true') {
            return;
        }

        // Mark as initialized
        addressInput.setAttribute('data-autocomplete-initialized', 'true');

        // Create autocomplete UI
        setupAutocomplete(addressInput);
    });
}

/**
 * Setup autocomplete for an input field
 */
function setupAutocomplete(inputElement) {
    var suggestionsContainer = null;
    var debounceTimer = null;
    var currentFocusIndex = -1;
    var sessionToken = typeof pcplace_session_token !== 'undefined' ? pcplace_session_token : generateSessionToken();

    // Create suggestions dropdown
    createSuggestionsDropdown();

    // Attach event listeners
    inputElement.addEventListener('input', function(e) {
        var value = e.target.value;

        // Clear existing timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Hide suggestions if input is empty
        if (!value || value.length < 3) {
            hideSuggestions();
            return;
        }

        // Debounce API calls (wait 300ms after user stops typing)
        debounceTimer = setTimeout(function() {
            fetchAutocompleteSuggestions(value);
        }, 300);
    });

    // Handle keyboard navigation
    inputElement.addEventListener('keydown', function(e) {
        if (!suggestionsContainer || suggestionsContainer.style.display === 'none') {
            return;
        }

        var items = suggestionsContainer.querySelectorAll('.pcplace-suggestion-item');

        if (e.keyCode === 40) { // Down arrow
            e.preventDefault();
            currentFocusIndex++;
            if (currentFocusIndex >= items.length) currentFocusIndex = 0;
            setActiveItem(items);
        } else if (e.keyCode === 38) { // Up arrow
            e.preventDefault();
            currentFocusIndex--;
            if (currentFocusIndex < 0) currentFocusIndex = items.length - 1;
            setActiveItem(items);
        } else if (e.keyCode === 13) { // Enter
            e.preventDefault();
            if (currentFocusIndex > -1 && items[currentFocusIndex]) {
                items[currentFocusIndex].click();
            }
        } else if (e.keyCode === 27) { // Escape
            hideSuggestions();
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== inputElement && !suggestionsContainer.contains(e.target)) {
            hideSuggestions();
        }
    });

    /**
     * Create suggestions dropdown container
     */
    function createSuggestionsDropdown() {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'pcplace-suggestions-container';
        suggestionsContainer.style.cssText = 'position: absolute; z-index: 9999; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); max-height: 300px; overflow-y: auto; display: none; width: 100%;';

        // Insert after input
        inputElement.parentNode.style.position = 'relative';
        inputElement.parentNode.appendChild(suggestionsContainer);
    }

    /**
     * Fetch autocomplete suggestions from API
     */
    function fetchAutocompleteSuggestions(input) {
        var formData = new FormData();
        formData.append('action', 'autocomplete');
        formData.append('input', input);
        formData.append('sessionToken', sessionToken);

        // Get user's location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                formData.append('latitude', position.coords.latitude);
                formData.append('longitude', position.coords.longitude);
                sendAutocompleteRequest(formData);
            }, function() {
                // Geolocation failed, send request without location
                sendAutocompleteRequest(formData);
            });
        } else {
            sendAutocompleteRequest(formData);
        }
    }

    /**
     * Send autocomplete request to server
     */
    function sendAutocompleteRequest(formData) {
        fetch(pcplace_ajax_url, {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.suggestions && data.suggestions.length > 0) {
                displaySuggestions(data.suggestions);
            } else {
                hideSuggestions();
            }
        })
        .catch(function(error) {
            console.error('Autocomplete error:', error);
            hideSuggestions();
        });
    }

    /**
     * Display suggestions in dropdown
     */
    function displaySuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';
        currentFocusIndex = -1;

        suggestions.forEach(function(suggestion) {
            if (!suggestion.placePrediction) {
                return; // Skip query predictions
            }

            var item = document.createElement('div');
            item.className = 'pcplace-suggestion-item';
            item.style.cssText = 'padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;';

            var mainText = suggestion.placePrediction.structuredFormat.mainText.text;
            var secondaryText = suggestion.placePrediction.structuredFormat.secondaryText ? suggestion.placePrediction.structuredFormat.secondaryText.text : '';

            item.innerHTML = '<strong>' + escapeHtml(mainText) + '</strong><br><small style="color: #666;">' + escapeHtml(secondaryText) + '</small>';

            // Hover effect
            item.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f5f5f5';
            });
            item.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'white';
            });

            // Click handler
            item.addEventListener('click', function() {
                handlePlaceSelection(suggestion.placePrediction);
            });

            suggestionsContainer.appendChild(item);
        });

        suggestionsContainer.style.display = 'block';
    }

    /**
     * Handle place selection
     */
    function handlePlaceSelection(placePrediction) {
        hideSuggestions();

        // Set input value to main text
        inputElement.value = placePrediction.text.text;

        // Fetch place details to get coordinates and address components
        fetchPlaceDetails(placePrediction.placeId);
    }

    /**
     * Fetch place details including coordinates
     */
    function fetchPlaceDetails(placeId) {
        var formData = new FormData();
        formData.append('action', 'placeDetails');
        formData.append('placeId', placeId);

        fetch(pcplace_ajax_url, {
            method: 'POST',
            body: formData
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.location && data.addressComponents) {
                // Extract coordinates
                var latitude = data.location.latitude;
                var longitude = data.location.longitude;

                // Store coordinates
                storeCoordinates(latitude, longitude);

                // Fill address fields
                fillAddressFields(data.addressComponents, data.formattedAddress);

                // Generate new session token for next search
                sessionToken = generateSessionToken();
            }
        })
        .catch(function(error) {
            console.error('Place details error:', error);
        });
    }

    /**
     * Set active item in suggestions
     */
    function setActiveItem(items) {
        items.forEach(function(item, index) {
            if (index === currentFocusIndex) {
                item.style.backgroundColor = '#f5f5f5';
            } else {
                item.style.backgroundColor = 'white';
            }
        });
    }

    /**
     * Hide suggestions dropdown
     */
    function hideSuggestions() {
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.innerHTML = '';
        }
        currentFocusIndex = -1;
    }
}

/**
 * Store coordinates
 */
function storeCoordinates(latitude, longitude) {
    // Store in hidden inputs (create if they don't exist)
    var latInput = document.querySelector('input[name="latitude"]');
    var lngInput = document.querySelector('input[name="longitude"]');

    if (!latInput) {
        latInput = document.createElement('input');
        latInput.type = 'hidden';
        latInput.name = 'latitude';
        latInput.id = 'pcplace-latitude';

        // Find form and append
        var form = document.querySelector('form');
        if (form) {
            form.appendChild(latInput);
        }
    }

    if (!lngInput) {
        lngInput = document.createElement('input');
        lngInput.type = 'hidden';
        lngInput.name = 'longitude';
        lngInput.id = 'pcplace-longitude';

        // Find form and append
        var form = document.querySelector('form');
        if (form) {
            form.appendChild(lngInput);
        }
    }

    latInput.value = latitude;
    lngInput.value = longitude;

    // Also store in session via AJAX
    var formData = new FormData();
    formData.append('action', 'saveCoordinates');
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);

    fetch(pcplace_ajax_url, {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        console.log('Coordinates saved:', data);
    })
    .catch(function(error) {
        console.error('Error saving coordinates:', error);
    });
}

/**
 * Fill address fields from address components
 */
function fillAddressFields(addressComponents, formattedAddress) {
    var addressData = {
        street_number: '',
        route: '',
        locality: '',
        postal_code: '',
        country: '',
        administrative_area_level_1: ''
    };

    // Parse address components (New API format)
    addressComponents.forEach(function(component) {
        var types = component.types || [];

        types.forEach(function(type) {
            if (type === 'street_number') {
                addressData.street_number = component.longText;
            } else if (type === 'route') {
                addressData.route = component.longText;
            } else if (type === 'locality') {
                addressData.locality = component.longText;
            } else if (type === 'postal_code') {
                addressData.postal_code = component.longText;
            } else if (type === 'country') {
                addressData.country = component.shortText;
            } else if (type === 'administrative_area_level_1') {
                addressData.administrative_area_level_1 = component.longText;
            }
        });
    });

    // Fill city field
    if (addressData.locality) {
        var cityInputs = document.querySelectorAll('input[name="city"], input[id*="city"]');
        cityInputs.forEach(function(input) {
            input.value = addressData.locality;
            triggerChangeEvent(input);
        });
    }

    // Fill postcode field
    if (addressData.postal_code) {
        var postcodeInputs = document.querySelectorAll('input[name="postcode"], input[id*="postcode"]');
        postcodeInputs.forEach(function(input) {
            input.value = addressData.postal_code;
            triggerChangeEvent(input);
        });
    }

    // Fill country select
    if (addressData.country) {
        var countrySelects = document.querySelectorAll('select[name="id_country"], select[id*="country"]');
        countrySelects.forEach(function(select) {
            // Try to find and select the country option
            var options = select.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i].getAttribute('data-iso-code') === addressData.country ||
                    options[i].text.toLowerCase().includes(addressData.country.toLowerCase())) {
                    select.selectedIndex = i;
                    triggerChangeEvent(select);
                    break;
                }
            }
        });
    }
}

/**
 * Trigger change event on element
 */
function triggerChangeEvent(element) {
    var event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
}

/**
 * Generate session token for billing optimization
 */
function generateSessionToken() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function() {
        return (Math.random() * 16 | 0).toString(16);
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
