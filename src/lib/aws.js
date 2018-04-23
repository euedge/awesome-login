import AWS from 'aws-sdk';

AWS.config.region = 'eu-west-1';

export default {
  getLambda() {
    return new Promise(resolve => {
      resolve(new AWS.Lambda({apiVersion: '2015-03-31'}));
    });
  },

  getCredentials(loginObject, cognitoId) {
    return new Promise(resolve => {
      let awsCognito = {
        IdentityPoolId: cognitoId,
        Logins: {
          [loginObject.name]: loginObject.token,
        },
      };
      AWS.config.credentials = new AWS.CognitoIdentityCredentials(awsCognito);

      resolve(AWS);
    });
  },

  clearCredentials() {
      if (AWS && AWS.config && AWS.config.credentials) {
        AWS.config.credentials.clearCachedId();
      }
  },

  addAttribute(cognitoId) {
    const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

    const params = {
      CustomAttributes: [
        {
          AttributeDataType: 'String',
          Name: 'email',
          StringAttributeConstraints: {
            MaxLength: 100,
            MinLength: 6,
          },
        },
      ],
      UserPoolId: cognitoId,
    };

    cognitoidentityserviceprovider.addCustomAttributes(params,
        function(err, data) {
          if (err) console.log(err, err.stack);
          else console.log(data);
        });
  },
};
