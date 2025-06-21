import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {LambdaConfiguration, ParameterSource} from "../../../utils/configuration";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {RESOURCE_IDENTIFIER} from "../../../utils/resource-identifiers";

export function config(scope: Construct, props?: cdk.StackProps): LambdaConfiguration {
    const config = LambdaConfiguration.nodejsBase(RESOURCE_IDENTIFIER.ADMIN_AUTHORIZER_FUNCTION)
    config.environment = {
        stage: {
            source: ParameterSource.PARAMETER_STORE,
            key: "stage"
        },
        jwt_secret: {
            source: ParameterSource.PARAMETER_STORE,
            key: "jwt_secret"
        },
        last_deployed: new Date().toISOString()
    }
    return config;
}

export function extend(resource: lambda.Function, scope: Construct, props?: cdk.StackProps): void {
}