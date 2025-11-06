<?php
/**
 * AJAX Controller for Google Places Autocomplete Module
 */

class PcPlaceAutocompleteAjaxModuleFrontController extends ModuleFrontController
{
    public function initContent()
    {
        parent::initContent();

        $action = Tools::getValue('action');

        switch ($action) {
            case 'saveCoordinates':
                $this->saveCoordinates();
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
