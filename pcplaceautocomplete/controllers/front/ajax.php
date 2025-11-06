<?php
/**
 * AJAX Controller for Google Places Autocomplete Module (New API)
 */

class PcPlaceAutocompleteAjaxModuleFrontController extends ModuleFrontController
{
    public function initContent()
    {
        parent::initContent();

        $action = Tools::getValue('action');

        switch ($action) {
            case 'autocomplete':
                $this->handleAutocomplete();
                break;
            case 'saveCoordinates':
                $this->saveCoordinates();
                break;
            case 'testApiKey':
                $this->testApiKey();
                break;
            case 'placeDetails':
                $this->getPlaceDetails();
                break;
            default:
                $this->ajaxRender(json_encode(array(
                    'success' => false,
                    'error' => 'Invalid action'
                )));
                break;
        }
    }

    /**
     * Handle autocomplete request - Proxy to Google Places API (New)
     */
    protected function handleAutocomplete()
    {
        $api_key = Configuration::get('PCPLACE_GOOGLE_API_KEY');

        if (!$api_key) {
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'API key not configured'
            )));
            return;
        }

        $input = Tools::getValue('input');
        $sessionToken = Tools::getValue('sessionToken');

        if (!$input) {
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'Input is required'
            )));
            return;
        }

        // Build request body
        $requestBody = array(
            'input' => $input,
        );

        // Add session token if provided
        if ($sessionToken) {
            $requestBody['sessionToken'] = $sessionToken;
        }

        // Add location bias if provided
        $latitude = Tools::getValue('latitude');
        $longitude = Tools::getValue('longitude');
        $radius = Tools::getValue('radius', 50000); // Default 50km

        if ($latitude && $longitude) {
            $requestBody['locationBias'] = array(
                'circle' => array(
                    'center' => array(
                        'latitude' => (float)$latitude,
                        'longitude' => (float)$longitude
                    ),
                    'radius' => (float)$radius
                )
            );
        }

        // Add region code (country)
        $countryCode = Tools::getValue('countryCode');
        if ($countryCode) {
            $requestBody['regionCode'] = $countryCode;
        }

        // Add language code
        $languageCode = Tools::getValue('languageCode', $this->context->language->iso_code);
        if ($languageCode) {
            $requestBody['languageCode'] = $languageCode;
        }

        // Make request to Google Places API
        $response = $this->makeGoogleApiRequest(
            'https://places.googleapis.com/v1/places:autocomplete',
            $api_key,
            $requestBody
        );

        $this->ajaxRender($response);
    }

    /**
     * Get place details including address components and geometry
     */
    protected function getPlaceDetails()
    {
        $api_key = Configuration::get('PCPLACE_GOOGLE_API_KEY');

        if (!$api_key) {
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'API key not configured'
            )));
            return;
        }

        $placeId = Tools::getValue('placeId');

        if (!$placeId) {
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'Place ID is required'
            )));
            return;
        }

        // Make request to Place Details API
        $url = 'https://places.googleapis.com/v1/places/' . urlencode($placeId);

        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'X-Goog-Api-Key: ' . $api_key,
            'X-Goog-FieldMask: id,addressComponents,location,formattedAddress'
        ));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'cURL error: ' . $error
            )));
            return;
        }

        curl_close($ch);

        if ($httpCode != 200) {
            $errorData = json_decode($response, true);
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => isset($errorData['error']['message']) ? $errorData['error']['message'] : 'API request failed',
                'httpCode' => $httpCode
            )));
            return;
        }

        $this->ajaxRender($response);
    }

    /**
     * Test API key validity
     */
    protected function testApiKey()
    {
        $api_key = Tools::getValue('apiKey');

        if (!$api_key) {
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'API key is required'
            )));
            return;
        }

        // Test with a simple autocomplete request
        $requestBody = array(
            'input' => 'test',
        );

        $response = $this->makeGoogleApiRequest(
            'https://places.googleapis.com/v1/places:autocomplete',
            $api_key,
            $requestBody
        );

        $responseData = json_decode($response, true);

        if (isset($responseData['suggestions']) || isset($responseData['error']['code']) && $responseData['error']['code'] != 401 && $responseData['error']['code'] != 403) {
            // API key is valid (even if no suggestions, as long as it's not auth error)
            $this->ajaxRender(json_encode(array(
                'success' => true,
                'message' => 'API Key is valid and Places API (New) is enabled!'
            )));
        } else {
            $error = isset($responseData['error']['message']) ? $responseData['error']['message'] : 'Unknown error';
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'API Key test failed: ' . $error
            )));
        }
    }

    /**
     * Make request to Google Places API
     */
    protected function makeGoogleApiRequest($url, $apiKey, $body)
    {
        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'X-Goog-Api-Key: ' . $apiKey,
            'X-Goog-FieldMask: suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types'
        ));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            return json_encode(array(
                'success' => false,
                'error' => 'cURL error: ' . $error
            ));
        }

        curl_close($ch);

        if ($httpCode != 200) {
            $errorData = json_decode($response, true);
            return json_encode(array(
                'success' => false,
                'error' => isset($errorData['error']['message']) ? $errorData['error']['message'] : 'API request failed',
                'httpCode' => $httpCode
            ));
        }

        return $response;
    }

    /**
     * Save coordinates to session
     * We store in session and then update database when address is saved
     */
    protected function saveCoordinates()
    {
        $latitude = Tools::getValue('latitude');
        $longitude = Tools::getValue('longitude');

        if ($latitude && $longitude) {
            // Store in session for later use
            $this->context->cookie->__set('pcplace_latitude', $latitude);
            $this->context->cookie->__set('pcplace_longitude', $longitude);
            $this->context->cookie->write();

            $this->ajaxRender(json_encode(array(
                'success' => true,
                'latitude' => $latitude,
                'longitude' => $longitude
            )));
        } else {
            $this->ajaxRender(json_encode(array(
                'success' => false,
                'error' => 'Missing coordinates'
            )));
        }
    }

    /**
     * Render AJAX response
     */
    protected function ajaxRender($json)
    {
        header('Content-Type: application/json');
        echo $json;
        exit;
    }
}
