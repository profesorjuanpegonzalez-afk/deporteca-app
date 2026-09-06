import React from 'react';
import GooglePlacesAutocomplete, { geocodeByPlaceId } from 'react-google-places-autocomplete';

function PlaceAutocomplete({ value = '', onChange, placeholder = 'Dirección (solo España)' }) {
  const [inputValue, setInputValue] = React.useState(value);
  const [geocodeError, setGeocodeError] = React.useState('');

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = async (selected) => {
    if (!selected) {
      const currentText = (inputValue || '').trim();
      if (!currentText) {
        setInputValue('');
        if (onChange) {
          onChange('', null);
        }
      }
      return;
    }
    setInputValue(selected.label);
    let coords = null;
    setGeocodeError('');
    try {
      const results = await geocodeByPlaceId(selected.value.place_id);
      if (results && results[0] && results[0].geometry && results[0].geometry.location) {
        coords = {
          latitude: typeof results[0].geometry.location.lat === 'function' ? results[0].geometry.location.lat() : results[0].geometry.location.lat,
          longitude: typeof results[0].geometry.location.lng === 'function' ? results[0].geometry.location.lng() : results[0].geometry.location.lng,
        };
      }
    } catch (err) {
      setGeocodeError('Error obteniendo coordenadas: ' + err.message);
    }
    if (onChange) {
      onChange(selected.label, coords);
    }
  };

  const handleInputChange = (newValue, actionMeta) => {
    const action = actionMeta?.action;
    if (action === 'input-change') {
      setInputValue(newValue || '');
    }
    if (action === 'clear') {
      setInputValue('');
    }
    return newValue;
  };

  return (
    <div>
      <GooglePlacesAutocomplete
        apiKey="REDACTED"
        selectProps={{
          value: inputValue ? { label: inputValue, value: inputValue } : null,
          onChange: handleSelect,
          onInputChange: handleInputChange,
          placeholder,
          isClearable: true,
        }}
        autocompletionRequest={{ componentRestrictions: { country: ['es'] } }}
      />
      {geocodeError && (
        <div className="text-xs text-red-700 mt-1">{geocodeError}</div>
      )}
    </div>
  );
}

export default PlaceAutocomplete;
