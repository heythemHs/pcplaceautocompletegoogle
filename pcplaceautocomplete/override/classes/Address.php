<?php
/**
 * Override Address class to add latitude and longitude fields
 */

class Address extends AddressCore
{
    /**
     * @var float Latitude
     */
    public $latitude;

    /**
     * @var float Longitude
     */
    public $longitude;

    /**
     * Override definition to add latitude and longitude
     */
    public static $definition = array(
        'table' => 'address',
        'primary' => 'id_address',
        'fields' => array(
            'id_customer' => array('type' => self::TYPE_INT, 'validate' => 'isNullOrUnsignedId', 'copy_post' => false),
            'id_manufacturer' => array('type' => self::TYPE_INT, 'validate' => 'isNullOrUnsignedId', 'copy_post' => false),
            'id_supplier' => array('type' => self::TYPE_INT, 'validate' => 'isNullOrUnsignedId', 'copy_post' => false),
            'id_warehouse' => array('type' => self::TYPE_INT, 'validate' => 'isNullOrUnsignedId', 'copy_post' => false),
            'id_country' => array('type' => self::TYPE_INT, 'validate' => 'isUnsignedId', 'required' => true),
            'id_state' => array('type' => self::TYPE_INT, 'validate' => 'isNullOrUnsignedId'),
            'alias' => array('type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'required' => true, 'size' => 32),
            'company' => array('type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'size' => 255),
            'lastname' => array('type' => self::TYPE_STRING, 'validate' => 'isName', 'required' => true, 'size' => 255),
            'firstname' => array('type' => self::TYPE_STRING, 'validate' => 'isName', 'required' => true, 'size' => 255),
            'vat_number' => array('type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'size' => 32),
            'address1' => array('type' => self::TYPE_STRING, 'validate' => 'isAddress', 'required' => true, 'size' => 128),
            'address2' => array('type' => self::TYPE_STRING, 'validate' => 'isAddress', 'size' => 128),
            'postcode' => array('type' => self::TYPE_STRING, 'validate' => 'isPostCode', 'size' => 12),
            'city' => array('type' => self::TYPE_STRING, 'validate' => 'isCityName', 'required' => true, 'size' => 64),
            'other' => array('type' => self::TYPE_STRING, 'validate' => 'isMessage', 'size' => 300),
            'phone' => array('type' => self::TYPE_STRING, 'validate' => 'isPhoneNumber', 'size' => 32),
            'phone_mobile' => array('type' => self::TYPE_STRING, 'validate' => 'isPhoneNumber', 'size' => 32),
            'dni' => array('type' => self::TYPE_STRING, 'validate' => 'isDniLite', 'size' => 16),
            'deleted' => array('type' => self::TYPE_BOOL, 'validate' => 'isBool', 'copy_post' => false),
            'date_add' => array('type' => self::TYPE_DATE, 'validate' => 'isDate', 'copy_post' => false),
            'date_upd' => array('type' => self::TYPE_DATE, 'validate' => 'isDate', 'copy_post' => false),
            // Add latitude and longitude
            'latitude' => array('type' => self::TYPE_FLOAT, 'validate' => 'isFloat'),
            'longitude' => array('type' => self::TYPE_FLOAT, 'validate' => 'isFloat'),
        ),
    );

    /**
     * Override add method to capture coordinates from request or session
     */
    public function add($autodate = true, $null_values = false)
    {
        $this->captureCoordinates();
        return parent::add($autodate, $null_values);
    }

    /**
     * Override update method to capture coordinates from request or session
     */
    public function update($null_values = false)
    {
        $this->captureCoordinates();
        return parent::update($null_values);
    }

    /**
     * Capture coordinates from POST data or cookie/session
     */
    protected function captureCoordinates()
    {
        // First check if coordinates are in POST data
        if (Tools::isSubmit('latitude') && Tools::isSubmit('longitude')) {
            $this->latitude = (float)Tools::getValue('latitude');
            $this->longitude = (float)Tools::getValue('longitude');
        }
        // If not in POST, check cookie (set by our AJAX call)
        elseif (isset(Context::getContext()->cookie->pcplace_latitude) &&
                isset(Context::getContext()->cookie->pcplace_longitude)) {
            $this->latitude = (float)Context::getContext()->cookie->pcplace_latitude;
            $this->longitude = (float)Context::getContext()->cookie->pcplace_longitude;

            // Clear the cookies after using them
            unset(Context::getContext()->cookie->pcplace_latitude);
            unset(Context::getContext()->cookie->pcplace_longitude);
            Context::getContext()->cookie->write();
        }
    }
}
