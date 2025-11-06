<?php
/**
 * PrestaShop Google Places Autocomplete Module
 *
 * @author    Your Name
 * @copyright Copyright (c) 2025
 * @license   MIT License
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class PcPlaceAutocomplete extends Module
{
    public function __construct()
    {
        $this->name = 'pcplaceautocomplete';
        $this->tab = 'checkout';
        $this->version = '2.0.0';
        $this->author = 'Your Name';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = array('min' => '1.7.0.0', 'max' => _PS_VERSION_);
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('Google Places Autocomplete');
        $this->description = $this->l('Add Google Places autocomplete to address forms and save coordinates.');
        $this->confirmUninstall = $this->l('Are you sure you want to uninstall this module?');
    }

    /**
     * Module installation
     */
    public function install()
    {
        include(dirname(__FILE__) . '/sql/install.php');

        return parent::install() &&
            $this->registerHook('header') &&
            $this->registerHook('displayAdminOrderLeft') &&
            $this->registerHook('displayBackOfficeHeader') &&
            $this->registerHook('actionValidateStepComplete') &&
            $this->installOverride();
    }

    /**
     * Module uninstallation
     */
    public function uninstall()
    {
        include(dirname(__FILE__) . '/sql/uninstall.php');

        Configuration::deleteByName('PCPLACE_GOOGLE_API_KEY');

        return parent::uninstall() && $this->uninstallOverride();
    }

    /**
     * Install override
     */
    protected function installOverride()
    {
        try {
            $this->_clearCache('*');
            return true;
        } catch (Exception $e) {
            $this->_errors[] = $e->getMessage();
            return false;
        }
    }

    /**
     * Configuration page
     */
    public function getContent()
    {
        $output = null;

        if (Tools::isSubmit('submit' . $this->name)) {
            $api_key = strval(Tools::getValue('PCPLACE_GOOGLE_API_KEY'));

            if (!$api_key || empty($api_key)) {
                $output .= $this->displayError($this->l('Invalid API Key value'));
            } else {
                Configuration::updateValue('PCPLACE_GOOGLE_API_KEY', $api_key);
                $output .= $this->displayConfirmation($this->l('Settings updated'));
            }
        }

        return $output . $this->displayForm();
    }

    /**
     * Configuration form
     */
    public function displayForm()
    {
        // Get default language
        $default_lang = (int)Configuration::get('PS_LANG_DEFAULT');

        // Init Fields form array
        $fields_form[0]['form'] = [
            'legend' => [
                'title' => $this->l('Settings'),
            ],
            'input' => [
                [
                    'type' => 'text',
                    'label' => $this->l('Google API Key'),
                    'name' => 'PCPLACE_GOOGLE_API_KEY',
                    'size' => 50,
                    'required' => true,
                    'desc' => $this->l('Enter your Google Places API Key'),
                ],
            ],
            'submit' => [
                'title' => $this->l('Save'),
                'class' => 'btn btn-default pull-right',
            ],
        ];

        $helper = new HelperForm();

        // Module, token and currentIndex
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;

        // Language
        $helper->default_form_language = $default_lang;
        $helper->allow_employee_form_lang = $default_lang;

        // Title and toolbar
        $helper->title = $this->displayName;
        $helper->show_toolbar = true;
        $helper->toolbar_scroll = true;
        $helper->submit_action = 'submit' . $this->name;
        $helper->toolbar_btn = [
            'save' => [
                'desc' => $this->l('Save'),
                'href' => AdminController::$currentIndex . '&configure=' . $this->name . '&save' . $this->name .
                    '&token=' . Tools::getAdminTokenLite('AdminModules'),
            ],
            'back' => [
                'href' => AdminController::$currentIndex . '&token=' . Tools::getAdminTokenLite('AdminModules'),
                'desc' => $this->l('Back to list'),
            ],
        ];

        // Load current value
        $helper->fields_value['PCPLACE_GOOGLE_API_KEY'] = Configuration::get('PCPLACE_GOOGLE_API_KEY');

        return $helper->generateForm($fields_form);
    }

    /**
     * Hook: header - Load JS and CSS on frontend
     */
    public function hookHeader($params)
    {
        $api_key = Configuration::get('PCPLACE_GOOGLE_API_KEY');

        if (!$api_key) {
            return;
        }

        // Check if we're on checkout or address page
        $controller = $this->context->controller->php_self;

        if (in_array($controller, array('order', 'address', 'checkout'))) {
            // Pass configuration to JavaScript
            Media::addJsDef(array(
                'pcplace_ajax_url' => $this->context->link->getModuleLink($this->name, 'ajax'),
                'pcplace_session_token' => bin2hex(random_bytes(16)), // Generate session token
            ));

            // Add our custom JS (now using new Places API)
            $this->context->controller->registerJavascript(
                'module-pcplaceautocomplete-front',
                'modules/' . $this->name . '/views/js/front.js',
                array('position' => 'bottom', 'priority' => 20)
            );
        }
    }

    /**
     * Hook: displayBackOfficeHeader - Load JS and CSS in backoffice
     */
    public function hookDisplayBackOfficeHeader($params)
    {
        $api_key = Configuration::get('PCPLACE_GOOGLE_API_KEY');

        if ($this->context->controller->controller_name == 'AdminModules' &&
            Tools::getValue('configure') == $this->name) {

            $this->context->controller->addCSS($this->_path . 'views/css/admin.css');
            $this->context->controller->addJS($this->_path . 'views/js/admin.js');

            if ($api_key) {
                Media::addJsDef(array(
                    'pcplace_api_key' => $api_key,
                    'pcplace_ajax_url' => $this->context->link->getModuleLink($this->name, 'ajax'),
                ));
            }
        }
    }

    /**
     * Hook: displayAdminOrderLeft - Display coordinates in order details
     */
    public function hookDisplayAdminOrderLeft($params)
    {
        $order = new Order($params['id_order']);
        $address = new Address($order->id_address_delivery);

        if (isset($address->latitude) && isset($address->longitude)) {
            $this->context->smarty->assign(array(
                'latitude' => $address->latitude,
                'longitude' => $address->longitude,
            ));

            return $this->display(__FILE__, 'views/templates/hook/orderdetail.tpl');
        }

        return '';
    }
}
