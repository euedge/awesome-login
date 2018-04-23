import load from 'load-script';
import AbstractAuthProvider from './abstractAuthProvider.js';

export const fbProvider = (fbAppId) => new Promise(resolve => {
  load('https://connect.facebook.net/en_US/sdk.js', null, () => {
    FB.init({
      appId: fbAppId,
      cookie: false,
      status: true,
      xfbml: false,
      version: 'v2.8',
    });

    resolve(FB);
  });
});

export class FBAuthProvider extends AbstractAuthProvider {
  constructor(sdk) {
    super();
    this.sdk = sdk;
  }

  logout() {
    return this.sdk.then(FB => {
      FB.logout()
    });
  }

  login() {
    return this.sdk.then(FB => new Promise(resolve => {
      FB.login(response => {
        resolve(this.responseHandler(response));
      }, {scope: 'email'});
    }));
  }

  responseHandler(response) {
    let loginObject = super.responseHandler('graph.facebook.com', response &&
        response.authResponse &&
        response.authResponse.accessToken);
    loginObject.email = ''


    FB.api('/me', (result) => {
      loginObject.userName = loginObject.userName || result.name;
      loginObject.email = loginObject.email || result.email;
    });

    return loginObject;
  }

  getSession() {
    return this.sdk.then(FB => new Promise(resolve => {
      FB.getLoginStatus(response => {
        resolve(this.responseHandler(response));
      });
    }));
  }
}

