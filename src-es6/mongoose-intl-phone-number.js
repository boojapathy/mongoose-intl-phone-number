import { IntlPhoneNumber } from './intl-phone-number';

/**
 * @module mongooseIntlPhoneNumber
 * @desc Validates a phone number against google's libphonenumber, otherwise returns a validation error.
 * @example
 ```js
var mongooseIntlPhoneNumber = require('mongoose-intl-phone-number');
var schema = Schema({...});

schema.plugin(mongooseIntlPhoneNumber, {
    hook: 'validate',
    phoneNumberField: 'phoneNumber',
    nationalFormatField: 'nationalFormat',
    internationalFormat: 'internationalFormat',
    countryCodeField: 'countryCode',
});
```
Use it with a model...
```js
var Customer = mongoose.model('Customer');

var customer = new Customer({
    firstName: 'test',
    lastName: 'customer',
    customerType: 'testing',
    phoneNumber: '+18888675309',
    email: 'test@testing.com'
});

customer.save();
```

Resulting document...
```js
{
    "firstName": "test",
    "lastName": "customer",
    "customerType": "testing",
    "phoneNumber": "+18888675309",
    "nationalFormat": "(888) 867-5309",
    "internationalFormat": "+1 888-867-5309"
    "countryCode": "US"
}
 ```
 */
/**
 * Attaches the mongoose document hook and parses the phone number that is provided.
 * @param  {object} schema - Mongoose schema
 * @param  {object} [options]
 * @param  {string} [options.hook=validate]
 * @param  {string} [options.phoneNumberField=phoneNumber]
 * @param  {string} [options.nationalFormatField=nationalFormat]
 * @param  {string} [options.internationalFormatField=internationalFormat]
 * @param  {string} [options.countryCodeField=countryCode]
 */
function mongooseIntlPhoneNumber(schema, {
    hook = 'validate',
    phoneNumberField = 'phoneNumber',
    nationalFormatField = 'nationalFormat',
    internationalFormatField = 'internationalFormat',
    countryCodeField = 'countryCode'
} = {}) {

    // If paths don't exist in schema add them
    [phoneNumberField, nationalFormatField, internationalFormatField, countryCodeField].forEach(function (path) {
        if (!schema.path(path)) {
            schema.add({
                [path]: { type: String }
            });
        }
    });

    schema.pre(hook, function parsePhoneNumber(next) {
        // Only return validation errors if the document is new or phone number has been modified.
        if (this.isNew || this.isDirectModified(phoneNumberField)) {
            try {
                let phoneNumber = this.get(phoneNumberField);
                let intlPhoneNumber = new IntlPhoneNumber(phoneNumber);

                if (intlPhoneNumber.isValid) {
                    this.set(phoneNumberField, intlPhoneNumber.e164Format);
                    this.set(nationalFormatField, intlPhoneNumber.nationalFormat);
                    this.set(internationalFormatField, intlPhoneNumber.internationalFormat);
                    this.set(countryCodeField, intlPhoneNumber.countryCode);
                    next();

                } else {
                    next(new Error(intlPhoneNumber.errorMsg));
                }

            } catch(e) {
                next(new Error(e));
            }
        } else {
            next();
        }
    });

}

export { mongooseIntlPhoneNumber };
