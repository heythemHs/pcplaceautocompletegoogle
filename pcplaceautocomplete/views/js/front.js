/**
 * Frontend JavaScript for Google Places Autocomplete
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
 * Initialize Google Places Autocomplete
 */
function initGooglePlacesAutocomplete() {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error('Google Maps API not loaded');
        return;
    }

    // Find address input fields
    var addressInputs = document.querySelectorAll('input[name="address1"], input[id*="address1"], input[id*="field-address1"]');

    if (addressInputs.length === 0) {
        // Try other common selectors
        addressInputs = document.querySelectorAll('#field-address1, [name="address"]');
    }

    if (addressInputs.length === 0) {
        console.log('No address input found');
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

        // Create autocomplete instance
        var autocomplete = new google.maps.places.Autocomplete(addressInput, {
            types: ['address'],
            fields: ['address_components', 'geometry', 'formatted_address']
        });

        // Listen for place selection
        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();

            if (!place.geometry) {
                console.error('No geometry data for selected place');
                return;
            }

            // Get latitude and longitude
            var latitude = place.geometry.location.lat();
            var longitude = place.geometry.location.lng();

            console.log('Selected place coordinates:', latitude, longitude);

            // Store coordinates in hidden fields or cookies
            storeCoordinates(latitude, longitude);

            // Parse address components and fill form fields
            fillAddressFields(place, addressInput);
        });
    });
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

    // Use prestashop's base URL if available
    var baseUrl = typeof prestashop !== 'undefined' && prestashop.urls && prestashop.urls.base_url
        ? prestashop.urls.base_url
        : window.location.origin;

    fetch(baseUrl + '/index.php?fc=module&module=pcplaceautocomplete&controller=ajax', {
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
 * Fill address fields from Google Places result
 */
function fillAddressFields(place, addressInput) {
    var addressComponents = place.address_components;

    if (!addressComponents) {
        return;
    }

    var addressData = {
        street_number: '',
        route: '',
        locality: '',
        postal_code: '',
        country: '',
        administrative_area_level_1: ''
    };

    // Parse address components
    addressComponents.forEach(function(component) {
        var type = component.types[0];

        if (type === 'street_number') {
            addressData.street_number = component.long_name;
        } else if (type === 'route') {
            addressData.route = component.long_name;
        } else if (type === 'locality') {
            addressData.locality = component.long_name;
        } else if (type === 'postal_code') {
            addressData.postal_code = component.long_name;
        } else if (type === 'country') {
            addressData.country = component.short_name;
        } else if (type === 'administrative_area_level_1') {
            addressData.administrative_area_level_1 = component.long_name;
        }
    });

    // Fill address1 field (street number + route)
    var fullAddress = (addressData.street_number + ' ' + addressData.route).trim();
    if (fullAddress && addressInput) {
        addressInput.value = fullAddress;
        // Trigger change event
        var event = new Event('change', { bubbles: true });
        addressInput.dispatchEvent(event);
    }

    // Fill city field
    if (addressData.locality) {
        var cityInputs = document.querySelectorAll('input[name="city"], input[id*="city"]');
        cityInputs.forEach(function(input) {
            input.value = addressData.locality;
            var event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        });
    }

    // Fill postcode field
    if (addressData.postal_code) {
        var postcodeInputs = document.querySelectorAll('input[name="postcode"], input[id*="postcode"]');
        postcodeInputs.forEach(function(input) {
            input.value = addressData.postal_code;
            var event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
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
                    var event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                    break;
                }
            }
        });
    }
}
