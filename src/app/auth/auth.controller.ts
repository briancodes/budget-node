import { Router, Request, Response } from 'express';
import { AuthRequest } from '../../models/authRequest';
import { SignupService } from './services/signup.service';
import authService from './services/auth.service.instance';
import validator from './auth.validator';

const router = Router();
const signupService = new SignupService();

router.post('/signup', validator, function (req: Request, res: Response) {
  const signupRequest = AuthRequest.buildFromRequest(req);
  signupService.signup(signupRequest).then(() => {
    res.sendStatus(204);
  }).catch(() => {
    res.status(400).json({msg: 'Signup failed'});
  });
});

router.get('/confirm', function (req: Request, res: Response) {
  let email = req.query.email;
  let confirmationCode = req.query.code;
  signupService.confirm(email, confirmationCode).then(() => {
    res.sendStatus(204);
  }).catch(() => {
    res.status(400).json({msg: 'Confirmation failed'});
  });
});

router.post('/login', function (req: Request, res: Response) {
  const loginRequest = AuthRequest.buildFromRequest(req);
  authService.login(loginRequest).then(result => {
    res.json(result);
  }).catch((err) => {
    res.status(401).json({msg: err ? err : 'Login failed'});
  });
});

router.get('/logout', function (req: Request, res: Response) {
  authService.logout(req.session).then(() => {
    res.sendStatus(204);
  });
});

router.get('/user', function (req: Request, res: Response) {
  authService.getCurrentUser(req.session).then((user) => {
    res.status(200).json(user);
  });
});

export default router;