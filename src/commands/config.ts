import {Command} from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

class ConfigStorage {
    private configDir: string;
    private configFile: string;

    constructor() {
        this.configDir = join(homedir(), '.1337legal-cli');
        this.configFile = join(this.configDir, 'config.json');

        if (!existsSync(this.configDir)) {
            mkdirSync(this.configDir, {recursive: true, mode: 0o700});
        }
    }

    get(key: string, defaultValue?: any): any {
        const store = this.getAll();
        return store[key] !== undefined ? store[key] : defaultValue;
    }

    set(key: string, value: any): void {
        const store = this.getAll();
        store[key] = value;
        this.save(store);
    }

    has(key: string): boolean {
        const store = this.getAll();
        return key in store;
    }

    delete(key: string): void {
        const store = this.getAll();
        delete store[key];
        this.save(store);
    }

    clear(): void {
        this.save({});
    }

    getAll(): Record<string, any> {
        if (!existsSync(this.configFile)) {
            return {};
        }

        try {
            const data = readFileSync(this.configFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    private save(data: Record<string, any>): void {
        try {
            writeFileSync(this.configFile, JSON.stringify(data, null, 2), {mode: 0o600});
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
    }
}

const config = new ConfigStorage();

export function createConfigCommands(program: Command): void {
    const configCmd = program.command('config').description('Manage CLI configuration');

    configCmd
        .command('set <key> <value>')
        .description('Set a configuration value')
        .action((key: string, value: string) => {
            config.set(key, value);
            console.log(chalk.green(`✓ Set ${key} = ${value}`));
        });

    configCmd
        .command('get <key>')
        .description('Get a configuration value')
        .action((key: string) => {
            const value = config.get(key);
            if (value === undefined) {
                console.log(chalk.yellow(`⚠ Configuration key "${key}" not found`));
            } else {
                console.log(chalk.blue(`${key} = ${value}`));
            }
        });

    configCmd
        .command('list')
        .alias('ls')
        .description('List all configuration values')
        .action(() => {
            const allConfig = config.getAll();
            if (Object.keys(allConfig).length === 0) {
                console.log(chalk.yellow('No configuration values set'));
                return;
            }

            console.log(chalk.bold('\nConfiguration:\n'));
            Object.entries(allConfig).forEach(([key, value]) => {
                console.log(`${chalk.blue(key)}: ${value}`);
            });
        });

    configCmd
        .command('delete <key>')
        .alias('rm')
        .description('Delete a configuration value')
        .action((key: string) => {
            if (config.has(key)) {
                config.delete(key);
                console.log(chalk.green(`✓ Deleted ${key}`));
            } else {
                console.log(chalk.yellow(`⚠ Configuration key "${key}" not found`));
            }
        });

    configCmd
        .command('clear')
        .description('Clear all configuration values')
        .action(async () => {
            const confirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmed',
                    message: 'Are you sure you want to clear all configuration?',
                    default: false,
                },
            ]);

            if (confirm.confirmed) {
                config.clear();
                console.log(chalk.green('✓ Configuration cleared'));
            } else {
                console.log(chalk.yellow('Cancelled'));
            }
        });

    configCmd
        .command('api-url <url>')
        .description('Set the API base URL')
        .action((url: string) => {
            config.set('apiUrl', url);
            console.log(chalk.green(`✓ API URL set to ${url}`));
        });

    configCmd
        .command('path')
        .description('Show configuration file location')
        .action(() => {
            const configPath = join(homedir(), '.1337legal-cli', 'config.json');
            console.log(chalk.blue(`Configuration file: ${configPath}`));
        });
}

export function getConfig(key: string, defaultValue?: any): any {
    return config.get(key, defaultValue);
}
