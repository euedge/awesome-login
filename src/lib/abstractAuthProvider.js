export default class AbstractAuthProvider {

  responseHandler(name, token) {
    let result = {
      name,
      isLoggedin: false,
    };

    if (token) {
      result.isLoggedin = true;
      result.token = token;
    }
    return result;
  }
}

