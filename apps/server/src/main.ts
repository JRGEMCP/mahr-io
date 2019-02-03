import * as Mongoose from 'mongoose';
import { Server } from "./app/mahrio.server";
import { SessionRouter } from "./app/routes/session/session.routing";
import * as env from './environments/environment';

env.environment['baseUrl'] = __dirname;
env.environment['NODE_ENV'] = process.env['NODE_ENV'] || 'development';
env.environment['NODE_PUBLIC_PATH'] = '../public';

Mongoose.set('useCreateIndex', true);
Mongoose.set('useNewUrlParser', true);

Server.initServer( env ).then( app => {
  //server['configProxies']();
  //server['configStaticApps']();
  SessionRouter( app['server'], env.environment );
});