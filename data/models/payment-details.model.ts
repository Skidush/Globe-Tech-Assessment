export interface PaymentDetails {
    "shippingAddress": {
        "country": string,
        "firstName": string,
        "lastName": string,
        "addressLine1": string,
        "addressLine2": string,
        "city": string,
        "state": string,
        "stateAbbreviation": string,
        "zipCode": string
    },
    "shippingMethod": string,
    "paymentMethod": {
        "vendor": string,
        "creditCardDetails": {
            "cardNumber": string,
            "expiryDate": string,
            "cvv": string,
            "country": string
        }
    }
}