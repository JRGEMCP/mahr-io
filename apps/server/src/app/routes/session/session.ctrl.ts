import * as Mongoose from 'mongoose';
import * as Boom from 'boom';
import * as crypto from 'crypto';
const User = Mongoose.model('User');

const createSalt = () => crypto.randomBytes(128).toString('base64');
const hashPwd = (salt, pwd) => {
  var hmac = crypto.createHmac('md5', salt);
  return hmac.update(pwd).digest('hex');
}
const SessionCtrl = {
  login: function (request, reply) {
    if (request.auth.isAuthenticated) { return reply(Boom.badRequest()); }

    User.login(request.payload.email.toLowerCase(), request.payload.password, function (err, user) {
      if (err) { return reply(Boom.unauthorized(err)); }
    
      user.token = 'Bearer ' + user.token;
      reply( {user: user} );
    });
  },
  register: function (User, request, reply, server, testing) {
    var responseObject = {};
    if (request.auth.isAuthenticated) { return reply(Boom.badRequest('You Logged In')); }

    if( !request.payload.user || !request.payload.user.password || request.payload.user.password.length < 8){
      return reply( Boom.badRequest('Bad Request') );
    }
    request.payload.user.access = ['authorized'];
    request.payload.user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    request.payload.user.confirmedToken = crypto.randomBytes(20).toString('hex');
    request.payload.user.authorizationToken = [crypto.randomBytes(20).toString('hex')];
    var user = new User( request.payload.user);

    user.save()
      .then(function(user){
        if( server.mailer ) {
          server.mailer({
            to: user.email,
            subject: 'Welcome to Mahr.io',
            html: 'Activate your account <a href="'+ server.hostDomain + '/?confirm='+user.confirmedToken + '">here</a>'
          });
        }
        responseObject = {
          token: 'Bearer ' + user.authorizationToken,
          email: user.email,
          access: user.access,
          id: user.id,
          stripeId: false,
          courses: user.courses,
          confirmed: user.confirmed
        };

        if( testing ) {
          responseObject['confirmedToken'] = user['confirmedToken'];
        }

        reply(responseObject);
      }).catch(function(err){
        reply( Boom.badRequest(err) ); // user already in system?
      });
  },
  logout: function ( request, reply, allDevices){
    if (request.auth.isAuthenticated) {
      let action:any = {$pull: {authorizationToken: request.auth.credentials.token}};
      if( allDevices ) {
        action = {$set: {authorizationToken: []}};
      }
      User.updateOne( {authorizationToken: request.auth.credentials.token}, action, function(err){
        if( err ) { return reply( Boom.badRequest() ); }

        reply({logout:true});
      });
    }else{
      reply({logout: true});
    }
  }
};

export {
    SessionCtrl
}