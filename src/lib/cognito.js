import {CognitoUserAttribute, AuthenticationDetails, CognitoUser} from 'amazon-cognito-identity-js';
import AbstractAuthProvider from './abstractAuthProvider.js';

class CognitoProvider extends AbstractAuthProvider {
  constructor() {
    super();
  }

  signup(userPool, username, email, password, callback) {
    let attributeList = [];

    const attributeEmail = new CognitoUserAttribute({
      Name: 'email',
      Value: email,
    });
    attributeList.push(attributeEmail);

    userPool.signUp(username, password, attributeList, null, (err) => {
      if (err) {
        console.log(err);
        return;
      }

      if (callback) {
        callback();
      }
    });
  }

  confirm(userPoolId, username, code, callback) {
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPoolId,
    });

    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        console.log('confirm error', err);
        return;
      }

      if (callback) {
        callback();
      }
    });
  }

  login(userPool, username, password) {
    return new Promise((resolve, reject) => {
      let cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      let authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const provider = `cognito-idp.eu-west-1.amazonaws.com/${userPool.userPoolId}`;
          let loginObject = super.responseHandler(provider, result && result.getIdToken().getJwtToken());

          resolve(loginObject);
        },

        onFailure: (err) => {
          console.log(err);
          reject();
        },
      });
    });
  }
}

export default new CognitoProvider();
