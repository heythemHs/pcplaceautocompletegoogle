# PrestaShop Google Places Autocomplete Module (New API)

A PrestaShop module (v1.7.x and above) that integrates **Google Places API (New)** - Autocomplete with address forms, automatically saving latitude and longitude coordinates for delivery addresses.

> **Note**: Version 2.0.0+ uses the new Google Places API which offers improved performance, better accuracy, and optimized billing with session tokens.

## Features

- **New Google Places API**: Uses the latest Places API (New) for better performance and accuracy
- **Smart Autocomplete**: Automatically suggests addresses as customers type (debounced for optimal performance)
- **Address Auto-fill**: Automatically fills in address fields (street, city, postcode, country) when an address is selected
- **Coordinate Storage**: Saves latitude and longitude in the database for each address
- **Session Token Optimization**: Implements session tokens for cost-effective API billing
- **Location Biasing**: Uses geolocation to prioritize nearby results
- **Configuration Panel**: Easy-to-use admin interface with API key management
- **API Key Validation**: Built-in button to test your Google API key validity with the new API
- **Order Details Display**: Shows coordinates in the backoffice order details page with a link to Google Maps
- **Universal Compatibility**: Works with both checkout and account address forms
- **Keyboard Navigation**: Full keyboard support for accessibility (arrow keys, Enter, Escape)
- **Secure**: API key is never exposed to frontend - all requests go through server-side proxy

## Installation

1. **Upload the Module**
   - Upload the `pcplaceautocomplete` folder to your PrestaShop `/modules` directory
   - Or zip the folder and upload via PrestaShop back office

2. **Install the Module**
   - Go to **Modules > Module Manager** in your PrestaShop back office
   - Search for "Google Places Autocomplete"
   - Click **Install**

3. **Configure the Module**
   - Click **Configure** on the module
   - Enter your Google Places API Key
   - Click **Test API Key** to verify it works
   - Click **Save**

## Google API Key Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project (required for Google Maps APIs)

### Step 2: Enable Required APIs

Enable the following API in your Google Cloud project:
- **Places API (New)** - This is the only required API for the module to work

**Important**: This module uses the **NEW** Places API, not the legacy Places API. Make sure "Places API (New)" is enabled in your Google Cloud Console.

### Step 3: Create API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy your API key
4. (Recommended) Click **Restrict Key** to add restrictions:
   - **Application restrictions**: Can be set to "None" or "IP addresses" (your server IP)
   - Since all API calls go through your server, HTTP referrer restrictions are not needed
   - **API restrictions**: Select "Restrict key" and choose **"Places API (New)"**

**Security Note**: This module uses server-side proxy for all API calls, so your API key is never exposed to the frontend. However, restricting the API key to only "Places API (New)" is still recommended for security.

### Step 4: Configure in PrestaShop

1. Go to your module configuration page
2. Paste your API key
3. Click "Test API Key" to verify it works
4. Save the configuration

## How It Works

### Frontend (Customer)

1. Customer navigates to checkout or address form
2. When typing in the address field, Google Places suggestions appear
3. Customer selects an address from the dropdown
4. All address fields are automatically filled (street, city, postcode, country)
5. Latitude and longitude are captured and stored

### Backend (Admin)

1. When viewing an order in the back office
2. The delivery address section shows a new panel
3. Displays the latitude and longitude of the delivery address
4. Includes a "View on Google Maps" link to see the exact location

## Database Changes

The module adds two new columns to the `ps_address` table:
- `latitude` (DECIMAL 10,8): Stores the latitude coordinate
- `longitude` (DECIMAL 11,8): Stores the longitude coordinate

These columns are automatically created during installation and removed during uninstallation.

## File Structure

```
pcplaceautocomplete/
├── pcplaceautocomplete.php          # Main module file
├── config.xml                        # Module configuration
├── index.php                         # Security file
├── sql/
│   ├── install.php                  # Database installation script
│   └── uninstall.php                # Database uninstallation script
├── views/
│   ├── css/
│   │   └── admin.css                # Admin panel styles
│   ├── js/
│   │   ├── admin.js                 # Admin panel JavaScript (API key testing)
│   │   └── front.js                 # Frontend JavaScript (autocomplete)
│   └── templates/
│       ├── admin/
│       │   └── configure.tpl        # Configuration page template
│       └── hook/
│           └── orderdetail.tpl      # Order details display template
├── controllers/
│   └── front/
│       └── ajax.php                 # AJAX controller for coordinate handling
└── override/
    └── classes/
        └── Address.php              # Address class override
```

## Hooks Used

- `header`: Loads Google Maps API and frontend JavaScript
- `displayBackOfficeHeader`: Loads admin CSS and JavaScript
- `displayAdminOrderLeft`: Displays coordinates in order details page
- `actionValidateStepComplete`: Validates checkout steps

## Compatibility

- **PrestaShop**: 1.7.0.0 and above
- **PHP**: 7.1 and above recommended
- **Browsers**: All modern browsers (Chrome, Firefox, Safari, Edge)

## Troubleshooting

### Autocomplete not appearing

1. Check that your API key is valid (use the Test button)
2. Ensure "Places API" is enabled in Google Cloud Console
3. Check browser console for JavaScript errors
4. Verify your domain is authorized in API key restrictions

### Coordinates not saving

1. Check that the module override is properly installed
2. Clear PrestaShop cache (Advanced Parameters > Performance > Clear cache)
3. Verify the `latitude` and `longitude` columns exist in `ps_address` table

### API Key validation fails

1. Verify the API key is correct (no extra spaces)
2. Check that billing is enabled in your Google Cloud project
3. Ensure "Places API" and "Maps JavaScript API" are enabled
4. Check API key restrictions aren't blocking your domain

## Uninstallation

When you uninstall the module:
- Configuration values are deleted
- Database columns (`latitude`, `longitude`) are removed
- Override files remain but are no longer active

**Note**: Uninstalling will permanently delete all stored coordinates.

## Support & Development

### Configuration Location
Back Office > Modules > Module Manager > Search "Google Places Autocomplete" > Configure

### Testing
1. Install the module on a test environment first
2. Test with different address formats
3. Verify coordinates are saved correctly
4. Check order details page displays coordinates

## License

This module is provided as-is for PrestaShop installations. Please ensure you comply with Google Maps Platform Terms of Service when using this module.

## Credits

Developed for PrestaShop 1.7.x and above
Uses Google Places Autocomplete API

## Version History

### 2.0.0 (Current)
- **Major Update**: Migrated to Google Places API (New)
- Server-side proxy for enhanced security (API key never exposed to frontend)
- Session token implementation for optimized billing
- Custom autocomplete UI with improved UX
- Debounced API calls for better performance
- Keyboard navigation support (arrow keys, Enter, Escape)
- Location biasing using geolocation
- Direct Place Details API integration for coordinates
- Updated API key testing for new API
- Improved error handling and logging

### 1.0.0
- Initial release
- Google Places autocomplete integration (legacy JavaScript API)
- Coordinate storage and display
- API key validation
- Multi-language support
