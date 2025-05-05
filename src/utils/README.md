
# API Documentation

This folder contains the following files that can be imported into Postman for testing the API:

## postman_collection.json

This file contains a collection of API requests for the QLA1 Dashboard application. It includes:
- Authentication requests (login, register, get current user)
- User management requests (update user roles - superadmin only)
- Reports API endpoints
- Metrics API endpoints
- IndusIT Dashboard API endpoints

## postman_environment.json

This file contains environment variables for the Postman collection, including:
- API URL
- User credentials
- Authentication token placeholder
- IDs for various resources

## env.json

This file contains environment configuration including tokens for different user roles:
- superadmin
- admin
- SDadmin
- IDadmin
- user

## Usage Instructions

1. Import the `postman_collection.json` and `postman_environment.json` files into Postman
2. Select the imported environment in Postman
3. Login with the appropriate user credentials to obtain a valid token
4. Copy the token from the response and set it in the "token" environment variable
5. For superadmin operations, store the token in the "superadminToken" environment variable
6. Now you can use all the API endpoints in the collection

## Role-Based Access

Different endpoints require different roles:
- `/admin/users` requires the 'superadmin' role
- Some dashboard endpoints require specific role permissions

## Updating Tokens

When tokens expire, you'll need to:
1. Login again with the appropriate credentials
2. Update the token in your environment variables
3. Update the corresponding token in `env.json` if you're using it for automated testing
