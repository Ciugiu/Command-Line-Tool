import {Command} from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import {BackendService} from '@Services/BackendService';
import {SessionService} from '@Services/SessionService';

function requireAuth(): boolean {
    const sessionService = SessionService.getInstance();
    if (!sessionService.isAuthenticated()) {
        console.log(chalk.red('❌ You must be logged in to use this command'));
        console.log(chalk.yellow('Run "1337legal auth login" to login'));
        return false;
    }
    return true;
}

export function createAliasCommands(program: Command, backendService: BackendService): void {
    const alias = program.command('alias').description('Manage email aliases');

    alias
        .command('list')
        .alias('ls')
        .description('List all your email aliases')
        .action(async () => {
            if (!requireAuth()) return;

            try {
                const spinner = ora('Fetching aliases...').start();

                const aliases = await backendService.getAliases();

                spinner.stop();

                if (aliases.length === 0) {
                    console.log(chalk.yellow('No aliases found. Create one with "1337legal alias create"'));
                    return;
                }

                console.log(chalk.bold(`\nYour aliases (${aliases.length}):\n`));

                aliases.forEach((alias) => {
                    const status = alias.isActive ? chalk.green('●') : chalk.red('●');
                    console.log(`${status} ${chalk.bold(alias.alias)}`);
                    if (alias.description) {
                        console.log(`  ${chalk.gray(alias.description)}`);
                    }
                    console.log(`  ${chalk.gray(`Created: ${new Date(alias.createdAt).toLocaleString()}`)}`);
                    console.log('');
                });
            } catch (error: any) {
                console.log(chalk.red('❌ Failed to fetch aliases:'), error.response?.data?.message || error.message);
            }
        });

    // Create alias
    alias
        .command('create')
        .description('Create a new email alias')
        .option('-d, --description <description>', 'Alias description')
        .action(async (options) => {
            if (!requireAuth()) return;

            try {
                let {description} = options;

                // Prompt for description if not provided
                if (!description) {
                    const descAnswer = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'description',
                            message: 'Enter a description (optional):',
                        },
                    ]);
                    description = descAnswer.description || undefined;
                }

                const spinner = ora('Creating alias...').start();

                const alias = await backendService.createAlias(description);

                spinner.succeed(chalk.green('✓ Alias created successfully!'));
                console.log(chalk.bold(`\n${alias.alias}\n`));
                if (alias.description) {
                    console.log(chalk.gray(`Description: ${alias.description}`));
                }
            } catch (error: any) {
                console.log(chalk.red('❌ Failed to create alias:'), error.response?.data?.message || error.message);
            }
        });

    // Get alias details
    alias
        .command('get <aliasId>')
        .description('Get details of a specific alias')
        .action(async (aliasId) => {
            if (!requireAuth()) return;

            try {
                const spinner = ora('Fetching alias...').start();

                const alias = await backendService.getAlias(aliasId);

                spinner.stop();

                const status = alias.isActive ? chalk.green('Active') : chalk.red('Inactive');
                console.log(chalk.bold(`\n${alias.alias}\n`));
                console.log(`Status: ${status}`);
                if (alias.description) {
                    console.log(`Description: ${alias.description}`);
                }
                console.log(`Created: ${new Date(alias.createdAt).toLocaleString()}`);
                console.log(`ID: ${chalk.gray(alias.id)}`);
            } catch (error: any) {
                console.log(chalk.red('❌ Failed to fetch alias:'), error.response?.data?.message || error.message);
            }
        });

    // Update alias
    alias
        .command('update <aliasId>')
        .description('Update an alias')
        .option('-d, --description <description>', 'New description')
        .option('-a, --active <active>', 'Set active status (true/false)')
        .action(async (aliasId, options) => {
            if (!requireAuth()) return;

            try {
                const updateData: any = {};

                if (options.description !== undefined) {
                    updateData.description = options.description;
                }

                if (options.active !== undefined) {
                    updateData.isActive = options.active === 'true';
                }

                if (Object.keys(updateData).length === 0) {
                    console.log(chalk.yellow('No updates provided. Use --description or --active'));
                    return;
                }

                const spinner = ora('Updating alias...').start();

                const alias = await backendService.updateAlias(aliasId, updateData);

                spinner.succeed(chalk.green('✓ Alias updated successfully!'));
                console.log(chalk.bold(`\n${alias.alias}\n`));
            } catch (error: any) {
                console.log(chalk.red('❌ Failed to update alias:'), error.response?.data?.message || error.message);
            }
        });

    // Delete alias
    alias
        .command('delete <aliasId>')
        .alias('rm')
        .description('Delete an alias')
        .option('-y, --yes', 'Skip confirmation')
        .action(async (aliasId, options) => {
            if (!requireAuth()) return;

            try {
                // Confirm deletion
                if (!options.yes) {
                    const confirm = await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'confirmed',
                            message: 'Are you sure you want to delete this alias?',
                            default: false,
                        },
                    ]);

                    if (!confirm.confirmed) {
                        console.log(chalk.yellow('Deletion cancelled'));
                        return;
                    }
                }

                const spinner = ora('Deleting alias...').start();

                await backendService.deleteAlias(aliasId);

                spinner.succeed(chalk.green('✓ Alias deleted successfully!'));
            } catch (error: any) {
                console.log(chalk.red('❌ Failed to delete alias:'), error.response?.data?.message || error.message);
            }
        });
}

