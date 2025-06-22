import {Architecture, Runtime} from "aws-cdk-lib/aws-lambda";
import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {Resource} from "aws-cdk-lib/core";
import {RESOURCE_IDENTIFIER} from "./resource-identifiers";
import {EndpointType} from "aws-cdk-lib/aws-apigateway";
import path from "path";

export type ENVIRONMENT = {[key: string]: string | CustomValue};

export interface CustomValue {
    source: ParameterSource;
    key: string;
}

export enum ParameterSource {
    PARAMETER_STORE = "PARAMETER_STORE",
    SECRETS_MANAGER = "SECRETS_MANAGER"
}

export abstract class ResourceConfiguration {
    resourceIdentifier: RESOURCE_IDENTIFIER

    protected constructor(resourceName: RESOURCE_IDENTIFIER) {
        this.resourceIdentifier = resourceName;
    }
}

export interface ResourcesConfiguration {
    [key: string]: {
        config: (scope: Construct, props?: cdk.StackProps) => ResourceConfiguration,
        extend: (resource: Resource, scope: Construct, props?: cdk.StackProps) => void,
        pckg: any,
        distPath: string
    }
}

export class ApiGatewayConfiguration extends ResourceConfiguration {
    protocol: API_PROTOCOL;
    endpointTypes: EndpointType[];

    constructor(resourceName: RESOURCE_IDENTIFIER, protocol: API_PROTOCOL, endpointTypes: EndpointType[]) {
        super(resourceName);
        this.protocol = protocol;
        this.endpointTypes = endpointTypes;
    }
}

export enum API_PROTOCOL {
    REST = "REST",
    WEBSOCKET = "WEBSOCKET"
}

export class LambdaConfiguration extends ResourceConfiguration {
    runtime: Runtime;
    handler: string;
    architecture: Architecture;
    environment: ENVIRONMENT;

    static nodejsBase(resourceName: RESOURCE_IDENTIFIER): LambdaConfiguration {
        return new LambdaConfiguration(resourceName, Runtime.NODEJS_20_X, "index.handler", Architecture.ARM_64);
    }

    constructor(resourceName: RESOURCE_IDENTIFIER, runtime: Runtime, handler: string, architecture: Architecture) {
        super(resourceName);
        this.runtime = runtime;
        this.handler = handler;
        this.architecture = architecture;
    }
}

export class AuthorizerConfiguration extends LambdaConfiguration {
    authHeaderSource: string;

    static nodejsAuthorizerBase(resourceName: RESOURCE_IDENTIFIER, authHeaderSource: string = 'Authorization'): AuthorizerConfiguration {
        return new AuthorizerConfiguration(resourceName, Runtime.NODEJS_20_X, "index.handler", Architecture.ARM_64, authHeaderSource);
    }

    constructor(resourceName: RESOURCE_IDENTIFIER, runtime: Runtime, handler: string, architecture: Architecture, authHeaderSource: string) {
        super(resourceName, runtime, handler, architecture);
        this.authHeaderSource = authHeaderSource;
    }
}

export type HTTP_METHOD = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class LambdaServiceConfiguration extends LambdaConfiguration {
    api: RESOURCE_IDENTIFIER;
    method: HTTP_METHOD;
    path: string;
    authorizer: RESOURCE_IDENTIFIER;
    proxy: boolean;

    static nodejsServiceBase(resourceName: RESOURCE_IDENTIFIER, api: RESOURCE_IDENTIFIER, method: HTTP_METHOD, path: string, authorizer: RESOURCE_IDENTIFIER, proxy: boolean = true): LambdaServiceConfiguration {
        return new LambdaServiceConfiguration(resourceName, Runtime.NODEJS_20_X, "index.handler", Architecture.ARM_64, api, method, path, authorizer, proxy);
    }

    constructor(resourceName: RESOURCE_IDENTIFIER, runtime: Runtime, handler: string, architecture: Architecture, api: RESOURCE_IDENTIFIER, method: HTTP_METHOD, path: string, authorizer: RESOURCE_IDENTIFIER, proxy: boolean) {
        super(resourceName, runtime, handler, architecture);
        this.api = api;
        this.method = method;
        this.path = path;
        this.authorizer = authorizer;
        this.proxy = proxy;
    }
}