import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {LambdaServiceConfiguration, ParameterSource} from "../../../utils/configuration";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {AUTHORIZERS, LAMBDA_FUNCTIONS, RESOURCES} from "../../../utils/resource-identifiers";
import {Constants} from "../../../utils/constants";

export function config(scope: Construct, props?: cdk.StackProps): LambdaServiceConfiguration {
    const config = LambdaServiceConfiguration.nodejsServiceBase(
        LAMBDA_FUNCTIONS.GET_EVENTS_FOR_USER_FUNCTION,
        RESOURCES.API_GATEWAY,
        "GET",
        "events/get",
        AUTHORIZERS.AUTHORIZER_FUNCTION,
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