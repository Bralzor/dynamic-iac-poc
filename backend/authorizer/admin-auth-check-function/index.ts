import {
    APIGatewayAuthorizerEvent,
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
    Callback,
    Context
} from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import {APIGatewayRequestAuthorizerEvent} from "aws-lambda/trigger/api-gateway-authorizer";

// Define interface for decoded JWT token
interface DecodedToken {
    sub: string;
    email: string;
    // Add any other claims that might be in your token
    [key: string]: any;
}

const secret: string = process.env.jwt_secret!;

/**
 * Auth check handler for API Gateway
 * @param event - The API Gateway event
 * @param context - Lambda context
 * @param callback - Lambda callback
 */
export const handler = async (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
    callback: Callback<APIGatewayAuthorizerResult>
): Promise<APIGatewayAuthorizerResult> => {
    try {
        // Get the Authorization token from the event
        const authorizationToken = event.headers![process.env.auth_header_source as string];
        if (!authorizationToken) {
            throw new Error('Unauthorized');
        }

        // Remove 'Bearer ' from the Authorization header if present
        const token = authorizationToken.replace(/^Bearer\s+/, '');

        // Verify and decode the JWT
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || secret) as DecodedToken;

        console.log(decodedToken);

        if (decodedToken.admin) {
            return generatePolicy(decodedToken.sub, 'Allow', event.methodArn);
        } else {
            return generatePolicy('user', 'Deny', event.methodArn);
        }
    } catch (error) {
        console.error('Authorization failed:', error);
        // Deny access
        return generatePolicy('user', 'Deny', event.methodArn);
    }
};

/**
 * Helper function to generate IAM policy
 * @param principalId - User identifier
 * @param effect - Allow or Deny
 * @param resource - The resource ARN
 */
const generatePolicy = (
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string
): APIGatewayAuthorizerResult => {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    };
};