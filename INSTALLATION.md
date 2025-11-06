# Installation Guide - PrestaShop Google Places Autocomplete Module (New API v2.0)

## Quick Start

### 1. Upload to PrestaShop

**Option A: Via FTP**
```bash
# Upload the entire 'pcplaceautocomplete' folder to:
/path/to/your/prestashop/modules/
```

**Option B: Via PrestaShop Admin**
1. Zip the `pcplaceautocomplete` folder
2. Go to **Modules > Module Manager**
3. Click **Upload a module**
4. Select the zip file and upload

### 2. Install the Module

1. Go to **Modules > Module Manager**
2. Search for "Google Places Autocomplete"
3. Click **Install**
4. Wait for installation to complete

### 3. Get Your Google API Key

#### Step-by-Step Guide

**3.1. Create Google Cloud Project**
1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Enter project name: "PrestaShop Maps"
4. Click "Create"

**3.2. Enable Billing**
1. Go to **Billing** in the left menu
2. Link a billing account (required for Maps APIs)
3. Google offers $200/month free credit

**3.3. Enable Required APIs**
1. Go to **APIs & Services > Library**
2. Search for "**Places API (New)**"
3. Click on it and enable it

**Important Notes:**
- This module uses the **NEW** Places API (also called "Places API (New)" in Google Cloud Console)
- This is different from the legacy "Places API"
- Make sure you enable "Places API (New)" specifically

**3.4. Create API Key**
1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **API Key**
4. Copy the API key (save it somewhere safe)

**3.5. Restrict API Key (Recommended)**
1. Click on your newly created API key
2. Under **Application restrictions**:
   - Select "None" or "IP addresses" (add your server IP if you choose this option)
   - Since the module uses server-side proxy, HTTP referrer restrictions are not needed
3. Under **API restrictions**:
   - Select "Restrict key"
   - Choose **"Places API (New)"** from the list
4. Click **Save**

**Security Note:** Version 2.0+ uses server-side proxy for all API calls, so your API key is never exposed in the frontend. However, restricting it to only "Places API (New)" is still recommended.

### 4. Configure the Module

1. Go to **Modules > Module Manager**
2. Search for "Google Places Autocomplete"
3. Click **Configure**
4. Paste your Google API Key
5. Click **Test API Key** button
6. If successful, click **Save**

## Testing

### Test Frontend Autocomplete

1. Go to your shop frontend
2. Navigate to checkout or "My Account > Addresses"
3. Start typing an address in the address field
4. Google Places suggestions should appear
5. Select an address
6. All fields should auto-fill

### Test Coordinate Storage

1. Complete an order with autocomplete
2. Go to **Orders** in back office
3. Open the order details
4. Look for the "Delivery Address Coordinates" panel
5. You should see latitude, longitude, and a Google Maps link

## Troubleshooting

### Problem: Autocomplete not showing

**Solution:**
1. Check browser console (F12) for errors
2. Verify API key in module configuration
3. Test API key using the Test button
4. Check that Places API is enabled in Google Cloud Console

### Problem: "Test API Key" fails

**Solution:**
1. Verify the API key is correct (no spaces)
2. Check billing is enabled in Google Cloud
3. Verify Places API and Maps JavaScript API are enabled
4. Check API key restrictions allow your domain

### Problem: Coordinates not saving

**Solution:**
1. Go to **Advanced Parameters > Performance**
2. Click **Clear cache**
3. Check database: `SELECT latitude, longitude FROM ps_address LIMIT 1;`
4. If columns don't exist, reinstall the module

### Problem: Override not working

**Solution:**
1. Go to **Advanced Parameters > Performance**
2. Scroll to **CCC (Combine, Compress and Cache)**
3. Make sure overrides are enabled
4. Click **Clear cache**
5. Check that file exists: `/override/classes/Address.php`

## Uninstallation

**Warning:** Uninstalling will delete all stored coordinates!

1. Go to **Modules > Module Manager**
2. Search for "Google Places Autocomplete"
3. Click the dropdown menu (⋮)
4. Click **Uninstall**
5. Confirm the action

## Advanced Configuration

### Customize Address Field Selector

Edit `/modules/pcplaceautocomplete/views/js/front.js`:

```javascript
// Line 18-20: Customize which fields to target
var addressInputs = document.querySelectorAll('input[name="address1"], input[id*="address1"], input[id*="field-address1"]');
```

### Customize Autocomplete Options

Edit `/modules/pcplaceautocomplete/views/js/front.js`:

```javascript
// Line 38-41: Customize autocomplete options
var autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ['address'],  // Change to ['geocode'] for broader results
    fields: ['address_components', 'geometry', 'formatted_address']
});
```

### Add Country Restriction

Edit `/modules/pcplaceautocomplete/views/js/front.js`:

```javascript
// Add componentRestrictions to limit to specific countries
var autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ['address'],
    fields: ['address_components', 'geometry', 'formatted_address'],
    componentRestrictions: { country: 'us' }  // Restrict to USA
});
```

## File Permissions

Ensure proper permissions after upload:

```bash
# Set correct permissions
chmod 755 /path/to/prestashop/modules/pcplaceautocomplete/
chmod 644 /path/to/prestashop/modules/pcplaceautocomplete/*.php
chmod -R 755 /path/to/prestashop/modules/pcplaceautocomplete/*/
```

## Database Structure

The module adds these columns to `ps_address`:

| Column    | Type         | Null | Description        |
|-----------|--------------|------|--------------------|
| latitude  | DECIMAL(10,8)| YES  | Address latitude   |
| longitude | DECIMAL(11,8)| YES  | Address longitude  |

## API Costs

Google Maps Platform pricing (as of 2024):
- **Places Autocomplete**: $2.83 per 1,000 requests
- **Maps JavaScript API**: Free for map loads
- **Free tier**: $200 credit per month

For a typical small store (100 orders/day), monthly cost is usually covered by the free tier.

## Support

For issues or questions:
1. Check this installation guide
2. Review README.md
3. Check PrestaShop logs: `/var/logs/`
4. Check browser console for JavaScript errors

## Module Info

- **Version**: 2.0.0
- **Compatibility**: PrestaShop 1.7.0.0+
- **PHP**: 7.1+
- **License**: MIT

---

**Note**: This module requires an active internet connection for Google Places API to work. It will not function in offline/local environments without proper API configuration.
