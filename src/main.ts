#!/usr/bin/env bun

import {Command} from 'commander';
import chalk from 'chalk';

import {BackendService} from '@Services/BackendService';
import {createAuthCommands} from '@Commands/auth';
import {createAliasCommands} from '@Commands/alias';
import {createConfigCommands, getConfig} from '@Commands/config';

const program = new Command();

// Get API URL from config or use default
const apiUrl = getConfig('apiUrl', 'https://api.1337.legal');
const backendService = new BackendService(apiUrl);

program
    .name('1337legal')
    .description('CLI tool for 1337.legal - Privacy-focused email service')
    .version('1.0.0');

// Add commands
createAuthCommands(program, backendService);
createAliasCommands(program, backendService);
createConfigCommands(program);

// Display welcome message
program.addHelpText('beforeAll', chalk.bold.blue('\n1337.legal CLI\n'));
program.addHelpText('afterAll', `
${chalk.gray('Examples:')}
  ${chalk.cyan('$ 1337legal auth register')}        Register a new account
  ${chalk.cyan('$ 1337legal auth login')}           Login to your account
  ${chalk.cyan('$ 1337legal alias list')}           List your email aliases
  ${chalk.cyan('$ 1337legal alias create')}         Create a new alias
  ${chalk.cyan('$ 1337legal config api-url <url>')} Set custom API URL

${chalk.gray('Configuration:')}
  Config is stored in: ${chalk.dim('~/.1337legal-cli/')}
  Use ${chalk.cyan('1337legal config path')} to see exact location

${chalk.gray('Documentation:')}
  https://1337.legal/docs

${chalk.gray('Support:')}
  support@1337.legal
`);

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
