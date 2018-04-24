import {CognitoUserPool} from 'amazon-cognito-identity-js';
import Bacon from 'baconjs';
import {FBAuthProvider, fbProvider} from './lib/facebook.js';
import {GAuthProvider, gProvider} from './lib/google.js';
import AWS from './lib/aws.js';
import cognitoProvider from './lib/cognito';

export default class extends window.HTMLElement {
  constructor() {
    super();
    this.userPoolId = '';
    this.userPoolClient = '';
    this.identityPoolId = '';
    this.loginRedirect = '';
    this.logoutRedirect = '';

    this.FBAuth = null;
    this.GAuth = null;
    this.loginBus = null;

    this.user = null;
    this.status = 'unmounted';
  }

  getJwtToken(data={}) {
    if (!this.user) {
      return Promise.reject();
    }

    let payload = Object.assign({}, {id: this.user.userId, name: this.user.userName}, data);
    const params = {
      FunctionName: 'tokenHandler',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload),
    };
    return AWS.getLambda().then(lambda => {
      lambda.invoke(params, (err, data) => {
        if (err) {
          console.log('error', err);
        } else {
          console.log(data);
          return data.Payload;
        }
      });
    });
  }

  set status(value) {
    if (value !== this._status) {
      const oldValue = this._status;
      this._status = value;
      const event = new CustomEvent('statusChange',
          {
            bubbles: true,
            cancelable: true,
            composed: true,
            detail: {
              oldValue: oldValue,
              newValue: value,
            },
          });

      this.dispatchEvent(event);
    }
  }

  initProps() {
    const fbApp = this.getAttribute('fbID');
    const googleApp = this.getAttribute('gID');

    this.userPoolId = this.getAttribute('userPoolID');
    this.userPoolClient = this.getAttribute('userPoolClient');
    this.identityPoolId = this.getAttribute('identityPoolID');
    this.loginRedirect = this.getAttribute('loginRedirect');
    this.logoutRedirect = this.getAttribute('logoutRedirect');

    this.FBAuth = fbApp ? new FBAuthProvider(fbProvider(fbApp)) : new Promise(resolve => resolve());
    this.GAuth = googleApp ? new GAuthProvider(gProvider, googleApp) : new Promise(resolve => resolve());
    this.loginBus = new Bacon.Bus();

    if (this.userPoolId && this.userPoolClient) {
      this.userPool = new CognitoUserPool({UserPoolId: this.userPoolId, ClientId: this.userPoolClient});
    }
  }

  connectedCallback() {
    this.initProps();
    let sessionStream = Bacon.mergeAll(
        Bacon.fromPromise(this.FBAuth.getSession()),
        Bacon.fromPromise(this.GAuth.getSession()));
    this.loginBus.plug(
        sessionStream.filter(loginObject => loginObject.isLoggedin).take(1));

    let loggedIn = this.loginBus.filter(
        (loginObject) => !this.user && loginObject && loginObject.isLoggedin);
    let notLoggedIn = sessionStream.reduce(false, (s, c) => s || c.isLoggedin).
        filter(e => !e);

    Bacon.mergeAll(loggedIn, notLoggedIn).onValue(loginObject => {
      if (loginObject === false) {
        this.status = 'loaded';
        return;
      } else {
        AWS.getCredentials(loginObject, this.identityPoolId).then(AWS => {
          AWS.config.credentials.get(() => {
            const user = AWS.config.credentials;

            this.user = {
              awsCredentials: user,
              data: loginObject,
              userName: loginObject && loginObject.userName,
              userId: user.data && user.data.IdentityId,
            };

            this.changeEvent();
            this.status = 'loaded';
          });
        }).catch((e) => {
          console.log(e);
        });
      }
    });

    this.status = 'mounted';
  }

  facebookLogin() {
    this.loginBus.plug(Bacon.fromPromise(this.FBAuth.login()));
  }

  googleLogin() {
    this.loginBus.plug(Bacon.fromPromise(this.GAuth.login()));
  }

  cognitoLogin(username, password) {
    this.loginBus.plug(Bacon.fromPromise(cognitoProvider.login(this.userPool, username, password)));
  }

  cognitoSignup(username, email, password, callback) {
    cognitoProvider.signup(this.userPool, username, email, password, callback);
  }

  cognitoConfirm(username, code, callback) {
    cognitoProvider.confirm(this.userPool, username, code, callback);
  }

  logout() {
    this.GAuth.logout();
    this.FBAuth.logout();

    AWS.clearCredentials();
    this.user = null;
    this.changeEvent();
  }

  changeEvent() {
    const event = new CustomEvent('userChange',
        {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: this.user,
        });

    let isCancelled = !this.dispatchEvent(event);
    if (!isCancelled && this.user && this.loginRedirect) {
      window.location.href = this.loginRedirect;
    }
    if (!isCancelled && !this.user && this.logoutRedirect) {
      window.location.href = this.logoutRedirect;
    }
  }
}


