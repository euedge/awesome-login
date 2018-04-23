# Awesome Login Webcomponent

## Requirements:
* AWS account and AWS CLI configurated with access key, secret and region

### Optional
* Facebook App - its AppId
* Google Project - its ClientId

## Setup

### 1. set up first cloudformation stack: cognitoCF.json
This will setup the aws resources: 
* Cognito User Pool and its User Pool Client
* Cognito Identity Pool
* Authorized and Unauthorized IAM roles with their policies linked to the Identity Pool
* S3 Bucket with its policy

In the cognitoCF.json, replace the supported login providers with your facebook / google appIds:
```json
"SupportedLoginProviders": {
  "graph.facebook.com": "<YOUR_FB_APP_ID>",
  "accounts.google.com": "<YOUR_GOOGLE_CLIENT_ID>"
}
```

run:
```sh
$ aws cloudformation create-stack --stack-name COGNITO_STACK_NAME --template-body file://./cloudformation.json --capabilities CAPABILITY_IAM
```

### 2. copy zip to the previously created S3 bucket

run:
```sh
$ aws s3 cp ./tokenHandler.zip s3://token-lambda-bucket
```

### 3. if you want to get JWT tokens, set up second cloudformation stack: lambdaCF.json
This will setup the lambda function and its IAM role and link to the previously created S3 bucket

In the lambdaConfig.json, add your shared secret as an environment variable, that you can use later for the jwt token.

```json
"Environment": {
  "Variables": {
    "SECRET": "<YOUR_SECRET>"
  }
},
```

```sh
$ aws cloudformation create-stack --stack-name LAMBDA_STACK_NAME --template-body file://./lambdaCF.json --capabilities CAPABILITY_IAM
```

### 4. set the attributes of the component

### 4/A Identity Pool ID

[https://eu-west-1.console.aws.amazon.com/cloudformation](https://eu-west-1.console.aws.amazon.com/cloudformation)

Go to your cloudformation stack in the AWS console, select the stack including the cognito resources and open the Output, where you can find the ID of the newly created Identity Pool ID and copy that


### 4/B Facebook App ID

[https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)

Go to your Facebook App, find the app which you want to use for login and copy the App ID.


### 4/C Google+ Client

[https://console.developers.google.com/apis](https://console.developers.google.com/apis)

Go to your Google developer console, find your project and its credentials and copy the Client ID.


### 4/D

Copy this to the html

```html
<aws-login
    userPoolID="<USER_POOL_ID>"
    userPoolClient="<USER_POOL_CLIENT_ID>"
    identityPoolID="<IDENTITY_POOL_ID>"
    fbID="<FB_APP_ID>"
    gID="<GOOGLE_CLIENT_ID>"
    successRedirect="<REDIRECT_URL_AFTER_LOGGING_IN>">
    logoutRedirect="<REDIRECT_URL_AFTER_LOGGED_OUT>">
</aws-login>
```


### 5. additional scripts

To make all this work, add this script to the head of your html document:

```html
  <script type="text/javascript" src="<PATH>/custom-element.min.js"></script>
  <script type="text/javascript" src="<PATH>/awesome-login.js"></script>
  
```

## How to use?

### just like a DOM element:
``` js
const awsLogin = document.querySelector('aws-login')
```

### methods:
* awsLogin.facebookLogin()
* awsLogin.googleLogin()
* awsLogin.cognitoLogin()
* awsLogin.cognitoSignup()
* awsLogin.cognitoConfirm()
* awsLogin.logout()
* awsLogin.getJwtToken()


## Contribution to the repo

install the node modules:
```sh
$ npm init OR yarn install
```

bundle (with webpack)
```sh
$ npm run build OR yarn build
```

