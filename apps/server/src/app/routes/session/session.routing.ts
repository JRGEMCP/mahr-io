import { User } from '../user/user.model';
import * as Boom from 'boom';
import { SessionCtrl } from './session.ctrl';

const versionedAPI = '/api/v1/session';

const SessionRouter  = ( server, config ) => {
  console.log( config.REGRESSION_SUPPORT ? 'RUNNING REGRESSION MODE ***** | ***** NOT PRODUCTION SAFE' : null);

  server.auth.strategy('simple', 'bearer-access-token', {
    allowQueryToken: true,              // optional, true by default
    allowMultipleHeaders: false,        // optional, false by default
    accessTokenName: 'access_token',    // optional, 'access_token' by default
    validateFunc: ( token, callback ) => {
      User.findOne({ authorizationToken: token}, function (err, user) {
        if (err || !user || typeof user === 'undefined') {
          return callback(null, false, { token: token });
        }
        callback(null, true, {
          token: token,
          email: user.email,
          access: user.access,
          id: user.id,
          stripeId: !!user.stripeId,
          courses: user.courses,
          confirmed: user.confirmed
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: versionedAPI + '/user',
    config: {
      handler: (request, reply) => {
        reply(request.auth.credentials);
      },
      auth: 'simple'
    }
  });

  server.route({
    method: 'POST',
    path: versionedAPI + '/{action?}',
    config: {
      handler: ( request, reply ) => {
        switch( request.params.action ){
          case 'register':
            return SessionCtrl.register(User, request, reply, server, config.REGRESSION_SUPPORT);
          // case 'resend-confirm-email':
          //   return SessionCtrl.resendConfirmEmail( request, reply, server);
          // case 'confirm-account':
          //   return SessionCtrl.confirmAccount( request, reply);
          case 'login':
            return SessionCtrl.login( request, reply );
          // case 'recover-password':
          //   return SessionCtrl.recoverPassword( request, reply, server, config.REGRESSION_SUPPORT );
          // case 'is-valid-token':
          //   return SessionCtrl.isValidToken( request, reply );
          // case 'change-password':
          //   return SessionCtrl.changePassword( request, reply );
          // case 'update-password':
          //   return SessionCtrl.updatePassword( request, reply);
          case 'logout':
            return SessionCtrl.logout( request, reply, false );
          case 'log-off-all-devices':
            return SessionCtrl.logout( request, reply, true );
          default:
            return reply( Boom.badRequest() );
        }
      },
      auth: {
        mode: 'try',
        strategy: 'simple'
      }
    }
  });
};

export {
    SessionRouter
}