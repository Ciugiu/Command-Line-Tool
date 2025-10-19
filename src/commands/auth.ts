import {Command} from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import {BackendService} from '@Services/BackendService';
import {SessionService} from '@Services/SessionService';

export function createAuthCommands(program: Command, backendService: BackendService): void {
    const auth = program.command('auth').description('Authentication commands');

    auth
        .command('register')
        .description('Register a new account')
        .option('-e, --email <email>', 'Email address')
        .option('-p, --password <password>', 'Master password')
        .action(async (options) => {
            try {
                let {email, password} = options;

                if (!email) {
                    const emailAnswer = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'email',
                            message: 'Enter your email:',
                            validate: (input) => {
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                return emailRegex.test(input) || 'Please enter a valid email address';
                            },
                        },
                    ]);
                    email = emailAnswer.email;
                }

                // Prompt for password if not provided
                if (!password) {
                    const passwordAnswer = await inquirer.prompt([
                        {
                            type: 'password',
                            name: 'password',
                            message: 'Enter your master password:',
                            mask: '*',
                            validate: (input) => {
                                return input.length >= 8 || 'Password must be at least 8 characters';
                            },
                        },
                        {
                            type: 'password',
                            name: 'confirmPassword',
                            message: 'Confirm your master password:',
                            mask: '*',
                        },
                    ]);

                    if (passwordAnswer.password !== passwordAnswer.confirmPassword) {
                        console.log(chalk.red('❌ Passwords do not match'));
                        return;
                    }

                    password = passwordAnswer.password;
                }

                const spinner = ora('Creating account...').start();

                const response = await backendService.register(email, password);

                spinner.succeed(chalk.green('✓ Account created successfully!'));
                console.log(chalk.blue(`User ID: ${response.userId}`));
                console.log(chalk.blue(`Email: ${response.email}`));
            } catch (error: any) {
                console.log(chalk.red('❌ Registration failed:'), error.response?.data?.message || error.message);
            }
        });

    // Login command
    auth
        .command('login')
        .description('Login to your account')
        .option('-e, --email <email>', 'Email address')
        .option('-p, --password <password>', 'Master password')
        .action(async (options) => {
            try {
                let {email, password} = options;

                // Prompt for email if not provided
                if (!email) {
                    const emailAnswer = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'email',
                            message: 'Enter your email:',
                        },
                    ]);
                    email = emailAnswer.email;
                }

                // Prompt for password if not provided
                if (!password) {
                    const passwordAnswer = await inquirer.prompt([
                        {
                            type: 'password',
                            name: 'password',
                            message: 'Enter your master password:',
                            mask: '*',
                        },
                    ]);
                    password = passwordAnswer.password;
                }

                const spinner = ora('Logging in...').start();

                const response = await backendService.login(email, password);

                spinner.succeed(chalk.green('✓ Logged in successfully!'));
                console.log(chalk.blue(`Welcome back, ${response.email}!`));
            } catch (error: any) {
                console.log(chalk.red('❌ Login failed:'), error.response?.data?.message || error.message);
            }
        });

    // Logout command
    auth
        .command('logout')
        .description('Logout from your account')
        .action(async () => {
            try {
                const sessionService = SessionService.getInstance();

                if (!sessionService.isAuthenticated()) {
                    console.log(chalk.yellow('⚠ You are not logged in'));
                    return;
                }

                const spinner = ora('Logging out...').start();

                await backendService.logout();

                spinner.succeed(chalk.green('✓ Logged out successfully!'));
            } catch (error: any) {
                console.log(chalk.red('❌ Logout failed:'), error.message);
            }
        });

    // Status command
    auth
        .command('status')
        .description('Check authentication status')
        .action(() => {
            const sessionService = SessionService.getInstance();

            if (sessionService.isAuthenticated()) {
                const email = sessionService.getEmail();
                const userId = sessionService.getUserId();
                console.log(chalk.green('✓ Authenticated'));
                console.log(chalk.blue(`Email: ${email}`));
                console.log(chalk.blue(`User ID: ${userId}`));
            } else {
                console.log(chalk.yellow('⚠ Not authenticated'));
            }
        });
}

