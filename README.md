        # 1337.legal Command-Line Tool

A comprehensive CLI tool for managing your 1337.legal account and email aliases from the terminal.

## Features

- 🔐 **Authentication**: Register, login, and manage your account
- 📧 **Alias Management**: Create, list, update, and delete email aliases
- 🔒 **End-to-End Encryption**: Client-side encryption of sensitive data
- ⚙️ **Configuration**: Customize API endpoints and settings
- 🎨 **Beautiful CLI**: Colorful and interactive command-line interface

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime installed

### Install from source

```bash
cd command-line-tool
bun install
```

### Build

```bash
bun run build
```

### Link globally (optional)

```bash
npm link
```

Now you can use `1337legal` command globally.

## Usage

### Authentication

#### Register a new account

```bash
1337legal auth register
# Or with options
1337legal auth register --email user@example.com --password yourpassword
```

#### Login

```bash
1337legal auth login
# Or with options
1337legal auth login --email user@example.com --password yourpassword
```

#### Check authentication status

```bash
1337legal auth status
```

#### Logout

```bash
1337legal auth logout
```

### Alias Management

#### List all aliases

```bash
1337legal alias list
# Or
1337legal alias ls
```

#### Create a new alias

```bash
1337legal alias create
# Or with description
1337legal alias create --description "For newsletter signups"
```

#### Get alias details

```bash
1337legal alias get <aliasId>
```

#### Update an alias

```bash
# Update description
1337legal alias update <aliasId> --description "New description"

# Disable alias
1337legal alias update <aliasId> --active false

# Enable alias
1337legal alias update <aliasId> --active true
```

#### Delete an alias

```bash
1337legal alias delete <aliasId>
# Or skip confirmation
1337legal alias delete <aliasId> --yes
```

### Configuration

#### Set API URL

```bash
1337legal config api-url https://api.1337.legal
```

#### Set any configuration value

```bash
1337legal config set <key> <value>
```

#### Get configuration value

```bash
1337legal config get <key>
```

#### List all configuration

```bash
1337legal config list
```

#### Delete configuration value

```bash
1337legal config delete <key>
```

#### Clear all configuration

```bash
1337legal config clear
```

## Architecture

### Services

#### CryptoService

Handles all cryptographic operations:

- Password hashing with PBKDF2
- AES-256-GCM encryption/decryption
- Master key derivation
- Challenge signing
- Secure token generation

#### SessionService

Manages user session and authentication state:

- Stores session data securely
- Token management (access/refresh)
- Session validation
- Encrypted local storage using Conf

#### BackendService

Handles all API communication:

- RESTful API client with Axios
- Automatic token refresh
- Request/response interceptors
- Authentication endpoints
- Alias management endpoints
- Error handling

### Commands

- **auth**: User authentication (register, login, logout, status)
- **alias**: Email alias management (create, list, get, update, delete)
- **config**: CLI configuration management

## Security

### Client-Side Encryption

1. **Master Key Derivation**: User password is never sent to the server
    - Salt is generated client-side during registration
    - Master key is derived using PBKDF2 (100,000 iterations)
    - Only the hash of the master key is sent to the server

2. **Data Encryption**: Sensitive data is encrypted before storage
    - AES-256-GCM encryption
    - Unique IV for each encryption operation
    - Authentication tags for integrity verification

3. **Session Security**:
    - Access tokens with automatic refresh
    - Encrypted local session storage
    - Automatic session expiration

### Best Practices

- Never share your master password
- Use a strong, unique password (minimum 8 characters)
- Keep your CLI and dependencies updated
- Use HTTPS endpoints only

## Development

### Run in development mode

```bash
bun run dev
```

### Build for production

```bash
bun run build
```

### Project Structure

```
command-line-tool/
├── src/
│   ├── commands/          # CLI command implementations
│   │   ├── auth.ts        # Authentication commands
│   │   ├── alias.ts       # Alias management commands
│   │   └── config.ts      # Configuration commands
│   ├── services/          # Service layer
│   │   ├── BackendService.ts    # API client
│   │   ├── CryptoService.ts     # Cryptography
│   │   └── SessionService.ts    # Session management
│   ├── types/             # TypeScript type definitions
│   │   └── globals.d.ts
│   └── main.ts            # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

## API Integration

The CLI communicates with the 1337.legal backend API. Default endpoints:

- **Base URL**: `https://api.1337.legal`
- **Auth**: `/auth/*`
- **User**: `/user/*`
- **Alias**: `/alias/*`

You can customize the API URL:

```bash
1337legal config api-url https://your-custom-api.com
```

## Troubleshooting

### Authentication issues

If you're having trouble logging in:

1. Check your internet connection
2. Verify the API URL is correct: `1337legal config get apiUrl`
3. Check authentication status: `1337legal auth status`
4. Try logging out and back in: `1337legal auth logout && 1337legal auth login`

### Session expired

If you get "Session expired" errors:

```bash
1337legal auth login
```

The CLI will automatically attempt to refresh your token, but if that fails, you'll need to log in again.

### Clear all data

If you need to start fresh:

```bash
1337legal auth logout
1337legal config clear
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: https://1337.legal/docs
- **Email**: support@1337.legal
- **Issues**: https://github.com/1337legal/cli/issues

## Changelog

### v1.0.0 (2025-10-19)

- Initial release
- Authentication system with client-side encryption
- Alias management (CRUD operations)
- Configuration management
- Beautiful CLI with colors and spinners
- Automatic token refresh
- Secure session management
