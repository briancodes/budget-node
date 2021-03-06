import path = require('path');
import rfs = require('rotating-file-stream');

const jwtSecret = 'VERY_SECRET_KEY!'; // TODO change in prod
const cookieSecret = 'VERY_SECRET_KEY!'; // TODO change in prod

const bunyanStreamSetting = process.env.LOGS || 'file';
const bunyanStdoutStream = { stream: process.stdout };
const bunyanFileStream = {
  type: 'rotating-file',
  path: path.join(process.cwd(), 'log', 'app'),
  period: '1d',
  count: 3
};

export default {
  jwtSecret,
  auth: 'session' as 'session' | 'jwt',
  loginThrottle: {
    maxFailures: 3,
    timeWindowInMinutes: 10
  },
  clientUrl: 'http://localhost:4200',
  sessionConfig: {
    name: 'session_id',
    secret: cookieSecret,
    saveUninitialized: true,
    resave: false,
    cookie: {
      sameSite: 'lax' as 'lax',
      maxAge: 3600000
    }
  },
  morganPattern: 'common',
  morganStream: rfs.createStream('access.log', {
    interval: '1d',
    path: path.join(process.cwd(), 'log')
  }),
  bunyanStream: bunyanStreamSetting === 'stdout' ? bunyanStdoutStream : bunyanFileStream
}