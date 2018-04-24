import load from 'load-script';
import AbstractAuthProvider from './abstractAuthProvider.js';

export const gProvider = (new Promise(
    resolve => load('https://apis.google.com/js/platform.js', null, resolve))).then(
    () => new Promise(resolve => gapi.load('auth2', resolve)));

export class GAuthProvider extends AbstractAuthProvider {
  constructor(sdk, clientId) {
    super();
    this.sdk = sdk.then(() => {
      this.GoogleAuth = gapi.auth2.init({
        client_id: clientId,
        fetch_basic_profile: false,
        scope: 'profile email https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.me',
      });
    });
  }

  logout() {
    return this.sdk.then(() => this.GoogleAuth.signOut());
  }

  login() {
    return this.sdk.then(() => {
      return this.GoogleAuth.signIn().then(user => this.responseHandler(user));
    });
  }

  responseHandler(user) {
    const profile = user && user.getBasicProfile();
    let loginObject = super.responseHandler('accounts.google.com', user &&
        user.getAuthResponse()['id_token']);

    loginObject.userName = profile && profile.getName();
    loginObject.email = profile && profile.getEmail();
    return loginObject;
  }

  getSession() {
    return this.sdk.then(() => new Promise(resolve => {
      this.GoogleAuth.then(gAuth => {
        if (gAuth.isSignedIn.get()) {
          resolve(this.responseHandler(gAuth.currentUser.get()));
        } else {
          resolve(this.responseHandler(null));
        }
      });
    }));
  }
}