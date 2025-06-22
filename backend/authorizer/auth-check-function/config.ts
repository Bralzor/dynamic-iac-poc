import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {AuthorizerConfiguration, LambdaConfiguration, ParameterSource} from "../../../utils/configuration";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {AUTHORIZERS} from "../../../utils/resource-identifiers";

export function config(scope: Construct, props?: cdk.StackProps): LambdaConfiguration {
    const authHeaderSource = 'Authorization';

    const config = AuthorizerConfiguration.nodejsAuthorizerBase(
        AUTHORIZERS.AUTHORIZER_FUNCTION,
        authHeaderSource
    )
    config.environment = {
        stage: {
            source: ParameterSource.PARAMETER_STORE,
            key: "stage"
        },
        jwt_secret: {
            source: ParameterSource.PARAMETER_STORE,
            key: "jwt_secret"
        },
        auth_header_source: authHeaderSource,
        last_deployed: new Date().toISOString()
    }
    return config;
}

export function extend(resource: lambda.Function, scope: Construct, props?: cdk.StackProps): void {
}