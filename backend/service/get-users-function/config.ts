import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {LambdaServiceConfiguration, ParameterSource} from "../../../utils/configuration";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {AUTHORIZERS, LAMBDA_FUNCTIONS, RESOURCES} from "../../../utils/resource-identifiers";
import {Constants} from "../../../utils/constants";

export function config(scope: Construct, props?: cdk.StackProps): LambdaServiceConfiguration {
    const config = LambdaServiceConfiguration.nodejsServiceBase(
        LAMBDA_FUNCTIONS.GET_ALL_USERS_FUNCTION,
        RESOURCES.API_GATEWAY,
        "GET",
        "users",
        AUTHORIZERS.ADMIN_AUTHORIZER_FUNCTION,
        true
    )
    config.environment = {
        stage: {
            source: ParameterSource.PARAMETER_STORE,
            key: "stage"
        },
        db_credentials: {
            source: ParameterSource.SECRETS_MANAGER,
            key: Constants.DB_SECRET_NAME
        },
        last_deployed: new Date().toISOString()
    }
    return config;
}

export function extend(resource: lambda.Function, scope: Construct, props?: cdk.StackProps): void {
}