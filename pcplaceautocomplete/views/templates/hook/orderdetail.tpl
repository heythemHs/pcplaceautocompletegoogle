{*
* Display coordinates in order detail page
*}

<div class="panel">
    <div class="panel-heading">
        <i class="icon-map-marker"></i>
        {l s='Delivery Address Coordinates' mod='pcplaceautocomplete'}
    </div>
    <div class="panel-body">
        <div class="row">
            <div class="col-md-6">
                <strong>{l s='Latitude:' mod='pcplaceautocomplete'}</strong> {$latitude|escape:'html':'UTF-8'}
            </div>
            <div class="col-md-6">
                <strong>{l s='Longitude:' mod='pcplaceautocomplete'}</strong> {$longitude|escape:'html':'UTF-8'}
            </div>
        </div>
        {if $latitude && $longitude}
        <div class="row" style="margin-top: 15px;">
            <div class="col-md-12">
                <a href="https://www.google.com/maps/search/?api=1&query={$latitude|escape:'url':'UTF-8'},{$longitude|escape:'url':'UTF-8'}"
                   target="_blank"
                   class="btn btn-default">
                    <i class="icon-external-link"></i>
                    {l s='View on Google Maps' mod='pcplaceautocomplete'}
                </a>
            </div>
        </div>
        {/if}
    </div>
</div>
