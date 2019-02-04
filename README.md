# Tyk middleware to allow both Bearer-token and (signed) Cookie JWTs

This middleware is to allow both `Authorization: Bearer`-header and (signed) cookies in `JWT`-format to pass through the Tyk API Gateway.

The middleware will in practice:

1. Look for the `COOKIE_NAME` (`access_token`) in the cookies
1. Strip any signed parts of the jwt-cookie since TYK does not understand this.
1. Copy the JWT to `HEADER_NAME` (`Authorization`) with the `HEADER_PREFIX` (`Bearer`)

The middleware will **not** strip away the original cookie and does **not** remove the Authorization-header when done (this could be added in a "post-middleware" if required).
