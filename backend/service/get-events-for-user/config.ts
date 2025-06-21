import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {LambdaServiceConfiguration, ParameterSource} from "../../../utils/configuration";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {RESOURCE_IDENTIFIER} from "../../../utils/resource-identifiers";

export function config(scope: Construct, props?: cdk.StackProps): LambdaServiceConfiguration {
    const config = LambdaServiceConfiguration.nodejsServiceBase(
        RESOURCE_IDENTIFIER.GET_EVENTS_FOR_USER_FUNCTION,
        RESOURCE_IDENTIFIER.API_GATEWAY,
        "GET",
        "users",
        RESOURCE_IDENTIFIER.ADMIN_AUTHORIZER_FUNCTION,
        true
    )
    config.environment = {
        stage: {
            source: ParameterSource.PARAMETER_STORE,
            key: "stage"
        },
        db_credentials: {
            source: ParameterSource.SECRETS_MANAGER,
            key: "voluntario-db-secret"
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