import * as cdk from 'aws-cdk-lib';
import {Duration} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
  API_PROTOCOL,
  ApiGatewayConfiguration, AuthorizerConfiguration,
  LambdaServiceConfiguration,
  ResourcesConfiguration
} from "../utils/configuration";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {EnvironmentVariableUtils} from "../utils/env-var-utils";
import {loadConfigs} from "../utils/directory-parser";
import path from "path";
import {
  AuthorizationType,
  IdentitySource, IResource,
  LambdaIntegration, MockIntegration, Model,
  RequestAuthorizer,
  RestApi
} from "aws-cdk-lib/aws-apigateway";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {ResourceUtils} from "../utils/resource-identifiers";
import {Constants} from "../utils/constants";

export class VoluntarioBackendStack extends cdk.Stack {

  envVarUtils = new EnvironmentVariableUtils();
  resourceMap: Map<string, IResource> = new Map();

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    this.main(this, id, props);
  }

  async main(scope: Construct, id: string, props: cdk.StackProps): Promise<void> {
    this.setupParameters(scope);
    await this.createAPIGateways(scope, props);
    await this.createAuthorizers(scope, props);
    await this.createServices(scope, props);

  }

  setupParameters(scope: Construct): void {
    this.createParam(scope, 'stage', 'dev');
  }

  private createParam(scope: Construct, paramName: string, paramValue: string) {
    const stageParam = new StringParameter(scope, 'StageInitParam', {
      parameterName: paramName,
      stringValue: paramValue
    })
    ResourceUtils.resources[paramName + Constants.PARAMETER_SUFFIX] = stageParam;
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

      const finalApiResource = this.registerPath(ResourceUtils.resources[config.api] as RestApi, config.path);

      finalApiResource.addMethod(
          config.method,
          new LambdaIntegration(lambdaFunction, {
            proxy: config.proxy
          }),
          {
            authorizationType: AuthorizationType.CUSTOM,
            authorizer: ResourceUtils.resources[config.authorizer] as RequestAuthorizer
          }
      );

      finalApiResource.addMethod(
          'OPTIONS',
          new MockIntegration({
            integrationResponses: [
              {
                statusCode: '200',
                responseParameters: {
                  'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                  'method.response.header.Access-Control-Allow-Origin': "'*'",
                  'method.response.header.Access-Control-Allow-Methods': `'OPTIONS,POST,GET,PUT,PATCH,DELETE'`
                },
                responseTemplates: {
                  'application/json': ''
                },
              }
            ]
          }),
          {
            authorizationType: AuthorizationType.NONE,
            methodResponses: [{
              statusCode: "200",
              responseModels: {
                "application/json": Model.EMPTY_MODEL
              },
              responseParameters: {
                "method.response.header.Access-Control-Allow-Headers": true,
                "method.response.header.Access-Control-Allow-Origin": true,
                "method.response.header.Access-Control-Allow-Methods": true,
              }
            }
            ]
          }
      );
    }
  }

  private registerPath(api: RestApi, path: string): IResource {
    const parts = path.split('/').filter(p => p.length > 0);

    let currentResource: IResource = api.root;
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (this.resourceMap.has(currentPath)) {
        currentResource = this.resourceMap.get(currentPath)!;
      } else {
        const newResource = currentResource.addResource(part);
        this.resourceMap.set(currentPath, newResource);
        currentResource = newResource;
      }
    }

    return currentResource;
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
          ResourceUtils.resources[config.resourceIdentifier] = api;
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
      const config: AuthorizerConfiguration = authorizerEntry.config(scope, props) as AuthorizerConfiguration;

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
        identitySources: [IdentitySource.header(config.authHeaderSource)],
        authorizerName: config.resourceIdentifier,
        resultsCacheTtl: Duration.seconds(300)
      })

      ResourceUtils.resources[config.resourceIdentifier] = apiGwAuthorizer;

      authorizers[authorizer].extend(lambdaFunction, scope, props);
    }
  }
}
