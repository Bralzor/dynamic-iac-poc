import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {API_PROTOCOL, ApiGatewayConfiguration} from "../../../utils/configuration";
import {RESOURCE_IDENTIFIER} from "../../../utils/resource-identifiers";
import {EndpointType, RestApi} from "aws-cdk-lib/aws-apigateway";

export function config(scope: Construct, props?: cdk.StackProps): ApiGatewayConfiguration {
    const config = new ApiGatewayConfiguration(RESOURCE_IDENTIFIER.API_GATEWAY, API_PROTOCOL.REST, [EndpointType.REGIONAL]);
    return config;
}

export function extend(resource: RestApi, scope: Construct, props?: cdk.StackProps): void {
}