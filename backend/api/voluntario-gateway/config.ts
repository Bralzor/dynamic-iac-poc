import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {API_PROTOCOL, ApiGatewayConfiguration} from "../../../utils/configuration";
import {EndpointType, RestApi} from "aws-cdk-lib/aws-apigateway";
import {RESOURCES} from "../../../utils/resource-identifiers";

export function config(scope: Construct, props?: cdk.StackProps): ApiGatewayConfiguration {
    const config = new ApiGatewayConfiguration(RESOURCES.API_GATEWAY, API_PROTOCOL.REST, [EndpointType.REGIONAL]);
    return config;
}

export function extend(resource: RestApi, scope: Construct, props?: cdk.StackProps): void {
}