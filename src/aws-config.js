// File: src/aws-config.js
import { Amplify } from 'aws-amplify';

const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
            region: import.meta.env.VITE_AWS_REGION || 'us-east-1',

            // Sign up configuration
            signUpVerificationMethod: 'email',

            // OAuth configuration
            oauth: {
                domain: `${import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID}.auth.${import.meta.env.VITE_AWS_REGION || 'us-east-1'}.amazoncognito.com`,
                scope: ['openid', 'email', 'profile'],
                redirectSignIn: import.meta.env.VITE_OAUTH_REDIRECT_SIGN_IN || 'http://localhost:3000/callback',
                redirectSignOut: import.meta.env.VITE_OAUTH_REDIRECT_SIGN_OUT || 'http://localhost:3000/logout',
                responseType: 'code'
            }
        }
    }
};

Amplify.configure(awsConfig);

export default awsConfig;