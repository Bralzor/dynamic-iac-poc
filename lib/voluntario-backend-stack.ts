import * as cdk from 'aws-cdk-lib';
import {Duration} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
  API_PROTOCOL,
  ApiGatewayConfiguration,
  LambdaConfiguration,
  LambdaServiceConfiguration,
  ResourcesConfiguration
} from "../utils/configuration";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {EnvironmentVariableUtils} from "../utils/utils";
import {Resource} from "aws-cdk-lib/core";
import {loadConfigs} from "../utils/directory-parser";
import path from "path";
import {
  AuthorizationType,
  IdentitySource,
  LambdaIntegration,
  RequestAuthorizer,
  RestApi
} from "aws-cdk-lib/aws-apigateway";
import {RESOURCE_IDENTIFIER} from "../utils/resource-identifiers";

export class VoluntarioBackendStack extends cdk.Stack {

  envVarUtils = new EnvironmentVariableUtils();
  resources: {[key: string]: Resource} = {};

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    this.main(this, id, props);
  }

  async main(scope: Construct, id: string, props: cdk.StackProps): Promise<void> {
    await this.createAPIGateways(scope, props);
    await this.createAuthorizers(scope, props);
    await this.createServices(scope, props);

  }

  async createServices(scope: Construct, props: cdk.StackProps): Promise<void> {
    const serviceLambdas: ResourcesConfiguration = await loadConfigs(path.resolve(__dirname, '../backend/service'));
    const lambdaNames = Object.keys(serviceLambdas);

    for (const apigw of lambdaNames) {
      const lambdaEntry = serviceLambdas[apigw];
      const config: LambdaServiceConfiguration = lambdaEntry.config(scope, props) as LambdaServiceConfiguration;

      const lambdaFunction = new lambda.Function(scope, config.resourceIdentifier, {
        functionName: lambdaEntry.pckg.name,
        code: lambda.Code.fromAsset(lambdaEntry.distPath),
        runtime: config.runtime,
        handler: config.handler,
        architecture: config.architecture,
        environment: this.envVarUtils.parseEnvironmentVariables(config.environment, scope)
      });

      const api: RestApi = this.resources[config.api] as RestApi;
      const path = api.root.addResource(config.path);
      path.addMethod(
          config.method,
          new LambdaIntegration(lambdaFunction, {
            proxy: config.proxy
          }),
          {
            authorizationType: AuthorizationType.CUSTOM,
            authorizer: this.resources[config.authorizer] as RequestAuthorizer
          }
      );

      const path2 = api.root.addResource("test");
      path2.addMethod(
          config.method,
          new LambdaIntegration(lambdaFunction, {
            proxy: config.proxy
          }),
          {
            authorizationType: AuthorizationType.CUSTOM,
            authorizer: this.resources[RESOURCE_IDENTIFIER.AUTHORIZER_FUNCTION] as RequestAuthorizer
          }
      );

    }
  }

  async createAPIGateways(scope: Construct, props: cdk.StackProps): Promise<void> {
    const apigws: ResourcesConfiguration = await loadConfigs(path.resolve(__dirname, '../backend/api'));
    const apigwNames = Object.keys(apigws);

    for (const apigw of apigwNames) {
      const apigwEntry = apigws[apigw];
      const config: ApiGatewayConfiguration = apigwEntry.config(scope, props) as ApiGatewayConfiguration;

      switch (config.protocol) {
        case API_PROTOCOL.REST:
          const api = new RestApi(scope, apigwEntry.pckg.name + 'REST_API_GW', {
            description: apigwEntry.pckg.description,
            restApiName: apigwEntry.pckg.name,
            endpointTypes: config.endpointTypes
          });
          this.resources[config.resourceIdentifier] = api;
          break;
        case API_PROTOCOL.WEBSOCKET:
          break;
      }
    }
  }

  async createAuthorizers(scope: Construct, props: cdk.StackProps): Promise<void> {
    const authorizers: ResourcesConfiguration = await loadConfigs(path.resolve(__dirname, '../backend/authorizer'));
    const authorizerNames = Object.keys(authorizers);

    for (const authorizer of authorizerNames) {
      const authorizerEntry = authorizers[authorizer];
      const config: LambdaConfiguration = authorizerEntry.config(scope, props) as LambdaConfiguration;

      const lambdaFunction = new lambda.Function(scope, config.resourceIdentifier, {
        functionName: authorizerEntry.pckg.name,
        code: lambda.Code.fromAsset(authorizerEntry.distPath),
        runtime: config.runtime,
        handler: config.handler,
        architecture: config.architecture,
        environment: this.envVarUtils.parseEnvironmentVariables(config.environment, scope)
      });

      const apiGwAuthorizer = new RequestAuthorizer(scope, `API_AUTHORIZER_${config.resourceIdentifier}`, {
        handler: lambdaFunction,
        identitySources: [IdentitySource.header('Authorization')],
        resultsCacheTtl: Duration.seconds(300)
      })

      this.resources[config.resourceIdentifier] = apiGwAuthorizer;

      authorizers[authorizer].extend(lambdaFunction, scope, props);
    }
  }
}
