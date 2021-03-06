const randtoken = require('rand-token');
import bcrypt = require('bcryptjs');
import CONFIG from '../../../config';
import { UserRepository } from '../repositories/user.repository';
import { AccountRepository } from '../repositories/account.repository';
import { InMemoryAccountRepository } from '../repositories/in-memory/in-memory-account.repository';
import { InMemoryUserRepository } from '../repositories/in-memory/in-memory-user.repository';
import { ExpenseCategoriesRepository } from '../../shared/expense-categories/expense-categories.repository';
import { InMemoryExpenseCategoriesRepository } from '../../shared/expense-categories/in-memory-expense-categories.repository';
import { AuthRequest } from 'src/models/authRequest';
import log from './../../../utils/logger';

const userRepository: UserRepository = new InMemoryUserRepository();
const accountRepository: AccountRepository = new InMemoryAccountRepository();
const expenseCategoriesRepository: ExpenseCategoriesRepository = new InMemoryExpenseCategoriesRepository();

/*
  >>> Salt prevents from Rainbow Tables attack. How bcrypt generates salt?
  >>> Example code with explicit salt generation and hashing:

  bcrypt.genSalt(10).then(salt => {
    bcrypt.hash("password here", salt)
      .then(hash => console.log({ salt, hash }));
  });

  >>> results in:

  {
    salt: '$2a$10$f8.SA/84vLuIqChGu4Y/6u',
    hash: '$2a$10$f8.SA/84vLuIqChGu4Y/6uFZMdQsBSAnYjymCIrXLVsIihRiDN4kS'
  }

  >>> Components concatenated: prefix + salt lenght + salt + hash

  $2a$ - bcrypt prefix
  $10$ - salt lenght
*/
export class SignupService {

  signup(signupRequest: AuthRequest): Promise<void> {
    const confirmationCode = randtoken.uid(256);
    return bcrypt.hash(signupRequest.password, 10) // 10 is the salt length (implicit salt generation)
      .then(hashedPassword => accountRepository.createAccount({})
        .then(accountId => Promise.all([
          expenseCategoriesRepository.createDefaultExpensesCategories(accountId),
          userRepository.createUser({
            accountId: accountId,
            email: signupRequest.email,
            password: hashedPassword,
            role: 'OWNER',
            confirmed: false,
            confirmationCode
          })
        ])).then(() => {
          log.info('auth.signup_successful', { email: signupRequest.email });
          this.sendConfirmationEmail(signupRequest.email, confirmationCode);
          return Promise.resolve();
        }).catch(error => {
          log.error('auth.signup_failed', { email: signupRequest.email });
          throw error; // rethrow the error for the controller
        })
      );
  }

  confirm(email: string, confirmationCode: string): Promise<void> {
    return userRepository.getUserByEmail(email).then(user => {
      if (user && !user.confirmed && user.confirmationCode === confirmationCode) {
        user.confirmed = true;
        user.confirmationCode = undefined;
        log.info('auth.confirmation_successful', { email });
      } else {
        log.warn('auth.confirmation_failed', { email });
        return Promise.reject();
      }
    });
  }

  private sendConfirmationEmail(email: string, code: string) {
    const link = `${CONFIG.clientUrl}/confirm?email=${email}&code=${code}`;
    console.log(`>>> LINK >>>: ${link}`); // mock email sending :)
    log.info('auth.signup_confirmation_email_sent', { email });
  }

}